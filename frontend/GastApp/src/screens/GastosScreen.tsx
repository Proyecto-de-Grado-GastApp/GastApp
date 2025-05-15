import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import { useAuth } from '../contexts/AuthContext';

export default function GastosScreen({ navigation }: any) {
  const { token } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchGastos = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/gastos`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setGastos(res.data);
        const totalCalculado = res.data.reduce(
          (sum: number, gasto: any) => sum + gasto.cantidad,
          0
        );
        setTotal(totalCalculado);
      } catch (error) {
        console.error('Error obteniendo gastos:', error);
      }
    };

    fetchGastos();
  }, [token]);

  const handleAgregarGasto = () => {
    navigation.navigate('AgregarGastoScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos</Text>

      {/* Tarjeta de resumen */}
      <View style={styles.card}>
        <Text style={styles.cardText}>Total Gastos: €{total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.button} onPress={handleAgregarGasto}>
          <Text style={styles.buttonText}>Agregar Gasto</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros básicos */}
      <View style={styles.filtros}>
        <TouchableOpacity style={styles.filtroBtn}>
          <Icon name="calendar" size={18} color="#2563eb" />
          <Text style={styles.filtroTexto}>Fecha</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filtroBtn}>
          <Icon name="pricetag" size={18} color="#2563eb" />
          <Text style={styles.filtroTexto}>Categoría</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filtroBtn}>
          <Icon name="pricetags" size={18} color="#2563eb" />
          <Text style={styles.filtroTexto}>Etiquetas</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de gastos */}
      <FlatList
        data={gastos}
        keyExtractor={(item: any) => item.id_gasto.toString()}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => navigation.navigate('DetalleGasto', { gastoId: item.id_gasto })}
          >
            <View>
              <Text style={styles.listItemText}>{item.descripcion}</Text>
              <Text style={{ color: '#666' }}>{item.fecha}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>
                ${item.cantidad.toFixed(2)}
              </Text>
              <Icon name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardText: {
    marginVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  filtros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  filtroTexto: {
    marginLeft: 6,
    color: '#2563eb',
    fontWeight: '500',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});
