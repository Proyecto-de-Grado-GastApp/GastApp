import React, {useEffect, useState} from 'react';

import {
  StyleSheet,
  View,
  Alert,
  Pressable,
  Image,
  Modal
} from 'react-native';

import Header from './src/components/Header';
import NuevoPresupuesto from './src/components/NuevoPresupuesto';
import ControlPresupuesto from './src/components/ControlPresupuesto';
import FormularioGasto from './src/components/FormularioGasto';


const App = () => {

  // Si el presupuesto es valido cambiamos la pantalla cambiando el valor de este useState
  const [isValidPresupuesto, setisValidPresupuesto] = useState(false)

  const [presupuesto, setpresupuesto] = useState(0)

  // Función para validar el presupuesto
  const handleNuevoPresupuesto = (presupuesto: number) => {
    if (presupuesto > 0) {
      setisValidPresupuesto(true)
    } else {
      Alert.alert('Error', 'El presupuesto debe ser mayor que 0', [{text: 'Aceptar'}] )
    }
  }

  // Gastos creados a mano para calcular el gastado y disponible en ControPresupuesto
  const [gastos, setgastos] = useState([]);

  // Modal para añadir un gasto nuevo
  const [modal, setModal] = useState(false);
  
  return(
    <View style={styles.contenedor}>

      <View style={styles.header}>
        <Header/>

        {isValidPresupuesto ? <ControlPresupuesto
          presupuesto = {presupuesto}
          gastos = {gastos}
        /> : (
            <NuevoPresupuesto 
              presupuesto = {presupuesto}
              setpresupuesto={setpresupuesto}
              handleNuevoPresupuesto={handleNuevoPresupuesto}
          />
        ) }

        
      </View>
      
      {/* Mostramos botón para añadir gastos */}
      {/* Los && indican que si la condición es verdadera se ejecuta el código a continuación */}
      {isValidPresupuesto && (
        <Pressable onPress={() => setModal(true)}>
          <Image
            style={styles.imagen}
            source={require('./src/img/nuevo-gasto.png')}
          />
        </Pressable>
      )}

      <Modal visible={modal} animationType='slide'>
        <FormularioGasto/>
      </Modal>
    </View>
    
  )
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
    top: 120,
    right: 20
  }
});

export default App;
