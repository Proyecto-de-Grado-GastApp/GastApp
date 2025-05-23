import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
        <View style={[styles.categoriaIcon, { backgroundColor: '#0ea5e9' }]}>
          <Icon name="repeat-outline" size={20} color="white" />
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
        <TouchableOpacity onPress={handleAgregarGasto}>
          <Icon name="add-circle" size={30} color="#white" />
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#2563eb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'black' },
  summaryCard: {
    backgroundColor: '#191919',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: { fontSize: 16, color: 'white', marginBottom: 4 },
  totalText: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#191919',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoriaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTextContainer: { flex: 1 },
  listItemText: { fontSize: 16, fontWeight: '600', color: 'black', marginBottom: 2 },
  fechaText: { fontSize: 14, color: 'black', marginBottom: 4 },
  notaText: { fontSize: 13, color: 'black', fontStyle: 'italic' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  montoText: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginRight: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, color: '#94a3b8', marginVertical: 16, textAlign: 'center' },
  emptyButton: { backgroundColor: '#89b5fa', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: 'white', fontWeight: '600' },
});
