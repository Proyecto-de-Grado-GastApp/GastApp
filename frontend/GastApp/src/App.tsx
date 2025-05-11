import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  Image,
  Modal,
  ScrollView
} from 'react-native';

import Header from './components/Header';
import NuevoPresupuesto from './components/NuevoPresupuesto';
import ControlPresupuesto from './components/ControlPresupuesto';
import FormularioGasto from './components/FormularioGasto';
import ListadoGastos from './components/ListadoGastos';
import { generarId } from './helpers/index';
import { Gastos } from './types';
import { initialGastoState } from './types';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

type AppScreen = 'login' | 'register' | 'main';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Si el presupuesto es valido cambiamos la pantalla cambiando el valor de este useState
  const [isValidPresupuesto, setisValidPresupuesto] = useState(false)
  const [presupuesto, setpresupuesto] = useState(0)

  // Gastos creados por el usuario en la aplicación
  const [gastos, setGastos] = useState<Gastos[]>([]);

  // Modal para añadir un gasto nuevo
  const [modal, setModal] = useState(false);

  // Función para validar el presupuesto
  const handleNuevoPresupuesto = (presupuesto: number) => {
    if (presupuesto > 0) {
      setisValidPresupuesto(true)
    } else {
      Alert.alert('Error', 'El presupuesto debe ser mayor que 0', [{text: 'Aceptar'}])
    }
  }

  // Función para validar el formulario de nuevo gasto
  const evaluarGasto = (gasto: Gastos) => {
    if ([gasto.nombre, gasto.cantidad, gasto.categoria].includes('')) {
        Alert.alert('Error', 'Todos los campos son obligatorios',[{text: 'Aceptar'}]) 
      return  
    } 

    if (gasto.id) {
      const gastosActualizados = gastos.map(gastoState => gastoState.id === gasto.id ? gasto : gastoState)
      setGastos(gastosActualizados);
    } else {
      gasto.id = generarId();
      gasto.fecha = Date.now();
      setGastos([...gastos,gasto]);
    }
    setModal(false);
  }

  // Estado para abrir el formulario para modificar los gastos creados
  const [modificarGasto, setModificarGasto] = useState<Gastos>(initialGastoState);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentScreen('main');
  }

  const handleRegisterSuccess = () => {
    Alert.alert('Éxito', 'Registro completado. Por favor inicia sesión.');
    setCurrentScreen('login');
  }

  // Renderizar la pantalla actual basada en el estado
  const renderScreen = () => {
    switch(currentScreen) {
      case 'login':
        return (
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentScreen('register')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onBackToLogin={() => setCurrentScreen('login')}
          />
        );
      case 'main':
        return renderMainApp();
      default:
        return renderMainApp();
    }
  }

  const renderMainApp = () => {
    return (
      <View style={styles.contenedor}>
        <ScrollView>
          <View style={styles.header}>
            <Header/>

            {isValidPresupuesto ? 
              <ControlPresupuesto
                presupuesto={presupuesto}
                gastos={gastos}
              /> : (
                <NuevoPresupuesto 
                  presupuesto={presupuesto}
                  setpresupuesto={setpresupuesto}
                  handleNuevoPresupuesto={handleNuevoPresupuesto}
                />
              )
            }
          </View>

          {isValidPresupuesto && (
            <ListadoGastos
              gastos={gastos}
              setModal={setModal}
              setModificarGasto={setModificarGasto}
            />
          )}
        </ScrollView>

        <Modal visible={modal} animationType='slide'>
          <FormularioGasto 
            setModal={setModal} 
            evaluarGasto={evaluarGasto}
            setModificarGasto={setModificarGasto}
            modificarGasto={modificarGasto}
          />
        </Modal>

        {isValidPresupuesto && (
          <Pressable onPress={() => setModal(true)}>
            <Image
              style={styles.imagen}
              source={require('../assets/img/nuevo-gasto.png')}
            />
          </Pressable>
        )}
      </View>
    );
  }

  return renderScreen();
}

const styles = StyleSheet.create({
  contenedor:{
    backgroundColor: "#F5F5F5",
    flex:1
  },
  header: {
    backgroundColor: "#3b82f6",
  },
  imagen:{
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: 40,
    right: 30
  }
});

export default App;