import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../api/urlConnection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import globalStyles from '../styles/index';

type Categoria = {
  id: number;
  nombre: string;
};

const HomeScreen = ({ navigation, route }: any) => {
  const { token } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [gastos, setGastos] = useState<any[]>([]);
  const [totalMes, setTotalMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    fetchGastos();
    fetchCategorias();
  }, [route.params?.refresh]); 

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategorias(res.data);
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
    }
  };

  // Función para obtener los gastos
  const fetchGastos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/gastos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const filtradas = res.data.filter((gasto: any) => gasto.categoriaId !== 9);

      const gastosOrdenadosFiltrados = filtradas.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setGastos(gastosOrdenadosFiltrados);

      // Gastos Totales incluyendo suscripciones para calcular el gasto mensual completo
      const gastosOrdenados = res.data.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      // Calcular total del mes actual
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      const gastosMesActual = gastosOrdenados.filter((gasto: any) => {
        const fechaGasto = new Date(gasto.fecha);
        return fechaGasto >= primerDiaMes && fechaGasto <= hoy;
      });

      const totalCalculado = gastosMesActual.reduce(
        (sum: number, gasto: any) => sum + gasto.cantidad,
        0
      );
      
      setTotalMes(totalCalculado);
    } catch (error) {
      console.error('Error obteniendo gastos:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Efecto para cargar datos al inicio
  useEffect(() => {
    fetchGastos();
    fetchCategorias();
  }, []);

  // Efecto para el mensaje de bienvenida
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setShowWelcome(false));
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [showWelcome, fadeAnim]);

  // Función para manejar el refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchGastos();
  };

  // Función para formatear fecha
  const formatFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return format(fecha, "d 'de' MMMM", { locale: es });
  };
  
  // Función para obtener icono según id de categoría
  const getIconByCategoria = (nombreCategoria: string) => {
  const nombre = nombreCategoria ? nombreCategoria.toLowerCase() : 'otros';

  switch (nombre) {
    case 'alimentación':
      return 'fast-food-outline';
    case 'transporte':
      return 'car-outline';
    case 'ocio':
      return 'game-controller-outline';
    case 'salud':
      return 'medkit-outline';
    case 'hogar':
      return 'home-outline';
    case 'educación':
      return 'school-outline';
    case 'ropa':
      return 'shirt-outline';
    case 'suscripciones':
      return 'card-outline';
    case 'otros':
      return 'ellipsis-horizontal-outline';
    default:
      return 'help-circle-outline';
  }
};


  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Mensaje de bienvenida animado */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
          <Icon name="happy-outline" size={40} color="#2563eb" />
          <Text style={styles.welcomeText}>¡Bienvenido a GastApp!</Text>
          <Text style={styles.welcomeSubtext}>Gestión inteligente de tus gastos</Text>
        </Animated.View>
      )}

      {/* Contenido principal */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <>
            <Text style={styles.title}>Resumen de Gastos</Text>
            
            {/* Card de resumen mensual */}
            <View style={styles.card}>
              <Icon name="calendar-outline" size={30} color="#2563eb" />
              <Text style={styles.cardText}>
                Gasto mensual: {totalMes.toFixed(2)}€
              </Text>
              <Text style={styles.cardSubtext}>
                {format(new Date(), 'MMMM yyyy', { locale: es })}
              </Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('AgregarGastoScreen')}
              >
                <Text style={styles.buttonText}>Agregar Gasto</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de últimos gastos */}
            <Text style={styles.sectionTitle}>Últimos gastos</Text>
            {gastos.slice(0, 5).map((gasto) => (
              <TouchableOpacity 
                key={gasto.id} 
                style={styles.listItem}
                onPress={() => navigation.navigate('DetalleGastoScreen', { gastoId: gasto.id })}
              >
                <View style={styles.listItemContent}>
                  <View style={[styles.categoriaIcon, { backgroundColor: getCategoriaColor(gasto.categoriaId) }]}>
                    <Icon 
                    name={getIconByCategoria(categorias.find(c => c.id === gasto.categoriaId)?.nombre || 'otros')} 
                    size={24} 
                    color="white" 
                    />
                  </View>
                  
                  <View style={styles.listItemText}>
                    <Text style={styles.listItemTitle}>{gasto.descripcion}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {formatFecha(gasto.fecha)} • {categorias.find(c => c.id === gasto.categoriaId)?.nombre || 'Otros'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.listItemAmount}>-{gasto.cantidad.toFixed(2)}€</Text>
              </TouchableOpacity>
            ))}

            {gastos.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="receipt-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No hay gastos registrados</Text>
                <Text style={styles.emptySubtext}>Presiona el botón para agregar tu primer gasto</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const getCategoriaColor = (id: number) => {
  const colors: { [key: number]: string } = {
    1: '#ef4444', // Comida
    2: '#3b82f6', // Transporte
    3: '#10b981', // Hogar
    5: '#8b5cf6', // Salud
    6: '#f59e0b', // Ocio
    8: '#ec4899', // Educación
    9: '#018a04', // Suscripciones
    10: '#64748b'  // Otros

  };
  return colors[id] || '#64748b';
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  welcomeContainer: {
    backgroundColor: '#2563eb',
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardText: {
    marginVertical: 15,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemAmount: {
    fontWeight: 'bold',
    color: '#dc2626',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  cardSubtext: {
    color: '#666',
    marginBottom: 15,
  },
  categoriaIcon: {
      ...globalStyles.categoriaIcon,
      marginRight: 0,
    },
});

export default HomeScreen;