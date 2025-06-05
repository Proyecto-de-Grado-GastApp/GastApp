import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import CustomInput from '../components/CustomInput';
import { loginUser } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      const { token, userId } = await loginUser(email, password);
      await login(token, userId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../images/logoGastApp.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Iniciar Sesión</Text>
      <CustomInput 
        placeholder="Correo" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
      />
      <CustomInput 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Register')} 
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    alignSelf: 'center',
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

export default LoginScreen;