import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';

import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
};

type AgregarGastoScreenNavigationProp = StackNavigationProp<RootStackParamList, any>;

interface AgregarGastoScreenProps {
  navigation: AgregarGastoScreenNavigationProp;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

interface Frecuencia {
  id: string;
  nombre: string;
}

const AgregarGastoScreen: React.FC<AgregarGastoScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('mensual');
  const [notificar, setNotificar] = useState(false);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const frecuencias: Frecuencia[] = [
    { id: 'diaria', nombre: 'Diaria' },
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ];

  useEffect(() => {
    const cargarCategorias = async () => {
      setCargandoCategorias(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categorias`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setCategorias(response.data);
        if (response.data.length > 0) {
          setCategoriaId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error cargando categorías:', error);
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      } finally {
        setCargandoCategorias(false);
      }
    };

    if (token) cargarCategorias();
  }, [token]);

  const handleFechaChange = (
    event: any,
    selectedDate?: Date | undefined
  ): void => {
    const currentDate: Date = selectedDate || fecha;
    setShowDatePicker(Platform.OS === 'android');
    setFecha(currentDate);
  };

  const handleGuardar = async () => {
  // Validaciones básicas
  if (!descripcion?.trim()) {
    Alert.alert('Error', 'La descripción es obligatoria');
    return;
  }

  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
    return;
  }

  if (!categoriaId) {
    Alert.alert('Error', 'Seleccione una categoría');
    return;
  }

  // Validación específica para Nota
  if (notas && notas.length > 500) {
    Alert.alert('Error', 'Las notas no pueden exceder los 500 caracteres');
    return;
  }

  setIsLoading(true);

  try {
    // Estructura de datos ajustada a las validaciones del backend
    const gastoData = {
      CategoriaId: categoriaId,
      Cantidad: cantidadNum,
      Descripcion: descripcion.trim(),
      Fecha: fecha.toISOString(),
      Activo: true,
      EsFrecuente: esFrecuente,
      ...(esFrecuente && {
        Frecuencia: frecuencia,
        Notificar: notificar
      }),
      Nota: notas?.trim() || '', // Asegurar que sea null cuando esté vacío
      MetodoPagoId: null,
      EtiquetaIds: []
    };

    console.log('Datos a enviar:', JSON.stringify(gastoData, null, 2));

    const response = await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    Alert.alert('Éxito', 'Gasto guardado correctamente');
    navigation.goBack();
  } catch (error) {
    let errorMessage = 'Error al guardar el gasto';
    
    if (axios.isAxiosError(error)) {
      // Manejo detallado de errores de validación
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        errorMessage = `Errores de validación:\n${validationErrors}`;
      } else {
        errorMessage = error.response?.data?.title || 
                      error.response?.data?.message || 
                      error.message;
      }
    }

    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Sección de información básica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Gasto</Text>
        
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Compra supermercado"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Cantidad (€) *</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={cantidad}
          onChangeText={(text) => setCantidad(text.replace(',', '.'))}
        />

        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowDatePicker(true)}
        > 
          <View style={{flex: 1}}>
            <Text>{formatDate(fecha)}</Text>
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default"
            onChange={handleFechaChange}
          />
        )}

        <Text style={styles.label}>Categoría *</Text>
        {cargandoCategorias ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : categorias.length > 0 ? (
          <View style={styles.categoriesContainer}>
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  categoriaId === cat.id && styles.categoryButtonSelected
                ]}
                onPress={() => setCategoriaId(cat.id)}
              >
                <Text style={[
                  styles.categoryText,
                  categoriaId === cat.id && styles.categoryTextSelected
                ]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.errorText}>No hay categorías disponibles</Text>
        )}
      </View>

      {/* Sección de gasto frecuente */}
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>¿Es un gasto frecuente?</Text>
          <Switch
            value={esFrecuente}
            onValueChange={setEsFrecuente}
            trackColor={{ false: '#767577', true: '#2563eb' }}
          />
        </View>

        {esFrecuente && (
          <>
            <Text style={styles.label}>Frecuencia</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowFrecuenciaModal(true)}
            >
              <Text>
                {frecuencias.find(f => f.id === frecuencia)?.nombre ?? 'Seleccionar'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" style={styles.dropdownIcon} />
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>¿Notificar próximo pago?</Text>
              <Switch
                value={notificar}
                onValueChange={setNotificar}
                trackColor={{ false: '#767577', true: '#2563eb' }}
              />
            </View>
          </>
        )}
      </View>

      {/* Sección de notas adicionales */}
      <View style={styles.section}>
        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Agrega cualquier detalle adicional sobre este gasto"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      {/* Botón de guardar */}
      <TouchableOpacity 
        style={[styles.button, (!descripcion || !cantidad || !categoriaId || isLoading) && styles.buttonDisabled]} 
        onPress={handleGuardar}
        disabled={!descripcion || !cantidad || !categoriaId || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Guardar Gasto</Text>
        )}
      </TouchableOpacity>

      {/* Modal de frecuencia */}
      <Modal
        visible={showFrecuenciaModal}
        transparent={true}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowFrecuenciaModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Frecuencia</Text>
          {frecuencias.map((freq) => (
            <TouchableOpacity
              key={freq.id}
              style={styles.modalOption}
              onPress={() => {
                setFrecuencia(freq.id);
                setShowFrecuenciaModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{freq.nombre}</Text>
              {frecuencia === freq.id && (
                <Icon name="checkmark" size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          ))}
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
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2563eb',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    color: '#333',
  },
  categoryTextSelected: {
    color: 'white',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    padding: 10,
  },
});

export default AgregarGastoScreen;