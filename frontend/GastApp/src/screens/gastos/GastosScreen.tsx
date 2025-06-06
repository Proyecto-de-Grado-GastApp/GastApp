import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

// --- Interfaces y Tipos ---
interface Gasto {
  id: number;
  descripcion: string;
  cantidad: number;
  fecha: string;
  nota?: string;
  categoriaId: number;
  activo: boolean;
}

interface FiltroOpcion {
  label: string;
  value: string | number;
}

// --- Componente Reutilizable para los Botones de Filtro ---
const FilterButton: React.FC<{ label: string; value: string; onPress: () => void }> = ({ label, value, onPress }) => (
  <View style={styles.filterButtonContainer}>
    <Text style={styles.filterLabel}>{label}</Text>
    <TouchableOpacity style={styles.filterButton} onPress={onPress}>
      <Text style={styles.filterButtonText}>{value}</Text>
      <Icon name="chevron-down" size={16} color="#64748b" />
    </TouchableOpacity>
  </View>
);

// --- Componente Principal ---
export default function GastosScreen({ navigation }: any) {
  const { token } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [gastosFiltrados, setGastosFiltrados] = useState<Gasto[]>([]);

  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [totalMes, setTotalMes] = useState(0);

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showMesModal, setShowMesModal] = useState(false);
  const [showAnioModal, setShowAnioModal] = useState(false);

  // --- Datos para los Filtros ---
  const categoriasFiltro: FiltroOpcion[] = [
    { label: 'Ver categorías', value: '' },
    { label: 'Alimentación', value: 1 },
    { label: 'Transporte', value: 2 },
    { label: 'Salud', value: 3 },
    { label: 'Hogar', value: 5 },
    { label: 'Ocio', value: 6 },
    { label: 'Educación', value: 8 },
    { label: 'Otros', value: 10 },
  ];

  const mesesFiltro: FiltroOpcion[] = Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(2000, i, 1), 'MMMM', { locale: es }),
    value: i + 1,
  }));

  const aniosFiltro: FiltroOpcion[] = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year };
  });

  const fetchGastos = async () => {
    try {
      const res = await axios.get<Gasto[]>(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const gastosSinSuscripciones = res.data.filter(g => g.categoriaId !== 9);

      const gastosOrdenados = gastosSinSuscripciones.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setGastos(gastosOrdenados);
      const totalCalculado = gastosOrdenados.reduce((sum, gasto) => sum + gasto.cantidad, 0);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGastos();
  }, []);

  const handleAgregarGasto = () => navigation.navigate('AgregarGastoScreen');

  const formatFecha = (fechaString: string) => format(new Date(fechaString), "dd MMM yyyy", { locale: es });

  useEffect(() => {
    const filtrados = gastos.filter((g) => {
      const fecha = new Date(g.fecha);
      const coincideMes = fecha.getMonth() + 1 === mesSeleccionado;
      const coincideAnio = fecha.getFullYear() === anioSeleccionado;
      const coincideCategoria = filtroCategoria === '' || g.categoriaId.toString() === filtroCategoria;
      return g.activo !== false && coincideMes && coincideAnio && coincideCategoria;
    });

    setGastosFiltrados(filtrados);

    const totalDelMes = filtrados.reduce((sum, g) => sum + g.cantidad, 0);
    setTotalMes(totalDelMes);

  }, [filtroCategoria, gastos, mesSeleccionado, anioSeleccionado]);

  const renderGastoItem = ({ item }: { item: Gasto }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('DetalleGastoScreen', { gastoId: item.id })}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.categoriaIcon, { backgroundColor: getCategoriaColor(item.categoriaId) }]}>
          <Icon name={getCategoriaIcon(item.categoriaId)} size={24} color="white" />
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.listItemText} numberOfLines={1}>{item.descripcion}</Text>
          <Text style={styles.fechaText}>{formatFecha(item.fecha)}</Text>
          {item.nota && (
            <Text style={styles.notaText} numberOfLines={1}>
              <Icon name="document-text-outline" size={14} color="#64748b" /> {item.nota}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.montoText}>{item.cantidad.toFixed(2)}€</Text>
        <Icon name="chevron-forward" size={20} color="#cbd5e1" />
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

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total del Mes ({mesesFiltro.find(m => m.value === mesSeleccionado)?.label})</Text>
          <Text style={styles.summaryValue}>{totalMes.toFixed(2)}€</Text>
        </View>
      </View>

      <View style={styles.filtrosContainer}>
        <FilterButton
          label="Categoría"
          value={categoriasFiltro.find(c => c.value === filtroCategoria)?.label || '-- Todas --'}
          onPress={() => setShowCategoriaModal(true)}
        />
        <FilterButton
          label="Mes"
          value={mesesFiltro.find(m => m.value === mesSeleccionado)?.label || 'Seleccionar'}
          onPress={() => setShowMesModal(true)}
        />
        <FilterButton
          label="Año"
          value={anioSeleccionado.toString()}
          onPress={() => setShowAnioModal(true)}
        />
      </View>

      <FlatList
        data={gastosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGastoItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-outline" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>No hay gastos que coincidan con los filtros.</Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
      
      <Modal visible={showCategoriaModal} transparent animationType="slide" onRequestClose={() => setShowCategoriaModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCategoriaModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtrar por Categoría</Text>
          <FlatList
            data={categoriasFiltro}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => { setFiltroCategoria(item.value.toString()); setShowCategoriaModal(false); }}>
                <Text style={styles.modalOptionText}>{item.label}</Text>
                {filtroCategoria === item.value && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showMesModal} transparent animationType="slide" onRequestClose={() => setShowMesModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMesModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Mes</Text>
          <FlatList
            data={mesesFiltro}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => { setMesSeleccionado(Number(item.value)); setShowMesModal(false); }}>
                <Text style={styles.modalOptionText}>{item.label}</Text>
                {mesSeleccionado === item.value && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showAnioModal} transparent animationType="slide" onRequestClose={() => setShowAnioModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAnioModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Año</Text>
          <FlatList
            data={aniosFiltro}
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => { setAnioSeleccionado(Number(item.value)); setShowAnioModal(false); }}>
                <Text style={styles.modalOptionText}>{item.label}</Text>
                {anioSeleccionado === item.value && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </View>
  );
}

const getCategoriaColor = (id: number) => {
  const colors: { [key: number]: string } = {
    1: '#ef4444', 2: '#3b82f6', 3: '#22c55e', 5: '#a855f7', 6: '#f59e0b', 8: '#ec4899', 10: '#64748b'
  };
  return colors[id] || '#64748b';
};

const getCategoriaIcon = (id: number) => {
  const icons: { [key: number]: string } = {
    1: 'fast-food-outline', 2: 'car-outline', 5: 'home-outline', 6: 'game-controller-outline', 3: 'medkit-outline', 8: 'school-outline', 10: 'ellipsis-horizontal-outline'
  };
  return icons[id] || 'ellipsis-horizontal-outline';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  filtrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterButtonContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    paddingLeft: 4,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemLeft: {
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
  itemTextContainer: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  fechaText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  notaText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  montoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e293b',
  },
  modalOption: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#334155',
  },
});