import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Interfaces y Tipos ---
interface Presupuesto {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  cantidad: number;
  fechaInicio: string;
  fechaFin: string;
  gastado: number;
}

// --- Componente Principal ---
const PresupuestosScreen = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;
  const navigation = useNavigation<NavigationProp>();

  const fetchPresupuestos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/presupuestos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const presupuestosConGastos = await Promise.all(
        res.data.map(async (presupuesto: any) => {
          const gastosRes = await axios.get(
            `${API_BASE_URL}/api/gastos/por-categoria/${presupuesto.categoriaId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const gastosEnRango = gastosRes.data.filter((g: any) => {
            const fecha = new Date(g.fecha);
            return (
              fecha >= new Date(presupuesto.fechaInicio) &&
              fecha <= new Date(presupuesto.fechaFin)
            );
          });

          const totalGastado = gastosEnRango.reduce(
            (sum: number, g: any) => sum + g.cantidad,
            0
          );

          return {
            ...presupuesto,
            gastado: totalGastado,
            icono: getIconByCategory(presupuesto.categoriaNombre)
          };
        })
      );

      setPresupuestos(presupuestosConGastos);
    } catch (error) {
      console.error('Error obteniendo presupuestos:', error);
      Alert.alert('Error', 'No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Eliminar Presupuesto',
      '¿Estás seguro de que quieres eliminar este presupuesto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/presupuestos/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              await fetchPresupuestos();
              Alert.alert('Éxito', 'Presupuesto eliminado correctamente');
            } catch (error) {
              console.error('Error eliminando presupuesto:', error);
              Alert.alert('Error', 'No se pudo eliminar el presupuesto');
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPresupuestos();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchPresupuestos();
      }
    }, [token])
  );
  
  const formatDateRange = (start: string, end: string) => {
    return `${format(parseISO(start), "dd MMM", { locale: es })} - ${format(parseISO(end), "dd MMM, yyyy", { locale: es })}`;
  };

  const renderHeaderComponent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Presupuestos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AgregarPresupuestoScreen')}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen General</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Presupuestado</Text>
            <Text style={styles.summaryValue}>
              {presupuestos.reduce((sum, p) => sum + p.cantidad, 0).toFixed(2)}€
            </Text>
          </View>
          <View style={[styles.summaryItem, {alignItems: 'flex-end'}]}>
            <Text style={styles.summaryLabel}>Total Gastado</Text>
            <Text style={styles.summaryValue}>
              {presupuestos.reduce((sum, p) => sum + p.gastado, 0).toFixed(2)}€
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderPresupuestoItem = ({ item }: { item: Presupuesto }) => {
    const porcentaje = item.cantidad > 0 ? (item.gastado / item.cantidad) * 100 : 0;
    const porcentajeWidth = Math.min(porcentaje, 100);
    const restante = item.cantidad - item.gastado;
    const isOverBudget = item.gastado > item.cantidad;
    const progressBarColor = isOverBudget ? '#ef4444' : porcentaje > 90 ? '#f59e0b' : '#22c55e';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoriaIcon, { backgroundColor: getCategoriaColor(item.categoriaId) }]}>
              <Icon name={getIconByCategory(item.categoriaNombre)} size={24} color="white" />
            </View>
            <View>
              <Text style={styles.categoryName}>{item.categoriaNombre}</Text>
              <Text style={styles.dateText}>{formatDateRange(item.fechaInicio, item.fechaFin)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Icon name="trash-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.amountsRow}>
            <Text style={styles.amountGastado}>{item.gastado.toFixed(2)}€ Gastado</Text>
            <Text style={styles.amountPresupuestado}>{item.cantidad.toFixed(2)}€</Text>
        </View>
        
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${porcentajeWidth}%`, backgroundColor: progressBarColor }]}/>
        </View>

        <View style={styles.progressInfo}>
            <Text style={styles.percentageText}>{porcentaje.toFixed(0)}% Usado</Text>
            <Text style={[styles.restanteText, isOverBudget && styles.overBudgetText]}>
              {isOverBudget ? `Excedido por ${(restante * -1).toFixed(2)}€` : `Quedan ${restante.toFixed(2)}€`}
            </Text>
        </View>

        <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('DetallePresupuestoScreen', { presupuestoId: item.id })}>
          <Text style={styles.detailsButtonText}>Ver Detalles</Text>
          <Icon name="chevron-forward" size={16} color="#2563eb" />
        </TouchableOpacity>
      </View>
    );
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={presupuestos}
        renderItem={renderPresupuestoItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeaderComponent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="wallet-outline" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>No tienes presupuestos activos.</Text>
            <Text style={styles.emptySubtext}>Crea uno para empezar a controlar tus gastos por categoría.</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AgregarPresupuestoScreen')}
            >
              <Text style={styles.emptyButtonText}>Crear Presupuesto</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']}/>}
      />
    </View>
  );
};

// --- Funciones Auxiliares y Estilos ---
const getCategoriaColor = (id: number) => {
  const colors: { [key: number]: string } = {
    1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 5: '#a855f7', 6: '#f59e0b', 8: '#ec4899', 9: '#0ea5e9', 10: '#64748b'
  };
  return colors[id] || '#6b7280';
};

const getIconByCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    const icons: { [key: string]: string } = {
      'alimentación': 'fast-food-outline', 'transporte': 'car-outline', 'ocio': 'game-controller-outline',
      'salud': 'medkit-outline', 'hogar': 'home-outline', 'educación': 'school-outline',
      'ropa': 'shirt-outline', 'suscripciones': 'card-outline',
    };
    return icons[name] || 'wallet-outline';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: '20%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoriaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  amountGastado: {
    fontSize: 14,
    color: '#334155',
  },
  amountPresupuestado: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  progressBarBackground: {
    backgroundColor: '#e2e8f0',
    height: 10,
    borderRadius: 5,
    marginHorizontal: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  percentageText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  restanteText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  overBudgetText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 16,
  },
  detailsButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 6,
  },
});

export default PresupuestosScreen;