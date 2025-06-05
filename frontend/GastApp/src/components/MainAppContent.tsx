import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  Image,
  Modal,
  ScrollView
} from 'react-native';

import Header from './Header';
import NuevoPresupuesto from './NuevoPresupuesto';
import ControlPresupuesto from './ControlPresupuesto';
import FormularioGasto from './FormularioGasto';
import ListadoGastos from './ListadoGastos';
import Filtro from './Filtro';
import { generarId } from '../functions/index';
import { Gastos } from '../types';
import { initialGastoState } from '../types';

const MainAppContent = () => {
  // Si el presupuesto es valido cambiamos la pantalla cambiando el valor de este useState
  const [isValidPresupuesto, setisValidPresupuesto] = useState(false)
  const [presupuesto, setpresupuesto] = useState(0)

  // Gastos creados por el usuario en la aplicación
  const [gastos, setGastos] = useState<Gastos[]>([]);

  // Modal para añadir un gasto nuevo
  const [modal, setModal] = useState(false);

  // Estado para abrir el formulario para modificar los gastos creados
  const [modificarGasto, setModificarGasto] = useState<Gastos>(initialGastoState);

  const [filtro, setFiltro] = useState('');

  const [gastosFiltrados, setGastosFiltrados] = useState<Gastos[]>([]);

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

  // Función para evaluar si el usuario quiere eliminar un gasto o no
  const eliminarGasto = (id: string) =>{
    Alert.alert(
      '¿Deseas eliminar este gasto?',
      'Esta acción es irreversible',
      [
        { text: 'No', style: 'cancel'},
        {text:'Sí, eliminar', onPress: () =>{
          // Esta función devuelve una array con todos los gastos menos el que tiene el id que hemos introducido en la función
          const gastosActualizados = gastos.filter( gastoState => gastoState.id !== id)
          setGastos(gastosActualizados);
          setModal(false);
          setModificarGasto(initialGastoState);
          
        }}
      ]
    )
  }

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
          <>
            <Filtro
              gastos={gastos}
              filtro={filtro}
              setFiltro={setFiltro}
              setGastosFiltrados={setGastosFiltrados}
            />
          
            <ListadoGastos
              gastos={gastos}
              setModal={setModal}
              setModificarGasto={setModificarGasto}
              filtro={filtro}
              gastosFiltrados={gastosFiltrados}
            />
          </>
        )}
      </ScrollView>

      <Modal visible={modal} animationType='slide'>
        <FormularioGasto 
          setModal={setModal} 
          evaluarGasto={evaluarGasto}
          setModificarGasto={setModificarGasto}
          modificarGasto={modificarGasto}
          eliminarGasto={eliminarGasto}
        />
      </Modal>

      {isValidPresupuesto && (
        <Pressable onPress={() => setModal(true)}
          style={styles.pressable}
        >
          <Image
            style={styles.imagen}
            source={require('../../assets/img/nuevo-gasto.png')}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#f3f4f6", // gris claro y suave
  },
  header: {
    backgroundColor: "#3b82f6", // azul vivo
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4, // sombra en Android
    shadowColor: "#000", // sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  imagen: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  pressable: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default MainAppContent;