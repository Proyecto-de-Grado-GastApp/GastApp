import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { renderIcon } from '../../functions/index';

interface Suscripcion {
  id: number;
  descripcion: string;
  cantidad: number;
  fecha: string;
  nota?: string;
  categoriaId: number;
}

export default function SubscriptionsScreen({ navigation }: any) {
  const { token } = useAuth();
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [totalMensual, setTotalMensual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuscripciones = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await axios.get<Suscripcion[]>(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtradas = res.data.filter((gasto: Suscripcion) => gasto.categoriaId === 9);

      const ordenadas = filtradas.sort(
        (a: Suscripcion, b: Suscripcion) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setSuscripciones(ordenadas);

      const mesActual = new Date().getMonth();
      const anioActual = new Date().getFullYear();

      const totalDelMes = ordenadas
        .filter(susc => {
          const fechaSusc = new Date(susc.fecha);
          return fechaSusc.getMonth() === mesActual && fechaSusc.getFullYear() === anioActual;
        })
        .reduce((sum, g) => sum + g.cantidad, 0);

      setTotalMensual(totalDelMes);

    } catch (error) {
      console.error('Error obteniendo suscripciones:', error);
      Alert.alert("Error", "No se pudieron cargar las suscripciones.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSuscripciones();
    }, [token])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSuscripciones();
  }, [token]);

  const handleAgregarSuscripcion = () => {
    navigation.navigate('AgregarSuscripcionesScreen');
  };

  const formatFecha = (fechaString: string) => {
    return format(new Date(fechaString), "dd 'de' MMMM, yyyy", { locale: es });
  };

  const renderSuscripcionItem = ({ item }: { item: Suscripcion }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('DetalleSuscripcionScreen', {
        suscripcionId: item.id,
        title: 'Detalle de Suscripción'
      })}
    >
      <View style={styles.itemLeft}>
        <View style={styles.categoriaIcon}>
          {renderIcon(item.descripcion)}
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.listItemText} numberOfLines={1}>{item.descripcion}</Text>
          <Text style={styles.fechaText}>Próximo pago: {formatFecha(item.fecha)}</Text>
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
        <Text style={styles.title}>Mis Suscripciones</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAgregarSuscripcion}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de este Mes</Text>
          <Text style={styles.summaryValue}>{totalMensual.toFixed(2)}€</Text>
        </View>
      </View>

      <FlatList
        data={suscripciones}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSuscripcionItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="repeat-outline" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aún no tienes suscripciones.{'\n'}¡Añade la primera!</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAgregarSuscripcion}
            >
              <Text style={styles.emptyButtonText}>Agregar Suscripción</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
}

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
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
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
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});