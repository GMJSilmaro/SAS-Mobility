import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, Animated, Image, TouchableOpacity, Dimensions, Platform, Modal, TouchableWithoutFeedback } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { markers, mapStandardStyle } from '../data/mapData';
import StarRating2 from '../components/StarRating2';
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SIZES, icons, illustrations } from '../constants';
import Button from '../components/Button';

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 112;
const CARD_WIDTH = width * 0.85;
const SPACING_FOR_CARD_INSET = width * 0.1 - 10;

const Explore = () => {
  const [isFavourite, setIsFavourite] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [directionModalVisible, setDirectionModalVisible] = useState(false);

  const initialMapState = {
    markers,
    region: {
      latitude: 22.62938671242907,
      longitude: 88.4354486029795,
      latitudeDelta: 0.04864195044303443,
      longitudeDelta: 0.040142817690068,
    },
  };

  const [state, setState] = React.useState(initialMapState);

  let mapIndex = 0;
  let mapAnimation = new Animated.Value(0);

  useEffect(() => {
    mapAnimation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
      if (index >= state.markers.length) {
        index = state.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(regionTimeout);

      const regionTimeout = setTimeout(() => {
        if (mapIndex !== index) {
          mapIndex = index;
          const { coordinate } = state.markers[index];
          _map.current.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: state.region.latitudeDelta,
              longitudeDelta: state.region.longitudeDelta,
            },
            350
          );
        }
      }, 10);
    });
  });

  const interpolations = state.markers.map((marker, index) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      ((index + 1) * CARD_WIDTH),
    ];

    const scale = mapAnimation.interpolate({
      inputRange,
      outputRange: [1, 1.5, 1],
      extrapolate: "clamp"
    });

    return { scale };
  });

  const onMarkerPress = (mapEventData) => {
    const markerID = mapEventData._targetInst.return.key;

    let x = (markerID * CARD_WIDTH) + (markerID * 20);
    if (Platform.OS === 'ios') {
      x = x - SPACING_FOR_CARD_INSET;
    }

    _scrollView.current.scrollTo({ x: x, y: 0, animated: true });
  }

  const _map = React.useRef(null);
  const _scrollView = React.useRef(null);

  const renderDirectionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={directionModalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setDirectionModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer,
            {
              height: 420,
              width: SIZES.width * 0.8,
              backgroundColor: COLORS.white,
            }]}>
              <View style={styles.backgroundIllustration}>
                <Image
                  source={illustrations.background}
                  resizeMode='contain'
                  style={styles.modalIllustration}
                />
                <Image
                  source={icons.location2}
                  resizeMode='contain'
                  style={styles.editPencilIcon}
                />
              </View>
              <Text style={styles.modalTitle}>You Have Arrived!</Text>
              <Text style={[styles.modalSubtitle, {
                color: COLORS.black,
              }]}>
                We have arrived at event location.
              </Text>
              <Button
                title="Okay"
                filled
                onPress={() => {
                  setDirectionModalVisible(false)
                }}
                style={styles.successBtn}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  // Render modal
  const renderModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalSubContainer, {
              backgroundColor: COLORS.white,
            }]}>
              <View style={styles.backgroundIllustration}>
                <Image
                  source={illustrations.background}
                  resizeMode='contain'
                  style={styles.modalIllustration}
                />
                <Image
                  source={icons.location2}
                  resizeMode='contain'
                  style={styles.editPencilIcon}
                />
              </View>
              <Text style={styles.modalTitle}>Enable Location</Text>
              <Text style={[styles.modalSubtitle, {
                color: COLORS.black,
              }]}>
                We need location access to find the nearest event around you.
              </Text>
              <Button
                title="Enable location"
                filled
                onPress={() => {
                  setModalVisible(false)
                }}
                style={styles.successBtn}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false)
                }}
                textColor={COLORS.primary}
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 32,
                  backgroundColor: COLORS.tansparentPrimary,
                  borderColor: COLORS.tansparentPrimary
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={_map}
        initialRegion={state.region}
        style={styles.container}
        customMapStyle={mapStandardStyle}
      >
        {state.markers.map((marker, index) => {
          const scaleStyle = {
            transform: [
              {
                scale: interpolations[index].scale,
              },
            ],
          };
          return (
            <Marker key={index} coordinate={marker.coordinate} onPress={(e) => onMarkerPress(e)}>
              <Animated.View style={[styles.markerWrap]}>
                <Animated.Image
                  source={icons.location4}
                  style={[styles.marker, scaleStyle]}
                  resizeMode="cover"
                />
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.searchBox, {
        backgroundColor: COLORS.white,
      }]}>
        <TextInput
          placeholder="Search events, locations..."
          placeholderTextColor={"#000"}
          autoCapitalize="none"
          style={{
            flex: 1,
            padding: 0,
            fontFamily: "medium"
          }}
        />
        <TouchableOpacity
          onPress={() => setDirectionModalVisible(true)}
          style={{
            width: 58,
            height: 50,
            backgroundColor: COLORS.primary,
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            top: -10,
            right: -10
          }}>
          <Ionicons name="search" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        height={50}
        style={styles.chipsScrollView}
        contentInset={{ // iOS only
          top: 0,
          left: 0,
          bottom: 0,
          right: 20
        }}
        contentContainerStyle={{
          paddingRight: Platform.OS === 'android' ? 20 : 0
        }}
      >

      </ScrollView>
      <Animated.ScrollView
        ref={_scrollView}
        horizontal
        pagingEnabled
        scrollEventThrottle={1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 20}
        snapToAlignment="center"
        style={styles.scrollView}
        contentInset={{
          top: 0,
          left: SPACING_FOR_CARD_INSET,
          bottom: 0,
          right: SPACING_FOR_CARD_INSET
        }}
        contentContainerStyle={{
          paddingHorizontal: Platform.OS === 'android' ? SPACING_FOR_CARD_INSET : 0
        }}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  x: mapAnimation,
                }
              },
            },
          ],
          { useNativeDriver: true }
        )}
      >
        {state.markers.map((marker, index) => (
          <View style={[styles.card, {
            backgroundColor: COLORS.white,
          }]} key={index}>
            <Image
              source={marker.image}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => {
                setIsFavourite(!isFavourite);
                setDirectionModalVisible(true);
              }}
              style={{
                position: "absolute",
                top: 12,
                right: 12
              }}
            >
              <Ionicons name={isFavourite ? "heart" : "heart-outline"} size={20} color={isFavourite ? COLORS.red : COLORS.black} />
            </TouchableOpacity>
            <View style={styles.textContent}>
              <Text numberOfLines={1} style={[styles.cardtitle, {
                color: COLORS.black,
              }]}>{marker.name}</Text>
              <StarRating2 ratings={marker.rating} reviews={marker.reviews} />
              <Text numberOfLines={1} style={[styles.cardDescription, {
                color: "#444",
              }]}>{marker.description}</Text>
              <Text style={styles.price}>{marker.price}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>
      {renderModal()}
      {renderDirectionModal()}
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    position: 'absolute',
    marginTop: Platform.OS === 'ios' ? 8 : 20,
    flexDirection: "row",
    backgroundColor: '#fff',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    top: 52,
    height: 50
  },
  chipsScrollView: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 80,
    paddingHorizontal: 10
  },
  chipsIcon: {
    marginRight: 5,
  },
  chipsItem: {
    flexDirection: "row",
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    height: 35,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  scrollView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  endPadding: {
    paddingRight: width - CARD_WIDTH,
  },
  card: {
    elevation: 2,
    backgroundColor: "#FFF",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: -2 },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: "hidden",
    marginBottom: 92,
    flexDirection: "row",
    borderRadius: 10,
    paddingHorizontal: 10,
    zIndex: 99999
  },
  cardImage: {
    width: 92,
    height: 92,
    alignSelf: "center",
    borderRadius: 15
  },
  textContent: {
    flex: 2,
    padding: 10,
  },
  cardtitle: {
    fontSize: 16,
    fontFamily: "bold",
    marginBottom: 7,
    color: COLORS.black
  },
  cardDescription: {
    fontSize: 12,
    color: "#444",
    marginTop: 12
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  marker: {
    width: 30,
    height: 30,
    tintColor: COLORS.primary,
  },
  button: {
    alignItems: 'center',
    marginTop: 5
  },
  signIn: {
    width: '100%',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  textSign: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  categoryIcon: {
    height: 18,
    width: 18,
    tintColor: COLORS.black,
    marginRight: 8
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },
  type: {
    fontSize: 12,
    fontFamily: "bold",
    color: COLORS.primary,
    marginLeft: 12
  },
  price: {
    fontSize: 14,
    fontFamily: "bold",
    color: COLORS.red,
    marginTop: 6
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 12
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.56)"
  },
  modalSubContainer: {
    height: 520,
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalIllustration: {
    height: 180,
    width: 180,
    marginVertical: 22
  },
  successBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32
  },
  receiptBtn: {
    width: "100%",
    marginTop: 12,
    borderRadius: 32,
    backgroundColor: COLORS.tansparentPrimary,
    borderColor: COLORS.tansparentPrimary
  },
  editPencilIcon: {
    width: 42,
    height: 42,
    tintColor: COLORS.white,
    zIndex: 99999,
    position: "absolute",
    top: 54,
    left: 58,
  },
  backgroundIllustration: {
    height: 150,
    width: 150,
    marginVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -999
  },
});

export default Explore