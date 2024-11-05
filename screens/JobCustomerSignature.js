import React, { useRef, useState, useEffect } from 'react'
import {
    View,
    Text,
    StyleSheet,
    Button,
    Alert,
    Image,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native'
import Signature from 'react-native-signature-canvas'
import Header from '../components/Header'
import { COLORS } from '../constants'
import { storage, db } from '../firebase' // Ensure this import is correct
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import * as FileSystem from 'expo-file-system'
import moment from 'moment'

const JobCustomerSignature = ({ navigation, route }) => {
    const { jobNo, workerId } = route.params
    const signatureRef = useRef(null)
    const [savedSignature, setSavedSignature] = useState(null)
    const [loading, setLoading] = useState(false)

    // Fetch the customer's signature from Firestore when the component mounts
    useEffect(() => {
        const fetchCustomerSignature = async () => {
            try {
                const currentDate = moment().format('MM-DD-YYYY')
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
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    if (data.customerSignature) {
                        setSavedSignature(data.customerSignature)
                    }
                } else {
                    console.log(
                        'No customer signature document found for this job.'
                    )
                }
            } catch (error) {
                console.error('Error fetching customer signature:', error)
            }
        }

        fetchCustomerSignature()
    }, [jobNo, workerId])

    const handleSignature = async (signature) => {
        setLoading(true)
        try {
            console.log('Signature Data URL:', signature)

            if (!signature.startsWith('data:image/png;base64,')) {
                throw new Error('Invalid signature data URL format')
            }

            const base64Signature = signature.split(',')[1]
            const fileUri =
                FileSystem.documentDirectory +
                `${jobNo}-${workerId}-Customer.png`
            await FileSystem.writeAsStringAsync(fileUri, base64Signature, {
                encoding: FileSystem.EncodingType.Base64,
            })

            console.log('File URI:', fileUri)

            // Ensure the file exists and is accessible
            const fileInfo = await FileSystem.getInfoAsync(fileUri)
            if (!fileInfo.exists) {
                throw new Error('File not found')
            }

            // Read the file as a blob
            const blob = await fetch(fileUri).then((res) => res.blob())

            // Upload the blob to Firebase Storage
            const signatureStorageRef = storageRef(
                storage,
                `jobSignature/${jobNo}-${workerId}-Customer.png`
            )
            await uploadBytes(signatureStorageRef, blob)

            // Get the download URL of the uploaded signature
            const downloadURL = await getDownloadURL(signatureStorageRef)
            console.log('Download URL:', downloadURL)

            // Get the current date formatted as MM-DD-YYYY
            const currentDate = moment().format('MM-DD-YYYY')

            // Update Firestore document with the download URL
            const docRef = doc(db, 'jobs', jobNo)
            await updateDoc(docRef, {
                customerSignature: {
                    signatureTimestamp: new Date().toISOString,
                    signatureURL: downloadURL,
                    signedBy: 'Customer Name',
                },
            })

            setSavedSignature(downloadURL)
            Alert.alert('Success', 'Signature uploaded and saved successfully.')
            console.log('Job report submitted successfully.')
        } catch (error) {
            console.error('Failed to upload and save signature:', error)
            Alert.alert(
                'Error',
                `Failed to upload and save signature: ${error.message}`
            )
        } finally {
            setLoading(false)
        }
    }

    const handleClear = () => {
        signatureRef.current.clearSignature()
        setSavedSignature(null)
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Customer Signature" />
            <View style={styles.signatureWrapper}>
                <Signature
                    ref={signatureRef}
                    onOK={handleSignature}
                    onEmpty={() => Alert.alert('Please provide a signature')}
                    descriptionText="Sign"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={styles.signature}
                />
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title="Clear Signature"
                    onPress={handleClear}
                    color={COLORS.primary}
                />
            </View>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
            {savedSignature && !loading && (
                <View style={styles.savedSignatureContainer}>
                    <Text style={styles.savedSignatureTitle}>
                        Saved Signature:
                    </Text>
                    <Image
                        source={{ uri: savedSignature }}
                        style={styles.savedSignatureImage}
                        resizeMode="contain"
                    />
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    signatureWrapper: {
        flex: 1,
    },
    signature: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderColor: '#000033',
        borderWidth: 1,
    },
    buttonContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    savedSignatureContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginTop: 20,
    },
    savedSignatureTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    savedSignatureImage: {
        width: 300,
        height: 100, // Adjust size according to your needs
    },
})

export default JobCustomerSignature
