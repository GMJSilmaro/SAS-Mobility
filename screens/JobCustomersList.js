import { View, StyleSheet, FlatList, Text, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { COLORS } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../components/Header'
import { ScrollView } from 'react-native-virtualized-view'
import { useRoute } from '@react-navigation/native'
import { db } from '../firebase' // import your Firebase configuration
import { collection, getDocs, query, where } from 'firebase/firestore'
import CustomersListCard from '../components/CustomersListCard'
import Ionicons from 'react-native-vector-icons/Ionicons'

const JobCustomersList = () => {
    const route = useRoute()
    const { workerId } = route.params
    const [jobs, setJobs] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchJobs = async () => {
            const q = query(
                collection(db, 'jobs'),
                where('assignedWorkers', 'array-contains', workerId)
            )
            const querySnapshot = await getDocs(q)
            const jobData = querySnapshot.docs.map((doc) => doc.data())
            setJobs(jobData)
        }

        fetchJobs()
    }, [workerId])

    const filteredJobs = jobs.filter(
        (job) =>
            job.customerName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            job.streetAddress
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            job.country.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.container}>
                <Header title={`${jobs.length} Assigned Customers`} />
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                >
                    <FlatList
                        data={filteredJobs}
                        keyExtractor={(item) => item.jobNo}
                        renderItem={({ item }) => (
                            <CustomersListCard
                                name={item.customerName}
                                primaryPhone={
                                    item.phoneNumber || item.mobilePhone
                                } // Use either phoneNumber or mobilePhone
                                jobNo={item.jobNo}
                                country={item.country}
                                address={`${item.streetAddress} ${item.block} ${item.locationName} ${item.city} ${item.zipCode}`}
                            />
                        )}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 40,
        marginBottom: 40,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
    },
    scrollView: {
        paddingVertical: 0,
    },
    searchBar: {
        padding: 10,
        borderColor: COLORS.greyscale300,
        borderWidth: 1,
        borderRadius: 8,
        margin: 10,
        backgroundColor: COLORS.lightGray, // Use a light background for better visibility
    },
})

export default JobCustomersList
