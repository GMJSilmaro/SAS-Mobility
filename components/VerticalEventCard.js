import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES, icons } from '../constants';

const VerticalEventCard = ({
    name,
    image,
    location,
    startTime,
    endTime,
    date,
    isFree,
    onPress
}) => {
    const [isFavourite, setIsFavourite] = useState(false);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.container, {
                backgroundColor: COLORS.white
            }]}>
            <Image
                source={image}
                resizeMode='cover'
                style={styles.image}
            />
            {
                isFree && isFree === true && (
                    <View style={styles.reviewContainer}>
                        <Text style={styles.rating}>FREE</Text>
                    </View>
                )
            }
            <Text style={[styles.name, {
                color: COLORS.greyscale900,
            }]}>{name}</Text>
            <Text style={[styles.location, {
                color: COLORS.grayscale700,
            }]}>{location}</Text>
            <View style={styles.bottomPriceContainer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.duration}>{date}, {startTime}-{endTime}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsFavourite(!isFavourite)}>
                    <Image
                        source={isFavourite ? icons.heart2 : icons.heart2Outline}
                        resizeMode='contain'
                        style={styles.heartIcon}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    )
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        width: (SIZES.width - 32) / 2 - 12,
        backgroundColor: COLORS.white,
        padding: 6,
        borderRadius: 16,
        marginBottom: 12
    },
    image: {
        width: "100%",
        height: 140,
        borderRadius: 16
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        marginVertical: 4
    },
    location: {
        fontSize: 12,
        fontFamily: "regular",
        color: COLORS.grayscale700,
        marginVertical: 4
    },
    bottomPriceContainer: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    duration: {
        fontSize: 10,
        fontFamily: "semiBold",
        color: COLORS.primary,
        marginRight: 8
    },
    durationText: {
        fontSize: 14,
        fontFamily: "regular",
        color: COLORS.grayscale700
    },
    heartIcon: {
        width: 16,
        height: 16,
        tintColor: COLORS.primary,
        marginLeft: 6
    },
    reviewContainer: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 46,
        height: 20,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        zIndex: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    rating: {
        fontSize: 12,
        fontFamily: "semiBold",
        color: COLORS.white,
        marginLeft: 4
    },
})

export default VerticalEventCard