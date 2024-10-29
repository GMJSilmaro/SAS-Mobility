import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons, images } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewStars from '../components/ReviewStars';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { OrganizerAbout, OrganizerCollections, OrganizerEvents } from '../tabs';

const renderScene = SceneMap({
  first: OrganizerEvents,
  second: OrganizerCollections,
  third: OrganizerAbout
});

const EventDetailsOrganizer = ({ navigation }) => {
  const layout = useWindowDimensions();

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Events' },
    { key: 'second', title: 'Collections' },
    { key: 'third', title: 'About' }
  ]);
  /**
   * Render header
   */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Image
            source={icons.arrowLeft}
            resizeMode='contain'
            style={[styles.arrowBackIcon, {
              tintColor: COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={icons.bell}
            resizeMode='contain'
            style={[styles.bellIcon, {
              tintColor: COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
      </View>
    )
  }

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{
        backgroundColor: COLORS.primary,
      }}
      style={{
        backgroundColor: COLORS.white
      }}
      renderLabel={({ route, focused }) => (
        <Text style={[{
          color: focused ? COLORS.primary : "gray",
          fontSize: 16,
          fontFamily: "semiBold"
        }]}>
          {route.title}
        </Text>
      )}
    />
  )

  /**
   * Render content
   */
  const renderContent = () => {
    const [hasFollowed, setHasFollowed] = useState(false);

    return (
      <View>
        <View style={styles.profileImageContainer}>
          <Image
            source={images.user1}
            resizeMode='contain'
            style={styles.profileImage}
          />
          <Text style={[styles.fullName, {
            color: COLORS.greyscale900
          }]}>Mariana Juliana</Text>
          <Text style={[styles.yearExperience, {
            color: COLORS.greyscale900
          }]}>World of Music</Text>
          <View style={styles.reviewContainer}>
            <ReviewStars review={5} size={14} color="orange" />
            <Text style={[styles.ratingNum, {
              color: "gray"
            }]}>(4.7)</Text>
          </View>
          <Text style={styles.price}>Pro+</Text>

          <View style={styles.viewContainer}>
            <View style={styles.view}>
              <Text style={[styles.viewNum, {
                color: COLORS.greyscale900
              }]}>100+</Text>
              <Text style={[styles.viewText, {
                color: COLORS.greyscale900
              }]}>Events</Text>
            </View>
            <View style={styles.view}>
              <Text style={[styles.viewNum, {
                color: COLORS.greyscale900
              }]}>983K+</Text>
              <Text style={[styles.viewText, {
                color: COLORS.greyscale900
              }]}>Followers</Text>
            </View>
            <View style={styles.viewLeft}>
              <Text style={[styles.viewNum, {
                color: COLORS.greyscale900
              }]}>700+</Text>
              <Text style={[styles.viewText, {
                color: COLORS.greyscale900
              }]}>Folowing</Text>
            </View>
          </View>

          <View style={styles.buttonActionContainer}>
            <TouchableOpacity
              onPress={() => setHasFollowed(!hasFollowed)}
              style={[styles.buttonAction, {
                borderWidth: 1,
                borderColor: COLORS.primary,
                backgroundColor: hasFollowed ? "transparent" : COLORS.primary
              }]}>
              <Image
                source={icons.addUser}
                resizeMode='contain'
                style={[styles.buttonActionIcon, {
                  tintColor: hasFollowed ? COLORS.primary : COLORS.white
                }]}
              />
              <Text style={[styles.buttonActionText, {
                color: hasFollowed ? COLORS.primary : COLORS.white
              }]}>{hasFollowed ? "Following" : "Follow"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Chat")}
              style={styles.buttonActionRight}>
              <Image
                source={icons.chat}
                resizeMode='contain'
                style={styles.buttonActionIconRight}
              />
              <Text style={styles.buttonActionTextRight}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separateLine} />
        </View>
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        {renderHeader()}
        <View style={{ flex: 1 }}>
          {renderContent()}
          <View style={{ flex: 1 }}>
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              onIndexChange={setIndex}
              initialLayout={{ width: layout.width }}
              renderTabBar={renderTabBar}
            />
          </View>
        </View>
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
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  arrowBackIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black
  },
  profileImageContainer: {
    alignItems: "center",
  },
  profileImage: {
    height: 120,
    width: 120,
    borderRadius: 9999,
    borderColor: COLORS.gray,
    borderWidth: 2
  },
  fullName: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 8
  },
  yearExperience: {
    fontSize: 14,
    color: COLORS.greyscale900
  },
  reviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6
  },
  ratingNum: {
    color: "gray",
    fontSize: 14
  },
  price: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.primary,
    marginVertical: 8
  },
  summaryContainer: {
    width: SIZES.width - 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 22
  },
  viewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12
  },
  view: {
    width: (SIZES.width - 32) / 3,
    alignItems: "center",
    borderRightColor: COLORS.black,
    borderRightWidth: .3
  },
  viewNum: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.black
  },
  viewText: {
    fontSize: 14,
    fontFamily: "regular",
    color: COLORS.black,
    marginVertical: 4
  },
  viewLeft: {
    width: (SIZES.width - 32) / 3,
    alignItems: "center"
  },
  buttonActionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
    width: SIZES.width - 32
  },
  buttonAction: {
    width: (SIZES.width - 32) / 2 - 8,
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42
  },
  buttonActionIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.white,
    marginRight: 8
  },
  buttonActionText: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.white
  },
  buttonActionRight: {
    width: (SIZES.width - 32) / 2 - 8,
    borderRadius: 32,
    borderWidth: 1.4,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42
  },
  buttonActionIconRight: {
    width: 16,
    height: 16,
    tintColor: COLORS.primary,
    marginRight: 8
  },
  buttonActionTextRight: {
    fontSize: 18,
    fontFamily: "semiBold",
    color: COLORS.primary
  },
  separateLine: {
    width: SIZES.width - 32,
    height: .1,
    backgroundColor: COLORS.gray,
  }
})

export default EventDetailsOrganizer