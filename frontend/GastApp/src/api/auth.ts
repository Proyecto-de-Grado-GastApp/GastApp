export const loginUser = async (email: string, password: string): Promise<string> => {
  const API_URL = 'https://ef45-5-180-230-103.ngrok-free.app/api/usuarios/login';

  try {
    const response = await fetch(API_URL, {
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
