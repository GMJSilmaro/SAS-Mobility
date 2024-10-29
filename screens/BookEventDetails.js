import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, FlatList, TextInput } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { COLORS, SIZES, FONTS, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import { Feather } from "@expo/vector-icons";
import { launchImagePicker } from '../utils/ImagePickerHelper';
import Input from '../components/Input';
import { getFormatedDate } from "react-native-modern-datepicker";
import DatePickerModal from '../components/DatePickerModal';
import Button from '../components/Button';
import RNPickerSelect from 'react-native-picker-select';

const isTestMode = true;

const initialState = {
  inputValues: {
    fullName: isTestMode ? 'John Doe' : '',
    email: isTestMode ? 'example@gmail.com' : '',
    nickname: isTestMode ? "" : "",
    phoneNumber: ''
  },
  inputValidities: {
    fullName: false,
    email: false,
    nickname: false,
    phoneNumber: false,
  },
  formIsValid: false,
}


const BookEventDetails = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [error, setError] = useState();
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  const locationOptions = [
    { label: 'New York, City', value: 'new york' },
    { label: 'Washington', value: 'washington' },
    { label: 'Florida', value: 'florida' },
  ];

  const handleLocationChange = (value) => {
    setSelectedLocation(value);
  };

  const today = new Date();
  const startDate = getFormatedDate(
    new Date(today.setDate(today.getDate() + 1)),
    "YYYY/MM/DD"
  );

  const [startedDate, setStartedDate] = useState("12/12/2023");

  const handleOnPressStartDate = () => {
    setOpenStartDatePicker(!openStartDatePicker);
  };

  const inputChangedHandler = useCallback(
    (inputId, inputValue) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({ inputId, validationResult: result, inputValue })
    },
    [dispatchFormState]
  )

  useEffect(() => {
    if (error) {
      Alert.alert('An error occured', error)
    }
  }, [error])

  const pickImage = async () => {
    try {
      const tempUri = await launchImagePicker()

      if (!tempUri) return

      // set the image
      setImage({ uri: tempUri })
    } catch (error) { }
  };

  // fectch codes from rescountries api
  useEffect(() => {
    fetch("https://restcountries.com/v2/all")
      .then(response => response.json())
      .then(data => {
        let areaData = data.map((item) => {
          return {
            code: item.alpha2Code,
            item: item.name,
            callingCode: `+${item.callingCodes[0]}`,
            flag: `https://flagsapi.com/${item.alpha2Code}/flat/64.png`
          }
        });

        setAreas(areaData);
        if (areaData.length > 0) {
          let defaultData = areaData.filter((a) => a.code == "US");

          if (defaultData.length > 0) {
            setSelectedArea(defaultData[0])
          }
        }
      })
  }, [])

  // render countries codes modal
  function RenderAreasCodesModal() {

    const renderItem = ({ item }) => {
      return (
        <TouchableOpacity
          style={{
            padding: 10,
            flexDirection: "row"
          }}
          onPress={() => {
            setSelectedArea(item),
              setModalVisible(false)
          }}
        >
          <Image
            source={{ uri: item.flag }}
            contentFit='contain'
            style={{
              height: 30,
              width: 30,
              marginRight: 10
            }}
          />
          <Text style={{ fontSize: 16, color: "#fff" }}>{item.item}</Text>
        </TouchableOpacity>
      )
    }
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                height: 400,
                width: SIZES.width * 0.8,
                backgroundColor: COLORS.primary,
                borderRadius: 12
              }}
            >
              <FlatList
                data={areas}
                renderItem={renderItem}
                horizontal={false}
                keyExtractor={(item) => item.code}
                style={{
                  padding: 20,
                  marginBottom: 20
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="Book Event" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.bookingTitle, {
            color: COLORS.greyscale900,
          }]}>Your Information Details</Text>
          <View>
            <Input
              id="fullName"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['fullName']}
              placeholder="Full Name"
              placeholderTextColor={COLORS.black}
            />
            <Input
              id="nickname"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['nickname']}
              placeholder="Nickname"
              placeholderTextColor={COLORS.black}
            />
            <Input
              id="email"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['email']}
              placeholder="Email"
              placeholderTextColor={COLORS.black}
              keyboardType="email-address" />
            <View style={{
              width: SIZES.width - 32
            }}>
              <TouchableOpacity
                style={[styles.inputBtn, {
                  backgroundColor: COLORS.greyscale500,
                  borderColor: COLORS.greyscale500,
                }]}
                onPress={handleOnPressStartDate}
              >
                <Text style={{ ...FONTS.body4, color: COLORS.grayscale400 }}>{startedDate}</Text>
                <Feather name="calendar" size={24} color={COLORS.grayscale400} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, {
              backgroundColor: COLORS.greyscale500,
              borderColor: COLORS.greyscale500,
            }]}>
              <TouchableOpacity
                style={styles.selectFlagContainer}
                onPress={() => setModalVisible(true)}>
                <View style={{ justifyContent: "center" }}>
                  <Image
                    source={icons.down}
                    resizeMode='contain'
                    style={styles.downIcon}
                  />
                </View>
                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                  <Image
                    source={{ uri: selectedArea?.flag }}
                    contentFit="contain"
                    style={styles.flagIcon}
                  />
                </View>
                <View style={{ justifyContent: "center", marginLeft: 5 }}>
                  <Text style={{ color: "#111", fontSize: 12 }}>{selectedArea?.callingCode}</Text>
                </View>
              </TouchableOpacity>
              {/* Phone Number Text Input */}
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.black}
                selectionColor="#111"
                keyboardType="numeric"
              />
            </View>
            <View>
              <RNPickerSelect
                placeholder={{ label: 'Select', value: '' }}
                items={locationOptions}
                onValueChange={(value) => handleLocationChange(value)}
                value={selectedLocation}
                style={{
                  inputIOS: {
                    fontSize: 16,
                    paddingHorizontal: 10,
                    borderRadius: 4,
                    color: COLORS.greyscale600,
                    paddingRight: 30,
                    height: 52,
                    width: SIZES.width - 32,
                    alignItems: 'center',
                    backgroundColor: COLORS.greyscale500,
                    borderRadius: 16
                  },
                  inputAndroid: {
                    fontSize: 16,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    color: COLORS.greyscale600,
                    paddingRight: 30,
                    height: 52,
                    width: SIZES.width - 32,
                    alignItems: 'center',
                    backgroundColor: COLORS.greyscale500,
                    borderRadius: 16
                  },
                }}
              />
            </View>
            <Input
              id="occupation"
              onInputChanged={inputChangedHandler}
              errorText={formState.inputValidities['occupation']}
              placeholder="Occupation"
              placeholderTextColor={COLORS.black}
            />
          </View>
        </ScrollView>
      </View>
      <DatePickerModal
        open={openStartDatePicker}
        startDate={startDate}
        selectedDate={startedDate}
        onClose={() => setOpenStartDatePicker(false)}
        onChangeStartDate={(date) => setStartedDate(date)}
      />
      {RenderAreasCodesModal()}
      <View style={styles.bottomContainer}>
        <Button
          title="Continue"
          filled
          style={styles.continueButton}
          onPress={() => navigation.navigate("PaymentMethods")}
        />
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white
  },
  avatarContainer: {
    marginVertical: 12,
    alignItems: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatar: {
    height: 130,
    width: 130,
    borderRadius: 65,
  },
  pickImage: {
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  inputContainer: {
    flexDirection: "row",
    borderColor: COLORS.greyscale500,
    borderWidth: .4,
    borderRadius: 6,
    height: 52,
    width: SIZES.width - 32,
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: COLORS.greyscale500,
  },
  downIcon: {
    width: 10,
    height: 10,
    tintColor: "#111"
  },
  selectFlagContainer: {
    width: 90,
    height: 50,
    marginHorizontal: 5,
    flexDirection: "row",
  },
  flagIcon: {
    width: 30,
    height: 30
  },
  input: {
    flex: 1,
    marginVertical: 10,
    height: 40,
    fontSize: 14,
    color: "#111"
  },
  inputBtn: {
    borderWidth: 1,
    borderRadius: 12,
    borderColor: COLORS.greyscale500,
    height: 50,
    paddingLeft: 8,
    fontSize: 18,
    justifyContent: "space-between",
    marginTop: 4,
    backgroundColor: COLORS.greyscale500,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    alignItems: "center"
  },
  continueButton: {
    width: SIZES.width - 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  genderContainer: {
    flexDirection: "row",
    borderColor: COLORS.greyscale500,
    borderWidth: .4,
    borderRadius: 6,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: COLORS.greyscale500,
  },
  bookingTitle: {
    fontSize: 20,
    fontFamily: "semiBold",
    color: COLORS.greyscale900,
    marginVertical: 20
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingHorizontal: 10,
    borderRadius: 4,
    color: COLORS.greyscale600,
    paddingRight: 30,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
    borderRadius: 16
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: COLORS.greyscale600,
    paddingRight: 30,
    height: 58,
    width: SIZES.width - 32,
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
    borderRadius: 16
  },
});

export default BookEventDetails