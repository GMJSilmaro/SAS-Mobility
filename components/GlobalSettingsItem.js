import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { COLORS, SIZES } from '../constants';

const GlobalSettingsItem = ({ title, isNotificationEnabled, toggleNotificationEnabled, showSwitch = true }) => {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showSwitch && (
        <Switch
          value={isNotificationEnabled}
          onValueChange={toggleNotificationEnabled}
          thumbColor={isNotificationEnabled ? '#fff' : COLORS.white}
          trackColor={{ false: '#EEEEEE', true: COLORS.primary }}
          ios_backgroundColor={COLORS.white}
          style={styles.switch}
        />
      )}
    </View>
  );
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
    color: COLORS.blackTie,
  },
  switch: {
    marginLeft: 8,
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});

export default GlobalSettingsItem;