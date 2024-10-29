import React, { useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    SectionList,
    TouchableOpacity,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native' // Import useRoute
import moment from 'moment'
import Icon from 'react-native-vector-icons/Ionicons'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

const MySchedule = () => {
    const navigation = useNavigation()
    const route = useRoute()
    const { workerId } = route.params // Extract workerId from route parameters
    const [schedule, setSchedule] = useState([])
    const [filteredSchedule, setFilteredSchedule] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchWorkerSchedules = async () => {
            setLoading(true)
            try {
                const scheduleRef = collection(db, 'workerSchedules') // Reference to the main collection
                const scheduleSnapshot = await getDocs(scheduleRef)
                const fetchedSchedules = scheduleSnapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter((schedule) => schedule.WorkerID === workerId) // Filter by WorkerID

                setSchedule(fetchedSchedules)
                setFilteredSchedule(groupByDate(fetchedSchedules))
            } catch (error) {
                console.error('Error fetching schedules:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchWorkerSchedules()
    }, [workerId])

    const groupByDate = (data) => {
        const groupedData = data.reduce((acc, item) => {
            const date = moment(item.StartTime.toDate()).format('MMMM D, YYYY') // Convert timestamp to date
            if (!acc[date]) {
                acc[date] = []
            }
            acc[date].push(item)
            return acc
        }, {})

        return Object.keys(groupedData).map((date) => ({
            title: date,
            data: groupedData[date],
        }))
    }

    const handleSearch = (query) => {
        setSearchQuery(query)
        const filtered = schedule.filter((item) =>
            item.Subject.toLowerCase().includes(query.toLowerCase())
        )
        setFilteredSchedule(groupByDate(filtered))
    }

    const renderScheduleItem = ({ item }) => {
        const { Subject, StartTime, EndTime, StatusID } = item
        const formattedStartTime = moment(StartTime.toDate()).format('h:mm A')
        const formattedEndTime = moment(EndTime.toDate()).format('h:mm A')

        return (
            <View style={styles.scheduleItem}>
                <Text style={styles.jobName}>{Subject}</Text>
                <Text style={styles.timeText}>
                    Start: {formattedStartTime} - End: {formattedEndTime}
                </Text>
                <Text style={styles.statusText}>Status ID: {StatusID}</Text>
            </View>
        )
    }

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>My Schedule</Text>
            </View>
            <TextInput
                style={styles.searchBar}
                placeholder="Search by job name..."
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {loading ? (
                <ActivityIndicator size="large" color="#007BFF" />
            ) : (
                <SectionList
                    sections={filteredSchedule}
                    renderItem={renderScheduleItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            No schedule available.
                        </Text>
                    }
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 32,
        padding: 16,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        textAlign: 'center',
        flex: 1,
    },
    searchBar: {
        margin: 16,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderColor: '#007BFF',
        borderWidth: 1,
        fontSize: 16,
    },
    sectionHeader: {
        backgroundColor: '#007BFF',
        padding: 8,
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scheduleItem: {
        backgroundColor: '#d0e7ff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        marginHorizontal: 16,
    },
    jobName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007BFF',
    },
    timeText: {
        fontSize: 14,
        color: '#555',
    },
    statusText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#007BFF',
    },
    emptyText: {
        fontSize: 16,
        color: '#808080',
        textAlign: 'center',
        marginTop: 20,
    },
})

export default MySchedule

// import React, { useEffect, useState } from 'react'
// import {
//     View,
//     Text,
//     StyleSheet,
//     FlatList,
//     ActivityIndicator,
//     Alert,
// } from 'react-native'
// import { collection, query, where, getDocs } from 'firebase/firestore'
// import { db } from '../firebase' // Import your Firebase configuration
// import moment from 'moment'

// const MySchedule = ({ workerId }) => {
//     const [schedule, setSchedule] = useState([])
//     const [loading, setLoading] = useState(true)

//     useEffect(() => {
//         // Fetch the worker's schedule from Firestore
//         const fetchSchedule = async () => {
//             try {
//                 setLoading(true)
//                 const currentDate = moment().format('MM-DD-YYYY')
//                 const scheduleQuery = query(
//                     collection(
//                         db,
//                         'workerAttendance',
//                         workerId,
//                         currentDate,
//                         'WorkerSchedule'
//                     ),
//                     where('workerId', '==', workerId)
//                 )

//                 const querySnapshot = await getDocs(scheduleQuery)
//                 const scheduleData = []

//                 querySnapshot.forEach((doc) => {
//                     scheduleData.push({ id: doc.id, ...doc.data() })
//                 })

//                 setSchedule(scheduleData)
//                 setLoading(false)
//             } catch (error) {
//                 console.error('Error fetching schedule:', error)
//                 Alert.alert(
//                     'Error',
//                     'Failed to fetch schedule. Please try again later.'
//                 )
//                 setLoading(false)
//             }
//         }

//         fetchSchedule()
//     }, [workerId])

//     const renderScheduleItem = ({ item }) => {
//         const { jobName, startTime, endTime, status } = item
//         const formattedStartTime = moment(startTime).format(
//             'MMMM D, YYYY [at] h:mm A'
//         )
//         const formattedEndTime = moment(endTime).format(
//             'MMMM D, YYYY [at] h:mm A'
//         )

//         return (
//             <View style={styles.scheduleItem}>
//                 <Text style={styles.jobName}>{jobName}</Text>
//                 <Text style={styles.timeText}>Start: {formattedStartTime}</Text>
//                 <Text style={styles.timeText}>End: {formattedEndTime}</Text>
//                 <Text style={styles.statusText}>Status: {status}</Text>
//             </View>
//         )
//     }

//     return (
//         <View style={styles.container}>
//             {loading ? (
//                 <ActivityIndicator size="large" color="#007BFF" />
//             ) : (
//                 <FlatList
//                     data={schedule}
//                     renderItem={renderScheduleItem}
//                     keyExtractor={(item) => item.id}
//                     ListEmptyComponent={
//                         <Text style={styles.emptyText}>
//                             No schedule available for today.
//                         </Text>
//                     }
//                 />
//             )}
//         </View>
//     )
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 16,
//         backgroundColor: '#f0f8ff',
//     },
//     scheduleItem: {
//         backgroundColor: '#007BFF',
//         borderRadius: 8,
//         padding: 16,
//         marginBottom: 12,
//     },
//     jobName: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#fff',
//     },
//     timeText: {
//         fontSize: 14,
//         color: '#e0e0e0',
//     },
//     statusText: {
//         fontSize: 14,
//         fontStyle: 'italic',
//         color: '#f0f8ff',
//     },
//     emptyText: {
//         fontSize: 16,
//         color: '#808080',
//         textAlign: 'center',
//         marginTop: 20,
//     },
// })

// export default MySchedule
