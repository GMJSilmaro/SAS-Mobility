import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native'
import Header from '../components/Header'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Dropdown } from 'react-native-element-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'
import Button from '../components/Button'
import { doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

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
        }

        console.log('Submitting report:', workerReport)

        try {
            const currentDate = format(new Date(), 'MM-dd-yyyy') // Corrected format
            const docRef = doc(
                db,
                'workerAttendance',
                workerId,
                currentDate,
                'workerStatus',
                jobNo,
                'JobStatus'
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

    return (
        <View style={styles.container}>
            <Header title="Job Report" />
            <View style={styles.container}>
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
            </View>
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
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    textInput: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    continueBtn: {
        marginTop: 20,
    },
})

export default JobsReport
