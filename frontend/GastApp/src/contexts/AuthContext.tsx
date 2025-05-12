import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Create an Axios instance
const client = axios.create({
  baseURL: 'https://your-api-base-url.com', // Replace with your API base URL
  timeout: 10000,
});

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkToken: () => Promise<boolean>; 
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const initAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      if (storedToken) {
        const isValid = await checkToken(); // Usamos checkToken aquí
        if (isValid) {
          setToken(storedToken);
          client.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          await logout(); // Limpia el token si no es válido
        }
      }
    } catch (error) {
      console.error('Error inicializando auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  initAuth();
}, []);

  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem('@auth_token', newToken);
      setToken(newToken);
      // Actualiza el header de axios directamente
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('@auth_token');
            setToken(null);
            delete axios.defaults.headers.common['Authorization'];
        } catch (error) {
            console.error('Error limpiando el auth:', error);
        }
    };

    const checkToken = async () => {
        const storedToken = await AsyncStorage.getItem('@auth_token');
        if (!storedToken) return false;

        try {
            const response = await client.get('/api/usuarios/validate-token');
            
            if (!response.data.valid) {
            await logout(); // Limpia el token si el backend lo marca como inválido
            return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error validando token:', error);
            await logout();
            return false;
        }
    };

  return (
  <AuthContext.Provider value={{ token, isLoading, login, logout, checkToken }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);