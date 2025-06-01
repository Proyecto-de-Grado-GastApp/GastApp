import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import globalStyles from '../styles/index';


import { mostrarNotificacionPresupuestoCasiAgotado, mostrarNotificacionPresupuestoSuperado } from "../notifications/notifeeService";

interface Presupuesto {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  cantidad: number;
  fechaInicio: string;
  fechaFin: string;
  gastado: number;
  icono?: string;
}

const PresupuestosScreen = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;
  const navigation = useNavigation<NavigationProp>();

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/presupuestos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const presupuestosConGastos = await Promise.all(
        res.data.map(async (presupuesto: any) => {
          const gastosRes = await axios.get(
            `${API_BASE_URL}/api/gastos/categoria/${presupuesto.categoriaId}`,
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

  const getIconByCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    switch (name) {
      case 'alimentación':
        return 'fast-food-outline';
      case 'transporte':
        return 'car-outline';
      case 'ocio':
        return 'game-controller-outline';
      case 'salud':
        return 'medkit-outline';
      case 'hogar':
        return 'home-outline';
      case 'educación':
        return 'school-outline';
      case 'ropa':
        return 'shirt-outline';
      case 'suscripciones':
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Eliminar presupuesto',
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
              fetchPresupuestos();
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

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPresupuestos();
  };

  useEffect(() => {
    fetchPresupuestos();
  }, []);

  useEffect(() => {
  presupuestos.forEach((presupuesto) => {
    const porcentaje = (presupuesto.gastado / presupuesto.cantidad) * 100;
    const restante = presupuesto.cantidad - presupuesto.gastado;

    if (porcentaje > 90 && porcentaje < 100) {
      mostrarNotificacionPresupuestoCasiAgotado(
        presupuesto.categoriaNombre,
        presupuesto.cantidad,
        restante
      );
    } else if (porcentaje >= 100) {
      mostrarNotificacionPresupuestoSuperado(
        presupuesto.categoriaNombre,
        presupuesto.cantidad,
        presupuesto.gastado - presupuesto.cantidad
      );
    }
  });
}, [presupuestos]);


  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#2563eb']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mis Presupuestos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AgregarPresupuestoScreen')}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {presupuestos.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="wallet-outline" size={50} color="#cbd5e1" />
          <Text style={styles.emptyText}>No tienes presupuestos</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primer presupuesto para empezar a controlar tus gastos
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate('AgregarPresupuestoScreen')}
          >
            <Text style={styles.buttonText}>Crear Presupuesto</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total presupuestado</Text>
                <Text style={styles.summaryValue}>
                  {presupuestos.reduce((sum, p) => sum + p.cantidad, 0).toFixed(2)}€
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total gastado</Text>
                <Text style={styles.summaryValue}>
                  {presupuestos.reduce((sum, p) => sum + p.gastado, 0).toFixed(2)}€
                </Text>
              </View>
            </View>
          </View>

          {presupuestos.map((presupuesto) => {
            const porcentaje = Math.min(
              (presupuesto.gastado / presupuesto.cantidad) * 100,
              100
            );
            const restante = presupuesto.cantidad - presupuesto.gastado;
            const isOverBudget = presupuesto.gastado > presupuesto.cantidad;

            return (
              <View key={presupuesto.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  
                  <View style={styles.categoryContainer}>
                    <View style={[styles.categoriaIcon, { backgroundColor: getCategoriaColor(presupuesto.categoriaId) }]}>
                      <Icon 
                        name={presupuesto.icono || 'wallet-outline'} 
                        size={24} 
                        color="white" 
                      />
                    </View>
                    
                    <Text style={styles.category}>
                      {presupuesto.categoriaNombre}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(presupuesto.id)}>
                    <Icon name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                <View style={styles.datesContainer}>
                  <Text style={styles.dateText}>
                    {formatDate(presupuesto.fechaInicio)} - {formatDate(presupuesto.fechaFin)}
                  </Text>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.amountsRow}>
                    <Text style={styles.amountGastado}>
                      Gastado: {presupuesto.gastado.toFixed(2)}€
                    </Text>
                    <Text style={styles.amountPresupuestado}>
                      Presupuesto: {presupuesto.cantidad.toFixed(2)}€
                    </Text>
                  </View>
                  
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${porcentaje}%`,
                          backgroundColor: isOverBudget ? '#dc2626' : 
                            porcentaje > 80 ? '#f59e0b' : '#2563eb'
                        }
                      ]}
                    />
                  </View>

                  <View style={styles.progressInfo}>
                    <Text style={[
                      styles.percentage,
                      isOverBudget && styles.percentageOver
                    ]}>
                      {porcentaje.toFixed(0)}%
                    </Text>
                    <Text style={styles.restante}>
                      {isOverBudget ? (
                        <Text style={styles.overBudget}>
                          Excedido: {(presupuesto.gastado - presupuesto.cantidad).toFixed(2)}€
                        </Text>
                      ) : (
                        `Restante: ${restante.toFixed(2)}€`
                      )}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate('DetallePresupuestoScreen', { 
                    presupuestoId: presupuesto.id 
                  })}
                >
                  <Text style={styles.detailsButtonText}>Ver detalles</Text>
                  <Icon name="chevron-forward" size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
};

const getCategoriaColor = (id: number) => {
  const colors: { [key: number]: string } = {
    1: '#ef4444', // Comida
    2: '#3b82f6', // Transporte
    3: '#10b981', // Hogar
    5: '#8b5cf6', // Salud
    6: '#f59e0b', // Ocio
    8: '#ec4899', // Educación
    9: '#018a04', // Suscripciones
    10: '#64748b'  // Otros

  };
  return colors[id] || '#64748b';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16, // Mantiene el padding lateral
    paddingTop: 16,       // Mantiene el padding superior
    paddingBottom: 80,    // Aumenta el padding inferior para dejar espacio a la tab bar (ajusta este valor según necesites, 70-100 suele funcionar bien)
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60, // Este padding es para el contenido del emptyState en sí
    paddingHorizontal: 30,
    // Si el emptyState es el único contenido, el paddingBottom del container principal le dará espacio.
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoriaIcon: {
    ...globalStyles.categoriaIcon,
  },
  category: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  datesContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    marginBottom: 12,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountGastado: {
    fontSize: 14,
    color: '#1e293b',
  },
  amountPresupuestado: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  progressBarBackground: {
    backgroundColor: '#e2e8f0',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percentage: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  percentageOver: {
    color: '#dc2626',
  },
  restante: {
    fontSize: 14,
    color: '#64748b',
  },
  overBudget: {
    color: '#dc2626',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  detailsButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    marginRight: 5,
  },
});

export default PresupuestosScreen;