import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, Switch, Modal, TouchableWithoutFeedback,
  Platform, ActivityIndicator, FlatList 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  EditarGastoScreen: { gastoId: number };
  Home: undefined;
};

type EditarGastoRouteProp = RouteProp<RootStackParamList, 'EditarGastoScreen'>;

interface Categoria {
  id: number;
  nombre: string;
}

interface MetodoPago {
  id: number;
  nombreMetodo: string;
}

interface Etiqueta {
  id: number;
  nombre: string;
}

interface Frecuencia {
  id: string;
  nombre: string;
}

interface Gasto {
  id: number;
  descripcion: string;
  cantidad: number;
  fecha: string;
  categoriaId: number;
  metodoPagoId: number | null;
  notas: string;
  esFrecuente: boolean;
  frecuencia: number;
  notificar: boolean;
  etiquetas: number[];
}

const EditarGastoScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  const route = useRoute<EditarGastoRouteProp>();
  const { gastoId } = route.params;

  // Estados para los datos del formulario
  const [gasto, setGasto] = useState<Gasto | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('mensual');
  const [notificar, setNotificar] = useState(false);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([]);
  
  // Estados para los datos de selección
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const frecuencias: Frecuencia[] = [
    { id: 'diaria', nombre: 'Diaria' },
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ];

  // Mapeo inverso para frecuencia numérica a string
  const mapFrecuenciaInverso: Record<number, string> = {
    1: 'diaria',
    2: 'semanal',
    3: 'mensual',
    4: 'anual'
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar datos del gasto y opciones en paralelo
        const [gastoRes, catRes, mpRes, etqRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/gastos/${gastoId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/categorias`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/metodosPago`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get(`${API_BASE_URL}/api/etiquetaGasto`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        const gastoData = gastoRes.data;
        console.log('Datos completos del gasto:', gastoData);
        console.log('Frecuencia recibida:', gastoData.frecuencia);
        console.log('Es frecuente?', gastoData.frecuencia > 0 && gastoData.frecuencia <= 4);
        
        setGasto(gastoData);

        // Setear valores del gasto
        setDescripcion(gastoData.descripcion);
        setCantidad(gastoData.cantidad.toString());
        setFecha(new Date(gastoData.fecha));
        setCategoriaId(gastoData.categoriaId);
        setMetodoPagoId(gastoData.metodoPagoId);
        setNotas(gastoData.notas || '');
        setEtiquetasSeleccionadas(gastoData.etiquetas || []);
        
        // Configurar frecuencia
        const frecuenciaValida = gastoData.frecuencia && gastoData.frecuencia >= 1 && gastoData.frecuencia <= 4;
        console.log('Frecuencia válida:', frecuenciaValida);
        
        if (frecuenciaValida) {
          console.log('Marcando como gasto frecuente');
          setEsFrecuente(true);
          setFrecuencia(mapFrecuenciaInverso[gastoData.frecuencia] || 'mensual');
          setNotificar(gastoData.notificar || false);
        } else {
          console.log('Marcando como gasto NO frecuente');
          setEsFrecuente(false);
          setFrecuencia('mensual');
          setNotificar(false);
        }

        // Setear opciones
        setCategorias(catRes.data);
        setMetodosPago(mpRes.data);
        setEtiquetas(etqRes.data);

      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos del gasto');
        navigation.goBack();
      } finally {
        setCargandoDatos(false);
      }
    };

    if (token) cargarDatos();
  }, [token, gastoId]);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const toggleEtiqueta = (id: number) => {
    setEtiquetasSeleccionadas(prev => 
      prev.includes(id) 
        ? prev.filter(etqId => etqId !== id) 
        : [...prev, id]
    );
  };

  const handleActualizar = async () => {
    // Validaciones
    if (!descripcion.trim()) {
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

    setIsLoading(true);

    try {
      const mapFrecuencia = {
        'diaria': 1,
        'semanal': 2,
        'mensual': 3,
        'anual': 4
      };

      const gastoData = {
        Id: gastoId,
        CategoriaId: categoriaId,
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Frecuencia: esFrecuente ? mapFrecuencia[frecuencia as keyof typeof mapFrecuencia] : 0,
        Activo: true,
        Notificar: esFrecuente ? notificar : false,
        Nota: notas.trim(),
        MetodoPagoId: metodoPagoId,
        EtiquetaIds: etiquetasSeleccionadas
      };

      const response = await axios.put(`${API_BASE_URL}/api/gastos/${gastoId}`, gastoData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Éxito', 'Gasto actualizado correctamente');
      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Error al actualizar el gasto';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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

  if (cargandoDatos || !gasto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando datos del gasto...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editar Gasto</Text>
        
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
          onChangeText={text => setCantidad(text.replace(',', '.'))}
        />

        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => Platform.OS === 'android' && setShowDatePicker(true)}
        > 
          <Text>{formatDate(fecha)}</Text>
          {Platform.OS === 'ios' && <Icon name="calendar" size={20} color="#666" />}
        </TouchableOpacity>

        {(showDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'ios' ? 'default' : 'calendar'}
            onChange={handleFechaChange}
          />
        )}

        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categoriesContainer}>
          {categorias.map(cat => (
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

        <Text style={styles.label}>Método de Pago</Text>
        <View style={styles.categoriesContainer}>
          {metodosPago.map(mp => (
            <TouchableOpacity
              key={mp.id}
              style={[
                styles.categoryButton,
                metodoPagoId === mp.id && styles.categoryButtonSelected
              ]}
              onPress={() => setMetodoPagoId(mp.id)}
            >
              <Text style={[
                styles.categoryText,
                metodoPagoId === mp.id && styles.categoryTextSelected
              ]}>
                {mp.nombreMetodo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Etiquetas</Text>
        <TouchableOpacity 
          style={styles.input}
          onPress={() => setShowEtiquetasModal(true)}
        >
          <Text>
            {etiquetasSeleccionadas.length > 0 
              ? `${etiquetasSeleccionadas.length} seleccionadas` 
              : 'Seleccionar etiquetas'}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
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
              <Text>{frecuencias.find(f => f.id === frecuencia)?.nombre}</Text>
              <Icon name="chevron-down" size={20} color="#666" />
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

      {/* Sección de notas */}
      <View style={styles.section}>
        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Agrega detalles adicionales"
          value={notas}
          onChangeText={setNotas}
          multiline
        />
      </View>

      {/* Botón de actualizar */}
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleActualizar}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Actualizar Gasto</Text>
        )}
      </TouchableOpacity>

      {/* Modal de frecuencia */}
      <Modal
        visible={showFrecuenciaModal}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowFrecuenciaModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Seleccionar Frecuencia</Text>
          {frecuencias.map(freq => (
            <TouchableOpacity
              key={freq.id}
              style={styles.modalOption}
              onPress={() => {
                setFrecuencia(freq.id);
                setShowFrecuenciaModal(false);
              }}
            >
              <Text>{freq.nombre}</Text>
              {frecuencia === freq.id && <Icon name="checkmark" size={20} color="#2563eb" />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Modal de etiquetas */}
      <Modal
        visible={showEtiquetasModal}
        transparent
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={() => setShowEtiquetasModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.modalContent, { maxHeight: '70%' }]}>
          <Text style={styles.modalTitle}>Seleccionar Etiquetas</Text>
          <FlatList
            data={etiquetas}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => toggleEtiqueta(item.id)}
              >
                <Text>{item.nombre}</Text>
                {etiquetasSeleccionadas.includes(item.id) && (
                  <Icon name="checkmark" size={20} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowEtiquetasModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Aceptar</Text>
          </TouchableOpacity>
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
    padding: 5,
    paddingBottom: 25
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  modalCloseButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EditarGastoScreen;