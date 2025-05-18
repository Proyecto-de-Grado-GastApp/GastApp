import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/urlConnection';
import { useNavigation } from '@react-navigation/native';

const AgregarPresupuestoScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation();

  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [mostrarInicio, setMostrarInicio] = useState(false);
  const [mostrarFin, setMostrarFin] = useState(false);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorias`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCategorias(res.data);
        if (res.data.length > 0) setCategoriaSeleccionada(res.data[0].id_categorias);
      } catch (error) {
        console.error('Error obteniendo categorías:', error);
      }
    };

    fetchCategorias();
  }, [token]);

  const handleGuardar = async () => {
    if (!categoriaSeleccionada || !cantidad || isNaN(Number(cantidad))) {
      Alert.alert('Error', 'Todos los campos deben ser válidos');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/presupuestos`, {
        CategoriaId: categoriaSeleccionada, // Cambiado de categoria_id a CategoriaId
        Cantidad: parseFloat(cantidad),
        FechaInicio: fechaInicio.toISOString(), // Asegurar formato ISO
        FechaFin: fechaFin.toISOString()       // Asegurar formato ISO
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Presupuesto guardado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error guardando presupuesto:', error);
      let errorMessage = 'Hubo un problema al guardar el presupuesto';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Presupuesto</Text>

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
        <Text>{fechaInicio.toDateString()}</Text>
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
        <Text>{fechaFin.toDateString()}</Text>
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

      <Pressable style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Guardar Presupuesto</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});

export default AgregarPresupuestoScreen;
