import { View, Text, TouchableOpacity, Image, StyleSheet, ImageBackground } from 'react-native';
import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native-virtualized-view';
import { COLORS, SIZES, FONTS, icons, images, socials } from '../constants';
import Button from '../components/Button';
import RBSheet from "react-native-raw-bottom-sheet";
import AutoSlider from '../components/AutoSlider';
import SocialIcon from '../components/SocialIcon';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout } from 'react-native-maps';
import { mapStandardStyle } from '../data/mapData';
import ReviewCard from '../components/ReviewCard';

const EventDetails = ({ navigation }) => {
  const refRBSheet = useRef();

  // Slider images
  const sliderImages = [
    images.event1,
    images.event2,
    images.event3,
    images.event4,
    images.event5,
  ];

  // render header
  const renderHeader = () => {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}>
            <Image
              source={isFavorite ? icons.heart2 : icons.heart2Outline}
              resizeMode='contain'
              style={styles.bookmarkIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendIconContainer}
            onPress={() => refRBSheet.current.open()}>
            <Image
              source={icons.send2}
              resizeMode='contain'
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /**
   * render content
   */
  const renderContent = () => {
    const [isFollowed, setIsFollowed] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const description = `Experience the ultimate musical extravaganza at the National Music Festival! Join us for a weekend filled with electrifying performances from top artists across all genres. From pulsating beats to soul-stirring melodies, immerse yourself in a symphony of sounds that will leave you mesmerized. With vibrant stages, delicious food vendors, and a lively atmosphere, this festival promises an unforgettable celebration of music and unity. Don't miss out on the rhythm and harmony – book your tickets now!`

    const toggleExpanded = () => {
      setExpanded(!expanded);
    };

    return (
      <View style={styles.contentContainer}>
        <Text style={[styles.eventName, {
          color: COLORS.greyscale900
        }]}>National Music Festival</Text>
        <View style={styles.eventDescContainer}>
          <View style={styles.eventCategoryContainer}>
            <Text style={styles.eventCategory}>Music</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image
              source={images.user1}
              resizeMode='contain'
              style={styles.avatar}
            />
            <Image
              source={images.user2}
              resizeMode='contain'
              style={[styles.avatar, { marginLeft: -16 }]}
            />
            <Image
              source={images.user3}
              resizeMode='contain'
              style={[styles.avatar, { marginLeft: -16 }]}
            />
            <Image
              source={images.user4}
              resizeMode='contain'
              style={[styles.avatar, { marginLeft: -16 }]}
            />
            <Image
              source={images.user5}
              resizeMode='contain'
              style={[styles.avatar, { marginLeft: - 16 }]}
            />
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("EventDetailsPeopleGoing")}
            style={styles.attenderContainer}>
            <Text style={[styles.numAttenders, {
              color: COLORS.greyscale900
            }]}>20,000+ going</Text>
            <Image
              source={icons.rightArrow}
              resizeMode='contain'
              style={[styles.arrowRightIcon, {
                tintColor: COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
        </View>
        <View style={[styles.separateLine, {
          marginVertical: 12,
          height: 1,
          backgroundColor: COLORS.grayscale100
        }]} />
        <View style={styles.eventFeatureContainer}>
          <View style={styles.eventFeatureIconContainer}>
            <Image
              source={icons.calendar3}
              resizeMode='contain'
              style={styles.eventFeatureIcon}
            />
          </View>
          <View style={styles.eventFeatureTextContainer}>
            <Text style={[styles.eventDate, {
              color: COLORS.greyscale900
            }]}>Monday, December 24, 2026</Text>
            <Text style={[styles.eventTime, {
              color: COLORS.grayscale700
            }]}>18:00 - 23:00 PM (GMT +07:00)</Text>
            <View style={styles.miniActionContainer}>
              <TouchableOpacity style={styles.miniIconContainer}>
                <Image
                  source={icons.calendar3}
                  resizeMode='contain'
                  style={styles.eventFeatureMiniIcon}
                />
              </TouchableOpacity>
              <Text style={styles.miniIconText}>Add To My Calendar</Text>
            </View>
          </View>
        </View>
        <View style={[styles.eventFeatureContainer, { marginVertical: 12 }]}>
          <View style={styles.eventFeatureIconContainer}>
            <Image
              source={icons.location7}
              resizeMode='contain'
              style={styles.eventFeatureIcon}
            />
          </View>
          <View style={styles.eventFeatureTextContainer}>
            <Text style={[styles.eventDate, {
              color: COLORS.greyscale900
            }]}>Grand Park, New York City, US</Text>
            <Text style={[styles.eventTime, {
              color: COLORS.grayscale700
            }]}>Grand City St. 100 New York, United States</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("EventDetailsLocation")}
              style={styles.miniActionContainer}>
              <View style={styles.miniIconContainer}>
                <Image
                  source={icons.location7}
                  resizeMode='contain'
                  style={styles.eventFeatureMiniIcon}
                />
              </View>
              <Text style={styles.miniIconText}>See Location on Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.eventFeatureContainer, { marginVertical: 12 }]}>
          <View style={styles.eventFeatureIconContainer}>
            <Image
              source={icons.ticket}
              resizeMode='contain'
              style={styles.eventFeatureIcon}
            />
          </View>
          <View style={styles.eventFeatureTextContainer}>
            <Text style={[styles.eventDate, {
              color: COLORS.greyscale900
            }]}>$20.00 - $100.00</Text>
            <Text style={[styles.eventTime, {
              color: COLORS.grayscale700
            }]}>Ticket Price depends on package</Text>
          </View>
        </View>
        <View style={[styles.separateLine, {
          marginVertical: 6,
          height: 1,
          backgroundColor: COLORS.grayscale100
        }]} />

        <View style={styles.userInfoContainer}>
          <View style={styles.userInfoLeftContainer}>
            <TouchableOpacity onPress={() => navigation.navigate("EventDetailsOrganizer")}>
              <Image
                source={images.user3}
                resizeMode="cover"
                style={styles.userImage}
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.userName, {
                color: COLORS.black
              }]}>Natasya Wilodra</Text>
              <Text style={[styles.userPosition, {
                color: COLORS.grayscale700,
              }]}>Organizer</Text>
            </View>
          </View>
          <View style={styles.userInfoRightContainer}>
            <TouchableOpacity
              onPress={() => setIsFollowed(!isFollowed)}
              style={[styles.followBtn, {
                backgroundColor: isFollowed ? COLORS.white : COLORS.primary
              }]}>
              <Text style={[styles.followBtnText, {
                color: isFollowed ? COLORS.primary : COLORS.white
              }]}>{isFollowed ? "Unfollow" : "Follow"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.viewSubtitle, {
          color: COLORS.greyscale900,
        }]}>About Event</Text>
        <Text style={[styles.description, {
          color: COLORS.grayscale700,
        }]} numberOfLines={expanded ? undefined : 2}>{description}</Text>
        <TouchableOpacity onPress={toggleExpanded}>
          <Text style={styles.viewBtn}>
            {expanded ? 'View Less' : 'View More'}
          </Text>
        </TouchableOpacity>

        <View style={styles.subItemContainer}>
          <Text style={[styles.viewSubtitle, {
            color: COLORS.greyscale900,
          }]}>Gallery (Pre-Event)</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Gallery")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coverImageContainer}>
          <Image
            source={images.event1}
            resizeMode='cover'
            style={styles.coverImage}
          />
          <Image
            source={images.event5}
            resizeMode='cover'
            style={styles.coverImage}
          />
          <ImageBackground
            imageStyle={{ borderRadius: 16 }}
            style={styles.coverImage}
            source={images.event3}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.gradientImage}>
              <Text style={styles.numImage}>20+</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        <Text style={[styles.viewSubtitle, {
          color: COLORS.greyscale900,
        }]}>Location</Text>

        <View style={styles.eventItemContainer}>
          <Image
            source={icons.pin}
            resizeMode='contain'
            style={styles.locationIcon}
          />
          <Text style={[styles.locationText, {
            color: COLORS.grayscale700,
          }]}>6993 Meadow Valley Terrace, New York</Text>
        </View>

        <View style={[styles.locationMapContainer, {
          backgroundColor: COLORS.white,
        }]}>
          <MapView
            style={styles.mapContainer}
            customMapStyle={mapStandardStyle}
            userInterfaceStyle="dark"
            initialRegion={{
              latitude: 48.8566,
              longitude: 2.3522,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}>
            <Marker
              coordinate={{
                latitude: 48.8566,
                longitude: 2.3522,
              }}
              image={icons.mapsOutline}
              title="Move"
              description="Address"
              onPress={() => console.log("Move to another screen")}
            >
              <Callout tooltip>
                <View>
                  <View style={styles.bubble}>
                    <Text
                      style={{
                        ...FONTS.body4,
                        fontWeight: 'bold',
                        color: COLORS.black,
                      }}
                    >
                      User Address
                    </Text>
                  </View>
                  <View style={styles.arrowBorder} />
                  <View style={styles.arrow} />
                </View>
              </Callout>
            </Marker>
          </MapView>
        </View>

        <View style={styles.reviewContainer}>
          <View style={styles.reviewLeft}>
            <Image
              source={icons.star}
              resizeMode='contain'
              style={styles.starMiddleIcon}
            />
            <Text style={[styles.reviewTitle, {
              color: COLORS.greyscale900
            }]}>4.8 (3.279 reviews)</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EventReviews")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ReviewCard
          avatar={images.user1}
          name="Maria Thompson"
          description="The atmosphere of the National Music Event was phenomenal! The venue was well-placed, and the surroundings were vibrant and convenient. Highly recommended for music enthusiasts! 😍"
          avgRating="5"
          date="2024-01-23T04:52:06.501Z"
          numLikes="948"
        />

      </View>
    )
  }

  return (
    <View style={[styles.area,
    { backgroundColor: COLORS.white }]}>
      <StatusBar hidden />
      <AutoSlider images={sliderImages} />
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
      <View style={[styles.bookBottomContainer, {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.white,
      }]}>
        <Button
          title="Booking Now"
          filled
          style={styles.bookingBtn}
          onPress={() => navigation.navigate("BookEvent")}
        />
      </View>

      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={false}
        height={360}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: COLORS.grayscale200,
          },
          container: {
            borderTopRightRadius: 32,
            borderTopLeftRadius: 32,
            height: 360,
            backgroundColor: COLORS.white,
            alignItems: "center",
          }
        }}
      >
        <Text style={[styles.bottomTitle, {
          color: COLORS.greyscale900
        }]}>Share</Text>
        <View style={[styles.separateLine, {
          backgroundColor: COLORS.grayscale200,
          marginVertical: 12
        }]} />
        <View style={styles.socialContainer}>
          <SocialIcon
            icon={socials.whatsapp}
            name="WhatsApp"
            onPress={() => console.log("WhatsApp")}
          />
          <SocialIcon
            icon={socials.twitter}
            name="X"
            onPress={() => console.log("Twitter")}
          />
          <SocialIcon
            icon={socials.facebook}
            name="Facebook"
            onPress={() => console.log("Facebook")}
          />
          <SocialIcon
            icon={socials.instagram}
            name="Instagram"
            onPress={() => console.log("Instagram")}
          />
        </View>
        <View style={styles.socialContainer}>
          <SocialIcon
            icon={socials.yahoo}
            name="Yahoo"
            onPress={() => console.log("Yahoo")}
          />
          <SocialIcon
            icon={socials.titktok}
            name="Tiktok"
            onPress={() => console.log("Tiktok")}
          />
          <SocialIcon
            icon={socials.messenger}
            name="Chat"
            onPress={() => console.log("Chat")}
          />
          <SocialIcon
            icon={socials.wechat}
            name="Wechat"
            onPress={() => console.log("Wechat")}
          />
        </View>
      </RBSheet>
    </View>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  headerContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 32,
    zIndex: 999,
    left: 16,
    right: 16
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white
  },
  bookmarkIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white
  },
  sendIconContainer: {
    marginLeft: 8
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  contentContainer: {
    marginHorizontal: 16
  },
  estateName: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 6
  },
  categoryContainer: {
    backgroundColor: COLORS.tansparentPrimary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderRadius: 6,
    width: 80,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.primary
  },
  rating: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.black
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  numReviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12
  },
  viewContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12
  },
  viewItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12
  },
  viewItemIcon: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.tansparentPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999
  },
  viewIcon: {
    height: 20,
    width: 20,
    tintColor: COLORS.primary
  },
  viewTitle: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.black,
    marginLeft: 12
  },
  separateLine: {
    width: SIZES.width - 32,
    height: 1,
    backgroundColor: COLORS.grayscale100
  },
  userInfoContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6
  },
  userImage: {
    width: 52,
    height: 52,
    borderRadius: 999
  },
  userName: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.black
  },
  userPosition: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.grayscale700,
    marginTop: 3
  },
  userInfoRightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  userInfoLeftContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  chatIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary
  },
  phoneIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary
  },
  viewSubtitle: {
    fontSize: 20,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginVertical: 12
  },
  description: {
    fontSize: 14,
    color: COLORS.grayscale700,
    fontFamily: "regular",
  },
  viewBtn: {
    color: COLORS.primary,
    marginTop: 5,
    fontSize: 14,
    fontFamily: "semiBold",
  },
  subItemContainer: {
    width: SIZES.width - 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: "semiBold"
  },
  coverImageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  coverImage: {
    width: (SIZES.width - 32) / 3 - 9,
    height: (SIZES.width - 32) / 3 - 9,
    borderRadius: 16,
    zIndex: 999
  },
  gradientImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: (SIZES.width - 32) / 3 - 9,
    height: (SIZES.width - 32) / 3 - 9,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  numImage: {
    fontSize: 22,
    color: COLORS.white,
    fontFamily: "bold",
  },
  eventItemContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
    marginRight: 8
  },
  locationText: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.grayscale700,
  },

  locationMapContainer: {
    height: 226,
    width: "100%",
    borderRadius: 12,
    marginVertical: 16
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.dark2
  },
  viewMapContainer: {
    height: 50,
    backgroundColor: COLORS.gray,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  bubble: {
    flexDirection: 'column',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    padding: 15,
    width: 'auto',
  },
  // Arrow below the bubble
  arrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#fff',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -32,
  },
  arrowBorder: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: '#007a87',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -0.5,
  },
  reviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    marginVertical: 16
  },
  reviewLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  starMiddleIcon: {
    height: 18,
    width: 18,
    tintColor: "orange",
    marginRight: 8
  },
  reviewTitle: {
    fontFamily: "bold",
    color: COLORS.black,
    fontSize: 18
  },
  seeAll: {
    color: COLORS.primary,
    fontFamily: "semiBold",
    fontSize: 16
  },
  bookBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: SIZES.width,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 104,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopRightRadius: 32,
    borderTopLeftRadius: 32,
    borderTopColor: COLORS.white,
    borderTopWidth: 1,
  },
  priceContainer: {
    flexDirection: "column",
  },
  priceText: {
    fontFamily: "regular",
    color: COLORS.grayscale700,
    fontSize: 14,
    marginBottom: 4
  },
  priceDurationContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  price: {
    fontFamily: "bold",
    color: COLORS.primary,
    fontSize: 26
  },
  priceDuration: {
    fontFamily: "regular",
    color: COLORS.grayscale700,
    fontSize: 16
  },
  bookingBtn: {
    width: SIZES.width - 32
  },
  separateLine: {
    width: SIZES.width - 32,
    height: 1,
    backgroundColor: COLORS.grayscale200
  },
  bottomTitle: {
    fontSize: 24,
    fontFamily: "semiBold",
    color: COLORS.black,
    textAlign: "center",
    marginTop: 12
  },
  socialContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    width: SIZES.width - 32
  },
  eventName: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 12
  },
  eventDescContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventCategoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 6,
  },
  eventCategory: {
    fontSize: 12,
    fontFamily: "medium",
    color: COLORS.primary,
  },
  avatarContainer: {
    flexDirection: "row",
    marginHorizontal: 16
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999
  },
  attenderContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  numAttenders: {
    fontSize: 14,
    fontFamily: "medium",
    color: COLORS.greyscale900
  },
  arrowRightIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.greyscale900,
    marginHorizontal: 8
  },
  eventFeatureContainer: {
    flexDirection: "row",
  },
  eventFeatureIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: COLORS.tansparentPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  eventFeatureIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary
  },
  eventFeatureTextContainer: {
    marginLeft: 12
  },
  eventDate: {
    fontSize: 18,
    fontFamily: "bold",
    color: COLORS.greyscale900,
    marginVertical: 6
  },
  eventTime: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.greyscale700
  },
  miniActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    width: 180,
    height: 30,
    borderRadius: 16,
    marginTop: 12
  },
  miniIconContainer: {
    marginRight: 8,
    marginLeft: 12
  },
  eventFeatureMiniIcon: {
    width: 12,
    height: 12,
    tintColor: COLORS.white
  },
  miniIconText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: "semiBold",
  },
  followBtn: {
    width: 96,
    height: 36,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  followBtnText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: "semiBold",
  }
})

export default EventDetails