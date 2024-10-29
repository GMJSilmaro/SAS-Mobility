import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '../constants';

const GlobalSettingsSubItem = ({ title, description, onPress }) => {

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}>
      <View>
        <Text style={[styles.title, { color: COLORS.greyscale900 }]}>{title}</Text>
        <Text style={[styles.description, { color: COLORS.grayscale700 }]}>{description}</Text>
      </View>
      <Image
        source={icons.arrowRight}
        resizeMode='contain'
        style={styles.arrowRight}
      />
    </TouchableOpacity>
  )
};

const styles = StyleSheet.create({
  container: {
    width: SIZES.width - 32,
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12
  },
  title: {
    fontSize: 18,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: 12
  },
  description: {
    fontSize: 14,
    fontFamily: 'medium',
    color: COLORS.grayscale700,
  },
  arrowRight: {
    width: 16,
    height: 16,
    tintColor: COLORS.greyscale900
  }
})

export default GlobalSettingsSubItem