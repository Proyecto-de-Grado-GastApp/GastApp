import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresupuestoDetalle {
  id: number;
  categoriaId: number;
  categoriaNombre: string;
  cantidad: number;
  fechaInicio: string;
  fechaFin: string;
  gastado: number;
  icono: string;
  gastos: Array<{
    id: number;
    descripcion: string;
    cantidad: number;
    fecha: string;
  }>;
}

type DetallePresupuestoNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DetallePresupuestoScreen'
>;

type DetallePresupuestoRouteProp = RouteProp<
  RootStackParamList,
  'DetallePresupuestoScreen'
>;

interface Props {
  navigation: DetallePresupuestoNavigationProp;
  route: DetallePresupuestoRouteProp;
}

const DetallePresupuestoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { presupuestoId } = route.params;
  const { token } = useAuth();
  const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPresupuesto = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/presupuestos/${presupuestoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gastosRes = await axios.get(
        `${API_BASE_URL}/api/gastos/categoria/${res.data.categoriaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const gastosEnRango = gastosRes.data
        .filter((g: any) => {
          const fecha = new Date(g.fecha);
          return (
            fecha >= new Date(res.data.fechaInicio) &&
            fecha <= new Date(res.data.fechaFin)
          );
        })
        .map((g: any) => ({
          id: g.id,
          descripcion: g.descripcion,
          cantidad: g.cantidad,
          fecha: g.fecha,
        }));

      const totalGastado = gastosEnRango.reduce(
        (sum: number, g: any) => sum + g.cantidad,
        0
      );

      setPresupuesto({
        ...res.data,
        gastado: totalGastado,
        gastos: gastosEnRango,
        icono: getIconByCategory(res.data.categoriaNombre),
      });
    } catch (error) {
      console.error('Error obteniendo presupuesto:', error);
      Alert.alert('Error', 'No se pudo cargar el presupuesto');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getIconByCategory = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    switch (name) {
      case 'alimentación': return 'fast-food-outline';
      case 'transporte': return 'car-outline';
      case 'ocio': return 'game-controller-outline';
      case 'salud': return 'medkit-outline';
      case 'hogar': return 'home-outline';
      case 'educación': return 'school-outline';
      case 'ropa': return 'shirt-outline';
      case 'suscripciones': return 'card-outline';
      default: return 'wallet-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd MMM yyyy", { locale: es });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPresupuesto();
  };

  useEffect(() => {
    fetchPresupuesto();
  }, [presupuestoId]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!presupuesto) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No se encontró el presupuesto</Text>
      </View>
    );
  }

  const porcentaje = Math.min((presupuesto.gastado / presupuesto.cantidad) * 100, 100);
  const restante = presupuesto.cantidad - presupuesto.gastado;
  const isOverBudget = presupuesto.gastado > presupuesto.cantidad;

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Presupuesto</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.categoryHeader}>
          <Icon
            name={presupuesto.icono}
            size={32}
            color="#2563eb"
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryName}>{presupuesto.categoriaNombre}</Text>
        </View>

        <View style={styles.datesContainer}>
          <Text style={styles.dateText}>
            {formatDate(presupuesto.fechaInicio)} - {formatDate(presupuesto.fechaFin)}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.amountsRow}>
            <Text style={styles.amountLabel}>Gastado:</Text>
            <Text style={styles.amountValue}>{presupuesto.gastado.toFixed(2)}€</Text>
          </View>
          <View style={styles.amountsRow}>
            <Text style={styles.amountLabel}>Presupuesto:</Text>
            <Text style={styles.amountValue}>{presupuesto.cantidad.toFixed(2)}€</Text>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gastos asociados</Text>
        {presupuesto.gastos.length === 0 ? (
          <View style={styles.emptyGastos}>
            <Icon name="receipt-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyGastosText}>No hay gastos registrados</Text>
          </View>
        ) : (
          presupuesto.gastos.map((gasto) => (
            <TouchableOpacity
              key={gasto.id}
              style={styles.gastoItem}
              onPress={() => navigation.navigate('DetalleGastoScreen', { gastoId: gasto.id })}
            >
              <View style={styles.gastoInfo}>
                <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                <Text style={styles.gastoFecha}>
                  {format(parseISO(gasto.fecha), "dd MMM yyyy", { locale: es })}
                </Text>
              </View>
              <Text style={styles.gastoCantidad}>-{gasto.cantidad.toFixed(2)}€</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 20,
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
    marginBottom: 8,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressBarBackground: {
    backgroundColor: '#e2e8f0',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  percentage: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  percentageOver: {
    color: '#dc2626',
  },
  restante: {
    fontSize: 16,
    color: '#64748b',
  },
  overBudget: {
    color: '#dc2626',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyGastos: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyGastosText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 10,
  },
  gastoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  gastoInfo: {
    flex: 1,
  },
  gastoDescripcion: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 4,
  },
  gastoFecha: {
    fontSize: 14,
    color: '#64748b',
  },
  gastoCantidad: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});

export default DetallePresupuestoScreen;