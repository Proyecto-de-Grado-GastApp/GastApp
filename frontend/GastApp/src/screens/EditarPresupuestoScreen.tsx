import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/urlConnection';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

type EditarPresupuestoRouteParams = {
  presupuestoId: string;
  presupuestoData: {
    categoriaId: string;
    cantidad: number;
    fechaInicio: string;
    fechaFin: string;
  };
};

const EditarPresupuestoScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: EditarPresupuestoRouteParams }>>();
  const { presupuestoId, presupuestoData } = route.params;

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(presupuestoData.categoriaId);
  const [cantidad, setCantidad] = useState(presupuestoData.cantidad.toString());
  const [fechaInicio, setFechaInicio] = useState(new Date(presupuestoData.fechaInicio));
  const [fechaFin, setFechaFin] = useState(new Date(presupuestoData.fechaFin));
  const [mostrarInicio, setMostrarInicio] = useState(false);
  const [mostrarFin, setMostrarFin] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategorias(res.data);
      } catch (error) {
        console.error('Error obteniendo categorías:', error);
      }
    };

    fetchCategorias();
  }, [token]);

  const handleActualizar = async () => {
    if (!categoriaSeleccionada || !cantidad || isNaN(Number(cantidad))) {
      Alert.alert('Error', 'Todos los campos deben ser válidos');
      return;
    }

    try {
      setLoading(true);
      
      await axios.put(`${API_BASE_URL}/api/presupuestos/${presupuestoId}`, {
        CategoriaId: categoriaSeleccionada,
        Cantidad: parseFloat(cantidad),
        FechaInicio: fechaInicio.toISOString(),
        FechaFin: fechaFin.toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Presupuesto actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error actualizando presupuesto:', error);
      let errorMessage = 'Hubo un problema al actualizar el presupuesto';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Presupuesto</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={categoriaSeleccionada}
          onValueChange={(value) => setCategoriaSeleccionada(value)}
        >
          {categorias.map((cat: any) => (
            <Picker.Item
              key={cat.id}
              label={cat.nombre}
              value={cat.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Cantidad (€)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={cantidad}
        onChangeText={setCantidad}
      />

      <Text style={styles.label}>Fecha de inicio</Text>
      <Pressable onPress={() => setMostrarInicio(true)} style={styles.dateInput}>
        <Text style={styles.dateText}>{formatDate(fechaInicio)}</Text>
        <Icon name="calendar-outline" size={20} style={styles.icon} />
      </Pressable>
      {mostrarInicio && (
        <DateTimePicker
          value={fechaInicio}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setMostrarInicio(false);
            if (selectedDate) setFechaInicio(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>Fecha de fin</Text>
      <Pressable onPress={() => setMostrarFin(true)} style={styles.dateInput}>
        <Text style={styles.dateText}>{formatDate(fechaFin)}</Text>
        <Icon name="calendar-outline" size={20} style={styles.icon} />
      </Pressable>
      {mostrarFin && (
        <DateTimePicker
          value={fechaFin}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setMostrarFin(false);
            if (selectedDate) setFechaFin(selectedDate);
          }}
        />
      )}

      <Pressable style={styles.button} onPress={handleActualizar}>
        <Text style={styles.buttonText}>Actualizar Presupuesto</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  dateInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  icon: {
    color: '#94a3b8',
  },
});

export default EditarPresupuestoScreen;