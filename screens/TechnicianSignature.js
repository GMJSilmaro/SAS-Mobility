import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SignaturePad from '../components/SignaturePad';

const TechnicianSignature = ({ navigation, route }) => {
  const [signature, setSignature] = useState(null);

  const handleSave = (signatureImage) => {
    setSignature(signatureImage);
    Alert.alert(
      'Success',
      'Signature saved successfully',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleClear = () => {
    setSignature(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Technician Signature</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="edit" size={24} color="#4a90e2" />
            <Text style={styles.cardTitle}>Sign Below</Text>
          </View>
          <Text style={styles.instructions}>
            Please sign in the box below to confirm completion of work
          </Text>
          <SignaturePad
            onSave={handleSave}
            onClear={handleClear}
            style={styles.signaturePad}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, !signature && styles.disabledButton]}
        disabled={!signature}
        onPress={() => handleSave(signature)}
      >
        <Text style={styles.saveButtonText}>Save Signature</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#4a90e2',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 4,
    borderRadius: 20,
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1E293B',
  },
  instructions: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  signaturePad: {
    height: 300,
    marginBottom: 16,
  },
  saveButton: {
    margin: 16,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default TechnicianSignature; 