import React, { useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Alert,
    Image,
    ScrollView,
} from 'react-native'
import Header from '../components/Header'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Dropdown } from 'react-native-element-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import Button from '../components/Button'
import { doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import * as ImagePicker from 'expo-image-picker'

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const issueData = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
]

const rescheduledData = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
]

const JobsReport = ({ navigation, route }) => {
    const { jobNo, workerId } = route.params
    const [issueValue, setIssueValue] = useState(null)
    const [rescheduledValue, setRescheduledValue] = useState(null)
    const [isIssueFocus, setIsIssueFocus] = useState(false)
    const [isRescheduledFocus, setIsRescheduledFocus] = useState(false)
    const [additionalInfo, setAdditionalInfo] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [rescheduledDate, setRescheduledDate] = useState(new Date())
    const [dateSelected, setDateSelected] = useState(false)
    const [photos, setPhotos] = useState([])

    const handleSubmit = async () => {
        if (!issueValue || !rescheduledValue) {
            Alert.alert('Error', 'Please fill in all fields before submitting.')
            return
        }

        const workerReport = {
            issue: issueValue,
            additionalInfo,
            rescheduled: rescheduledValue,
            rescheduledDate: dateSelected
                ? format(rescheduledDate, 'yyyy-MM-dd')
                : null,
            photos, // Add photos (download URLs) to the report
        }

        console.log('Submitting report:', workerReport)

        try {
            const docRef = doc(
                db,
                'jobs',
                jobNo,
                'jobReports',
                `JS-${workerId}`
            )
            const docSnap = await getDoc(docRef)

            // Check if the document exists
            if (docSnap.exists()) {
                // If a report exists, update it
                await updateDoc(docRef, {
                    workerReport: arrayUnion(workerReport), // Add the new report to the existing array
                })
                Alert.alert('Success', 'Job report updated successfully.')
                console.log('Job report updated successfully.')
            } else {
                // Document doesn't exist, create it
                await setDoc(docRef, {
                    workerReport: [workerReport], // Create a new report array
                })
                Alert.alert('Success', 'Job report submitted successfully.')
                console.log('Job report submitted successfully.')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit job report.')
            console.error('Failed to submit job report:', error)
        }
    }

    const uploadPhoto = async (uri) => {
        const response = await fetch(uri)
        const blob = await response.blob()
        const storageRef = ref(
            getStorage(),
            `jobReports/${jobNo}/${Date.now()}_${workerId}`
        )
        await uploadBytes(storageRef, blob)
        return await getDownloadURL(storageRef)
    }

    const takePhoto = async () => {
        // Request permission for camera access
        const permissionResult =
            await ImagePicker.requestCameraPermissionsAsync()
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access the camera is required!')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            const downloadURL = await uploadPhoto(result.assets[0].uri)
            setPhotos([...photos, downloadURL]) // Add the new photo URL to the state
        }
    }

    const pickImage = async () => {
        // Request permission for media library access
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera roll is required!')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        })

        if (!result.canceled) {
            const downloadURL = await uploadPhoto(result.assets[0].uri)
            setPhotos([...photos, downloadURL]) // Add the new photo URL to the state
        }
    }

    return (
        <View style={styles.container}>
            <Header title="Job Report" />
            <ScrollView style={styles.container}>
                <Text style={styles.staticLabel}>Any issue?</Text>
                <Dropdown
                    style={[
                        styles.dropdown,
                        isIssueFocus && { borderColor: 'blue' },
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={issueData}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={
                        !isIssueFocus ? 'Do you have any issue?' : '...'
                    }
                    value={issueValue}
                    onFocus={() => setIsIssueFocus(true)}
                    onBlur={() => setIsIssueFocus(false)}
                    onChange={(item) => {
                        setIssueValue(item.value)
                        setIsIssueFocus(false)
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styles.icon}
                            color={isIssueFocus ? 'blue' : 'black'}
                            name="Safety"
                            size={20}
                        />
                    )}
                />
                {issueValue === 'yes' && (
                    <TextInput
                        style={styles.textInput}
                        placeholder="Please describe the issue"
                        value={additionalInfo}
                        onChangeText={setAdditionalInfo}
                    />
                )}

                <Text style={styles.staticLabel}>Re-scheduled?</Text>
                <Dropdown
                    style={[
                        styles.dropdown,
                        isRescheduledFocus && { borderColor: 'blue' },
                    ]}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={rescheduledData}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={
                        !isRescheduledFocus
                            ? 'Do you want to reschedule?'
                            : '...'
                    }
                    value={rescheduledValue}
                    onFocus={() => setIsRescheduledFocus(true)}
                    onBlur={() => setIsRescheduledFocus(false)}
                    onChange={(item) => {
                        setRescheduledValue(item.value)
                        setIsRescheduledFocus(false)
                        if (item.value === 'yes') {
                            setShowDatePicker(true)
                        }
                    }}
                    renderLeftIcon={() => (
                        <AntDesign
                            style={styles.icon}
                            color={isRescheduledFocus ? 'blue' : 'black'}
                            name="calendar"
                            size={20}
                        />
                    )}
                />
                {showDatePicker && (
                    <DateTimePicker
                        value={rescheduledDate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            if (date !== undefined) {
                                setRescheduledDate(date)
                                setDateSelected(true)
                            }
                            setShowDatePicker(false)
                        }}
                    />
                )}
                {rescheduledValue === 'yes' && dateSelected && (
                    <TextInput
                        style={styles.textInput}
                        placeholder="Additional info for the selected date"
                        value={format(rescheduledDate, 'yyyy-MM-dd')}
                        editable={false}
                    />
                )}

                {/* Buttons for adding images */}
                <View style={styles.photoContainer}>
                    <Button title="Choose Photo" onPress={pickImage} />
                    <Button title="Take Photo" onPress={takePhoto} />
                </View>

                {/* Display selected images */}
                <View style={styles.imagesContainer}>
                    {photos.map((uri, index) => (
                        <Image
                            key={index}
                            source={{ uri }}
                            style={styles.image}
                        />
                    ))}
                </View>
            </ScrollView>
            <Button
                title="Submit"
                onPress={handleSubmit}
                filled
                style={styles.continueBtn}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 16,
    },
    staticLabel: {
        marginBottom: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    continueBtn: {
        marginTop: 16,
    },
    photoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        margin: 5,
    },
})

export default JobsReport
