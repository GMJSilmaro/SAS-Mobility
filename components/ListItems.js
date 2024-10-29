import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Button, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { COLORS, SIZES, FONTS, icons, images } from '../constants';

const ListItems = ({ icon, label, value, onPress, showPicker, options, onValueChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState([]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const addField = () => {
    setFields([...fields, '']);
  };

  return (
    <View style={styles.listItemContainer}>
      <TouchableOpacity style={styles.listItem} onPress={toggleDropdown}>
        <View style={styles.iconContainer}>
          <Image source={icon} style={styles.listIcon} />
        </View>
        <Text style={styles.listLabel}>{label}</Text>
        {value && (
          <Text style={styles.listValue}>
            {options.find((option) => option.value === value)?.label || value}
          </Text>
        )}
        <Image source={icons.rightArrow} style={styles.arrowIcon} />
      </TouchableOpacity>
      {isOpen && (
        <View>
          {fields.map((field, index) => (
            <TextInput
              key={index}
              style={styles.inputField}
              value={field}
              onChangeText={(text) => {
                const newFields = [...fields];
                newFields[index] = text;
                setFields(newFields);
              }}
            />
          ))}
          <Button title="Add Field" onPress={addField} />
        </View>
      )}
      {showPicker && (
        <RNPickerSelect
          onValueChange={onValueChange}
          items={options}
          style={pickerSelectStyles}
          value={value}
          useNativeAndroidPickerStyle={false}
          Icon={() => <Image source={icons.downArrow} style={styles.pickerArrowIcon} />}
        />
      )}
    </View>
  );
};

export default ListItems;

const styles = StyleSheet.create({
  listItemContainer: {
    marginVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    padding: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  listIcon: {
    width: 20,
    height: 20,
  },
  listLabel: {
    flex: 1,
    ...FONTS.body3,
  },
  listValue: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  arrowIcon: {
    width: 15,
    height: 15,
    tintColor: COLORS.gray,
  },
  inputField: {
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
  },
  pickerArrowIcon: {
    width: 15,
    height: 15,
    tintColor: COLORS.gray,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
