import React, { useEffect, useState, useCallback  } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Picker } from "@react-native-picker/picker";
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import globalStyles from '../../styles/index';

// Para que se actualice automaticamente la pestaña cuando se crea un gasto
import { useFocusEffect } from '@react-navigation/native';


export default function GastosScreen({ navigation }: any) {
  const { token } = useAuth();
  const [gastos, setGastos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtrar por categoría
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);

  // Filtrar por fecha
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [totalMes, setTotalMes] = useState(0);




  const fetchGastos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filtradas = res.data.filter((gasto: any) => gasto.categoriaId !== 9);


      const gastosOrdenados = filtradas.sort((a: any, b: any) => 
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

  useFocusEffect(
    useCallback(() => {
      fetchGastos();
    }, [])
  );

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

  useEffect(() => {
    const filtrados = gastos.filter((g) => {
      const fecha = new Date(g.fecha);

      const coincideMes = (fecha.getMonth() + 1) === mesSeleccionado;
      const coincideAnio = fecha.getFullYear() === anioSeleccionado;
      const coincideCategoria = filtroCategoria === '' || g.categoriaId.toString() === filtroCategoria;
      const estaActivo = g.activo !== false;

      return estaActivo && coincideMes && coincideAnio && coincideCategoria;
    });

    setGastosFiltrados(filtrados);
  }, [filtroCategoria, gastos, mesSeleccionado, anioSeleccionado]);

  useEffect(() => {
    const gastosDelMes = gastos.filter((g) => {
      const fecha = new Date(g.fecha);
      return (
        g.activo !== false &&
        (fecha.getMonth() + 1) === mesSeleccionado &&
        fecha.getFullYear() === anioSeleccionado
      );
    });

    const totalDelMes = gastosDelMes.reduce((sum, g) => sum + g.cantidad, 0);
    setTotalMes(totalDelMes);
  }, [gastos, mesSeleccionado, anioSeleccionado]);

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
            size={24} 
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
        <Text style={styles.title}>Mis Gastos</Text>
        <TouchableOpacity onPress={handleAgregarGasto} style={styles.addButton}>
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total histórico</Text>
            <Text style={styles.summaryValue}>{total.toFixed(2)}€</Text>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total mes selecionado</Text>
            <Text style={styles.summaryValue}>{totalMes.toFixed(2)}€</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtrosContainer}>
        {/* Categoría */}
        <View style={styles.pickerCard}>
          <Text style={styles.pickerLabel}>Filtrar por categoría</Text>
          <Picker
            selectedValue={filtroCategoria}
            onValueChange={(valor) => setFiltroCategoria(valor)}
            style={styles.picker}
          >
            <Picker.Item label="-- Todas --" value="" />
            <Picker.Item label="Alimentación" value="1" />
            <Picker.Item label="Transporte" value="2" />
            <Picker.Item label="Salud" value="3" />
            <Picker.Item label="Hogar" value="5" />
            <Picker.Item label="Ocio" value="6" />
            <Picker.Item label="Educación" value="8" />
            <Picker.Item label="Otros" value="10" />
          </Picker>
        </View>

        {/* Fecha (Mes y Año) */}
        <View style={styles.pickerCard}>
          <Text style={styles.pickerLabel}>Filtrar por fecha</Text>
          <Picker
            selectedValue={mesSeleccionado}
            onValueChange={(value) => setMesSeleccionado(value)}
            style={[styles.picker, { marginBottom: 8 }]}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <Picker.Item
                key={i + 1}
                label={format(new Date(2000, i, 1), 'MMMM', { locale: es })}
                value={i + 1}
              />
            ))}
          </Picker>
          <Picker
            selectedValue={anioSeleccionado}
            onValueChange={(value) => setAnioSeleccionado(value)}
            style={styles.picker}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <Picker.Item key={year} label={year.toString()} value={year} />;
            })}
          </Picker>
        </View>
      </View>



      {/* Lista de gastos */}
      <FlatList
        data={gastosFiltrados}
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
              <Text style={styles.emptyButtonText}>Agregar Gasto</Text>
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
    5: '#8b5cf6', // Salud
    6: '#f59e0b', // Ocio
    8: '#ec4899', // Educación
    10: '#64748b'  // Otros

  };
  return colors[id] || '#64748b';
};

const getCategoriaIcon = (id: number) => {
  const icons: { [key: number]: string } = {
    1: 'fast-food-outline',
    2: 'car-outline',
    5: 'home-outline',
    6: 'game-controller-outline',
    3: 'medkit-outline',
    8: 'school-outline',
    10: 'ellipsis-horizontal-outline'
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
    padding: 20,
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
  summaryColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
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
    ...globalStyles.categoriaIcon
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
  pickerText: {
    fontSize: 16,
    marginBottom: 4,
    color: "#64748b"
  },
    filtrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },

  pickerCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  pickerLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },

  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },


});