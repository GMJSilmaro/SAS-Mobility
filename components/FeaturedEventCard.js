import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Image } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';

const FeaturedEventCard = ({
    name,
    image,
    startTime,
    endTime,
    date,
    location,
    onPress
}) => {
    const [isFavourite, setIsFavourite] = useState(false);

    return (
        <TouchableOpacity onPress={onPress}>
            <ImageBackground
                imageStyle={{ borderRadius: 32 }}
                style={styles.container}
                source={image}>
                <LinearGradient
                    style={styles.bottomContainer}
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                >
                    <Text style={styles.name}>{name.substring(0, 16)}...</Text>
                    <Text style={styles.location}>{location}</Text>
                    <View style={styles.bottomPriceContainer}>
                        <View style={styles.durationContainer}>
                            <Text style={styles.durationText}>{date}-{startTime}-{endTime}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsFavourite(!isFavourite)}>
                            <Image
                                source={isFavourite ? icons.heart2 : icons.heart2Outline}
                                resizeMode='contain'
                                style={styles.heartIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    )
};

const styles = StyleSheet.create({
    container: {
        width: SIZES.width * 0.68,
        height: 310,
        borderRadius: 16,
        marginRight: 12,

    },
    bottomContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 124,
        zIndex: 999999,
        width: "100%",
        borderBottomRightRadius: 32,
        borderBottomLeftRadius: 32,
        padding: 16
    },
    name: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.white,
        marginBottom: 6
    },
    location: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.white,
        marginVertical: 6
    },
    bottomPriceContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4
    },
    durationContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    durationText: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.white
    },
    heartIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white,
        marginRight: 6
    }
})

export default FeaturedEventCard