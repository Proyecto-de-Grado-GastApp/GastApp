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
import { generarId } from '../helpers/index';
import { Gastos } from '../types';
import { initialGastoState } from '../types';

const MainAppContent = () => {
  const [isValidPresupuesto, setisValidPresupuesto] = useState(false);
  const [presupuesto, setpresupuesto] = useState(0);
  const [gastos, setGastos] = useState<Gastos[]>([]);
  const [modal, setModal] = useState(false);
  const [modificarGasto, setModificarGasto] = useState<Gastos>(initialGastoState);

  const handleNuevoPresupuesto = (presupuesto: number) => {
    if (presupuesto > 0) {
      setisValidPresupuesto(true);
    } else {
      Alert.alert('Error', 'El presupuesto debe ser mayor que 0', [{text: 'Aceptar'}]);
    }
  };

  const evaluarGasto = (gasto: Gastos) => {
    if ([gasto.nombre, gasto.cantidad, gasto.categoria].includes('')) {
        Alert.alert('Error', 'Todos los campos son obligatorios',[{text: 'Aceptar'}]);
      return;
    }

    if (gasto.id) {
      const gastosActualizados = gastos.map(gastoState => gastoState.id === gasto.id ? gasto : gastoState);
      setGastos(gastosActualizados);
    } else {
      gasto.id = generarId();
      gasto.fecha = Date.now();
      setGastos([...gastos, gasto]);
    }
    setModal(false);
  };

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
            source={require('../../assets/img/nuevo-gasto.png')}
          />
        </Pressable>
      )}
    </View>
  );
};

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

export default MainAppContent;