import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import globalStyles from '../../styles/index';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';



export default function SubscriptionsScreen({ navigation }: any) {
  const { token } = useAuth();
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuscripciones = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtradas = res.data.filter((gasto: any) => gasto.categoriaId === 9);

      const ordenadas = filtradas.sort(
        (a: any, b: any) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setSuscripciones(ordenadas);
      setTotal(
        ordenadas.reduce((sum: number, g: any) => sum + g.cantidad, 0)
      );
    } catch (error) {
      console.error('Error obteniendo suscripciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSuscripciones();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuscripciones();
  };

  const handleAgregarGasto = () => {
    navigation.navigate('AgregarSuscripcionesScreen');
  };

  const formatFecha = (fechaString: string) => {
    return format(new Date(fechaString), 'dd MMM yyyy', { locale: es });
  };

  const renderGastoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('DetalleSuscripcionScreen', {
        suscripcionId: item.id,
        title: 'Detalle de Suscripción'
      })}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.categoriaIcon]}>
          {renderIcon(item.descripcion)}
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.listItemText}>{item.descripcion}</Text>
          <Text style={styles.fechaText}>{formatFecha(item.fecha)}</Text>
          {item.nota && (
            <Text style={styles.notaText} numberOfLines={1}>
              <Icon name="document-text-outline" size={14} color="#666" /> {item.nota}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.montoText}>{item.cantidad.toFixed(2)}€</Text>
        <Icon name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Suscripciones</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAgregarGasto}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Gastado en Suscripciones</Text>
        <Text style={styles.totalText}>{total.toFixed(2)}€</Text>
      </View>

      <FlatList
        data={suscripciones}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGastoItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="repeat-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay suscripciones registradas</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAgregarGasto}
            >
              <Text style={styles.emptyButtonText}>Agregar suscripción</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// const getCategoriaIcon = (descripcion: string) => {
//   const key = descripcion.toLowerCase().trim();
//   const icons: { [key: string]: string } = {
//     spotify: 'spotify',
//     netflix: 'netflix',
//     strava: 'strava',
//     youtube: 'youtube',
//     hbo: 'tv',
//     prime: 'amazon',
//     disney: 'film',
//   };
//   return icons[key] || 'apps';
// };

const renderIcon = (descripcion: string) => {
  const key = descripcion.toLowerCase().trim();

  if (key === 'netflix') {
    return (
      <Image
        source={require('../../images/netflix.png')}
        style={{ width: 24, height: 24, resizeMode: 'contain', tintColor: '#E50914' }}
      />
    );
  }

  const icons: { [key: string]: string } = {
    spotify: 'spotify',
    strava: 'strava',
    youtube: 'youtube',
    hbo: 'tv',
    prime: 'amazon',
    disney: 'magic',
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

const getColorMarca = (descripcion: string) => {
  const key = descripcion.toLowerCase();
  const colors: { [key: string]: string } = {
    spotify: '#1DB954',   // Verde de Spotify
    netflix: '#E50914',   // Rojo de Netflix
    strava: '#FC4C02',    // Naranja de Strava
    youtube: '#FF0000',   // Rojo de YouTube
    hbo: '#4B0082',       // Azul oscuro de HBO (ejemplo)
    prime: '#00A8E1',     // Azul de Amazon Prime
    disney: '#113CCF',    // Azul de Disney+
    default: '#64748b',   // Gris por defecto
  };
  return colors[key] || colors['default'];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  totalText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16, // Ajustado de 10 a 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoriaIcon: {
    ...globalStyles.categoriaIcon
  },
  itemTextContainer: {
    flex: 1,
  },
  listItemText: {
    fontSize: 18, // Ajustado de 16 a 18
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  fechaText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  notaText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  montoText: {
    fontSize: 16,
    fontWeight: '600', // Ajustado de 'bold' a '600'
    color: '#2563eb',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
