import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GastosScreen({ navigation }: any) {
  const { token } = useAuth();
  const [gastos, setGastos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGastos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const gastosOrdenados = res.data.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setGastos(gastosOrdenados);
      const totalCalculado = gastosOrdenados.reduce(
        (sum: number, gasto: any) => sum + gasto.cantidad,
        0
      );
      setTotal(totalCalculado);
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGastos();
  };

  const handleAgregarGasto = () => {
    navigation.navigate('AgregarGastoScreen');
  };

  const formatFecha = (fechaString: string) => {
    return format(new Date(fechaString), "dd MMM yyyy", { locale: es });
  };

  const renderGastoItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('DetalleGastoScreen', {
        gastoId: item.id,
        title: 'Detalle del Gasto'
      })}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.categoriaIcon, { backgroundColor: getCategoriaColor(item.categoriaId) }]}>
          <Icon 
            name={getCategoriaIcon(item.categoriaId)} 
            size={20} 
            color="white" 
          />
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
        <Text style={styles.montoText}>€{item.cantidad.toFixed(2)}</Text>
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
        <Text style={styles.title}>Mis Gastos</Text>
        <TouchableOpacity onPress={handleAgregarGasto}>
          <Icon name="add-circle" size={30} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total del período</Text>
        <Text style={styles.totalText}>€{total.toFixed(2)}</Text>
      </View>

      {/* Lista de gastos */}
      <FlatList
        data={gastos}
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
            <Icon name="receipt-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAgregarGasto}
            >
              <Text style={styles.emptyButtonText}>Agregar primer gasto</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// Funciones auxiliares para categorías
const getCategoriaColor = (id: number) => {
  const colors: { [key: number]: string } = {
    1: '#ef4444', // Comida
    2: '#3b82f6', // Transporte
    3: '#10b981', // Hogar
    4: '#f59e0b', // Ocio
    5: '#8b5cf6', // Salud
    6: '#ec4899', // Educación
    7: '#64748b'  // Otros
  };
  return colors[id] || '#64748b';
};

const getCategoriaIcon = (id: number) => {
  const icons: { [key: number]: string } = {
    1: 'fast-food-outline',
    2: 'car-outline',
    3: 'home-outline',
    4: 'game-controller-outline',
    5: 'medkit-outline',
    6: 'school-outline',
    7: 'ellipsis-horizontal-outline'
  };
  return icons[id] || 'ellipsis-horizontal-outline';
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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
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
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoriaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
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
    fontWeight: 'bold',
    color: '#2563eb',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    marginVertical: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});