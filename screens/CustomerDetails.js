import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { COLORS } from '../constants'
import Ionicons from 'react-native-vector-icons/Ionicons'

const CustomerDetails = ({ route }) => {
    const { name, primaryPhone, jobNo, country, address } = route.params

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{name}</Text>

            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <Ionicons
                        name="call-outline"
                        size={20}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{` ${primaryPhone}`}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons
                        name="location-outline"
                        size={20}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{` ${address}`}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons
                        name="flag-outline"
                        size={20}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{` ${country}`}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons
                        name="briefcase-outline"
                        size={20}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{` Job No: ${jobNo}`}</Text>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: COLORS.primary, // Assuming you have a primary color in your COLORS
        textAlign: 'center',
    },
    detailsContainer: {
        backgroundColor: COLORS.lightGrey, // A subtle background for the details
        borderRadius: 12,
        padding: 16,
        elevation: 2, // Adds a shadow effect
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    detailText: {
        fontSize: 16,
        color: COLORS.greyscale700,
        marginLeft: 10,
    },
})

export default CustomerDetails
