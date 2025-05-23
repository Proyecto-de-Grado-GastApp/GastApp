import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MetodoPago {
  id: number;
  nombreMetodo: string;
}

interface Etiqueta {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

const DetalleGastoScreen = ({ route, navigation }: any) => {
  const { token } = useAuth();
  const { gastoId } = route.params;
  const [gasto, setGasto] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estados para edición
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState('');
  const [notificar, setNotificar] = useState(false);

  // Datos para selección
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([]);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const frecuencias = [
    { id: 'diaria', nombre: 'Diaria', valorBackend: 1 },
    { id: 'semanal', nombre: 'Semanal', valorBackend: 2 },
    { id: 'mensual', nombre: 'Mensual', valorBackend: 3 },
    { id: 'anual', nombre: 'Anual', valorBackend: 4 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos en paralelo
        const [gastoRes, metodosRes, etiquetasRes, categoriasRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/gastos/${gastoId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/metodosPago`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/etiquetaGasto`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/api/categorias`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setGasto(gastoRes.data);
        setMetodosPago(metodosRes.data);
        setEtiquetas(etiquetasRes.data);
        setCategorias(categoriasRes.data);

        // Inicializar estados de edición
        setDescripcion(gastoRes.data.descripcion);
        setCantidad(gastoRes.data.cantidad.toString());
        setFecha(new Date(gastoRes.data.fecha));
        setCategoriaId(gastoRes.data.categoriaId);
        setMetodoPagoId(gastoRes.data.metodoPagoId);
        setNotas(gastoRes.data.nota || '');
        setEsFrecuente(gastoRes.data.frecuencia !== null);
        
        // Convertir frecuencia numérica a string para el selector
        if (gastoRes.data.frecuencia) {
          const freq = frecuencias.find(f => f.valorBackend === gastoRes.data.frecuencia);
          setFrecuencia(freq?.id || '');
        }
        
        setNotificar(gastoRes.data.notificar);
        setEtiquetasSeleccionadas(gastoRes.data.etiquetas?.map((e: any) => e.id) || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del gasto');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gastoId, token]);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fecha;
    setShowDatePicker(false);
    setFecha(currentDate);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const formatFecha = (date: Date) => {
    return format(date, "dd MMMM yyyy", { locale: es });
  };

  const toggleEtiqueta = (id: number) => {
    setEtiquetasSeleccionadas(prev => 
      prev.includes(id) 
        ? prev.filter(etqId => etqId !== id) 
        : [...prev, id]
    );
  };

  const handleCancelar = async () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres cancelar este gasto?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`${API_BASE_URL}/api/gastos/${gastoId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              Alert.alert('Éxito', 'Gasto cancelado correctamente');
              
              // Navegar a HomeScreen con flag de refresh y eliminar esta pantalla del stack
              navigation.replace('AgregarGastoScreen', { refresh: true });
              
            } catch (error) {
              console.error('Error al cancelar gasto:', error);
              Alert.alert('Error', 'No se pudo cancelar el gasto');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGuardarCambios = async () => {
    if (!descripcion.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
      return;
    }

    try {
      const datosActualizados = {
        Id: gastoId,
        CategoriaId: categoriaId,
        MetodoPagoId: metodoPagoId,
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Frecuencia: esFrecuente 
          ? frecuencias.find(f => f.id === frecuencia)?.valorBackend || 0 
          : 0,
        Activo: true,
        Notificar: esFrecuente ? notificar : false,
        Nota: notas.trim() || null,
        EtiquetaIds: etiquetasSeleccionadas
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/gastos/${gastoId}`, 
        datosActualizados, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Actualizar el estado local con los cambios
      setGasto({
        ...gasto,
        ...datosActualizados,
        etiquetas: etiquetas.filter(e => etiquetasSeleccionadas.includes(e.id))
      });

      Alert.alert('Éxito', 'Los cambios se guardaron correctamente');
      setEditMode(false);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      
      let errorMessage = 'No se pudieron guardar los cambios';
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.errors) {
          const validationErrors = Object.values(error.response.data.errors)
            .flat()
            .join('\n');
          errorMessage = `Errores de validación:\n${validationErrors}`;
        } else {
          errorMessage = error.response?.data?.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading || !gasto) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Gasto</Text>
        <TouchableOpacity onPress={toggleEditMode}>
          <Icon 
            name={editMode ? "close" : "create-outline"} 
            size={24} 
            color="#2563eb" 
          />
        </TouchableOpacity>
      </View>

      {editMode ? (
        <View style={styles.editContainer}>
          {/* Sección de información básica */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Gasto</Text>
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={styles.label}>Cantidad (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={cantidad}
              onChangeText={setCantidad}
            />

            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity 
              style={[styles.input, {flexDirection: 'row', alignItems: 'center'}]} 
              onPress={() => setShowDatePicker(true)}
            >
              <View style={{flex: 1}}>
                <Text>{formatFecha(fecha)}</Text>
              </View>
              <Icon name="calendar" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                onChange={handleFechaChange}
              />
            )}

            <Text style={styles.label}>Categoría</Text>
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

            <Text style={styles.label}>Método de Pago</Text>
            <View style={styles.categoriesContainer}>
              {metodosPago.map((mp) => (
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
          </View>

          {/* Sección de etiquetas */}
          <View style={styles.section}>
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
                <View style={styles.categoriesContainer}>
                  {frecuencias.map((freq) => (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.categoryButton,
                        frecuencia === freq.id && styles.categoryButtonSelected
                      ]}
                      onPress={() => setFrecuencia(freq.id)}
                    >
                      <Text style={[
                        styles.categoryText,
                        frecuencia === freq.id && styles.categoryTextSelected
                      ]}>
                        {freq.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notas}
              onChangeText={setNotas}
              multiline
              placeholder="Agrega cualquier detalle adicional"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleGuardarCambios}
          >
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.detailContainer}>
          {/* Vista de detalle (solo lectura) */}
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Descripción:</Text>
              <Text style={styles.detailValue}>{gasto.descripcion || 'Sin descripción'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad:</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                €{gasto.cantidad.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>{formatFecha(new Date(gasto.fecha))}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Categoría:</Text>
              <Text style={styles.detailValue}>
                {categorias.find(c => c.id === gasto.categoriaId)?.nombre || 'Otros'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Método de Pago:</Text>
              <Text style={styles.detailValue}>
                {metodosPago.find(m => m.id === gasto.metodoPagoId)?.nombreMetodo || 'No especificado'}
              </Text>
            </View>
            {gasto.etiquetas?.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Etiquetas:</Text>
                <View style={styles.tagsContainer}>
                  {gasto.etiquetas.map((etiqueta: any) => (
                    <View key={etiqueta.id} style={styles.tag}>
                      <Text style={styles.tagText}>{etiqueta.nombre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {gasto.frecuencia ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Frecuencia:</Text>
                  <Text style={styles.detailValue}>
                    {frecuencias.find(f => f.valorBackend === gasto.frecuencia)?.nombre || '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notificar:</Text>
                  <Text style={styles.detailValue}>
                    {gasto.notificar ? 'Sí' : 'No'}
                  </Text>
                </View>
              </>
            ) : null}
            {gasto.nota && (
              <View style={styles.notesContainer}>
                <Text style={styles.detailLabel}>Notas:</Text>
                <Text style={styles.notesText}>
                  {gasto.nota}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
                  style={[styles.button, styles.deleteButton]} 
                  onPress={handleCancelar}
                >
                  <Icon name="trash-outline" size={20} color="white" />
                  <Text style={styles.buttonText}>Eliminar Gasto</Text>
                </TouchableOpacity>
        </View>
      )}

      {/* Modal para seleccionar etiquetas */}
      <Modal
        visible={showEtiquetasModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEtiquetasModal(false)}
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
    padding: 16,
    paddingBottom: 20
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailContainer: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  amountText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  editContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryText: {
    color: '#334155',
  },
  categoryTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 5,
    marginBottom: 5,
  },
  tagText: {
    color: '#0369a1',
    fontSize: 12,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    marginTop: 20
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetalleGastoScreen;