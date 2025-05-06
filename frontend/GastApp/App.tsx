import React, {useState} from 'react';

import {
  StyleSheet,
  View,
  Alert
} from 'react-native';

import Header from './src/components/Header';
import NuevoPresupuesto from './src/components/NuevoPresupuesto';
import ControlPresupuesto from './src/components/ControlPresupuesto';


const App = () => {

  // Si el presupuesto es valido
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

  return(
    <View style={styles.contenedor}>

      <View style={styles.header}>
        <Header/>

        {isValidPresupuesto ? <ControlPresupuesto
          presupuesto = {presupuesto}
        /> : (
            <NuevoPresupuesto 
              presupuesto = {presupuesto}
              setpresupuesto={setpresupuesto}
              handleNuevoPresupuesto={handleNuevoPresupuesto}
          />
        ) }

        
      </View>
      
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
});

export default App;
