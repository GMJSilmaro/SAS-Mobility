import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants';
import { AntDesign } from '@expo/vector-icons';

const Vip = () => {
  const [seats, setSeats] = React.useState(1);

  const decreaseSeats = () => {
    if (seats > 1) {
      setSeats(seats - 1);
    }
  };

  const increaseSeats = () => {
    setSeats(seats + 1);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {
        color: COLORS.greyscale900
      }]}>Choose number of seats</Text>
      <View style={styles.buttonActionContainer}>
        <TouchableOpacity style={styles.actionContainer} onPress={decreaseSeats}>
          <AntDesign name="minus" size={24} color={COLORS.greyscale900} />
        </TouchableOpacity>
        <Text style={[styles.text, {
          color: COLORS.greyscale900
        }]}>{seats}</Text>
        <TouchableOpacity style={styles.actionContainer} onPress={increaseSeats}>
          <AntDesign name="plus" size={24} color={COLORS.greyscale900} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
  },
  actionContainer: {
    height: 42,
    width: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.grayscale400,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 148,
    justifyContent: "space-between",
    paddingVertical: 22
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  }
});

export default Vip