import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/urlConnection'; 

import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const EditProfileScreen = () => {
  const { token } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');

  const obtenerDatosUsuario = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/usuarios/perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNombre(response.data.nombre);
      setEmail(response.data.email);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil.');
    }
  };

  const actualizarPerfil = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/usuarios/actualizar-perfil`,
        {
          nombre,
          email,
          contrasena: contrasena !== '' ? contrasena : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setContrasena('');
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo actualizar el perfil.'
      );
    }
  };

  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Icon name="arrow-back" size={30} color="#2563eb" onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Editar Perfil</Text>
        <Text style={styles.subtitle}>Modifica tu información personal</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Nueva Contraseña (opcional)</Text>
        <TextInput
          style={styles.input}
          value={contrasena}
          secureTextEntry
          onChangeText={setContrasena}
          placeholder="••••••••"
        />

        <TouchableOpacity style={styles.button} onPress={actualizarPerfil}>
          <Text style={styles.buttonText}>Guardar Cambios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
