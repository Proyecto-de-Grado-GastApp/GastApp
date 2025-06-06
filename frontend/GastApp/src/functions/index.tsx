import React from 'react';
import { Image, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

export const formatearCantidad = (cantidad: number) => {
    return cantidad.toLocaleString('es-ES',
        {
            style: 'currency',
            currency: 'EUR',
        }
    )
}

export const generarId = () => {
    const random = Math.random().toString(36).substring(2,11);
    const fecha = Date.now().toString(36);

    return random + fecha;
}

export const formatearFecha = (fecha: number | undefined) => {
    if (!fecha) return "-";

    const opciones: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    };
    
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
};

export const renderIcon = (descripcion: string) => {
  const key = descripcion.toLowerCase().trim();

  if (key === 'netflix') {
    return (
      <Image
        source={require('../images/netflix.png')}
        style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: '#E50914' }}
      />
    );
  }

  if (key === 'strava') {
    return (
      <View
        style={{
          backgroundColor: '#FC4C02',
          borderRadius: 8,
          padding: 6,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FontAwesome5 name="strava" size={24} color="#ffffff" solid />
      </View>
    );
  }

  if (key === 'dazn') {
    return (
      <Image
        source={require('../images/dazn.png')}
        style={{ width: 38, height: 38, resizeMode: 'contain'}}
      />
    );
  }

  if (key === 'disney+') {
    return (
      <View
        style={{
          backgroundColor: 'black',
          borderRadius: 8,
          padding: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../images/disney.png')}
          style={{ width: 38, height: 38, resizeMode: 'contain'}}
        />
      </View>
      
    );
  }

  const icons: { [key: string]: string } = {
    spotify: 'spotify',
    "prime video": 'amazon',
  };

  const iconName = icons[key] || 'apps';

  return (
    <FontAwesome5
      name={iconName}
      size={30}
      color={getColorMarca(descripcion)}
      solid
    />
  );
};

export const getColorMarca = (descripcion: string) => {
  const key = descripcion.toLowerCase();
  const colors: { [key: string]: string } = {
    spotify: '#1DB954',   // Verde de Spotify
    netflix: '#E50914',   // Rojo de Netflix
    strava: '#FC4C02',    // Naranja de Strava
    youtube: '#FF0000',   // Rojo de YouTube
    hbo: '#4B0082',       // Azul oscuro de HBO (ejemplo)
    "prime video": '#00A8E1',     // Azul de Amazon Prime
    "disney+": '#113CCF',    // Azul de Disney+
    default: '#64748b',   // Gris por defecto
  };
  return colors[key] || colors['default'];
};