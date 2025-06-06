import React, { useState, useEffect, useCallback } from 'react';
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
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Interfaces y Tipos ---
type RootStackParamList = {
  EditarGastoScreen: { gastoId: number };
  Home: undefined;
  CrearEtiquetaScreen: undefined;
};

type EditarGastoRouteProp = RouteProp<RootStackParamList, 'EditarGastoScreen'>;

interface Categoria { id: number; nombre: string; }
interface MetodoPago { id: number; nombreMetodo: string; }
interface EtiquetaPersonalizada { id: number; nombre: string; color: string; }
interface Frecuencia { id: number; nombre: string; }

// --- Componente Principal ---
const EditarGastoScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  const route = useRoute<EditarGastoRouteProp>();
  const { gastoId } = route.params;

  // Estados del formulario
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [esFrecuente, setEsFrecuente] = useState(false);
  const [frecuencia, setFrecuencia] = useState(3);
  const [notificar, setNotificar] = useState(false);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  const [notas, setNotas] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([]);

  // Estados de UI y datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaPersonalizada[]>([]);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const frecuencias: Frecuencia[] = [
    { id: 1, nombre: 'Diaria' },
    { id: 2, nombre: 'Semanal' },
    { id: 3, nombre: 'Mensual' },
    { id: 4, nombre: 'Anual' },
  ];
  
  const mapFrecuenciaInverso: { [key: number]: number } = { 1: 1, 2: 2, 3: 3, 4: 4 };

  useEffect(() => {
    const cargarDatos = async () => {
      if (!token || !gastoId) return;
      try {
        const [gastoRes, catRes, mpRes, etqRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/gastos/${gastoId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/categorias`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/metodosPago`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/EtiquetasPersonalizadas`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const gastoData = gastoRes.data;
        setDescripcion(gastoData.descripcion);
        setCantidad(gastoData.cantidad.toString());
        setFecha(new Date(gastoData.fecha));
        setCategoriaId(gastoData.categoriaId);
        setMetodoPagoId(gastoData.metodoPagoId);
        setNotas(gastoData.nota || '');
        setEtiquetasSeleccionadas(gastoData.etiquetaIds || []);
        
        const frecuenciaValida = gastoData.frecuencia > 0;
        setEsFrecuente(frecuenciaValida);
        if (frecuenciaValida) {
          setFrecuencia(mapFrecuenciaInverso[gastoData.frecuencia] || 3);
          setNotificar(gastoData.notificar || false);
        }

        setCategorias(catRes.data.filter((c: Categoria) => c.id !== 9));
        setMetodosPago(mpRes.data);
        setEtiquetas(etqRes.data);

      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos del gasto');
        navigation.goBack();
      } finally {
        setCargandoDatos(false);
      }
    };
    cargarDatos();
  }, [token, gastoId]);

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFecha(selectedDate);
    }
  };

  const toggleEtiqueta = (id: number) => {
    setEtiquetasSeleccionadas(prev => prev.includes(id) ? prev.filter(etqId => etqId !== id) : [...prev, id]);
  };

  const handleActualizar = async () => {
    if (!descripcion.trim() || !categoriaId) {
      Alert.alert('Error', 'La descripción y la categoría son obligatorias.');
      return;
    }
    const cantidadNum = parseFloat(cantidad.replace(',', '.'));
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número válido mayor a cero.');
      return;
    }
    setIsLoading(true);
    try {
      const gastoData = {
        Id: gastoId,
        CategoriaId: categoriaId,
        Cantidad: cantidadNum,
        Descripcion: descripcion.trim(),
        Fecha: fecha.toISOString(),
        Frecuencia: esFrecuente ? frecuencia : 0,
        Activo: true,
        Notificar: esFrecuente ? notificar : false,
        Nota: notas.trim(),
        MetodoPagoId: metodoPagoId,
        EtiquetasPersonalizadasIds: etiquetasSeleccionadas
      };
      await axios.put(`${API_BASE_URL}/api/gastos/${gastoId}`, gastoData, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      Alert.alert('Éxito', 'Gasto actualizado correctamente');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar el gasto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (cargandoDatos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Gasto</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Descripción *</Text>
        <TextInput style={styles.input} placeholder="Ej: Compra supermercado" value={descripcion} onChangeText={setDescripcion} placeholderTextColor="#94a3b8" />

        <Text style={styles.label}>Cantidad (€) *</Text>
        <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={cantidad} onChangeText={text => setCantidad(text.replace(',', '.'))} placeholderTextColor="#94a3b8" />
        
        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{format(fecha, "dd 'de' MMMM, yyyy", { locale: es })}</Text>
          <Icon name="calendar-outline" size={20} color="#64748b" />
        </TouchableOpacity>
        {showDatePicker && (
            <>
                {Platform.OS === 'android' && (
                    <DateTimePicker value={fecha} mode="date" display="default" onChange={handleFechaChange} />
                )}
                {Platform.OS === 'ios' && (
                    <Modal visible={showDatePicker} transparent={true} animationType="slide">
                        <View style={styles.modalDatePickerOverlay}>
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker value={fecha} mode="date" display="inline" onChange={handleFechaChange} locale="es-ES" />
                                <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.datePickerDoneButtonText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}
            </>
        )}
        
        <Text style={styles.label}>Categoría *</Text>
        <View style={styles.categoriesContainer}>
          {categorias.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.categoryButton, categoriaId === cat.id && styles.categoryButtonSelected]} onPress={() => setCategoriaId(cat.id)}>
              <Text style={[styles.categoryText, categoriaId === cat.id && styles.categoryTextSelected]}>{cat.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Método de Pago</Text>
        <View style={styles.categoriesContainer}>
          {metodosPago.map(mp => (
            <TouchableOpacity key={mp.id} style={[styles.categoryButton, metodoPagoId === mp.id && styles.categoryButtonSelected]} onPress={() => setMetodoPagoId(mp.id)}>
              <Text style={[styles.categoryText, metodoPagoId === mp.id && styles.categoryTextSelected]}>{mp.nombreMetodo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Etiquetas</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowEtiquetasModal(true)}>
          <Text style={etiquetasSeleccionadas.length === 0 ? styles.placeholderText : styles.inputText}>{etiquetasSeleccionadas.length > 0 ? `${etiquetasSeleccionadas.length} seleccionada(s)` : 'Seleccionar etiquetas'}</Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>¿Es un gasto frecuente?</Text>
          <Switch value={esFrecuente} onValueChange={setEsFrecuente} trackColor={{ false: '#d1d5db', true: '#81b0ff' }} thumbColor="#2563eb"/>
        </View>
        {esFrecuente && (
          <View>
            <Text style={styles.label}>Frecuencia</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowFrecuenciaModal(true)}>
              <Text style={styles.inputText}>{frecuencias.find(f => f.id === frecuencia)?.nombre}</Text>
              <Icon name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>¿Notificar próximo pago?</Text>
              <Switch value={notificar} onValueChange={setNotificar} trackColor={{ false: '#d1d5db', true: '#81b0ff' }} thumbColor="#2563eb" />
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notas adicionales</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Agrega cualquier detalle..." value={notas} onChangeText={setNotas} multiline placeholderTextColor="#94a3b8" />
      </View>

      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleActualizar} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Actualizar Gasto</Text>}
      </TouchableOpacity>
      
      {/* Modal de etiquetas */}
                          <Modal
              visible={showEtiquetasModal}
              transparent
              animationType="slide"
            >
              <TouchableWithoutFeedback onPress={() => setShowEtiquetasModal(false)}>
                <View style={styles.modalOverlay} />
              </TouchableWithoutFeedback>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar Etiquetas</Text>
                
                {/* Contenedor para las etiquetas seleccionadas con scroll horizontal */}
                {etiquetasSeleccionadas.length > 0 && (
                  <View style={styles.selectedTagsContainer}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectedTagsScrollContent}
                    >
                      {etiquetasSeleccionadas.map(id => {
                        const etiqueta = etiquetas.find(e => e.id === id);
                        if (!etiqueta) return null;
                        
                        return (
                          <View 
                            key={id} 
                            style={[
                              styles.selectedTag,
                              { backgroundColor: etiqueta.color || '#3b82f6' }
                            ]}
                          >
                            <Text style={styles.selectedTagText}>{etiqueta.nombre}</Text>
                            <TouchableOpacity 
                              onPress={() => toggleEtiqueta(id)}
                              style={styles.removeTagButton}
                            >
                              <Icon name="close" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
      
                {/* Lista de todas las etiquetas disponibles */}
                <FlatList
                  data={etiquetas}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.tagItem,
                        etiquetasSeleccionadas.includes(item.id) && styles.tagItemSelected,
                        { borderLeftColor: item.color || '#3b82f6' }
                      ]}
                      onPress={() => toggleEtiqueta(item.id)}
                    >
                      <View style={styles.tagLeftContent}>
                        <View style={[
                          styles.tagColorIndicator,
                          { backgroundColor: item.color || '#3b82f6' }
                        ]} />
                        <Text style={styles.tagText}>{item.nombre}</Text>
                      </View>
                      {etiquetasSeleccionadas.includes(item.id) && (
                        <Icon name="checkmark-circle" size={24} color={item.color || '#3b82f6'} />
                      )}
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.tagListContent}
                />
      
                <View style={styles.tagModalFooter}>
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => {
                      setShowEtiquetasModal(false);
                      navigation.navigate('CrearEtiquetaScreen');
                    }}
                  >
                    <Icon name="add" size={20} color="white" style={styles.addTagIcon} />
                    <Text style={styles.addTagButtonText}>Añadir Nueva Etiqueta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowEtiquetasModal(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 16,
        color: '#64748b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4, 
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
        marginBottom: 16,
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
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 20,
        fontSize: 16,
        color: '#0f172a',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputText: {
        color: '#0f172a',
        fontSize: 16,
    },
    placeholderText: {
        color: '#94a3b8',
        fontSize: 16,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    categoryButtonSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    categoryText: {
        color: '#334155',
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
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
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalDatePickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    datePickerContainer: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    datePickerDoneButton: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    datePickerDoneButtonText: {
        color: '#2563eb',
        fontSize: 16,
        fontWeight: '600',
    },
    tagItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderLeftWidth: 4, 
    },
    tagItemSelected: {
      backgroundColor: '#f0fdf4',
      borderColor: '#bbf7d0',
    },
    tagLeftContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedTagsScrollContent: {
        paddingHorizontal: 5,
        alignItems: 'center',
      },
    tagColorIndicator: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 12,
    },
    tagText: {
      fontSize: 16,
      color: '#1e293b',
      fontWeight: '500',
    },
    tagModalFooter: {
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      paddingTop: 16,
    },
    modalCloseButton: { 
      backgroundColor: '#2563eb', 
      padding: 14, 
      borderRadius: 10, 
      alignItems: 'center',
      marginTop: 12,
    },
    modalCloseButtonText: { 
      color: 'white', 
      fontWeight: 'bold',
      fontSize: 16,
    },
    addTagButton: {
      flexDirection: 'row',
      backgroundColor: '#2563eb',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    addTagIcon: {
      marginRight: 8,
    },
    addTagButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '500',
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
    maxHeight: '70%', // Altura máxima fija
  },
  modalTitle: { 
  fontSize: 20, 
  fontWeight: 'bold', 
  marginBottom: 20, 
  textAlign: 'center',
  color: '#1e293b',
},
  modalOption: { paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
 modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
 tagListContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  removeTagButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTagsContainer: {
    maxHeight: 60, // Altura máxima para las etiquetas seleccionadas
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#3b82f6',
  },
  selectedTagText: {
    color: 'white',
    fontSize: 14,
    marginRight: 6,
  },
});

export default EditarGastoScreen;