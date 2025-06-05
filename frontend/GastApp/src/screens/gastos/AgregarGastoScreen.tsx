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
import type { StackNavigationProp } from '@react-navigation/stack';
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';

import recognize from '@react-native-ml-kit/text-recognition';

import { mostrarNotificacionNuevoGasto } from '../../notifications/notifeeService';
import { mostrarNotificacionPresupuestoCasiAgotado, mostrarNotificacionPresupuestoSuperado } from "../../notifications/notifeeService";
import notifee, { AndroidImportance } from '@notifee/react-native';

type RootStackParamList = {
  AgregarGasto: undefined;
  Home: undefined;
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

const AgregarGastoScreen: React.FC<{ navigation: StackNavigationProp<RootStackParamList> }> = ({ navigation }) => {
  const { token } = useAuth();
//  Estados para los datos del formulario
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
  
//  Estados para los datos de selección
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [showFrecuenciaModal, setShowFrecuenciaModal] = useState(false);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const frecuencias: Frecuencia[] = [
    { id: 'diaria', nombre: 'Diaria' },
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'mensual', nombre: 'Mensual' },
    { id: 'anual', nombre: 'Anual' },
  ];

  type TicketData = {
  supermercado: string;
  total: number | null;
  fecha: Date | null;
  numeroTicket: string | null;
  metodoPago: 'Tarjeta' | 'Efectivo' | null;
  lineasProductos: string[];
};

const procesarTicket = (textoOCR: string): TicketData => {
  console.log("=== TEXTO ORIGINAL DEL OCR ===");
  console.log(textoOCR);
  console.log("=============================");

  const rawLines = textoOCR.split('\n');
  // Limpiar líneas vacías y trim
  const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0);

  // 1) Supermercado
  let supermercado: TicketData['supermercado'] = 'Otro';
  const marcas = [
    { regex: /MERCADONA/i, nombre: 'Mercadona' },
    { regex: /CARREFOUR/i, nombre: 'Carrefour' },
    { regex: /DIA\b/i, nombre: 'DIA' },
    // Añade aquí más marcas si lo necesitas
  ];
  for (const m of marcas) {
    if (lines.some(l => m.regex.test(l))) {
      supermercado = m.nombre;
      break;
    }
  }
  // Si no detectamos marca, tomamos la primera línea (opcional):
  if (supermercado === 'Otro' && lines.length > 0) {
    supermercado = lines[0].toUpperCase();
  }

  // 2) Fecha (y hora si existe)
  let fecha: Date | null = null;
  for (const l of lines) {
    // Buscamos dd/mm/yyyy hh:mm o sólo dd/mm/yyyy
    const m = l.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (m) {
      const [ , dd, mm, yyyy, hh = '00', mi = '00'] = m;
      fecha = new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:00`);
      break;
    }
  }

  // 3) Número de ticket
  let numeroTicket: string | null = null;
  for (const l of lines) {
    const m = l.match(/TICKET[:\s]*#?(\d+)/i);
    if (m) {
      numeroTicket = m[1];
      break;
    }
  }

  // 4) TOTAL (scan de abajo arriba)
  let total: number | null = null;
  let idxTotalLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (/^TOTAL\b/i.test(l)) {
      idxTotalLine = i;
      // (a) mismo renglón: “TOTAL 32,68”
      const m1 = l.match(/^TOTAL[^\d]*([\d.,]+)/i);
      if (m1) {
        total = parseFloat(m1[1].replace(/\./g, '').replace(',', '.'));
        break;
      }
      // (b) número en siguiente línea
      if (i + 1 < lines.length) {
        const m2 = lines[i+1].match(/^([\d.,]+)$/);
        if (m2) {
          total = parseFloat(m2[1].replace(/\./g, '').replace(',', '.'));
          break;
        }
      }
    }
  }
  // (c) Fallback: buscar última línea que contenga sólo un número con coma o punto dec.
  if (total === null) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/^([\d]+\.\d{2}|[\d]+,\d{2})$/);
      if (m) {
        total = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        idxTotalLine = i;
        break;
      }
    }
  }

  // 5) Método de pago: normalmente justo después del total
  let metodoPago: TicketData['metodoPago'] = null;
  for (let i = idxTotalLine + 1; i < lines.length; i++) {
    const l = lines[i].toUpperCase();
    if (/TARJETA/.test(l)) {
      metodoPago = 'Tarjeta';
      break;
    }
    if (/EFECTIVO/.test(l)) {
      metodoPago = 'Efectivo';
      break;
    }
  }

  // 6) Líneas de productos (todo lo anterior a TOTAL)
  const lineasProductos: string[] = [];
  for (let i = 0; i < (idxTotalLine > 0 ? idxTotalLine : lines.length); i++) {
    const l = lines[i];
    // Detectamos líneas con: qty descripción precio_unitario precio_importe
    if (/^\d+\s+.+\s+[\d,]+\s+[\d,]+$/.test(l)) {
      lineasProductos.push(l);
    }
    // Detectamos peso: “0,154 kg 7,50 €/kg 1,16”
    else if (/[\d,]+\s*kg\b.*€\/kg.*[\d,]+/.test(l)) {
      lineasProductos.push(l);
    }
  }

  // 7) Validar que total sea razonable
  if (total !== null && (total < 0.1 || total > 100000)) {
    total = null;
  }

  console.log("=== DATOS PROCESADOS ===");
  console.log({ supermercado, fecha, numeroTicket, total, metodoPago, productos: lineasProductos.length });
  console.log("=========================");

  return {
    supermercado,
    fecha,
    numeroTicket,
    total,
    metodoPago,
    lineasProductos
  };
};

  
  const handleScanTicket = async () => {
    try {
      const image = await ImagePicker.openCamera({
        cropping: false,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      const result = await recognize.recognize(image.path);
      const datosTicket = procesarTicket(result.text);

      // Actualizar estado con los datos
      if (datosTicket.total) {
        setCantidad(datosTicket.total.toString());
      }

      if (datosTicket.fecha) {
        setFecha(datosTicket.fecha);
      }

      setDescripcion(`Compra en ${datosTicket.supermercado}`);
      
      Alert.alert(
        '✅ Ticket procesado', 
        `Supermercado: ${datosTicket.supermercado}\nTotal: ${datosTicket.total}€`
      );

    } catch (error) {
      console.error('Error al escanear ticket:', error);
      Alert.alert('Error', 'No se pudo procesar el ticket.');
    }
  };

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
          axios.get(`${API_BASE_URL}/api/etiquetaGasto`, { headers: { Authorization: `Bearer ${token}` } })
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

  const handleSeleccionarImagenYReconocerTexto = async () => {
    try {
        setIsLoading(true); // Activar indicador de carga
        
        const result = await launchImageLibrary({
            mediaType: 'photo',
            includeBase64: false,
            quality: 0.8, // Mejor calidad para OCR
        });

        if (result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;

            if (!uri) {
                Alert.alert('Error', 'No se pudo obtener la imagen.');
                return;
            }

            // OCR con la librería
            const ocrResult = await recognize.recognize(uri);
            const textoCompleto = ocrResult.text;

            if (!textoCompleto || textoCompleto.length === 0) {
                Alert.alert('Sin texto', 'No se pudo reconocer ningún texto en la imagen.');
                return;
            }

            // Procesar el texto del ticket con nuestra función mejorada
            const datosTicket = procesarTicket(textoCompleto);

            // Actualizar el estado con los datos extraídos
            if (datosTicket.total) {
                setCantidad(datosTicket.total.toString());
            }

            if (datosTicket.fecha) {
                setFecha(datosTicket.fecha);
            }

            if (datosTicket.supermercado) {
                setDescripcion(`Compra en ${datosTicket.supermercado}`);
            }

            if (datosTicket.metodoPago) {
                // Buscar si coincide con algún método de pago existente
                const metodoExistente = datosTicket.metodoPago
                    ? metodosPago.find(
                        mp => mp.nombreMetodo.toLowerCase().includes(datosTicket.metodoPago!.toLowerCase())
                    )
                    : undefined;
                if (metodoExistente) {
                    setMetodoPagoId(metodoExistente.id);
                }
            }

            // Mostrar resumen al usuario
            Alert.alert(
                'Ticket procesado',
                `Supermercado: ${datosTicket.supermercado}\n` +
                `Total: ${datosTicket.total ? datosTicket.total + '€' : 'No identificado'}\n` +
                `Fecha: ${datosTicket.fecha ? formatDate(datosTicket.fecha) : 'No identificada'}\n` +
                `Método pago: ${datosTicket.metodoPago || 'No identificado'}`
            );

            // Opcional: Mostrar datos en consola para depuración
            console.log('Datos del ticket procesado:', datosTicket);
        }
    } catch (error) {
        console.error('Error en el proceso OCR:', error);
        Alert.alert(
            'Error', 
            error instanceof Error ? error.message : 'Ocurrió un error al procesar el ticket'
        );
    } finally {
        setIsLoading(false); // Desactivar indicador de carga
    }
};

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

  const handleGuardar = async () => {
  //  Validaciones
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

      const resPresupuestos = await axios.get(`${API_BASE_URL}/api/presupuestos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const todosLosPresupuestos = resPresupuestos.data;
      const presupuesto = todosLosPresupuestos.find((p: any) => p.categoriaId === categoriaId);

      //Función para calcular el total gastado en ese presupuesto antes y después de crear el gasto
      const obtenerTotalGastado = async () => {
        const resGastos = await axios.get(`${API_BASE_URL}/api/gastos/categoria/${categoriaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const gastosFiltrados = resGastos.data.filter((g: any) => {
          const fechaGasto = new Date(g.fecha);
          return g.activo !== false &&
            fechaGasto >= new Date(presupuesto.fechaInicio) &&
            fechaGasto <= new Date(presupuesto.fechaFin);
        });

        return gastosFiltrados.reduce((sum: number, g: any) => sum + g.cantidad, 0);
      };

      let porcentajeAntes = 0;
      let gastadoDespues = 0;
      if (presupuesto) {
        const gastadoAntes = await obtenerTotalGastado();
        porcentajeAntes = (gastadoAntes / presupuesto.cantidad) * 100;
      }

      const response = await axios.post(`${API_BASE_URL}/api/gastos`, gastoData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await mostrarNotificacionNuevoGasto(descripcion, cantidadNum);

      if (presupuesto) {
        gastadoDespues = await obtenerTotalGastado();
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
      
      Alert.alert('Éxito', 'Gasto creado correctamente');
      setTimeout(() => navigation.goBack(), 500);
    } catch (error: any) {
      let errorMessage = 'Error al crear el gasto';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).flat().join('\n');
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
      {cargandoDatos ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
            <Text>Cargando datos iniciales...</Text>
        </View>
      ) : (
        <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nuevo Gasto</Text>
          
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
          <TouchableOpacity 
            style={[styles.scanButton, { marginBottom: 15 }]}
            onPress={handleScanTicket}
          >
            <Icon name="camera-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Escanear Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#10b981', marginBottom: 20 }]}
            onPress={handleSeleccionarImagenYReconocerTexto}
          >
            <Text style={styles.buttonText}>Escanear imagen desde galería</Text>
          </TouchableOpacity>
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
            {categorias.filter(cat => cat.id !==9).map(cat => (
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
                  {mp.nombreMetodo} {/* Cambiado de mp.nombre a mp.nombreMetodo */}
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

        {/* Botón de guardar */}
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleGuardar}
          disabled={isLoading}
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
      </>
      )}  
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
    paddingBottom: 5
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
  scanButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#10b981',
  paddingVertical: 12,
  borderRadius: 8,
  marginTop: 5,
},

});

export default AgregarGastoScreen;