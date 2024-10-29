import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { COLORS } from '../constants'
import { useNavigation } from '@react-navigation/native'

const CustomersListCard = ({ name, primaryPhone, jobNo, country, address }) => {
    const navigation = useNavigation()

    // Function to handle the card press
    const handleOnPress = () => {
        navigation.navigate('CustomerDetails', {
            name,
            primaryPhone,
            jobNo,
            country,
            address,
        })
    }

    return (
        <TouchableOpacity style={styles.card} onPress={handleOnPress}>
            <View style={styles.cardContent}>
                <Text style={styles.customerName}>{name}</Text>
                <View style={styles.detailsContainer}>
                    <Ionicons
                        name="call-outline"
                        size={16}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{primaryPhone}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Ionicons
                        name="location-outline"
                        size={16}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{address}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Ionicons
                        name="flag-outline"
                        size={16}
                        color={COLORS.IconColor}
                    />
                    <Text style={styles.detailText}>{country}</Text>
                </View>
                <Text style={styles.jobNoText}>Job No: {jobNo}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4, // For Android shadow
    },
    cardContent: {
        flexDirection: 'column',
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    detailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        marginLeft: 4,
        fontSize: 12,
        color: COLORS.greyscale700,
    },
    jobNoText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.greyscale600,
    },
})

export default CustomersListCard
