import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Switch,
} from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Alert } from 'react-native'
import { COLORS, SIZES, icons, images } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native-virtualized-view'
import { MaterialIcons } from '@expo/vector-icons'
import { launchImagePicker } from '../utils/ImagePickerHelper'
import SettingsItem from '../components/SettingsItem'
import RBSheet from 'react-native-raw-bottom-sheet'
import Button from '../components/Button'
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore' // Import Firestore functions
import moment from 'moment'
import { db } from '../firebase' // import your Firebase configuration

const Profile = ({ navigation, route }) => {
    const refRBSheet = useRef()
    const { workerId } = route.params
    const [image, setImage] = useState('')

    const [isClockedIn, setIsClockedIn] = useState(false) // Track clock-in status
    const [buttonText, setButtonText] = useState('Clock In') // Track button text
    const [clockInTime, setClockInTime] = useState(null) // Track the clock-in time

    const [userData, setUserData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
    })

    useEffect(() => {
        // Fetch user data once (no need for re-listening here)
        const fetchUserData = async () => {
            try {
                const userDoc = doc(db, 'users', workerId)
                const userSnapshot = await getDoc(userDoc)

                if (userSnapshot.exists()) {
                    const data = userSnapshot.data()
                    setUserData(data)
                    setImage({ uri: data.profilePicture })
                    console.log('Fetched user data:', data) // Log fetched user data
                } else {
                    console.warn(
                        'No user document found for workerId:',
                        workerId
                    ) // Warn if no user document found
                }
            } catch (error) {
                console.error('Error fetching user data:', error) // Log fetching errors
            }
        }

        fetchUserData()

        // Real-time listener for clock-in status
        const currentDate = moment().format('MM-DD-YYYY')
        const clockInDocRef = doc(
            db,
            `users/${workerId}/attendanceLogs/${currentDate}`
        )

        const unsubscribe = onSnapshot(clockInDocRef, (clockInDocSnapshot) => {
            if (clockInDocSnapshot.exists()) {
                const clockInData = clockInDocSnapshot.data()
                setIsClockedIn(
                    clockInData.clockInLogs?.[currentDate]?.clockIn !==
                        undefined
                ) // Check if clockIn exists
                setClockInTime(
                    clockInData.clockInLogs?.[currentDate]?.clockIn || null
                ) // Set clockIn time if it exists
                setButtonText(
                    clockInData.clockInLogs?.[currentDate]?.isClockedIn
                        ? 'Clock Out'
                        : 'Clock In'
                )
                console.log('Fetched clock-in status for today:', clockInData)
            } else {
                // If no document found, set defaults
                setIsClockedIn(false)
                setClockInTime(null)
                setButtonText('Clock In')
                console.warn('No clock-in document found for today.')
            }
        })

        return () => unsubscribe() // Cleanup listener on component unmount
    }, [workerId]) // Consider adding other dependencies if needed
    /**
     * Render header
     */
    const renderHeader = () => {
        return (
            <TouchableOpacity style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Image
                        source={images.sasLogo}
                        resizeMode="contain"
                        style={styles.logo}
                    />
                    <Text
                        style={[
                            styles.headerTitle,
                            {
                                color: COLORS.greyscale900,
                            },
                        ]}
                    >
                        Profile
                    </Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        resizeMode="contain"
                        style={[
                            styles.headerIcon,
                            {
                                tintColor: COLORS.greyscale900,
                            },
                        ]}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        )
    }

    const handleClockIn = async () => {
        // Confirm before clocking in
        Alert.alert(
            'Confirm Clock In',
            'Are you sure you want to clock in?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            console.log('Worker ID:', workerId)

                            // Reference to the user document
                            const userRef = doc(db, 'users', workerId)

                            // Format current date as MM-DD-YYYY
                            const currentDate = moment().format('MM-DD-YYYY')
                            console.log('Current date:', currentDate)

                            // Reference to the attendanceLogs sub-collection
                            const attendanceLogRef = doc(
                                collection(userRef, 'attendanceLogs'),
                                currentDate
                            )

                            // Fetch worker details from the users collection
                            const userSnap = await getDoc(userRef)
                            if (!userSnap.exists()) {
                                Alert.alert('Error', 'User document not found.')
                                return
                            }

                            const { userId, firstName, middleName, lastName } =
                                userSnap.data()

                            // Check if the attendance log for today already exists
                            const attendanceLogSnap =
                                await getDoc(attendanceLogRef)
                            const currentTime = moment().toDate() // Current timestamp

                            // If attendance log exists
                            if (attendanceLogSnap.exists()) {
                                const attendanceData = attendanceLogSnap.data()
                                const todayLog =
                                    attendanceData.clockInLogs?.[currentDate]

                                // Check if the user is currently clocked in
                                if (todayLog?.isClockedIn) {
                                    Alert.alert(
                                        'Info',
                                        'You are already clocked in for today.'
                                    )
                                    return // Exit if already clocked in
                                }

                                // Check if the user has clocked out
                                if (todayLog?.isClockedIn === false) {
                                    // Allow re-clock-in but ask for confirmation
                                    Alert.alert(
                                        'Re-Clock In',
                                        'You have already clocked out today. Do you want to clock in again?',
                                        [
                                            {
                                                text: 'Cancel',
                                                style: 'cancel',
                                            },
                                            {
                                                text: 'Confirm',
                                                onPress: async () => {
                                                    // Create or update the attendance log document with re-clock-in details
                                                    await setDoc(
                                                        attendanceLogRef,
                                                        {
                                                            fullName: `${firstName} ${middleName} ${lastName}`,
                                                            userId: `${userId}`,
                                                            clockInLogs: {
                                                                [currentDate]: {
                                                                    clockIn:
                                                                        currentTime,
                                                                    clockOut:
                                                                        '',
                                                                    isClockedIn: true,
                                                                    reClockIns:
                                                                        {
                                                                            count:
                                                                                (todayLog
                                                                                    .reClockIns
                                                                                    ?.count ||
                                                                                    0) +
                                                                                1,
                                                                            reClockInTime:
                                                                                currentTime,
                                                                        },
                                                                },
                                                            },
                                                            timestamp:
                                                                serverTimestamp(), // Store as a timestamp
                                                        },
                                                        { merge: true }
                                                    )

                                                    // Upload to recentActivities
                                                    const recentActivitiesRef =
                                                        collection(
                                                            db,
                                                            'recentActivities'
                                                        )
                                                    await addDoc(
                                                        recentActivitiesRef,
                                                        {
                                                            activity:
                                                                'Re-Clock In',
                                                            activitybrief: `${firstName} ${lastName} (Worker No: ${workerId}) has re-clocked in.`,
                                                            icon: 'check',
                                                            time: serverTimestamp(), // Store as a timestamp
                                                            workerId: workerId,
                                                        }
                                                    )

                                                    console.log(
                                                        'Re-Clock In data saved successfully!'
                                                    )
                                                    Alert.alert(
                                                        'Success',
                                                        'You are now re-clocked in.'
                                                    )
                                                },
                                            },
                                        ],
                                        { cancelable: true }
                                    )
                                    return // Exit to avoid further processing
                                }
                            }

                            // If no logs exist for today, create a new one
                            await setDoc(
                                attendanceLogRef,
                                {
                                    fullName: `${firstName} ${middleName} ${lastName}`,
                                    userId: `${userId}`,
                                    clockInLogs: {
                                        [currentDate]: {
                                            clockIn: currentTime,
                                            clockOut: '',
                                            isClockedIn: true,
                                            reClockIns: { count: 0 }, // Start count for re-clock-ins
                                        },
                                    },
                                    timestamp: serverTimestamp(), // Store as a timestamp
                                },
                                { merge: true }
                            )

                            // Upload to recentActivities
                            const recentActivitiesRef = collection(
                                db,
                                'recentActivities'
                            )
                            await addDoc(recentActivitiesRef, {
                                activity: 'Clock In',
                                activitybrief: `${firstName} ${lastName} (Worker No: ${workerId}) has clocked in.`,
                                icon: 'check',
                                time: serverTimestamp(), // Store as a timestamp
                                workerId: workerId,
                            })

                            console.log('Clock In data saved successfully!')
                            Alert.alert('Success', 'You are now clocked in.')
                        } catch (error) {
                            console.error('Error during clock in:', error)
                            Alert.alert(
                                'Error',
                                'Failed to clock in. Please try again.'
                            )
                        }
                    },
                },
            ],
            { cancelable: true }
        )
    }

    const handleClockOut = async () => {
        // Confirm before clocking out
        Alert.alert(
            'Confirm Clock Out',
            'Are you sure you want to clock out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            console.log('Worker ID:', workerId)

                            // Reference to the user document
                            const userRef = doc(db, 'users', workerId)

                            // Format current date as MM-DD-YYYY
                            const currentDate = moment().format('MM-DD-YYYY')
                            console.log('Current date:', currentDate)

                            // Reference to the attendanceLogs sub-collection
                            const attendanceLogRef = doc(
                                collection(userRef, 'attendanceLogs'),
                                currentDate
                            )

                            // Fetch worker details from the users collection
                            const userSnap = await getDoc(userRef)
                            if (!userSnap.exists()) {
                                Alert.alert('Error', 'User document not found.')
                                return
                            }

                            const { firstName, lastName } = userSnap.data()

                            // Check if the attendance log for today already exists
                            const attendanceLogSnap =
                                await getDoc(attendanceLogRef)
                            if (
                                !attendanceLogSnap.exists() ||
                                !attendanceLogSnap.data().clockInLogs?.[
                                    currentDate
                                ]?.clockIn
                            ) {
                                Alert.alert(
                                    'Info',
                                    'You need to clock in before you can clock out.'
                                )
                                return // Exit if not clocked in
                            }

                            const currentTime = moment().toDate() // Current timestamp

                            // Create or update the attendance log document
                            await setDoc(
                                attendanceLogRef,
                                {
                                    clockInLogs: {
                                        [currentDate]: {
                                            clockOut: currentTime,
                                            isClockedIn: false,
                                        },
                                    },
                                },

                                { merge: true }
                            )
                            setIsClockedIn(false) // Update the state

                            // Upload to recentActivities
                            const recentActivitiesRef = collection(
                                db,
                                'recentActivities'
                            )
                            await addDoc(recentActivitiesRef, {
                                activity: 'Clock Out',
                                activitybrief: `${firstName} ${lastName} (Worker No: ${workerId}) has clocked out.`,
                                icon: 'check',
                                time: serverTimestamp(), // Store as a timestamp
                                workerId: workerId,
                            })

                            console.log('Clock Out data saved successfully!')
                            Alert.alert('Success', 'You are now clocked out.')
                        } catch (error) {
                            console.error('Error during clock out:', error)
                            Alert.alert(
                                'Error',
                                'Failed to clock out. Please try again.'
                            )
                        }
                    },
                },
            ],
            { cancelable: true }
        )
    }

    // const handleClockOut = async () => {
    //     // Show a confirmation alert before proceeding with the clock-out
    //     Alert.alert(
    //         'Confirm Clock Out',
    //         'Are you sure you want to clock out?',
    //         [
    //             {
    //                 text: 'Cancel',
    //                 style: 'cancel', // Cancel button style
    //             },
    //             {
    //                 text: 'Yes, Clock Out', // Confirmation button text
    //                 onPress: async () => {
    //                     try {
    //                         console.log('Worker ID:', workerId)

    //                         // Format current date and time
    //                         const currentDate = moment().format('MM-DD-YYYY')
    //                         const currentTime = moment().format(
    //                             'MMMM D, YYYY [at] h:mm:ss A [UTC+8]'
    //                         )
    //                         console.log('Current date:', currentDate)
    //                         console.log('Current time:', currentTime)

    //                         // Reference to the workerAttendance collection
    //                         const workerAttendanceRef = doc(
    //                             db,
    //                             'workerAttendance',
    //                             workerId
    //                         )
    //                         const currentDateRef = collection(
    //                             workerAttendanceRef,
    //                             currentDate
    //                         )
    //                         const workerStatusRef = doc(
    //                             currentDateRef,
    //                             'workerStatus'
    //                         )

    //                         // Fetch the WorkerStatus document to update
    //                         const docSnap = await getDoc(workerStatusRef)

    //                         // If the document exists, proceed to update
    //                         if (docSnap.exists()) {
    //                             await setDoc(
    //                                 workerStatusRef,
    //                                 {
    //                                     clockOutDate: currentDate,
    //                                     clockOutTime: currentTime,
    //                                     isClockedIn: false,
    //                                     isWorking: false, // Set isWorking to false
    //                                 },
    //                                 { merge: true }
    //                             )

    //                             console.log(
    //                                 'WorkerStatus document updated successfully!'
    //                             )
    //                             Alert.alert(
    //                                 'Success',
    //                                 'You are now clocked out.'
    //                             )

    //                             // Update local state
    //                             setIsClockedIn(false)
    //                             setClockInTime(null) // Clear clockInTime since the worker is clocked out
    //                             setButtonText('Clock In') // Change button text back to 'Clock In'

    //                             // Fetch worker details from the users collection
    //                             const userRef = doc(db, 'users', workerId)
    //                             const userSnap = await getDoc(userRef)
    //                             if (userSnap.exists()) {
    //                                 const { firstName, lastName, workerId } =
    //                                     userSnap.data()

    //                                 // Upload to recentActivities
    //                                 const recentActivitiesRef = collection(
    //                                     db,
    //                                     'recentActivities'
    //                                 )
    //                                 try {
    //                                     await addDoc(recentActivitiesRef, {
    //                                         activity: 'Clock Out',
    //                                         activitybrief: `${firstName} ${lastName} (Worker No: ${workerId}) has clocked out.`,
    //                                         icon: 'clock', // You can change this icon as needed
    //                                         time: serverTimestamp(), // Store as a timestamp
    //                                         workerId: workerId,
    //                                     })
    //                                     console.log(
    //                                         'Activity added to recentActivities successfully.'
    //                                     )
    //                                 } catch (addDocError) {
    //                                     console.error(
    //                                         'Error adding to recentActivities:',
    //                                         addDocError
    //                                     )
    //                                     Alert.alert(
    //                                         'Error',
    //                                         'Failed to add activity to recentActivities.'
    //                                     )
    //                                 }
    //                             } else {
    //                                 console.error(
    //                                     'No user document found for this worker ID.'
    //                                 )
    //                             }
    //                         } else {
    //                             Alert.alert(
    //                                 'Error',
    //                                 'You are not clocked in. Please clock in first.'
    //                             )
    //                         }
    //                     } catch (error) {
    //                         console.error(
    //                             'Error updating worker status:',
    //                             error
    //                         )
    //                         Alert.alert(
    //                             'Error',
    //                             'Failed to clock out. Please try again.'
    //                         )
    //                     }
    //                 },
    //             },
    //         ],
    //         { cancelable: true } // Allows the alert to be dismissed by tapping outside
    //     )
    // }

    const renderClockInButton = () => {
        return (
            <TouchableOpacity
                style={styles.clockButton}
                onPress={isClockedIn ? handleClockOut : handleClockIn} // Call the appropriate function based on the state
            >
                <Text style={styles.clockButtonText}>
                    {isClockedIn ? 'Clock Out' : 'Clock In'}
                    {''}
                    {/* Button text based on clocked in status */}
                </Text>
            </TouchableOpacity>
        )
    }

    const renderClockInTime = () => {
        return (
            <View style={styles.clockTimeContainer}>
                {isClockedIn && (
                    <Text>
                        {`Clock In Time: ${clockInTime ? moment(clockInTime.toDate()).format('LLLL') : ''}`}
                    </Text>
                )}
            </View>
        )
    }

    /**
     * Render User Profile
     */
    const renderProfile = () => {
        // const pickImage = async () => {
        //   try {
        //     const tempUri = await launchImagePicker();
        //     if (!tempUri) return;
        //     setImage({ uri: tempUri });
        //   } catch (error) { }
        // };

        return (
            <View style={styles.profileContainer}>
                <View>
                    <Image
                        source={image}
                        resizeMode="cover"
                        style={styles.avatar}
                    />
                </View>
                <Text style={[styles.title, { color: COLORS.greyscale900 }]}>
                    {userData.firstName} {userData.middleName}{' '}
                    {userData.lastName}
                </Text>
                <Text style={[styles.subtitle, { color: COLORS.IconColor }]}>
                    {userData.email}
                </Text>
            </View>
        )
    }

    /**
     * Render Settings
     */
    const renderSettings = () => {
        const [isDarkMode, setIsDarkMode] = useState(false)

        const toggleDarkMode = () => {
            setIsDarkMode((prev) => !prev)
        }

        return (
            <View style={styles.settingsContainer}>
                <SettingsItem
                    icon={icons.userOutline}
                    name="Edit Profile"
                    onPress={() => navigation.navigate('EditProfile')}
                />

                <SettingsItem
                    icon={icons.calendar}
                    name="View Schedule"
                    onPress={() =>
                        navigation.navigate('MySchedule', { workerId })
                    } // Pass the workerId here
                />
                <SettingsItem
                    icon={icons.shieldOutline}
                    name="Security"
                    onPress={() => navigation.navigate('SettingsSecurity')}
                />
                <TouchableOpacity
                    onPress={() => refRBSheet.current.open()}
                    style={styles.logoutContainer}
                >
                    <View style={styles.logoutLeftContainer}>
                        <Image
                            source={icons.logout}
                            resizeMode="contain"
                            style={[
                                styles.logoutIcon,
                                {
                                    tintColor: 'red',
                                },
                            ]}
                        />
                        <Text
                            style={[
                                styles.logoutName,
                                {
                                    color: 'red',
                                },
                            ]}
                        >
                            Logout
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    {renderProfile()}

                    {renderSettings()}

                    {renderClockInTime()}
                    {renderClockInButton()}
                </ScrollView>
            </View>
            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={false}
                height={SIZES.height * 0.8}
                customStyles={{
                    wrapper: {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    },
                    draggableIcon: {
                        backgroundColor: COLORS.grayscale200,
                        height: 4,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 260,
                        backgroundColor: COLORS.white,
                    },
                }}
            >
                <Text style={styles.bottomTitle}>Logout</Text>
                <View
                    style={[
                        styles.separateLine,
                        {
                            backgroundColor: COLORS.grayscale200,
                        },
                    ]}
                />
                <Text
                    style={[
                        styles.bottomSubtitle,
                        {
                            color: COLORS.black,
                        },
                    ]}
                >
                    Are you sure you want to log out?
                </Text>
                <View style={styles.bottomContainer}>
                    <Button
                        title="Cancel"
                        style={{
                            width: (SIZES.width - 32) / 2 - 8,
                            backgroundColor: COLORS.tansparentPrimary,
                            borderRadius: 32,
                            borderColor: COLORS.tansparentPrimary,
                        }}
                        textColor={COLORS.primary}
                        onPress={() => refRBSheet.current.close()}
                    />
                    <Button
                        title="Yes, Logout"
                        filled
                        style={styles.logoutButton}
                        onPress={() => refRBSheet.current.close()}
                    />
                </View>
            </RBSheet>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
        marginBottom: 32,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        height: 32,
        width: 32,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: 'bold',
        color: COLORS.Icon,
        marginLeft: 12,
    },
    headerIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900,
    },
    profileContainer: {
        alignItems: 'center',
        borderBottomColor: COLORS.grayscale400,
        borderBottomWidth: 0.4,
        paddingVertical: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 999,
    },
    picContainer: {
        width: 20,
        height: 20,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        position: 'absolute',
        right: 0,
        bottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginTop: 12,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.greyscale900,
        fontFamily: 'medium',
        marginTop: 4,
    },
    settingsContainer: {
        marginVertical: 12,
    },
    settingsItemContainer: {
        width: SIZES.width - 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900,
    },
    settingsName: {
        fontSize: 18,
        fontFamily: 'semiBold',
        color: COLORS.greyscale900,
        marginLeft: 12,
    },
    settingsArrowRight: {
        width: 24,
        height: 24,
        tintColor: COLORS.greyscale900,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightLanguage: {
        fontSize: 18,
        fontFamily: 'semiBold',
        color: COLORS.greyscale900,
        marginRight: 8,
    },
    switch: {
        marginLeft: 8,
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], // Adjust the size of the switch
    },
    logoutContainer: {
        width: SIZES.width - 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    logoutLeftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900,
    },
    logoutName: {
        fontSize: 18,
        fontFamily: 'semiBold',
        color: COLORS.greyscale900,
        marginLeft: 12,
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
        paddingHorizontal: 16,
    },
    cancelButton: {
        width: (SIZES.width - 32) / 2 - 8,
        backgroundColor: COLORS.tansparentPrimary,
        borderRadius: 32,
    },
    logoutButton: {
        width: (SIZES.width - 32) / 2 - 8,
        backgroundColor: COLORS.primary,
        borderRadius: 32,
    },
    bottomTitle: {
        fontSize: 24,
        fontFamily: 'semiBold',
        color: 'red',
        textAlign: 'center',
        marginTop: 12,
    },
    bottomSubtitle: {
        fontSize: 20,
        fontFamily: 'semiBold',
        color: COLORS.greyscale900,
        textAlign: 'center',
        marginVertical: 28,
    },
    separateLine: {
        width: SIZES.width,
        height: 1,
        backgroundColor: COLORS.grayscale200,
        marginTop: 12,
    },
    clockButton: {
        backgroundColor: COLORS.IconColor,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 16,
    },
    clockButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    clockTimeContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    clockTimeText: {
        fontSize: 16,
        color: COLORS.greyscale900,
    },
})

export default Profile

// import { View, Text, StyleSheet, TouchableOpacity, Image, Switch } from 'react-native';
// import React, { useState, useRef, useEffect } from 'react';
// import { COLORS, SIZES, icons, images } from '../constants';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { ScrollView } from 'react-native-virtualized-view';
// import { MaterialIcons } from '@expo/vector-icons';
// import { launchImagePicker } from '../utils/ImagePickerHelper';
// import SettingsItem from '../components/SettingsItem';
// import RBSheet from "react-native-raw-bottom-sheet";
// import Button from '../components/Button';

// const Profile = ({ navigation, route }) => {
//   const refRBSheet = useRef();
//   const { workerId } = route.params;
//   const [userData, setUserData] = useState(null);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const userDoc = doc(db, 'users', workerId);
//       const userSnapshot = await getDoc(userDoc);
//       if (userSnapshot.exists()) {
//         setUserData(userSnapshot.data());
//       }
//     };

//     fetchUserData();
//   }, [workerId]);

//   /**
//    * Render header
//    */
//   const renderHeader = () => {
//     return (
//       <TouchableOpacity style={styles.headerContainer}>
//         <View style={styles.headerLeft}>
//           <Image
//             source={images.potensiLogo}
//             resizeMode='contain'
//             style={styles.logo}
//           />
//           <Text style={[styles.headerTitle, {
//             color: COLORS.greyscale900
//           }]}>Profile</Text>
//         </View>
//         <TouchableOpacity>
//           <Image
//             source={icons.moreCircle}
//             resizeMode='contain'
//             style={[styles.headerIcon, {
//               tintColor: COLORS.greyscale900
//             }]}
//           />
//         </TouchableOpacity>
//       </TouchableOpacity>
//     )
//   }

//   /**
//    * Render User Profile
//    */
//   const renderProfile = () => {
//     const [image, setImage] = useState(images.user1)

//     const pickImage = async () => {
//       try {
//         const tempUri = await launchImagePicker()

//         if (!tempUri) return

//         // set the image
//         setImage({ uri: tempUri })
//       } catch (error) { }
//     };
//     return (
//       <View style={styles.profileContainer}>
//         <View>
//           <Image
//             source={image}
//             resizeMode='cover'
//             style={styles.avatar}
//           />
//           <TouchableOpacity
//             onPress={pickImage}
//             style={styles.picContainer}>
//             <MaterialIcons name="edit" size={16} color={COLORS.white} />
//           </TouchableOpacity>
//         </View>
//         <Text style={[styles.title, { color: COLORS.greyscale900 }]}>Nathalie Erneson</Text>
//         <Text style={[styles.subtitle, { color: COLORS.greyscale900 }]}>nathalie_erneson@gmail.com</Text>
//       </View>
//     )
//   }
//   /**
//    * Render Settings
//    */
//   const renderSettings = () => {
//     const [isDarkMode, setIsDarkMode] = useState(false);

//     const toggleDarkMode = () => {
//       setIsDarkMode((prev) => !prev);
//     };

//     return (
//       <View style={styles.settingsContainer}>

//         <SettingsItem
//           icon={icons.userOutline}
//           name="Edit Profile"
//           onPress={() => navigation.navigate("EditProfile")}
//         />

//         <SettingsItem
//           icon={icons.shieldOutline}
//           name="Security"
//           onPress={() => navigation.navigate("SettingsSecurity")}
//         />

//         <TouchableOpacity
//           onPress={() => refRBSheet.current.open()}
//           style={styles.logoutContainer}>
//           <View style={styles.logoutLeftContainer}>
//             <Image
//               source={icons.logout}
//               resizeMode='contain'
//               style={[styles.logoutIcon, {
//                 tintColor: "red"
//               }]}
//             />
//             <Text style={[styles.logoutName, {
//               color: "red"
//             }]}>Logout</Text>
//           </View>
//         </TouchableOpacity>
//       </View>
//     )
//   }
//   return (
//     <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
//       <View style={[styles.container, { backgroundColor: COLORS.white }]}>
//         {renderHeader()}
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {renderProfile()}
//           {renderSettings()}
//         </ScrollView>
//       </View>
//       <RBSheet
//         ref={refRBSheet}
//         closeOnDragDown={true}
//         closeOnPressMask={false}
//         height={SIZES.height * .8}
//         customStyles={{
//           wrapper: {
//             backgroundColor: "rgba(0,0,0,0.5)",
//           },
//           draggableIcon: {
//             backgroundColor: COLORS.grayscale200,
//             height: 4
//           },
//           container: {
//             borderTopRightRadius: 32,
//             borderTopLeftRadius: 32,
//             height: 260,
//             backgroundColor: COLORS.white
//           }
//         }}
//       >
//         <Text style={styles.bottomTitle}>Logout</Text>
//         <View style={[styles.separateLine, {
//           backgroundColor: COLORS.grayscale200,
//         }]} />
//         <Text style={[styles.bottomSubtitle, {
//           color: COLORS.black
//         }]}>Are you sure you want to log out?</Text>
//         <View style={styles.bottomContainer}>
//           <Button
//             title="Cancel"
//             style={{
//               width: (SIZES.width - 32) / 2 - 8,
//               backgroundColor: COLORS.tansparentPrimary,
//               borderRadius: 32,
//               borderColor: COLORS.tansparentPrimary
//             }}
//             textColor={COLORS.primary}
//             onPress={() => refRBSheet.current.close()}
//           />
//           <Button
//             title="Yes, Logout"
//             filled
//             style={styles.logoutButton}
//             onPress={() => refRBSheet.current.close()}
//           />
//         </View>
//       </RBSheet>
//     </SafeAreaView>
//   )
// };

// const styles = StyleSheet.create({
//   area: {
//     flex: 1,
//     backgroundColor: COLORS.white
//   },
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//     padding: 16,
//     marginBottom: 32
//   },
//   headerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between"
//   },
//   headerLeft: {
//     flexDirection: "row",
//     alignItems: "center"
//   },
//   logo: {
//     height: 32,
//     width: 32,

//   },
//   headerTitle: {
//     fontSize: 22,
//     fontFamily: "bold",
//     color: COLORS.greyscale900,
//     marginLeft: 12
//   },
//   headerIcon: {
//     height: 24,
//     width: 24,
//     tintColor: COLORS.greyscale900
//   },
//   profileContainer: {
//     alignItems: "center",
//     borderBottomColor: COLORS.grayscale400,
//     borderBottomWidth: .4,
//     paddingVertical: 20
//   },
//   avatar: {
//     width: 120,
//     height: 120,
//     borderRadius: 999
//   },
//   picContainer: {
//     width: 20,
//     height: 20,
//     borderRadius: 4,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.primary,
//     position: "absolute",
//     right: 0,
//     bottom: 12
//   },
//   title: {
//     fontSize: 18,
//     fontFamily: "bold",
//     color: COLORS.greyscale900,
//     marginTop: 12
//   },
//   subtitle: {
//     fontSize: 16,
//     color: COLORS.greyscale900,
//     fontFamily: "medium",
//     marginTop: 4
//   },
//   settingsContainer: {
//     marginVertical: 12
//   },
//   settingsItemContainer: {
//     width: SIZES.width - 32,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginVertical: 12
//   },
//   leftContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   settingsIcon: {
//     height: 24,
//     width: 24,
//     tintColor: COLORS.greyscale900
//   },
//   settingsName: {
//     fontSize: 18,
//     fontFamily: "semiBold",
//     color: COLORS.greyscale900,
//     marginLeft: 12
//   },
//   settingsArrowRight: {
//     width: 24,
//     height: 24,
//     tintColor: COLORS.greyscale900
//   },
//   rightContainer: {
//     flexDirection: "row",
//     alignItems: "center"
//   },
//   rightLanguage: {
//     fontSize: 18,
//     fontFamily: "semiBold",
//     color: COLORS.greyscale900,
//     marginRight: 8
//   },
//   switch: {
//     marginLeft: 8,
//     transform: [{ scaleX: .8 }, { scaleY: .8 }], // Adjust the size of the switch
//   },
//   logoutContainer: {
//     width: SIZES.width - 32,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginVertical: 12
//   },
//   logoutLeftContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   logoutIcon: {
//     height: 24,
//     width: 24,
//     tintColor: COLORS.greyscale900
//   },
//   logoutName: {
//     fontSize: 18,
//     fontFamily: "semiBold",
//     color: COLORS.greyscale900,
//     marginLeft: 12
//   },
//   bottomContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginVertical: 12,
//     paddingHorizontal: 16
//   },
//   cancelButton: {
//     width: (SIZES.width - 32) / 2 - 8,
//     backgroundColor: COLORS.tansparentPrimary,
//     borderRadius: 32
//   },
//   logoutButton: {
//     width: (SIZES.width - 32) / 2 - 8,
//     backgroundColor: COLORS.primary,
//     borderRadius: 32
//   },
//   bottomTitle: {
//     fontSize: 24,
//     fontFamily: "semiBold",
//     color: "red",
//     textAlign: "center",
//     marginTop: 12
//   },
//   bottomSubtitle: {
//     fontSize: 20,
//     fontFamily: "semiBold",
//     color: COLORS.greyscale900,
//     textAlign: "center",
//     marginVertical: 28
//   },
//   separateLine: {
//     width: SIZES.width,
//     height: 1,
//     backgroundColor: COLORS.grayscale200,
//     marginTop: 12
//   }
// })

// export default Profile
