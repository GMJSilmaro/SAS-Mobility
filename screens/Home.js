import React, { useEffect, useState, useCallback } from 'react'
import { Alert } from 'react-native'
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native'
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc,
} from 'firebase/firestore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { db } from '../firebase'
import { COLORS, icons } from '../constants'
import { Calendar } from 'react-native-calendars'
import moment from 'moment'
import { useFocusEffect } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'

const getStatusName = (status) => {
    switch (status) {
        case 'Created':
            return 'Created'
        case 'Confirm':
            return 'Confirm'
        case 'Cancel':
            return 'Cancel'
        case 'Job Started':
            return 'Job Started'
        case 'Job Complete':
            return 'Job Complete'
        case 'Validate':
            return 'Validate'
        case 'Scheduled':
            return 'Scheduled'
        case 'Unscheduled':
            return 'Unscheduled'
        case 'Re-scheduled':
            return 'Re-scheduled'
        default:
            return 'Unknown Status'
    }
}

const getStatusColor = (status) => {
    switch (status) {
        case 'Created':
            return '#9bcaf5' // Created
        case 'Scheduled':
            return '#6da7de' // Scheduled
        case 'Job Complete':
            return '#04386b' // Job Complete
        case 'Cancel':
            return 'red' // Cancelled
        default:
            return 'gray'
    }
}

const Ribbon = ({ status }) => {
    const color = getStatusColor(status)
    return (
        <View style={[styles.ribbon, { backgroundColor: color }]}>
            <Text style={styles.ribbonText}>{getStatusName(status)}</Text>
        </View>
    )
}

const Home = ({ navigation, route }) => {
    const { workerId } = route.params
    const [userData, setUserData] = useState(null)
    const [selectedDate, setSelectedDate] = useState(
        moment().format('YYYY-MM-DD')
    )
    const [jobs, setJobs] = useState([])
    const [markedDates, setMarkedDates] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchUserData = async () => {
            const userDoc = doc(db, 'users', workerId)
            const userSnapshot = await getDoc(userDoc)
            if (userSnapshot.exists()) {
                setUserData(userSnapshot.data())
            }
        }

        fetchUserData()
    }, [workerId])

    useFocusEffect(
        useCallback(() => {
            const fetchJobs = async () => {
                const jobsQuery = query(collection(db, 'jobs'))
                const jobSnapshots = await getDocs(jobsQuery)
                const jobsList = jobSnapshots.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }))

                const formattedJobs = jobsList.map((job) => {
                    const startDateTime = moment(job.startDate).format(
                        'YYYY-MM-DD'
                    ) // Format startDate
                    return {
                        ...job,
                        startDateTime: startDateTime,
                        estimatedDurationHours: parseInt(
                            job.estimatedDurationHours,
                            10
                        ),
                        estimatedDurationMinutes: parseInt(
                            job.estimatedDurationMinutes,
                            10
                        ),
                    }
                })

                setJobs(formattedJobs)

                const datesMarked = {}
                formattedJobs.forEach((job) => {
                    if (!datesMarked[job.startDateTime]) {
                        datesMarked[job.startDateTime] = {
                            dots: [],
                        }
                    }
                    datesMarked[job.startDateTime].dots.push({
                        color: getStatusColor(job.jobStatus),
                        selectedDotColor: getStatusColor(job.jobStatus),
                    })
                })

                setMarkedDates(datesMarked)
            }

            fetchJobs()
        }, [])
    )

    useFocusEffect(
        useCallback(() => {
            const fetchJobsForSelectedDate = async () => {
                setLoading(true)

                // Format selectedDate to match the Firestore startDate format
                const formattedSelectedDate = moment(selectedDate).format(
                    'YYYY-MM-DDTHH:mm:ss'
                ) // Adjust as needed

                const jobsQuery = query(
                    collection(db, 'jobs'),
                    where('startDate', '>=', formattedSelectedDate), // Adjust query for inclusive date
                    where(
                        'startDate',
                        '<',
                        moment(formattedSelectedDate)
                            .add(1, 'days')
                            .format('YYYY-MM-DDTHH:mm:ss')
                    ) // End of day
                )
                const jobSnapshots = await getDocs(jobsQuery)
                const jobsList = jobSnapshots.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }))

                const formattedJobs = jobsList.map((job) => ({
                    ...job,
                    startDateTime: moment(job.startDate).format('YYYY-MM-DD'), // Format startDate
                    estimatedDurationHours: parseInt(
                        job.estimatedDurationHours,
                        10
                    ),
                    estimatedDurationMinutes: parseInt(
                        job.estimatedDurationMinutes,
                        10
                    ),
                }))

                setJobs(formattedJobs)
                setLoading(false)
            }

            fetchJobsForSelectedDate()
        }, [selectedDate])
    )
 

    const onDayPress = (day) => {
        setSelectedDate(day.dateString)
    }

    const renderHeader = () => (
        <View>
            <View style={styles.headerContainer}>
                <View style={styles.viewLeft}>
                    {userData && userData.profilePicture ? (
                        <Image
                            source={{ uri: userData.profilePicture }}
                            resizeMode="contain"
                            style={styles.userIcon}
                        />
                    ) : (
                        <View style={styles.userIconPlaceholder}></View>
                    )}
                    <View style={styles.viewNameContainer}>
                        <Text style={styles.greeeting}>Welcome back👋</Text>
                        <Text
                            style={[
                                styles.title,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            {userData
                                ? `${userData.firstName} ${userData.lastName}`
                                : 'Guest'}
                        </Text>
                    </View>
                </View>
                <View style={styles.viewRight}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Image
                            source={icons.notificationBell2}
                            resizeMode="contain"
                            style={[
                                styles.bellIcon,
                                { tintColor: COLORS.greyscale900 },
                            ]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View
                style={[
                    styles.separateLine,
                    {
                        marginVertical: 6,
                        height: 1,
                        backgroundColor: COLORS.grayscale100,
                    },
                ]}
            />

            <Calendar
                onDayPress={onDayPress}
                markedDates={{
                    ...markedDates,
                    [selectedDate]: {
                        ...markedDates[selectedDate],
                        selected: true,
                        selectedColor: COLORS.IconColor,
                    },
                }}
                markingType={'multi-dot'}
            />
        </View>
    )

    const renderJobItem = ({ item, workerId }) => {
        const handlePress = async () => {
            console.log('Worker ID:', workerId)
            console.log('Job Number:', item.jobNo)

            try {
                // Format current date as MM-DD-YYYY
                const currentDate = moment().format('MM-DD-YYYY')
                
                // Reference to the workerAttendance collection
                const workerAttendanceRef = doc(db, 'workerAttendance', workerId)
                const currentDateRef = collection(workerAttendanceRef, currentDate)
                const workerStatusRef = doc(currentDateRef, 'workerStatus')

                // Check if there is any ongoing job for the current day
                const workerStatusSnap = await getDoc(workerStatusRef)
                if (workerStatusSnap.exists()) {
                    const workerStatus = workerStatusSnap.data()
                    
                    // Check if the specified job is marked as "On Going"
                    if (workerStatus.jobNo && workerStatus.jobNo[item.jobNo] === 'On Going') {
                        navigation.navigate('ServiceTaskDetails', {
                            jobNo: item.jobNo,
                            workerId,
                        })
                        return
                    }

                    // Check for any other ongoing jobs
                    if (workerStatus.jobNo && Object.values(workerStatus.jobNo).includes('On Going')) {
                        Alert.alert(
                            'Ongoing Job',
                            'You have an ongoing job today. Please complete it before starting a new one.'
                        )
                        return
                    }
                }

                // Navigate to ServiceTaskDetails if no ongoing jobs
                navigation.navigate('ServiceTaskDetails', {
                    jobNo: item.jobNo,
                    workerId,
                })

            } catch (error) {
                console.error('Error checking worker status:', error)
                Alert.alert('Error', 'Failed to check job status. Please try again.')
            }
        }

        return (
            <TouchableOpacity onPress={handlePress}>
                <View style={styles.jobItemContainer}>
                    {/* Top Ribbon Section */}
                    <View style={styles.ribbonContainer}>
                        <View style={styles.ribbon}>
                            <Text style={styles.ribbonText}>
                                Job # {item.jobNo}
                            </Text>
                        </View>
                        <Text style={styles.startDate}>
                            {moment(item.startDate).format('DD-MM-YYYY')}
                        </Text>
                    </View>

                    {/* Main Job Info */}
                    <View style={styles.jobInfoContainer}>
                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="briefcase-outline"
                                size={20}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobTitle}>{item.jobName}</Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="time-outline"
                                size={20}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobDetail}>
                                Start Time: {item.startTime}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="location-outline"
                                size={20}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobDetail}>
                                Location: {item.locationName}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobDetail}>
                                Customer: {item.customerName}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobDetail}>
                                Mobile: {item.mobilePhone}
                            </Text>
                        </View>
                    </View>

                    {/* Status Ribbon at the Bottom */}
                    <Ribbon status={item.jobStatus} />
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.area}>
            <FlatList
                data={loading ? [] : jobs}
                renderItem={({ item }) => renderJobItem({ item, workerId })} // Pass workerId here
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                            />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !loading && (
                        <Text style={styles.noJobsText}>
                            No jobs available for this date.
                        </Text>
                    )
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 1,
        paddingBottom: 40,
        marginBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 1,
        paddingTop: 20,
    },
    calendarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 20,
        marginLeft: 5,
        marginRight: 5,
    },
    userIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    userIconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.lightGray,
    },
    viewLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    greeeting: {
        fontSize: 15,
        fontFamily: 'regular',
        color: 'gray',
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
    },
    viewNameContainer: {
        marginLeft: 12,
    },
    viewRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bellIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
        marginRight: 8,
    },
    bookmarkIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
    },
    jobListContainer: {
        marginTop: 16,
    },
    jobList: {
        marginVertical: 16,
    },
    jobItemContainer: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4, // For Android shadow
        borderColor: '#E8E8E8', // Light border for a clean design
        borderWidth: 1,
    },
    ribbonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12, // Spacing between ribbon and job info
    },
    ribbon: {
        backgroundColor: COLORS.IconColor, // Primary color ribbon
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    ribbonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    startDate: {
        alignSelf: 'flex-end',
        color: COLORS.black,
        fontWeight: 'bold',
        fontSize: 14,
    },
    jobInfoContainer: {
        marginTop: 8,
    },
    jobInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    jobTitle: {
        fontSize: 16,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 8,
    },
    jobDetail: {
        fontSize: 14,
        color: COLORS.gray2,
        marginLeft: 8,
    },
    jobTitleBold: {
        fontWeight: 'bold',
    },
    noJobsText: {
        textAlign: 'center',
        color: COLORS.gray,
        marginTop: 20,
    },
})

export default Home
