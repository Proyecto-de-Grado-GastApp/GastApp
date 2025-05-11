import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import CustomInput from '../components/CustomInput';
import { registerUser } from '../api/auth';

type Props = {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
};

const RegisterScreen = ({ onRegisterSuccess, onBackToLogin }: Props) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await registerUser(nombre, email, password);
      Alert.alert('Éxito', 'Registro completado con éxito');
      onRegisterSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el registro');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      
      <CustomInput 
        placeholder="Nombre de usuario" 
        value={nombre} 
        onChangeText={setNombre}
      />
      
      <CustomInput 
        placeholder="Correo electrónico" 
        value={email} 
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <CustomInput 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <CustomInput 
        placeholder="Confirmar contraseña" 
        value={confirmPassword} 
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onBackToLogin} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 24,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
  },
});

export default RegisterScreen;