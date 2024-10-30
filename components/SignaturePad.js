import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SignaturePad = ({ onSave, onClear, style }) => {
  const ref = React.useRef();

  const handleSignature = (signature) => {
    onSave(signature);
  };

  const handleClear = () => {
    ref.current.clearSignature();
    onClear();
  };

  return (
    <View style={[styles.container, style]}>
      <SignatureScreen
        ref={ref}
        onOK={handleSignature}
        webStyle={`.m-signature-pad--footer
          { display: none; background-color: transparent; }
          .m-signature-pad {
            box-shadow: none;
            border-radius: 12px;
          }
          body { background-color: transparent; }`}
        backgroundColor="transparent"
        penColor="#1E293B"
      />
      <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default SignaturePad; 