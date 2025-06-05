import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/urlConnection';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Interfaces y Tipos ---
type RootStackParamList = {
  AgregarPresupuestoScreen: undefined;
};

interface Categoria {
  id: number;
  nombre: string;
}

// --- Componente Principal ---
const AgregarPresupuestoScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { token } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchCategorias = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoriasSinSuscripciones = res.data.filter((c: Categoria) => c.id !== 9);
        setCategorias(categoriasSinSuscripciones);
      } catch (error) {
        console.error('Error obteniendo categorías:', error);
        Alert.alert("Error", "No se pudieron cargar las categorías.");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchCategorias();
  }, [token]);

  const handleSelectCategoria = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria.id);
    setShowCategoriaModal(false);
  };

  const handleFechaInicioChange = (event: any, selectedDate?: Date) => {
    setShowInicioPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (selectedDate > fechaFin) {
        setFechaFin(selectedDate);
      }
      setFechaInicio(selectedDate);
    }
  };

  const handleFechaFinChange = (event: any, selectedDate?: Date) => {
    setShowFinPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (selectedDate < fechaInicio) {
        Alert.alert("Fecha inválida", "La fecha de fin no puede ser anterior a la fecha de inicio.");
        return;
      }
      setFechaFin(selectedDate);
    }
  };

  const handleGuardar = async () => {
    if (!categoriaSeleccionada || !cantidad || isNaN(Number(cantidad.replace(',', '.')))) {
      Alert.alert('Error', 'Todos los campos marcados con * son obligatorios y deben ser válidos.');
      return;
    }
    if (fechaFin < fechaInicio) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/presupuestos`, {
        CategoriaId: categoriaSeleccionada,
        Cantidad: parseFloat(cantidad.replace(',', '.')),
        FechaInicio: fechaInicio.toISOString(),
        FechaFin: fechaFin.toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Presupuesto guardado correctamente');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Hubo un problema al guardar el presupuesto';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return format(date, "dd 'de' MMMM, yyyy", { locale: es });
  };
  
  if (isDataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Presupuesto</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Categoría *</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowCategoriaModal(true)}
        >
          <Text style={!categoriaSeleccionada ? styles.placeholderText : styles.inputText}>
            {categorias.find(c => c.id === categoriaSeleccionada)?.nombre || 'Seleccionar una categoría'}
          </Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
        
        <Text style={styles.label}>Cantidad (€) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
          value={cantidad}
          onChangeText={setCantidad}
        />

        <Text style={styles.label}>Fecha de inicio</Text>
        <TouchableOpacity onPress={() => setShowInicioPicker(true)} style={styles.input}>
          <Text style={styles.inputText}>{formatDate(fechaInicio)}</Text>
          <Icon name="calendar-outline" size={20} color="#64748b" />
        </TouchableOpacity>
        {showInicioPicker && (
          <DateTimePicker
            value={fechaInicio}
            mode="date"
            display="default"
            onChange={handleFechaInicioChange}
          />
        )}

        <Text style={styles.label}>Fecha de fin</Text>
        <TouchableOpacity onPress={() => setShowFinPicker(true)} style={styles.input}>
          <Text style={styles.inputText}>{formatDate(fechaFin)}</Text>
          <Icon name="calendar-outline" size={20} color="#64748b" />
        </TouchableOpacity>
        {showFinPicker && (
          <DateTimePicker
            value={fechaFin}
            mode="date"
            display="default"
            minimumDate={fechaInicio}
            onChange={handleFechaFinChange}
          />
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleGuardar}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Guardar Presupuesto</Text>}
      </TouchableOpacity>
      
      <Modal visible={showCategoriaModal} transparent animationType="slide" onRequestClose={() => setShowCategoriaModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCategoriaModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
          <FlatList
            data={categorias}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => handleSelectCategoria(item)}>
                <Text style={styles.modalOptionText}>{item.nombre}</Text>
                {categoriaSeleccionada === item.id && <Icon name="checkmark-circle" size={24} color="#2563eb" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingBottom: 40,
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
        paddingVertical: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        color: '#334155',
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 20,
        fontSize: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#1e293b',
    },
    inputText: {
        fontSize: 16,
        color: '#1e293b',
    },
    placeholderText: {
        fontSize: 16,
        color: '#94a3b8',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        minHeight: 52,
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
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

export default AgregarPresupuestoScreen;