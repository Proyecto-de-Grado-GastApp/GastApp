import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Alert,
  Button,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

import { API_BASE_URL } from '../api/urlConnection';
import LoadingScreen from '../components/LoadingScreen';

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
      await axios.put(`${API_BASE_URL}/api/usuarios/actualizar-perfil`, {
        nombre: userData.nombre,
        email: userData.email,
        imagenPerfil: selectedImage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserData(prev => prev ? { ...prev, imagenPerfil: selectedImage } : prev);
      setModalVisible(false);
    } catch (error) {
      console.error("Error actualizando imagen de perfil:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => setModalVisible(true)}>
          <Image
            source={{ uri: userData.imagenPerfil || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
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
          <View style={styles.imageGrid}>
            {imagenesDisponibles.map((img, idx) => (
              <Pressable key={idx} onPress={() => setSelectedImage(img)}>
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

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
              <Text style={styles.saveButtonText}>Guardar imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    marginTop: 10,
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

});

export default ProfileScreen;
