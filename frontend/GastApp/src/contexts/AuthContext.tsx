import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL } from '../api/urlConnection'; 

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

  // Configuración inicial de axios
  useEffect(() => {
    const initializeAxios = async () => {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      if (storedToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    };
    initializeAxios();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@auth_token');
        if (storedToken) {
          const isValid = await checkToken();
          if (isValid) {
            setToken(storedToken);
          } else {
            await logout();
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error limpiando el auth:', error);
      throw error;
    }
  };

  const checkToken = async () => {
    const storedToken = await AsyncStorage.getItem('@auth_token');
    if (!storedToken) return false;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/usuarios/validate-token`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      return response.data.valid === true;
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