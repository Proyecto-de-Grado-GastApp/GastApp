import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
const AboutAppScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View>
        <Icon name="arrow-back" size={30} color="#2563eb" onPress={() => navigation.goBack()} />
      </View>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Icon name="information-circle" size={50} color="#2563eb" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>Acerca de GastApp</Text>
        <Text style={{ fontSize: 16, color: '#666' }}>Información de la aplicación</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>GastApp</Text>
        <Text style={styles.version}>Versión 1.0.0</Text>
        
        <View style={styles.infoItem}>
          <Icon name="code-slash" size={20} color="#2563eb" />
          <Text style={styles.infoText}>Desarrollado por Rony Luzuriaga y Javier Olmos con ❤️</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="business-sharp" size={20} color="#2563eb" />
          <Text style={styles.infoText}>CES Vegamedia, Alguazas, Murcia</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="logo-github" size={20} color="#2563eb" />
          <Text 
            style={[styles.infoText, styles.link]}
            onPress={() => Linking.openURL('https://github.com/Proyecto-de-Grado-GastApp/GastApp')}
          >
            GitHub
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2563eb',
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
  },
  link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});

export default AboutAppScreen;