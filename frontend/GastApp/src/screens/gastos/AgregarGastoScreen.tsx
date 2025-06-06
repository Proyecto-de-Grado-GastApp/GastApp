import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, Switch, Modal, TouchableWithoutFeedback,
  Platform, ActivityIndicator, FlatList, Linking, PermissionsAndroid
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../api/urlConnection';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import type { StackNavigationProp } from '@react-navigation/stack';
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { launchCamera as rnLaunchCamera, CameraOptions } from 'react-native-image-picker';


import { mostrarNotificacionNuevoGasto } from '../../notifications/notifeeService';
import { mostrarNotificacionPresupuestoCasiAgotado, mostrarNotificacionPresupuestoSuperado } from "../../notifications/notifeeService";
import notifee, { AndroidImportance } from '@notifee/react-native';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
  CrearEtiquetaScreen: undefined;
};

interface Categoria {
  id: number;
  nombre: string;
}

interface MetodoPago {
  id: number;
  nombreMetodo: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface Etiqueta {
  id: number;
  nombre: string;
}

interface Frecuencia {
  id: string;
  nombre: string;
}

interface EtiquetaPersonalizada {
  id: number;
  nombre: string;
  color: string; 
  usuarioId?: number;
}

interface ExtractedInformationDto {
  tienda: string | null;
  fecha: string | null; // La fecha vendrá como string, la parsearemos
  total: string | null; // El total vendrá como string, lo parsearemos
  textoCompletoLimpio?: string; // Opcional para depuración si el backend lo envía
}

const AgregarGastoScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
  
  // Estados para los datos del formulario
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
  const [etiquetas, setEtiquetas] = useState<EtiquetaPersonalizada[]>([]);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Para el guardado general
  const [isOcrLoading, setIsOcrLoading] = useState(false); // Específico para el proceso OCR
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const frecuencias: Frecuencia[] = [
    { id: 'diaria', nombre: 'Diaria' },
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ];

  const [uiState, setUiState] = useState({
    showDatePicker: false,
    showFrecuenciaModal: false,
    showEtiquetasModal: false,
    isLoading: false,
    isOcrLoading: false,
    isDataLoading: true,
  });

  useEffect(() => {
    (async () => {
      const settings = await notifee.requestPermission();
      if (settings.authorizationStatus < 1) {
        console.warn('Permiso para notificaciones denegado');
      }
    })();
  }, []);
  
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [catRes, mpRes, etqRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/categorias`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/metodosPago`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/EtiquetasPersonalizadas`, { // Cambiado a la nueva ruta
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setCategorias(catRes.data);
        setMetodosPago(mpRes.data);
        setEtiquetas(etqRes.data);
        
        if (catRes.data.length > 0) setCategoriaId(catRes.data[0].id);
        if (mpRes.data.length > 0) setMetodoPagoId(mpRes.data[0].id);
        
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los datos iniciales');
      } finally {
        setCargandoDatos(false);
      }
    };
    
    if (token) cargarDatosIniciales();
  }, [token]);
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const parseDateString = (dateString: string): Date | null => {
    // Intenta parsear formatos comunes como DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
    const partsSlash = dateString.split('/');
    const partsDash = dateString.split('-');

    let day, month, year;

    if (partsSlash.length === 3) { // Formato con /
        // DD/MM/YYYY (Europa)
        day = parseInt(partsSlash[0], 10);
        month = parseInt(partsSlash[1], 10) - 1; // Meses en JS son 0-indexados
        year = parseInt(partsSlash[2], 10);
         if (year < 100) year += 2000; // Asumir siglo XXI para años de 2 dígitos
    } else if (partsDash.length === 3) { // Formato con -
        // YYYY-MM-DD (ISO)
        year = parseInt(partsDash[0], 10);
        month = parseInt(partsDash[1], 10) - 1;
        day = parseInt(partsDash[2], 10);
    } else {
        return null; // Formato no reconocido
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
    }
    const parsed = new Date(year, month, day);
    // Validar si la fecha es válida (ej. 31/02/2025 no es válido)
    if (parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day) {
        return parsed;
    }
    return null;
  };

  const processImageForOCR = async (imageUri: string, type: string, fileName?: string) => {
    
    setUiState(prev => ({...prev, isOcrLoading: true}));
    try {
      const formData = new FormData();
      formData.append('imageFile', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        type: type || 'image/jpeg',
        name: fileName || `ticket_${Date.now()}.jpg`,
      });

      const endpointUrl = `${API_BASE_URL}/api/Ocr/process-ticket`;
      console.log(`Enviando imagen a: ${endpointUrl}`);

      const response = await fetch(endpointUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del backend:', response.status, errorText);
        throw new Error(`Error del servidor: ${response.status} - ${errorText || 'No se pudo procesar el ticket.'}`);
      }

      const extractedData: ExtractedInformationDto = await response.json();
      console.log('Datos extraídos:', extractedData);

      // Actualizar el estado con los datos extraídos
      if (extractedData.total) {
        setCantidad(extractedData.total.toString().replace('.', ','));
      }
      if (extractedData.fecha) {
        const parsedDate = parseDateString(extractedData.fecha);
        if (parsedDate) setFecha(parsedDate);
      }
      if (extractedData.tienda) {
        setDescripcion(`Compra en ${extractedData.tienda}`);
      }

      Alert.alert(
        'Ticket Procesado',
        `Tienda: ${extractedData.tienda || 'No identificada'}\n` +
        `Total: ${extractedData.total ? extractedData.total + '€' : 'No identificado'}\n` +
        `Fecha: ${extractedData.fecha || 'No identificada'}`
      );
    } catch (error) {
      console.error('Error en procesamiento OCR:', error);
      Alert.alert(
        'Error de Procesamiento', 
        error instanceof Error ? error.message : 'Ocurrió un error desconocido al procesar la imagen.'
      );
    } finally {
      setUiState(prev => ({...prev, isOcrLoading: false}));
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Verificar permisos en Android
      if (Platform.OS === 'android') {
        const cameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!cameraPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Permiso de Cámara',
              message: 'La aplicación necesita acceso a la cámara para escanear tickets',
              buttonNeutral: 'Preguntar después',
              buttonNegative: 'Cancelar',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permiso requerido',
              'No se puede usar la cámara sin permisos',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir configuración', onPress: () => Linking.openSettings() }
              ]
            );
            return;
          }
        }
      }

      // Configuración de la cámara
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'back',
        includeBase64: false,
      };

      const result = await rnLaunchCamera(options);
      
      if (result.didCancel) {
        console.log('Usuario canceló la cámara');
        return;
      }

      if (result.errorCode || result.errorMessage) {
        console.log('Error en la cámara:', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Error al acceder a la cámara');
        return;
      }

      const imageAsset = result.assets && result.assets[0];
      if (!imageAsset || !imageAsset.uri) {
        Alert.alert('Error', 'No se pudo obtener la imagen de la cámara');
        return;
      }

      await processImageForOCR(imageAsset.uri, imageAsset.type || 'image/jpeg', imageAsset.fileName);
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara. Por favor verifica los permisos.');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode || result.errorMessage) {
        console.log('Error en galería:', result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Error al seleccionar imagen');
        return;
      }

      const imageAsset = result.assets && result.assets[0];
      if (!imageAsset || !imageAsset.uri) {
        Alert.alert('Error', 'No se pudo obtener la imagen seleccionada');
        return;
      }

      await processImageForOCR(imageAsset.uri, imageAsset.type || 'image/jpeg', imageAsset.fileName);
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'Ocurrió un error al seleccionar la imagen de la galería');
    }
  };

  const handleFechaChange = (event: any, selectedDate?: Date) => {
    // Ocultar el picker en cualquier acción del usuario (seleccionar o cancelar)
    setShowDatePicker(false);

    // Solo actualizar la fecha si el usuario presionó "OK" y seleccionó una fecha
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

  const getTagColor = (id: number): string => {
  const colors = [
      '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6',
      '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
      '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'
    ];
    return colors[id % colors.length];
  };
  
  const handleGuardar = async () => {
  // --- 1. Validaciones de entrada (sin cambios) ---
  if (!descripcion.trim()) {
    Alert.alert('Error', 'La descripción es obligatoria');
    return;
  }
  // Se usa .replace para asegurar que tanto comas como puntos funcionen como decimales
  const cantidadNum = parseFloat(cantidad.replace(',', '.'));
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    Alert.alert('Error', 'Ingrese una cantidad válida mayor a cero');
    return;
  }
  if (!categoriaId) {
    Alert.alert('Error', 'Seleccione una categoría');
    return;
  }

  setIsLoading(true);

  // --- 2. Preparación del objeto de datos del gasto ---
  const mapFrecuencia = { 'diaria': 1, 'semanal': 2, 'mensual': 3, 'anual': 4 };
  const gastoData = {
    CategoriaId: categoriaId,
    Cantidad: cantidadNum,
    Descripcion: descripcion.trim(),
    Fecha: fecha.toISOString(),
    Frecuencia: esFrecuente ? mapFrecuencia[frecuencia as keyof typeof mapFrecuencia] : 0,
    Activo: true,
    Notificar: esFrecuente ? notificar : false,
    Nota: notas.trim(),
    MetodoPagoId: metodoPagoId,
    EtiquetasPersonalizadasIds: etiquetasSeleccionadas
  };

  // --- 3. Bloque Try/Catch para la operación crítica ---
  try {
    // Intenta guardar el gasto en la base de datos.
    // Esta es la única operación que, si falla, debe mostrar un error al usuario.
    await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    // Si la línea anterior no falló, el gasto se creó con éxito.
    // Informa al usuario inmediatamente.
    Alert.alert('Éxito', 'Gasto creado correctamente');

    // Navega hacia atrás después de un breve momento.
    setTimeout(() => navigation.goBack(), 500);

    // --- 4. Ejecución de Tareas Secundarias (no críticas) ---
    // Estas tareas se ejecutan después del éxito, pero sus fallos no
    // mostrarán un error al usuario, solo se registrarán en la consola.

    // Tarea secundaria 1: Notificación de nuevo gasto
    try {
      await mostrarNotificacionNuevoGasto(descripcion, cantidadNum);
    } catch (notifError) {
      console.error('Error al mostrar la notificación de nuevo gasto:', notifError);
    }

    // Tarea secundaria 2: Comprobación y notificación de presupuestos
    try {
      const resPresupuestos = await axios.get(`${API_BASE_URL}/api/presupuestos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const presupuesto = resPresupuestos.data.find((p: any) => p.categoriaId === categoriaId);

      if (presupuesto) {
        // Lógica de cálculo de gastos para el presupuesto encontrado
        const resGastos = await axios.get(`${API_BASE_URL}/api/gastos/por-categoria/${categoriaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const gastosFiltrados = resGastos.data.filter((g: any) => {
          const fechaGasto = new Date(g.fecha);
          return g.activo !== false &&
                 fechaGasto >= new Date(presupuesto.fechaInicio) &&
                 fechaGasto <= new Date(presupuesto.fechaFin);
        });

        const gastadoDespues = gastosFiltrados.reduce((sum: number, g: any) => sum + g.cantidad, 0);
        const gastadoAntes = gastadoDespues - cantidadNum; // Total gastado antes de este nuevo gasto
        
        const porcentajeAntes = (gastadoAntes / presupuesto.cantidad) * 100;
        const porcentajeDespues = (gastadoDespues / presupuesto.cantidad) * 100;

        if (porcentajeAntes < 90 && porcentajeDespues >= 90 && porcentajeDespues < 100) {
          mostrarNotificacionPresupuestoCasiAgotado(
            presupuesto.categoriaNombre,
            presupuesto.cantidad,
            presupuesto.cantidad - gastadoDespues
          );
        } else if (porcentajeAntes < 100 && porcentajeDespues >= 100) {
          mostrarNotificacionPresupuestoSuperado(
            presupuesto.categoriaNombre,
            presupuesto.cantidad,
            gastadoDespues - presupuesto.cantidad
          );
        }
      }
    } catch (presupuestoError) {
      console.error("Error al comprobar los presupuestos después de crear el gasto:", presupuestoError);
    }

  } catch (error: any) {
    // --- 5. Manejo del Error Crítico ---
    // Este bloque solo se ejecutará si la llamada `axios.post` para crear el gasto falla.
    let errorMessage = 'Error al crear el gasto';
    if (error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors).flat().join('\n');
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    Alert.alert('Error', errorMessage);

  } finally {
    // Se ejecuta siempre, haya habido éxito o error.
    setIsLoading(false);
  }
};

  if (cargandoDatos) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Cargando formulario iniciales...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header} >
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10, bottom:10, left:10, right:10}}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Gasto</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        {uiState.isOcrLoading && (
          <View style={styles.ocrLoadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.ocrLoadingText}>Procesando ticket...</Text>
          </View>
        )}
        <Text style={[styles.label, { marginTop: 0 }]}>Descripción *</Text>
        <TextInput style={styles.input} placeholder="Ej: Compra supermercado" value={descripcion} onChangeText={setDescripcion} placeholderTextColor="#94a3b8" />

        <Text style={styles.label}>Cantidad (€) *</Text>
        <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={cantidad} onChangeText={text => setCantidad(text.replace(',', '.'))} placeholderTextColor="#94a3b8" />
        
        <Text style={styles.label}>Cargar datos automáticamente: </Text>
        <View style={styles.ocrButtonContainer}>
            <TouchableOpacity style={styles.scanButton} onPress={handleTakePhoto} disabled={uiState.isOcrLoading}>
              {uiState.isOcrLoading ? <ActivityIndicator color="white" /> : <Icon name="camera-outline" size={20} color="white" />}
              <Text style={styles.scanButtonText}>Escanear Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.scanButton, {backgroundColor: '#34d399'}]} onPress={handleSelectFromGallery} disabled={uiState.isOcrLoading}>
              {uiState.isOcrLoading ? <ActivityIndicator color="white" /> : <Icon name="images-outline" size={20} color="white" />}
              <Text style={styles.scanButtonText}>Desde Galería</Text>
            </TouchableOpacity>
        </View>
        <Text style={styles.discreteText}>Esta herramienta está en proceso de mejora, puede fallar.</Text>
        
        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity 
          style={styles.input} 
          onPress={() => setShowDatePicker(true)}
        >
            <Text style={styles.inputText}>{format(fecha, "dd 'de' MMMM, yyyy", { locale: es })}</Text>
            <Icon name="calendar-outline" size={20} color="#64748b" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display="default" // 'default' funciona bien y muestra el estilo nativo en ambas plataformas
            onChange={handleFechaChange}
          />
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
          <Text style={etiquetasSeleccionadas.length === 0 ? styles.placeholderText : styles.inputText}>{etiquetasSeleccionadas.length > 0 ? `${etiquetasSeleccionadas.length} seleccionadas` : 'Seleccionar etiquetas'}</Text>
          <Icon name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { paddingBottom: 12 }]}>
        <View style={styles.switchContainer}>
          <Text style={[styles.label, { marginTop: 0 }]}>¿Es un gasto frecuente?</Text>
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
        <Text style={[styles.label, { marginTop: 0 }]}>Notas adicionales</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Agrega cualquier detalle..." value={notas} onChangeText={setNotas} multiline placeholderTextColor="#94a3b8" />
      </View>

      <TouchableOpacity style={[styles.button, uiState.isLoading && styles.buttonDisabled]} onPress={handleGuardar} disabled={uiState.isLoading}>
        {uiState.isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Guardar Gasto</Text>}
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
        position: 'relative',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        marginTop: 15,
        color: '#334155',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 14,
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
    ocrButtonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    scanButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1d4ed8',

        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    scanButtonText: {
        color: 'white',
        fontWeight: '600',
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
 
  categoriesScrollView: { marginBottom: 10 },
    discreteText:{
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 8,
    },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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
 
  iosDateDoneButton: { // Estilo para el botón OK de iOS en el DatePicker
    padding: 10,
    alignItems: 'flex-end', // Alinearlo a la derecha
    backgroundColor: '#f0f0f0', // Un fondo ligero para distinguirlo
    borderBottomLeftRadius: 8, // Opcional, para redondear esquinas si el picker está encima
    borderBottomRightRadius: 8,
  },
  iosDateDoneButtonText: {
    color: '#007aff', // Color azul típico de iOS para botones de acción
    fontSize: 16,
  },
  emptyTagsContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
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
  removeTagButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagListContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
emptyTagsIcon: {
  marginBottom: 16,
},
emptyTagsText: {
  fontSize: 16,
  color: '#64748b',
  textAlign: 'center',
  marginBottom: 24,
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
ocrLoadingOverlay: {
        ...StyleSheet.absoluteFillObject, // Cubre completamente el componente padre
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12, // Para que coincida con el borde de la tarjeta
        zIndex: 10, // Para asegurarse de que esté por encima de otros elementos
    },
    ocrLoadingText: {
        color: 'white',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },

});


const handleLaunchCamera = async (): Promise<ImagePickerResponse | null> => {
  try {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
      cameraType: 'back',
    };

    // Manejo de permisos para Android
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      if (
        granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        Alert.alert(
          'Permisos requeridos',
          'Para escanear tickets necesitas conceder los permisos de cámara y almacenamiento',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Abrir configuración',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return null;
      }
    }

    // Lanzar la cámara
    const result = await rnLaunchCamera(options);
    
    if (result.didCancel) {
      console.log('Usuario canceló la acción de la cámara');
      return null;
    }

    if (result.errorCode || result.errorMessage) {
      console.log('Error en la cámara:', result.errorMessage);
      Alert.alert('Error', result.errorMessage || 'Error al acceder a la cámara');
      return null;
    }

    return result;
    
  } catch (error) {
    console.error('Error al lanzar cámara:', error);
    Alert.alert('Error', 'No se pudo abrir la cámara. Por favor verifica los permisos.');
    return null;
  }
};

export default AgregarGastoScreen;