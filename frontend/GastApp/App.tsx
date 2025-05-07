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

import Header from './src/components/Header';
import NuevoPresupuesto from './src/components/NuevoPresupuesto';
import ControlPresupuesto from './src/components/ControlPresupuesto';
import FormularioGasto from './src/components/FormularioGasto';
import ListadoGastos from './src/components/ListadoGastos';
import { generarId } from './src/helpers/index';
import { Gastos } from './src/types';





const App = () => {

  // Si el presupuesto es valido cambiamos la pantalla cambiando el valor de este useState
  const [isValidPresupuesto, setisValidPresupuesto] = useState(false)

  const [presupuesto, setpresupuesto] = useState(0)

  // Función para validar el presupuesto
  const handleNuevoPresupuesto = (presupuesto: number) => {
    if (presupuesto > 0) {
      setisValidPresupuesto(true)
    } else {
      Alert.alert('Error', 'El presupuesto debe ser mayor que 0', [{text: 'Aceptar'}])
    }
  }

  // Gastos creados por el usuario en la aplicación
  const [gastos, setGastos] = useState<Gastos[]>([]);


  // Modal para añadir un gasto nuevo
  const [modal, setModal] = useState(false);

  // Función para validar el formulario de nuevo gasto
  const evaluarGasto = (gasto: Gastos) => {
    // Object.values crea un array con los valores introducidos en el objeto
    if (Object.values(gasto).includes('')) {
        Alert.alert('Error', 'Todos los campos son obligatorios',[{text: 'Aceptar'}]) 
      return  
    } 
    
    // Añadir el nuevo gasto al state
    
    gasto.id = generarId();
    setGastos([...gastos,gasto]);
    console.log(gasto);
    setModal(false);

  }
  
  return(
    <View style={styles.contenedor}>
      <ScrollView>

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

        {/* Mostramos los gastos creados */}
        {isValidPresupuesto && (
          <ListadoGastos
            gastos = {gastos}
          />
        )}

    </ScrollView>


      {/* Modal para mostrar el formulario de crear nuevo gasto */}
      <Modal visible={modal} animationType='slide'>
        <FormularioGasto 
          setModal={setModal} 
          evaluarGasto={evaluarGasto}
        />
      </Modal>

      {/* Mostramos botón para añadir gastos una vez que el presupuesto introducido es válido */}
      {/* Los && indican que si la condición es verdadera se ejecuta el código a continuación */}
      {isValidPresupuesto && (
        <Pressable onPress={() => setModal(true)}>
          <Image
            style={styles.imagen}
            source={require('./src/img/nuevo-gasto.png')}
          />
        </Pressable>
      )}

      

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
    bottom: 40,
    right: 30
  }
});

export default App;
