import client from './client'; // Asumiendo que has creado este archivo como se sugirió anteriormente

import { API_BASE_URL } from '../api/urlConnection';

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await client.post(`${API_BASE_URL}/api/usuarios/login`, {
      Email: email,
      Contrasena: password,
    });

    if (!response.data.token) {
      throw new Error('Respuesta sin token');
    }

    return response.data.token;
  } catch (error: any) {
    console.error('Error de login:', error.message);
    
    // Manejo específico de errores de axios
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
      throw new Error(error.response.data.message || 'Error en login');
    } else if (error.request) {
      throw new Error('Error de conexión con el servidor');
    } else {
      throw new Error(error.message || 'Error desconocido');
    }
  }
};

export const registerUser = async (nombre: string, email: string, password: string): Promise<boolean> => {
  try {
    const response = await client.post(`${API_BASE_URL}/api/usuarios/registrar`, {
      Nombre: nombre,
      Email: email,
      Contrasena: password,
    });

    return true;
  } catch (error: any) {
    console.error('Error de registro:', error.message);
    
    if (error.response) {
      throw new Error(error.response.data.message || 'Error en el registro');
    } else if (error.request) {
      throw new Error('Error de conexión con el servidor');
    } else {
      throw new Error(error.message || 'Error desconocido');
    }
  }
};

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await client.get(`${API_BASE_URL}/api/usuarios/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.valid || false;
  } catch (error) {
    console.error('Error validando token:', error);
    return false;
  }
};