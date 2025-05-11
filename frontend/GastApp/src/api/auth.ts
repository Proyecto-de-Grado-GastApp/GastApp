// auth.ts
const API_BASE_URL = 'https://4371-5-180-230-103.ngrok-free.app/api/usuarios';

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Email: email,
        Contrasena: password,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en login');
    }

    const data = await response.json();
    if (data.token) {
      return data.token;
    } else {
      throw new Error('Respuesta sin token');
    }
  } catch (error: any) {
    console.error('Error de login:', error.message);
    throw new Error(error.message || 'Error de red o del servidor');
  }
};

export const registerUser = async (nombre: string, email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Nombre: nombre,
        Email: email,
        Contrasena: password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el registro');
    }

    return true;
  } catch (error: any) {
    console.error('Error de registro:', error.message);
    throw new Error(error.message || 'Error de red o del servidor');
  }
};