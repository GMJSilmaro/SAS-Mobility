import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const OrSeparator = ({ text }) => {

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: COLORS.grayscale200 }]} />
      <Text style={[styles.orText, { color: COLORS.black }]}>{text}</Text>
      <View style={[styles.line, { backgroundColor: COLORS.grayscale200 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  line: {
    flex: 1,
    height: .4,
    backgroundColor: COLORS.grayscale200,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 19.25,
    fontFamily: "medium",
    color: COLORS.black,
    textAlign: "center",
  },
});

export default OrSeparator;