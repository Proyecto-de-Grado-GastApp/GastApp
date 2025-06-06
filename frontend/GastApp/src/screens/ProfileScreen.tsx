import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Alert,
  Button,
  Modal,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

import { API_BASE_URL } from '../api/urlConnection';
import LoadingScreen from '../components/LoadingScreen';

import ImagePicker from 'react-native-image-crop-picker';


// Tipo de datos del usuario
type Usuario = {
  id: number;
  nombre: string;
  email: string;
  imagenPerfil: string;
};

// Lista de imágenes predefinidas
const imagenesDisponibles = [
  'https://randomuser.me/api/portraits/lego/0.jpg',
  'https://randomuser.me/api/portraits/lego/1.jpg',
  'https://randomuser.me/api/portraits/lego/2.jpg',
  'https://randomuser.me/api/portraits/lego/3.jpg',
  'https://randomuser.me/api/portraits/lego/4.jpg',
  'https://randomuser.me/api/portraits/lego/5.jpg',
  'https://randomuser.me/api/portraits/lego/6.jpg',
  'https://randomuser.me/api/portraits/lego/7.jpg',
  'https://static.wikia.nocookie.net/xbox/images/a/ae/Bubble-gum-gamerpic.png/revision/latest/scale-to-width-down/1000?cb=20200426103304',
  'https://static.wikia.nocookie.net/xbox/images/d/d6/Orange-black-skull.jpg/revision/latest/scale-to-width-down/1000?cb=20200426103335',
  'https://static.wikia.nocookie.net/xbox/images/2/2e/Smiley-face-gamerpic.png/revision/latest/scale-to-width-down/1000?cb=20200426103408',
  'https://static.wikia.nocookie.net/xbox/images/c/ca/Dog-gamerpic.jpg/revision/latest?cb=20200426103311',
  'https://static.wikia.nocookie.net/xbox/images/b/ba/Dragon-gamerpic.jpg/revision/latest/scale-to-width-down/1000?cb=20200426103318',
  'https://static.wikia.nocookie.net/xbox/images/f/f2/Monkey-gamerpic.png/revision/latest/scale-to-width-down/1000?cb=20200426103327',
  'https://static.wikia.nocookie.net/xbox/images/d/d3/Pink-hair-girl-gamerpic.png/revision/latest?cb=20200426103352',
  'https://static.wikia.nocookie.net/xbox/images/9/9b/Blue-head-gamerpic.png/revision/latest/scale-to-width-down/1000?cb=20200426103256'
];

const ProfileScreen = ({ navigation }: any) => {
  const { token, logout } = useAuth();

  const [userData, setUserData] = useState<Usuario | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const [imagenPersonalizada, setImagenPersonalizada] = useState<string | null>(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const cropViewRef = useRef<any>(null);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/usuarios/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(res.data);
        setSelectedImage(res.data.imagenPerfil);
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
      }
    };

    if (token) fetchUserData();
  }, [token]);

  if (!userData) return <LoadingScreen />;

  const handleSaveImage = async () => {
    try {
      let imagenFinal = selectedImage;

      if (imagenPersonalizada) {
        const formData = new FormData();
        formData.append('imagen', {
          uri: imagenPersonalizada,
          type: 'image/jpeg',
          name: `perfil_${userData?.id}.jpg`,
        });

        const res = await axios.post(`${API_BASE_URL}/api/usuarios/upload-foto`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        imagenFinal = res.data.imagenPerfilUrl;
      }

      await axios.put(`${API_BASE_URL}/api/usuarios/actualizar-perfil`, {
        nombre: userData?.nombre,
        email: userData?.email,
        imagenPerfil: imagenFinal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserData(prev => prev ? { ...prev, imagenPerfil: imagenFinal } : prev);
      
      setModalVisible(false);
    } catch (error) {
      console.error("Error actualizando imagen de perfil:", error);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: "Permiso para medios",
            message: "Necesitamos acceso a tus imágenes",
            buttonPositive: "Aceptar",
            buttonNegative: "Cancelar",
            buttonNeutral: "Preguntar luego"
          }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Permiso para almacenamiento",
            message: "Necesitamos acceso a tus archivos",
            buttonPositive: "Aceptar",
            buttonNegative: "Cancelar",
            buttonNeutral: "Preguntar luego"
          }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.error("Error solicitando permisos:", err);
      return false;
    }
  };

  const handleSeleccionarImagenPersonalizada = async () => {
    try {
      // Paso 1: Verificar si ya tenemos permisos
      let hasPermission = false;
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
        } else {
          hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
        }
      } else {
        hasPermission = true;
      }

      // Paso 2: Si no tenemos permisos, solicitarlos
      if (!hasPermission) {
        hasPermission = await requestStoragePermission();
      }

      // Paso 3: Si aún no tenemos permisos, mostrar alerta
      if (!hasPermission) {
        Alert.alert(
          'Permisos insuficientes',
          'Por favor, habilita los permisos de almacenamiento en Configuración',
          [
            {
              text: 'Abrir Configuración',
              onPress: () => Linking.openSettings()
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      // Paso 4: Si tenemos permisos, proceder
      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        width: 500,
        height: 500,
        cropping: false,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        forceJpg: true,
      });

      setSelectedImage(image.path);
      setImagenPersonalizada(image.path);

    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        if (!(error as any).message.includes('User cancelled image selection')) {
          console.error('Error al seleccionar imagen:', error);
          Alert.alert('Error', 'Ocurrió un problema al acceder a la galería');
        }
      } else {
        console.error('Error al seleccionar imagen:', error);
        Alert.alert('Error', 'Ocurrió un problema al acceder a la galería');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerBack}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.header}>
        <Pressable onPress={() => setModalVisible(true)}>
          <Image
            source={{ uri: `${userData.imagenPerfil}?t=${Date.now()}` || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
            style={styles.profileImage}
          />
          <View style={styles.editIconContainer}>
            <Icon name="camera" size={20} color="white" />
          </View>
        </Pressable>
        <Text style={styles.name}>{userData.nombre}</Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {[
          { icon: 'person', text: 'Editar Perfil', action: () => navigation.navigate('EditProfile') },
          { icon: 'settings', text: 'Configuración', action: () => navigation.navigate('Settings') },
          { icon: 'information-circle', text: 'Acerca de la App', action: () => navigation.navigate('AboutApp') },
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.option} onPress={item.action}>
            <Icon name={item.icon} size={24} color="#666" />
            <Text style={styles.optionText}>{item.text}</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#666" />
          <Text style={styles.optionText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecciona tu imagen de perfil</Text>
          
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleSeleccionarImagenPersonalizada}
          >
            <Icon name="images-outline" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.galleryButtonText}>Seleccionar desde galería</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>O elige una de nuestras imágenes:</Text>
          
          <View style={styles.imageGrid}>
            {imagenesDisponibles.map((img, idx) => (
              <Pressable key={idx} onPress={() => {
                setSelectedImage(img);
                setImagenPersonalizada(null);
              }}>
                <Image
                  source={{ uri: img }}
                  style={[
                    styles.selectableImage,
                    selectedImage === img && styles.selectedImage
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {selectedImage !== '' && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Imágen actual:</Text>
              <Image 
                source={{ uri: `${selectedImage}?t=${Date.now()}` }} 
                style={styles.previewImage} 
              />
            </View>
          )}


          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerBack:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
      padding: 30,
      backgroundColor: 'white',
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    color: '#666',
    fontSize: 16,
  },
  optionsContainer: {
    paddingHorizontal: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
    paddingBottom: Platform.select({
      android: 40, 
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2563eb',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectableImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: '#2563eb',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: Platform.select({
      ios: 30,
      android: 40,
    }),
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2563eb',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563eb',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 15,
    textAlign: 'center',
  },
  previewContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#334155',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  galleryButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 24, // Igual que el ancho del botón para mantener centrado el título
  },
});

export default ProfileScreen;

