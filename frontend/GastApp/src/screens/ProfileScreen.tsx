import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../contexts/AuthContext'
import axios from 'axios';
import { useState } from 'react';

const ProfileScreen = ({ navigation }: any) => {

  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };

  // Token de autenticacion y hook para obtener datos del usuario
  const { token } = useAuth();
  const [userData, setUserData] = useState<any>(null);

   useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get('https://5f2b-5-180-230-103.ngrok-free.app/api/usuarios/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(res.data);
      } catch (error) {
        console.error('Error obteniendo datos del usuario:', error);
      }
    };

    if (token) fetchUserData();
  }, [token]);

  if (!userData) {
    return <Text>Cargando datos del usuario...</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Header con foto */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{userData.nombre}</Text>
        <Text style={styles.email}>{userData.email}</Text>
      </View>

      {/* Opciones de perfil */}
      <View style={styles.optionsContainer}>
        {[
          { 
            icon: 'person', 
            text: 'Editar Perfil',
            onPress: () => navigation.navigate('EditProfile')
          },
          { 
            icon: 'settings', 
            text: 'Configuración',
            onPress: () => navigation.navigate('Settings')
          },
          {
            icon: 'information-circle', 
            text: 'Acerca de la App',
            onPress: () => navigation.navigate('AboutApp')
          }
        ].map((item, index) => (
          <TouchableOpacity key={index} style={styles.option} onPress={item.onPress}>
            <Icon name={item.icon} size={24} color="#666" />
            <Text style={styles.optionText}>{item.text}</Text>
            <Icon name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Icon name='log-out' size={24} color="#666" />
          <Text style={styles.optionText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#2563eb',
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
});

export default ProfileScreen;