import { View, Text, StyleSheet, Image } from 'react-native';
import React, { useState } from 'react';
import { COLORS, SIZES } from '../constants';

const PeopleGoingCard = ({ name, avatar, primaryPhone, workerId }) => {
    const [isFollow, setIsFollow] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                <Image
                    source={{ uri: avatar }}
                    resizeMode='contain'
                    style={styles.avatar}
                />
                <View style={styles.viewContainer}>
                    <Text style={styles.phoneNumber}>{workerId}</Text>
                    <Text style={[styles.name, { color: COLORS.greyscale900 }]}>{name}</Text>
                    <Text style={styles.phoneNumber}>{primaryPhone}</Text>
                </View>
            </View>
      
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: SIZES.width - 32,
        marginVertical: 12,
    },
    leftContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        height: 52,
        width: 52,
        borderRadius: 999,
    },
    name: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.black,
        marginBottom: 6,
    },
    phoneNumber: {
        fontSize: 12,
        fontFamily: "regular",
        color: COLORS.grayscale700,
    },
    viewContainer: {
        marginLeft: 16,
    },
    btn: {
        width: 72,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 16,
    },
    btnText: {
        fontFamily: "medium",
        color: COLORS.white,
        fontSize: 12,
    },
});

export default PeopleGoingCard;
