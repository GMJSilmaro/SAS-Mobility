import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SignatureScreen = ({ navigation, route }) => {
  const { onSave } = route.params;
  const signatureRef = React.useRef();

  const handleSignature = (signature) => {
    onSave(signature);
    navigation.goBack();
  };

  const handleClear = () => {
    signatureRef.current.clearSignature();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signature Capture</Text>
        <TouchableOpacity 
          onPress={handleClear}
          style={styles.headerButton}
        >
          <Icon name="refresh" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <SignatureCanvas
        ref={signatureRef}
        onOK={handleSignature}
        descriptionText="Sign above"
        clearText="Clear"
        confirmText="Save"
        webStyle={`.m-signature-pad--footer
          { display: none; }
          .m-signature-pad--body
          { border: none; }
          body,html {
            width: 100%;
            height: 100%;
          }
        `}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]}
          onPress={() => signatureRef.current.readSignature()}
        >
          <Text style={styles.saveButtonText}>Save Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SignatureScreen; 