import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Picker } from '@react-native-picker/picker' // Install if necessary
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const Completion = ({ navigation, route }) => {
    const [jobData, setJobData] = useState(null)
    // const [paymentMethod, setPaymentMethod] = useState('')
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

    const handleFinishJob = async () => {
        const workerId = route?.params?.workerId

        try {
            const docRef = doc(db, 'jobs', jobNo)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const jobData = docSnap.data()
                const assignedWorkers = jobData.assignedWorkers.map(
                    (worker) => {
                        if (worker.workerId === workerId) {
                            return { ...worker, overallStatus: 'Completed' }
                        }
                        return worker
                    }
                )

                // Check if all workers have "Completed" status
                const allCompleted = assignedWorkers.every(
                    (worker) => worker.overallStatus === 'Completed'
                )

                const updates = {
                    assignedWorkers,
                }

                // Update jobStatus to "Completed" if all workers are done
                if (allCompleted) {
                    updates.jobStatus = 'Job Complete'
                }

                await updateDoc(docRef, updates)

                console.log(
                    'Worker status updated and job status checked successfully.'
                )
            } else {
                console.error('Job document not found.')
            }
        } catch (error) {
            console.error('Error finishing job:', error)
        }

        // Navigate back to 'Main'
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
                            Status: {jobData.jobStatus || 'N/A'}
                        </Text>
                        <Text style={styles.jobText}>
                            Assigned Workers:{' '}
                            {jobData.assignedWorkers
                                ?.map((worker) => worker.workerId)
                                .join(', ') || 'N/A'}
                        </Text>

                        {jobData.photos && jobData.photos.length > 0 && (
                            <View>
                                <Text style={styles.summaryTitle}>Photos</Text>
                                {jobData.photos.map((photo, index) => {
                                    const photoUri =
                                        typeof photo === 'string'
                                            ? photo
                                            : photo?.uri // Check if photo is a string
                                    return photoUri ? (
                                        <Image
                                            key={index}
                                            source={{ uri: photoUri }}
                                            style={styles.photo}
                                        />
                                    ) : (
                                        <Text
                                            key={index}
                                            style={styles.errorText}
                                        >
                                            Invalid photo URL
                                        </Text>
                                    )
                                })}
                            </View>
                        )}

                        {jobData.customerSignature && (
                            <View style={styles.signatureContainer}>
                                <Text style={styles.summaryTitle}>
                                    Customer Signature
                                </Text>
                                <Image
                                    source={{
                                        uri: jobData.customerSignature
                                            .signatureURL,
                                    }}
                                    style={styles.signature}
                                />
                                <Text style={styles.signatureText}>
                                    Signed by:{' '}
                                    {jobData.customerSignature.signedBy}
                                </Text>
                                <Text style={styles.signatureText}>
                                    Timestamp:{' '}
                                    {
                                        jobData.customerSignature
                                            .signatureTimestamp
                                    }
                                </Text>
                            </View>
                        )}

                        {jobData.workerSignature && (
                            <View style={styles.signatureContainer}>
                                <Text style={styles.summaryTitle}>
                                    Technician Signature
                                </Text>
                                <Image
                                    source={{
                                        uri: jobData.workerSignature
                                            .signatureURL,
                                    }}
                                    style={styles.signature}
                                />
                                <Text style={styles.signatureText}>
                                    Signed by:{' '}
                                    {jobData.workerSignature.signedBy}
                                </Text>
                                <Text style={styles.signatureText}>
                                    Timestamp:{' '}
                                    {jobData.workerSignature.signatureTimestamp}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* <View style={styles.dropdownContainer}>
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
                </View> */}

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
                style={[
                    styles.finishButton,
                    jobData?.jobStatus === 'Job Complete' &&
                        styles.disabledButton,
                ]}
                onPress={
                    jobData?.jobStatus === 'Job Complete'
                        ? () => navigation.navigate('Home')
                        : handleFinishJob
                }
                disabled={false}
            >
                <Text style={styles.buttonText}>
                    {jobData?.jobStatus === 'Job Complete'
                        ? 'Go Back to Calendar'
                        : 'Finish Job'}
                </Text>
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
        fontSize: 18,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#7BA5F3',
    },
    photo: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginVertical: 8,
    },
    signatureContainer: {
        marginTop: 16,
    },
    signature: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginVertical: 8,
    },
    signatureText: {
        fontSize: 16,
        color: '#333',
    },
})

export default Completion
