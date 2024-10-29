import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React, { useState } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { mapStandardStyle } from '../data/mapData';
import { COLORS, SIZES, FONTS, icons } from '../constants';

const OrganizerAbout = () => {
    const [expanded, setExpanded] = useState(false);

    const description = `Experience the ultimate musical extravaganza at the National Music Festival! Join us for a weekend filled with electrifying performances from top artists across all genres. From pulsating beats to soul-stirring melodies, immerse yourself in a symphony of sounds that will leave you mesmerized. With vibrant stages, delicious food vendors, and a lively atmosphere, this festival promises an unforgettable celebration of music and unity. Don't miss out on the rhythm and harmony – book your tickets now!`

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };
    return (
        <View>
            <Text style={[styles.viewSubtitle, {
                color: COLORS.greyscale900,
            }]}>About Organizer</Text>
            <Text style={[styles.description, {
                color: COLORS.grayscale700,
            }]} numberOfLines={expanded ? undefined : 2}>{description}</Text>
            <TouchableOpacity onPress={toggleExpanded}>
                <Text style={styles.viewBtn}>
                    {expanded ? 'View Less' : 'View More'}
                </Text>
            </TouchableOpacity>

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

        </View>
    )
};

const styles = StyleSheet.create({
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
    eventItemContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    viewBtn: {
        color: COLORS.primary,
        marginTop: 5,
        fontSize: 14,
        fontFamily: "semiBold",
    }
})

export default OrganizerAbout