import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Modal,
    Linking,
    Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { COLORS, SIZES, FONTS, icons, images } from '../constants'
import Button from '../components/Button'
import { db } from '../firebase'
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    serverTimestamp,
    collection,
    onSnapshot,
} from 'firebase/firestore'
import moment from 'moment'
import Input from '../components/Input'
import { reducer } from '../utils/reducers/formReducers'
import Header from '../components/Header'
import RNPickerSelect from 'react-native-picker-select'
import Icon from 'react-native-vector-icons/FontAwesome'
import { useFocusEffect } from '@react-navigation/native'
import TaskListTab from '../components/TaskListTabs'
import ListItems from '../components/ListItems'

const getJobPriorityLabel = (priority) => {
    switch (priority) {
        case 'H':
            return 'High'
        case 'M':
            return 'Mid'
        case 'L':
            return 'Low'
        default:
            return priority
    }
}

const getRibbonColor = (priority) => {
    switch (priority) {
        case 'High':
            return '#FF0000' // Red for High
        case 'Mid':
            return '#FFA500' // Orange for Mid
        case 'Low':
            return '#008000' // Green for Low
        default:
            return '#000000' // Black as default
    }
}

const Ribbon = ({ label }) => (
    <View
        style={[
            styles.ribbonContainer,
            { backgroundColor: getRibbonColor(label) },
        ]}
    >
        <Text style={styles.ribbonText}>{label}</Text>
    </View>
)

const sendMessageViaWhatsApp = (mobilePhone) => {
    let url = `whatsapp://send?text=Hello! I need some information.&phone=${mobilePhone}`
    Linking.canOpenURL(url)
        .then((supported) => {
            if (supported) {
                Linking.openURL(url)
            } else {
                console.log(
                    'Please install WhatsApp to send a message directly to this number.'
                )
            }
        })
        .catch((err) => console.error('An error occurred', err))
}

const ListItem = ({
    icon,
    label,
    value,
    onPress,
    showPicker,
    options,
    onValueChange,
}) => (
    <View style={styles.listItemContainer}>
        <TouchableOpacity style={styles.listItem} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Image source={icon} style={styles.listIcon} />
            </View>
            <Text style={styles.listLabel}>{label}</Text>
            {value && (
                <Text style={styles.listValue}>
                    {options.find((option) => option.value === value)?.label ||
                        value}
                </Text>
            )}
            <Image source={icons.rightArrow} style={styles.arrowIcon} />
        </TouchableOpacity>
        {showPicker && (
            <RNPickerSelect
                onValueChange={onValueChange}
                items={options}
                style={pickerSelectStyles}
                value={value}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                    <Image
                        source={icons.downArrow}
                        style={styles.pickerArrowIcon}
                    />
                )}
            />
        )}
    </View>
)

const JobDetails = ({ navigation, route }) => {
    const { jobNo } = route.params
    const { workerId } = route.params

    const [workerCount, setWorkerCount] = useState(0)
    const [jobData, setJobData] = useState(null)
    const [isFollowed, setIsFollowed] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [workerProfiles, setWorkerProfiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [visibleEquipments, setVisibleEquipments] = useState([])

    const formatDate = (date) => moment(date).format('DD-MM-YYYY')
    const formatTime = (time) => moment(time, 'HH:mm').format('hh:mm A')

    const [selectedStatus, setSelectedStatus] = useState('')
    const [showPicker, setShowPicker] = useState(false)

    const [isJobLocationRecorded, setIsJobLocationRecorded] = useState(false)
    const [jobButtonTitle, setJobButtonTitle] = useState('Job Start')
    const [workerStatus, setWorkerStatus] = useState('')
    const [selectedJobStatus, setSelectedJobStatus] = useState('')

    const [selectedTab, setSelectedTab] = useState('Task List')

    const [isOpen, setIsOpen] = useState(false)
    const [fields, setFields] = useState([])

    const toggleDropdown = () => {
        setIsOpen(!isOpen)
    }

    const addField = () => {
        setFields([...fields, ''])
    }

    const options = [
        { label: 'Created', value: 'Created' },
        { label: 'Confirm', value: 'Confirm' },
        { label: 'Cancel', value: 'Cancel' },
        { label: 'Job Started', value: 'Job Started' },
        { label: 'Job Complete', value: 'Job Completed' },
        // { label: 'Validate', value: 'V' },
        { label: 'Scheduled', value: 'Scheduled' },
        // { label: 'Unscheduled', value: 'US' },
        // { label: 'Re-scheduled', value: 'RS' },
    ]

    useEffect(() => {
        // Set loading state to true initially
        setLoading(true)

        const jobDocRef = doc(db, 'jobs', jobNo)

        // Set up a listener on the job document for real-time updates
        const unsubscribe = onSnapshot(
            jobDocRef,
            (jobDoc) => {
                if (jobDoc.exists()) {
                    const data = jobDoc.data()
                    setSelectedJobStatus(data.jobStatus) // Update job status
                    setJobData(data) // Update job data

                    // Update worker count and fetch profiles if assigned workers exist
                    if (data && Array.isArray(data.assignedWorkers)) {
                        setWorkerCount(data.assignedWorkers.length)
                        fetchWorkerProfiles(data.assignedWorkers) // Keep the fetchWorkerProfiles function
                    }

                    // Update visible equipment states if equipment data exists
                    if (data && Array.isArray(data.equipments)) {
                        setVisibleEquipments(data.equipments.map(() => false))
                    }

                    // Ensure loading is set to false after data is fetched
                    setLoading(false)
                } else {
                    console.warn(
                        'No such document exists for job number:',
                        jobNo
                    )
                    // Handle the case where the job document doesn't exist
                    setJobData(null) // Reset job data
                    setSelectedJobStatus(null) // Reset job status
                    setLoading(false) // Stop loading
                }
            },
            (error) => {
                console.error('Error fetching job details:', error)
                setLoading(false) // Stop loading on error
            }
        )

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return () => unsubscribe()
    }, [jobNo])

    const fetchWorkerProfiles = async (assignedWorkers) => {
        const profiles = await Promise.all(
            assignedWorkers.map(async (worker) => {
                // Destructure the worker object
                const workerId = worker.workerId // Access the workerId from the map
                const workerDocRef = doc(db, 'users', workerId)
                const workerDoc = await getDoc(workerDocRef)

                if (workerDoc.exists()) {
                    const workerData = workerDoc.data()
                    return {
                        workerId,
                        profilePicture: workerData.profilePicture,
                        name: workerData.fullName || 'Unknown Name', // Provide default in case fullName is undefined
                        primaryPhone:
                            workerData.primaryPhone || 'Unknown Primary Phone', // Default if not available
                        position: 'Technician',
                    }
                } else {
                    return {
                        workerId,
                        profilePicture: null,
                        name: 'Unknown Name',
                        primaryPhone: 'Unknown Primary Phone',
                        position: 'Unknown Position',
                    }
                }
            })
        )
        setWorkerProfiles(profiles)
    }

    // useEffect(() => {
    //     const fetchExistingData = async () => {
    //         try {
    //             const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
    //             const docSnap = await getDoc(docRef);
    //             if (docSnap.exists()) {
    //                 const data = docSnap.data();
    //                 setIsJobLocationRecorded(true);
    //                 setWorkerStatus(data.status);
    //                 if (data.status === 'Started') {
    //                     setJobButtonTitle('End Job');
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('Error fetching existing direction data:', error);
    //         }
    //     };

    //     if (jobNo && workerId) {
    //         fetchExistingData();
    //     }
    // }, [jobNo, workerId]);
    useFocusEffect(
        useCallback(() => {
            const fetchExistingData = async () => {
                try {
                    // Use the new path for fetching the document
                    const currentDate = moment().format('MM-DD-YYYY') // Format current date as MM-DD-YYYY
                    const docRef = doc(
                        db,
                        'workerAttendance',
                        workerId,
                        currentDate,
                        'workerStatus',
                        jobNo, // This should be the jobNo, not jobId
                        'JobStatus'
                    )

                    const docSnap = await getDoc(docRef)
                    if (docSnap.exists()) {
                        const data = docSnap.data()
                        console.log('Existing data:', data)

                        // Update state based on the existing data
                        setIsJobLocationRecorded(true)
                        setWorkerStatus(data.workerStatus || '')

                        // Set the job button title based on the current worker status
                        if (data.status === 'On Going') {
                            setJobButtonTitle('End Job')
                        } else if (data.status === 'Completed') {
                            setJobButtonTitle('Completed') // Set button title to "Completed"
                        } else {
                            setJobButtonTitle('Job Start')
                        }
                    } else {
                        console.log('No such document!')
                        // Set the job button title to "Job Start" if no document is found
                        setJobButtonTitle('Job Start')
                    }
                } catch (error) {
                    console.error(
                        'Error fetching existing direction data:',
                        error
                    )
                }
            }

            if (jobNo && workerId) {
                fetchExistingData()
            }
        }, [jobNo, workerId])
    )

    async function handleJobButtonClick() {
        const currentDate = moment().format('MM-DD-YYYY') // Format current date as MM-DD-YYYY
        const workerStatusRef = doc(
            db,
            'workerAttendance',
            workerId,
            currentDate,
            'workerStatus'
        )
        const jobStatusRef = doc(workerStatusRef, jobNo, 'JobStatus')
        const jobDocRef = doc(db, 'jobs', jobNo)

        // Common date and time formatting
        const formattedClockInDate = moment().format('MM-DD-YYYY')
        const formattedClockInTime = moment().format(
            'MMMM D, YYYY [at] h:mm:ss A [UTC+8]'
        )
        const formattedClockOutDate = moment().format('MM-DD-YYYY')
        const formattedClockOutTime = moment().format(
            'MMMM D, YYYY [at] h:mm:ss A [UTC+8]'
        )

        try {
            // Navigate to Home.js if the job is completed
            if (jobButtonTitle === 'Completed') {
                navigation.navigate('Home') // Ensure you have access to `navigation` from your component
                return // Exit the function after navigation
            }

            // Show a confirmation alert for "Job Start" or "End Job"
            const confirmationMessage =
                jobButtonTitle === 'Job Start'
                    ? 'Are you sure you want to start this job?'
                    : 'Are you sure you want to end this job?'
            const alertTitle =
                jobButtonTitle === 'Job Start'
                    ? 'Confirm Job Start'
                    : 'Confirm Job End'

            Alert.alert(
                alertTitle,
                confirmationMessage,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel', // Cancel button style
                    },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            if (jobButtonTitle === 'Job Start') {
                                // Check if job location is recorded
                                console.log(
                                    'isJobLocationRecorded:',
                                    isJobLocationRecorded
                                ) // Debugging statement

                                if (!isJobLocationRecorded) {
                                    Alert.alert(
                                        'Error: Location Missing!',
                                        'The job location has not been recorded yet. Please record the job location before starting the job.'
                                    )
                                    return
                                }

                                // Fetch job data to get jobName
                                const jobDocSnap = await getDoc(jobDocRef)
                                let jobName = ''
                                if (jobDocSnap.exists()) {
                                    jobName = jobDocSnap.data().jobName // Fetch the jobName from the job document
                                } else {
                                    console.error('No such job document found!')
                                    Alert.alert(
                                        'Error',
                                        'Job information could not be retrieved.'
                                    )
                                    return
                                }
                                const startTimestamp = serverTimestamp()

                                // Update the workerStatus document
                                await updateDoc(workerStatusRef, {
                                    [`jobNo.${jobNo}`]: 'On Going', // Update job status in the jobNo map
                                    isClockedIn: true,
                                    isWorking: true,
                                })

                                // Update the JobStatus document with just the status field
                                await updateDoc(jobStatusRef, {
                                    status: 'On Going',
                                    timeStart: startTimestamp,
                                    dateStarted: startTimestamp,
                                    workerReport: '',
                                    technicianSignature: '',
                                    customerSignature: '',
                                })

                                // Update the jobStatus in the jobs collection
                                await updateDoc(jobDocRef, {
                                    jobStatus: 'JS', // Update jobStatus to reflect the current status
                                })

                                // Upload to recentActivities
                                const recentActivitiesRef = collection(
                                    db,
                                    'recentActivities'
                                )
                                try {
                                    await addDoc(recentActivitiesRef, {
                                        activity: 'Job Started',
                                        activitybrief: `Job ${jobName} (Job No: ${jobNo}) was started.`,
                                        icon: 'check',
                                        time: serverTimestamp(),
                                        workerId: workerId,
                                    })
                                    console.log(
                                        'Activity added to recentActivities successfully.'
                                    )
                                } catch (addDocError) {
                                    console.error(
                                        'Error adding to recentActivities:',
                                        addDocError
                                    )
                                    Alert.alert(
                                        'Error',
                                        'Failed to add activity to recentActivities.'
                                    )
                                }

                                setJobButtonTitle('End Job')
                                setWorkerStatus('Started')

                                Alert.alert(
                                    'Job Status',
                                    `Job Started at ${formattedClockInDate} ${formattedClockInTime}`
                                )
                            } else {
                                // Before ending the job, check for signatures
                                const jobStatusSnap = await getDoc(jobStatusRef)
                                if (jobStatusSnap.exists()) {
                                    const {
                                        customerSignature,
                                        technicianSignature,
                                    } = jobStatusSnap.data()

                                    if (
                                        !customerSignature ||
                                        !technicianSignature
                                    ) {
                                        Alert.alert(
                                            'Error: Signatures Required!',
                                            'Both customer signature and technician signature must be provided before ending the job.'
                                        )
                                        return
                                    }
                                } else {
                                    console.error(
                                        'No such job status document found!'
                                    )
                                    Alert.alert(
                                        'Error',
                                        'Job status information could not be retrieved.'
                                    )
                                    return
                                }

                                const endTimestamp = serverTimestamp()

                                // Update the workerStatus document
                                await updateDoc(workerStatusRef, {
                                    [`jobNo.${jobNo}`]: 'Completed',

                                    isClockedIn: true,
                                    isWorking: false,
                                })

                                // Update the JobStatus document with just the status field
                                await updateDoc(jobStatusRef, {
                                    status: 'Completed',
                                    timeEnd: endTimestamp,
                                    dateEnded: endTimestamp,
                                })

                                // Update the jobStatus in the jobs collection
                                await updateDoc(jobDocRef, {
                                    jobStatus: 'JC', // Update jobStatus to reflect the completed state
                                })

                                const jobDocSnap = await getDoc(jobDocRef)
                                let jobName = ''
                                if (jobDocSnap.exists()) {
                                    jobName = jobDocSnap.data().jobName // Fetch the jobName from the job document
                                }

                                // Upload to recentActivities for job completion
                                const recentActivitiesRef = collection(
                                    db,
                                    'recentActivities'
                                )
                                try {
                                    await addDoc(recentActivitiesRef, {
                                        activity: 'Job Completed',
                                        activitybrief: `Job ${jobName} (Job No: ${jobNo}) was completed.`,
                                        icon: 'check',
                                        time: endTimestamp, // Use serverTimestamp for time
                                        workerId: workerId,
                                    })
                                    console.log(
                                        'Activity added to recentActivities successfully.'
                                    )
                                } catch (addDocError) {
                                    console.error(
                                        'Error adding to recentActivities:',
                                        addDocError
                                    )
                                    Alert.alert(
                                        'Error',
                                        'Failed to add activity to recentActivities.'
                                    )
                                }

                                setWorkerStatus('Ended')
                                setJobButtonTitle('Completed')

                                Alert.alert(
                                    'Job Status',
                                    `Job Ended at ${formattedClockOutDate} ${formattedClockOutTime}`
                                )
                            }
                        },
                    },
                ],
                { cancelable: true } // Allows the alert to be dismissed by tapping outside
            )
        } catch (error) {
            console.error('Error updating job status:', error)
            Alert.alert('Error', 'Failed to update job status.')
        }
    }

    const inputChangedHandler = useCallback((inputId, inputValue) => {
        const result = validateInput(inputId, inputValue)
        dispatchFormState({ inputId, validationResult: result, inputValue })
    }, [])

    const toggleExpanded = () => {
        setExpanded(!expanded)
    }

    const toggleEquipmentVisibility = (index) => {
        setVisibleEquipments((prev) => {
            const newVisibleEquipments = [...prev]
            newVisibleEquipments[index] = !newVisibleEquipments[index]
            return newVisibleEquipments
        })
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        )
    }

    const renderContent = () => {
        const customerName = jobData?.customerName?.split(' - ')[1] || ''
        const jobPriorityLabel = getJobPriorityLabel(jobData?.jobPriority)

        return (
            <View style={styles.contentContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                ></TouchableOpacity>
                <Header title={jobData?.jobName} />
                <View style={styles.eventDescContainer}>
                    <View style={styles.eventCategoryContainer}>
                        <Text style={styles.eventCategory}>
                            Assigned Workers
                        </Text>
                    </View>
                    <View style={styles.avatarContainer}>
                        {workerProfiles.map((worker, index) => (
                            <Image
                                key={index}
                                source={{ uri: worker.profilePicture }}
                                resizeMode="contain"
                                style={[
                                    styles.avatar,
                                    { marginLeft: index === 0 ? 0 : -16 },
                                ]}
                            />
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('JobDetailsAssignedWorkers', {
                                workerCount,
                                workerProfiles,
                            })
                        }
                        style={styles.attenderContainer}
                    >
                        <Text
                            style={[
                                styles.numAttenders,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            {workerCount}
                        </Text>
                        <Image
                            source={icons.rightArrow}
                            resizeMode="contain"
                            style={[
                                styles.arrowRightIcon,
                                { tintColor: COLORS.greyscale900 },
                            ]}
                        />
                    </TouchableOpacity>
                </View>
                <View
                    style={[
                        styles.separateLine,
                        {
                            marginVertical: 12,
                            height: 1,
                            backgroundColor: COLORS.grayscale100,
                        },
                    ]}
                />
                <View style={styles.eventFeatureContainer}>
                    <View style={styles.eventFeatureIconContainer}>
                        <Image
                            source={icons.calendar3}
                            resizeMode="contain"
                            style={styles.eventFeatureIcon}
                        />
                    </View>
                    <View style={styles.eventFeatureTextContainer}>
                        <Text
                            style={[
                                styles.eventDate,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            {moment(jobData?.startDate).format(
                                'dddd, MMMM D, YYYY'
                            )}
                        </Text>
                        <Text
                            style={[
                                styles.eventTime,
                                { color: COLORS.grayscale700 },
                            ]}
                        >
                            {moment(jobData?.startTime, 'HH:mm').format(
                                'hh:mm A'
                            )}{' '}
                            -{' '}
                            {moment(jobData?.endTime, 'HH:mm').format(
                                'hh:mm A'
                            )}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        styles.eventFeatureContainer,
                        { marginVertical: 12 },
                    ]}
                >
                    <View style={styles.eventFeatureIconContainer}>
                        <Image
                            source={icons.location7}
                            resizeMode="contain"
                            style={styles.eventFeatureIcon}
                        />
                    </View>
                    <View style={styles.eventFeatureTextContainer}>
                        <Text
                            style={[
                                styles.eventDate,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            {jobData?.locationName}
                        </Text>
                        <Text
                            style={[
                                styles.eventTime,
                                { color: COLORS.grayscale700 },
                            ]}
                        >
                            {jobData?.streetAddress}
                        </Text>
                    </View>
                </View>

                <View style={styles.eventFeatureContainer}>
                    <View style={styles.eventFeatureIconContainer}>
                        <Image
                            source={icons.user}
                            resizeMode="contain"
                            style={styles.eventFeatureIcon}
                        />
                    </View>
                    <View style={styles.eventFeatureTextContainer}>
                        <Text
                            style={[
                                styles.eventDate,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            Contact
                        </Text>
                        <Text
                            style={[
                                styles.eventTime,
                                { color: COLORS.grayscale700 },
                            ]}
                        >
                            {jobData?.firstName} {jobData?.middleName}{' '}
                            {jobData?.lastName} | {jobData?.mobilePhone} |{' '}
                            {jobData?.phoneNumber}
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                sendMessageViaWhatsApp(jobData?.mobilePhone)
                            }
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon
                                name="whatsapp"
                                size={20}
                                color={COLORS.success}
                            />
                            <Text
                                style={{ color: COLORS.success, marginLeft: 5 }}
                            >
                                Send Message via WhatsApp
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View
                    style={[
                        styles.eventFeatureContainer,
                        { marginVertical: 12 },
                    ]}
                >
                    <View style={styles.eventFeatureIconContainer}>
                        <Image
                            source={icons.infoCircle}
                            resizeMode="contain"
                            style={styles.eventFeatureIcon}
                        />
                    </View>
                    <View style={styles.eventFeatureTextContainer}>
                        <Text
                            style={[
                                styles.eventDate,
                                { color: COLORS.greyscale900 },
                            ]}
                        >
                            Job Priority
                        </Text>
                        <View style={styles.jobDetailContainer}>
                            <Text
                                style={[
                                    styles.eventTime,
                                    { color: COLORS.grayscale700 },
                                ]}
                            >
                                #{jobData?.jobNo}
                            </Text>
                            <Ribbon label={jobPriorityLabel} />
                        </View>
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
                <View style={styles.userInfoContainer}>
                    <View style={styles.userInfoLeftContainer}>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('EventDetailsOrganizer')
                            }
                        >
                            <Image
                                source={images.potensiLogo}
                                resizeMode="cover"
                                style={styles.userImage}
                            />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 12 }}>
                            <Text
                                style={[
                                    styles.userName,
                                    { color: COLORS.black },
                                ]}
                            >
                                {customerName}
                            </Text>
                            <Text
                                style={[
                                    styles.userPosition,
                                    { color: COLORS.grayscale700 },
                                ]}
                            >
                                Customer
                            </Text>
                        </View>
                    </View>
                </View>
                <Text
                    style={[
                        styles.viewSubtitle,
                        { color: COLORS.greyscale900 },
                    ]}
                >
                    Job Details
                </Text>
                <Text
                    style={[styles.description, { color: COLORS.grayscale700 }]}
                    numberOfLines={expanded ? undefined : 2}
                >
                    {jobData?.description}
                </Text>
                <TouchableOpacity onPress={toggleExpanded}>
                    <Text style={styles.viewBtn}>
                        {expanded ? 'View Less' : 'View More'}
                    </Text>
                </TouchableOpacity>
                <View
                    style={[
                        styles.separateLine,
                        {
                            marginVertical: 12,
                            height: 1,
                            backgroundColor: COLORS.grayscale100,
                        },
                    ]}
                />
                <View style={styles.container}>
                    <View style={styles.jobDetailsContainer}>
                        {[
                            {
                                label: 'Start Date',
                                value: formatDate(jobData.startDate),
                            },
                            {
                                label: 'End Date',
                                value: formatDate(jobData.endDate),
                            },
                            {
                                label: 'Start Time',
                                value: formatTime(jobData.startTime),
                            },
                            {
                                label: 'End Time',
                                value: formatTime(jobData.endTime),
                            },
                            { label: 'Last Clock Out', value: 'N/A' },
                            {
                                label: 'Duration',
                                value: `${jobData.estimatedDurationHours} Hr(s)`,
                            },
                        ].map((item, index) => (
                            <View key={index} style={styles.detailRow}>
                                <Text
                                    style={[
                                        styles.jobDetailLabel,
                                        { color: COLORS.greyscale900 },
                                    ]}
                                >
                                    {item.label}:
                                </Text>
                                <Text style={styles.detail}>{item.value}</Text>
                            </View>
                        ))}

                        <Text
                            style={[
                                styles.jobDetailLabel,
                                { color: COLORS.greyscale900, marginTop: 16 },
                            ]}
                        >
                            Equipments:
                        </Text>
                        {jobData.equipments && jobData.equipments.length > 0 ? (
                            jobData.equipments.map((equipment, index) => (
                                <View
                                    key={index}
                                    style={styles.equipmentContainer}
                                >
                                    <TouchableOpacity
                                        onPress={() =>
                                            toggleEquipmentVisibility(index)
                                        }
                                    >
                                        <Text style={styles.header}>
                                            Equipment {index + 1}{' '}
                                            {visibleEquipments[index]
                                                ? '▲'
                                                : '▼'}
                                        </Text>
                                    </TouchableOpacity>
                                    {visibleEquipments[index] && (
                                        <View>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Brand:
                                                </Text>{' '}
                                                {equipment.Brand}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Location:
                                                </Text>{' '}
                                                {equipment.EquipmentLocation}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Type:
                                                </Text>{' '}
                                                {equipment.EquipmentType}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Item Code:
                                                </Text>{' '}
                                                {equipment.ItemCode}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Item Name:
                                                </Text>{' '}
                                                {equipment.ItemName}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Model Series:
                                                </Text>{' '}
                                                {equipment.ModelSeries}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Notes:
                                                </Text>{' '}
                                                {equipment.Notes}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Serial No:
                                                </Text>{' '}
                                                {equipment.SerialNo}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Warranty Start Date:
                                                </Text>{' '}
                                                {formatDate(
                                                    equipment.WarrantyStartDate
                                                )}
                                            </Text>
                                            <Text style={styles.detail}>
                                                <Text
                                                    style={
                                                        styles.equipmentLabel
                                                    }
                                                >
                                                    Warranty End Date:
                                                </Text>{' '}
                                                {formatDate(
                                                    equipment.WarrantyEndDate
                                                )}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.detail}>
                                No Equipments Assigned
                            </Text>
                        )}

                        <View
                            style={[
                                styles.separateLine,
                                {
                                    marginVertical: 12,
                                    height: 1,
                                    backgroundColor: COLORS.grayscale100,
                                },
                            ]}
                        />
                        <Text style={styles.jobTitle}>Manage</Text>
                        <View style={styles.listItemContainer}>
                            <ListItem
                                icon={icons.bell}
                                label="Job Status"
                                value={selectedStatus || selectedJobStatus}
                                onPress={() => setShowPicker(!showPicker)}
                                showPicker={showPicker}
                                options={options}
                                onValueChange={(value) => {
                                    setSelectedStatus(value)
                                    setShowPicker(false)
                                }}
                            />
                            <ListItem
                                icon={icons.document2}
                                label="Task List"
                                onPress={() =>
                                    navigation.navigate('JobTasks', {
                                        jobNo: jobData.jobNo,
                                        workerId,
                                    })
                                }
                            />
                            <ListItem
                                icon={icons.location}
                                label="Job Location"
                                onPress={() =>
                                    navigation.navigate('JobLocation', {
                                        locationId: jobData.jobNo,
                                        workerId,
                                    })
                                }
                            />
                            <ListItem
                                icon={icons.image}
                                label="Pictures"
                                onPress={() =>
                                    navigation.navigate('JobsImages', {
                                        jobNo: jobData.jobNo,
                                        workerId,
                                    })
                                }
                            />
                            <ListItem
                                icon={icons.document}
                                label="Report"
                                onPress={() =>
                                    navigation.navigate('JobReport', {
                                        jobNo: jobData.jobNo,
                                        workerId,
                                    })
                                }
                            />

                            <ListItem
                                icon={icons.signature}
                                label="Technician Signature"
                                onPress={() =>
                                    navigation.navigate('JobSignature', {
                                        jobNo: jobData.jobNo,
                                        workerId,
                                    })
                                }
                            />
                            <ListItem
                                icon={icons.signature}
                                label="Customer Signature"
                                onPress={() =>
                                    navigation.navigate(
                                        'JobCustomerSignature',
                                        { jobNo: jobData.jobNo, workerId }
                                    )
                                }
                            />

                            {/* <ListItems
        icon={icons.infoCircle}
        label="Task List"
        onPress={() => console.log('Task List Click')}
        showPicker={false}
        options={[]}
        onValueChange={() => {}}
      />
      <ListItems
        icon={icons.chatOutline}
        label="Private Worker Msg"
        onPress={() => console.log('Private Worker Msg Click')}
        showPicker={false}
        options={[]}
        onValueChange={() => {}}
      />
      <ListItems
        icon={icons.chatBubble2}
        label="Public Customer Msg"
        onPress={() => console.log('Public Customer Msg')}
        showPicker={false}
        options={[]}
        onValueChange={() => {}}
      />
      <ListItems
        icon={icons.document2}
        label="Documents"
        onPress={() => console.log('Documents Click')}
        showPicker={false}
        options={[]}
        onValueChange={() => {}}
      /> */}
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <StatusBar hidden />
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
            </ScrollView>
            <View
                style={[
                    styles.bookBottomContainer,
                    {
                        backgroundColor: COLORS.white,
                        borderTopColor: COLORS.white,
                    },
                ]}
            >
                <Button
                    title={jobButtonTitle}
                    filled
                    style={styles.bookingBtn}
                    onPress={handleJobButtonClick}
                    disabled={!isJobLocationRecorded} // Disable button if job location is not recorded
                />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 100,
    },
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.grayscale100,
    },
    listItemContainer: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#ccc',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    iconContainer: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.primary,
    },
    listLabel: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: COLORS.black,
    },
    listValue: {
        fontSize: 16,
        color: COLORS.primary,
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.gray,
    },
    jobDetailsContainer: {
        padding: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    jobDetailLabel: {
        fontWeight: 'bold',
    },
    detail: {
        color: COLORS.greyscale700,
    },
    equipmentContainer: {
        marginTop: 8,
        marginBottom: 8,
        padding: 8,
        backgroundColor: COLORS.grayscale100,
        borderRadius: 4,
    },
    equipmentLabel: {
        fontWeight: 'bold',
    },
    headerContainer: {
        width: SIZES.width - 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 32,
        zIndex: 999,
        left: 16,
        right: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 10,
    },
    bellIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    pickerContainer: {
        flex: 1,
    },
    //   backIcon: {
    //     width: 24,
    //     height: 24,
    //     tintColor: COLORS.white
    //   },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: 'blue', // Change this to the color you want
        marginLeft: 10,
    },
    bookmarkIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white,
    },
    sendIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.white,
    },
    sendIconContainer: {
        marginLeft: 8,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contentContainer: {
        marginHorizontal: 16,
        paddingTop: 15,
    },
    estateName: {
        fontSize: 24,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 6,
    },
    jobTitle: {
        fontSize: 15,
        marginBottom: 1,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 6,
    },
    jobDetail: {
        fontSize: 15,
        marginBottom: 50,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 6,
    },
    categoryContainer: {
        backgroundColor: COLORS.tansparentPrimary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        borderRadius: 6,
        width: 80,
    },
    categoryName: {
        fontSize: 12,
        fontFamily: 'medium',
        color: COLORS.primary,
    },
    rating: {
        fontSize: 12,
        fontFamily: 'medium',
        color: COLORS.black,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    numReviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    viewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    viewItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    viewItemIcon: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.tansparentPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },
    viewIcon: {
        height: 20,
        width: 20,
        tintColor: COLORS.primary,
    },
    viewTitle: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.black,
        marginLeft: 12,
    },
    separateLine: {
        width: SIZES.width - 32,
        height: 1,
        backgroundColor: COLORS.grayscale100,
    },
    userInfoContainer: {
        width: SIZES.width - 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 6,
    },
    userImage: {
        width: 52,
        height: 52,
        borderRadius: 999,
    },
    userName: {
        fontSize: 16,
        fontFamily: 'semiBold',
        color: COLORS.black,
    },
    userPosition: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.grayscale700,
        marginTop: 3,
    },
    userInfoRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfoLeftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary,
    },
    phoneIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary,
    },
    viewSubtitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginVertical: 12,
    },
    description: {
        fontSize: 14,
        color: COLORS.grayscale700,
        fontFamily: 'regular',
    },
    viewBtn: {
        color: COLORS.primary,
        marginTop: 5,
        fontSize: 14,
        fontFamily: 'semiBold',
    },
    subItemContainer: {
        width: SIZES.width - 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    seeAll: {
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: 'semiBold',
    },
    coverImageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coverImage: {
        width: (SIZES.width - 32) / 3 - 9,
        height: (SIZES.width - 32) / 3 - 9,
        borderRadius: 16,
        zIndex: 999,
    },
    gradientImage: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: (SIZES.width - 32) / 3 - 9,
        height: (SIZES.width - 32) / 3 - 9,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numImage: {
        fontSize: 22,
        color: COLORS.white,
        fontFamily: 'bold',
    },
    eventItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.primary,
        marginRight: 8,
    },
    locationText: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.grayscale700,
    },

    locationMapContainer: {
        height: 226,
        width: '100%',
        borderRadius: 12,
        marginVertical: 16,
    },
    mapContainer: {
        ...StyleSheet.absoluteFillObject,
        flex: 1,
        borderRadius: 12,
        backgroundColor: COLORS.dark2,
    },
    viewMapContainer: {
        height: 50,
        backgroundColor: COLORS.gray,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: SIZES.width - 32,
        marginVertical: 16,
    },
    reviewLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starMiddleIcon: {
        height: 18,
        width: 18,
        tintColor: 'orange',
        marginRight: 8,
    },
    reviewTitle: {
        fontFamily: 'bold',
        color: COLORS.black,
        fontSize: 18,
    },
    seeAll: {
        color: COLORS.primary,
        fontFamily: 'semiBold',
        fontSize: 16,
    },
    bookBottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: SIZES.width,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 104,
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopRightRadius: 32,
        borderTopLeftRadius: 32,
        borderTopColor: COLORS.white,
        borderTopWidth: 1,
    },
    priceContainer: {
        flexDirection: 'column',
    },
    priceText: {
        fontFamily: 'regular',
        color: COLORS.grayscale700,
        fontSize: 14,
        marginBottom: 4,
    },
    priceDurationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontFamily: 'bold',
        color: COLORS.primary,
        fontSize: 26,
    },
    priceDuration: {
        fontFamily: 'regular',
        color: COLORS.grayscale700,
        fontSize: 16,
    },
    bookingBtn: {
        width: SIZES.width - 32,
    },
    separateLine: {
        width: SIZES.width - 32,
        height: 1,
        backgroundColor: COLORS.grayscale200,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomTitle: {
        fontSize: 24,
        fontFamily: 'semiBold',
        color: COLORS.black,
        textAlign: 'center',
        marginTop: 12,
    },
    socialContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 12,
        width: SIZES.width - 32,
    },
    eventName: {
        fontSize: 28,
        fontFamily: 'bold',
        color: COLORS.black,
        marginVertical: 12,
        marginLeft: 20,
    },
    eventDescContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    eventCategoryContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
    },
    eventCategory: {
        fontSize: 12,
        fontFamily: 'medium',
        color: COLORS.primary,
    },
    avatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    singleAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginLeft: 0,
    },
    attenderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    numAttenders: {
        fontSize: 14,
        fontFamily: 'medium',
        color: COLORS.greyscale900,
    },
    arrowRightIcon: {
        width: 16,
        height: 16,
        tintColor: COLORS.greyscale900,
        marginLeft: 4,
    },
    eventFeatureContainer: {
        flexDirection: 'row',
    },
    eventFeatureIconContainer: {
        width: 58,
        height: 58,
        borderRadius: 999,
        backgroundColor: COLORS.tansparentPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventFeatureIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.primary,
    },
    eventFeatureTextContainer: {
        marginLeft: 12,
    },
    eventDate: {
        fontSize: 18,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginVertical: 6,
    },
    eventTime: {
        fontSize: 15,
        fontFamily: 'regular',
        color: COLORS.greyscale700,
    },
    contactNo: {
        fontSize: 15,
        fontFamily: 'regular',
        color: COLORS.greyscale700,
    },
    miniActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        width: 180,
        height: 30,
        borderRadius: 16,
        marginTop: 12,
    },
    jobDetailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4, // Adjust as needed for spacing
    },
    ribbonContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 4,
    },
    ribbonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    miniIconContainer: {
        marginRight: 8,
        marginLeft: 12,
    },
    eventFeatureMiniIcon: {
        width: 12,
        height: 12,
        tintColor: COLORS.white,
    },
    miniIconText: {
        fontSize: 14,
        color: COLORS.white,
        fontFamily: 'semiBold',
    },
    followBtn: {
        width: 96,
        height: 36,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    followBtnText: {
        fontSize: 14,
        color: COLORS.white,
        fontFamily: 'semiBold',
    },
})

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 0.5,
        borderColor: 'gray',
        borderRadius: 8,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
    iconContainer: {
        top: 10,
        right: 12,
    },
})

export default JobDetails

// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// const JobDetails = ({ navigation, route }) => {
//   const { job } = route.params;

//   return (
// <View style={styles.container}>
//   <Text style={styles.title}>Job Details</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Job Number:</Text> #{job.jobNo}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Job Status:</Text> {job.jobStatus}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Job Name:</Text> {job.jobName}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Description:</Text> {job.description}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Contact:</Text> {job.phoneNumber}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Mobile:</Text> {job.mobilePhone}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Location:</Text> {job.locationName}</Text>
//   <Text style={styles.detail}><Text style={styles.bold}>Customer:</Text> {job.customerName}</Text>
// </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: 'white',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   detail: {
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   bold: {
//     fontWeight: 'bold',
//   },
// });

// export default JobDetails;
