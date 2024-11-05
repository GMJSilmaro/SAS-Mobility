import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Picker } from '@react-native-picker/picker' // Install if necessary
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const Completion = ({ navigation, route }) => {
    const [jobData, setJobData] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('')
    const jobNo = route?.params?.jobNo

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                if (!jobNo) {
                    console.log('No job number provided')
                    return
                }

                const jobRef = doc(db, 'jobs', jobNo)
                const jobSnap = await getDoc(jobRef)

                if (jobSnap.exists()) {
                    setJobData(jobSnap.data())
                } else {
                    console.log('Job document does not exist')
                }
            } catch (error) {
                console.error('Error fetching job data:', error)
            }
        }

        fetchJobData()
    }, [jobNo])

    const handleFinishJob = () => {
        if (!paymentMethod) {
            Alert.alert('Validation Error', 'Please select a payment method')
            return
        }

        // Additional validation for other required fields can go here

        navigation.navigate('Main', {
            workerId: route.params?.workerId,
        })
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Complete Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.summaryCard}>
                    <Icon name="check-circle" size={64} color="#4CAF50" />
                    <Text style={styles.summaryTitle}>Service Completed</Text>
                    <Text style={styles.summaryText}>
                        All tasks have been completed successfully
                    </Text>
                </View>

                {jobData && (
                    <View style={styles.jobSummary}>
                        <Text style={styles.summaryTitle}>Job Summary</Text>
                        <Text style={styles.jobText}>Job Number: {jobNo}</Text>
                        <Text style={styles.jobText}>
                            Description: {jobData.jobDescription || 'N/A'}
                        </Text>
                        <Text style={styles.jobText}>
                            Status: {jobData.jobStatus || 'N/A'}
                        </Text>
                        <Text style={styles.jobText}>
                            Assigned Workers:{' '}
                            {jobData.assignedWorkers?.join(', ') || 'N/A'}
                        </Text>
                    </View>
                )}

                <View style={styles.dropdownContainer}>
                    <Text style={styles.label}>Payment Method:</Text>
                    <Picker
                        selectedValue={paymentMethod}
                        onValueChange={(itemValue) =>
                            setPaymentMethod(itemValue)
                        }
                        style={styles.picker}
                    >
                        <Picker.Item label="Select Payment Method" value="" />
                        <Picker.Item label="Credit Card" value="Credit Card" />
                        <Picker.Item label="Cash" value="Cash" />
                        <Picker.Item
                            label="Bank Transfer"
                            value="Bank Transfer"
                        />
                    </Picker>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="camera-alt" size={24} color="#4a90e2" />
                        <Text style={styles.actionText}>Add Photos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="note-add" size={24} color="#4a90e2" />
                        <Text style={styles.actionText}>Add Notes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Icon name="person" size={24} color="#4a90e2" />
                        <Text style={styles.actionText}>
                            Customer Signature
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinishJob}
            >
                <Text style={styles.buttonText}>Finish Job</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#4a90e2',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    summaryCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 8,
        alignItems: 'center',
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    summaryText: {
        color: '#666',
        textAlign: 'center',
    },
    jobSummary: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        elevation: 2,
    },
    jobText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    dropdownContainer: {
        marginTop: 16,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    picker: {
        height: 50,
        color: '#333',
    },
    actionsContainer: {
        marginTop: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        elevation: 2,
    },
    actionText: {
        marginLeft: 16,
        fontSize: 16,
        color: '#4a90e2',
    },
    finishButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

export default Completion
