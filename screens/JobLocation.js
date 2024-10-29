import React, { useState, useEffect } from 'react'
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Alert,
    Animated,
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { db } from '../firebase'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { COLORS } from '../constants'
import axios from 'axios'
import * as Location from 'expo-location'
import Header from '../components/Header'
import polyline from '@mapbox/polyline'
import moment from 'moment'
import { GOOGLE_MAPS_API_KEY } from '@env'

const getCoordinates = async (address, apiKey) => {
    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
    if (response.data.status === 'OK') {
        const { lat, lng } = response.data.results[0].geometry.location
        return { latitude: lat, longitude: lng }
    } else {
        throw new Error('Unable to geocode address')
    }
}

const JobLocation = ({ route, navigation }) => {
    const { locationId, workerId } = route.params
    console.log(workerId)
    const [jobData, setJobData] = useState(null)
    const [origin, setOrigin] = useState(null)
    const [destination, setDestination] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [polylinePoints, setPolylinePoints] = useState([])
    const [polylineVisible, setPolylineVisible] = useState(false)
    const [animationValue] = useState(new Animated.Value(0))
    const [distance, setDistance] = useState(null)
    const [duration, setDuration] = useState(null)
    const apiKey = GOOGLE_MAPS_API_KEY

    useEffect(() => {
        const checkPermissions = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Permission to access location is required to use this feature.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                )
                return
            }
        }

        checkPermissions()
    }, [navigation])

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const locationDoc = await getDoc(doc(db, 'jobs', locationId))
                if (locationDoc.exists()) {
                    const data = locationDoc.data()
                    setJobData(data)
                    const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`
                    const coordinates = await getCoordinates(address, apiKey)
                    setDestination(coordinates)
                } else {
                    setError('No such document!')
                }
            } catch (error) {
                setError('Error fetching document')
                console.error('Error fetching document:', error)
            } finally {
                setLoading(false)
            }
        }

        if (locationId) {
            fetchLocation()
        }
    }, [locationId, apiKey])

    const saveDirectionData = async (
        workerId,
        currentDate,
        jobNo,
        origin,
        destination,
        distance,
        duration
    ) => {
        try {
            // Define the path for the document
            const docRef = doc(
                db,
                `workerAttendance/${workerId}/${currentDate}/workerStatus/${jobNo}/JobStatus`
            )

            // Save the data
            await setDoc(docRef, {
                origin,
                destination,
                distance,
                duration,
                timestamp: new Date(),
            })

            console.log('Direction data saved successfully!')
        } catch (error) {
            console.error('Error saving direction data:', error)
            throw new Error('Unable to save direction data')
        }
    }

    useEffect(() => {
        const fetchExistingData = async () => {
            try {
                const docRef = doc(
                    db,
                    'workerStatus',
                    `${locationId}-${workerId}`
                )
                const unsub = onSnapshot(docRef, async (doc) => {
                    if (doc.exists()) {
                        const data = doc.data()
                        setOrigin(data.origin)
                        setDestination(data.destination)
                        setDistance(data.distance)
                        setDuration(data.duration)
                        setPolylineVisible(true)

                        const directions = await getDirections(
                            data.origin,
                            data.destination
                        )
                        if (directions) {
                            const decodedPoints = polyline.decode(
                                directions.points
                            )
                            const polylineCoordinates = decodedPoints.map(
                                (point) => ({
                                    latitude: point[0],
                                    longitude: point[1],
                                })
                            )
                            setPolylinePoints(polylineCoordinates)
                        }
                    }
                })

                return () => unsub()
            } catch (error) {
                console.error('Error fetching existing direction data:', error)
            }
        }

        if (locationId && workerId) {
            fetchExistingData()
        }
    }, [locationId, workerId])

    const handleGetDirection = async () => {
        if (!jobData || !jobData.assignedWorkers.includes(workerId)) {
            Alert.alert('Error', 'You are not assigned to this job')
            return
        }

        // Assuming jobNo is part of jobData
        const jobNo = jobData.jobNo // Get the jobNo from jobData

        try {
            // Get the current date in MM-DD-YYYY format
            const currentDate = moment().format('MM-DD-YYYY')

            // Check if data already exists
            const docRef = doc(
                db,
                `workerAttendance/${workerId}/${currentDate}/workerStatus/${jobNo}/JobStatus`
            )
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                Alert.alert('Information', 'Job location is already recorded.')
                return
            }

            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied')
                return
            }

            let userLocation = await Location.getCurrentPositionAsync({})
            const { latitude, longitude } = userLocation.coords
            // const origin = { latitude, longitude }
            const origin = {
                latitude: 3.1501888510212197,
                longitude: 101.74421351418829,
            }

            if (!destination) {
                Alert.alert('Error', 'Destination location not found')
                return
            }

            console.log('Origin:', origin)
            console.log('Destination:', destination)

            const directions = await getDirections(origin, destination)
            if (directions) {
                const decodedPoints = polyline.decode(directions.points)
                const polylineCoordinates = decodedPoints.map((point) => ({
                    latitude: point[0],
                    longitude: point[1],
                }))
                setPolylinePoints(polylineCoordinates)
                setPolylineVisible(true)
                setDistance(directions.distance)
                setDuration(directions.duration)
                console.log('Directions fetched successfully')
                animatePolyline()

                // Save direction data to Firestore
                await saveDirectionData(
                    workerId,
                    currentDate,
                    jobNo,
                    origin,
                    destination,
                    directions.distance,
                    directions.duration
                )
            }
        } catch (error) {
            console.error('Error getting directions:', error)
            Alert.alert('Error', 'Error getting directions')
        }
    }

    const getDirections = async (origin, destination) => {
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
            )

            if (response.data.status === 'OK') {
                const route = response.data.routes[0]
                console.log('Directions:', response.data)
                return {
                    points: route.overview_polyline.points,
                    distance: route.legs[0].distance.text,
                    duration: route.legs[0].duration.text,
                }
            } else {
                console.error('Directions API error:', response.data)
                Alert.alert(
                    'Error',
                    `Directions API error: ${response.data.status}`
                )
                throw new Error('Unable to fetch directions')
            }
        } catch (error) {
            console.error('Axios error:', error)
            throw new Error('Unable to fetch directions')
        }
    }

    const animatePolyline = () => {
        Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
        }).start()
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Loading...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>{error}</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Get Location" />
            <View style={styles.mapWrapper}>
                <MapView
                    style={styles.mapContainer}
                    initialRegion={{
                        latitude: destination ? destination.latitude : 0,
                        longitude: destination ? destination.longitude : 0,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {origin && (
                        <Marker
                            coordinate={origin}
                            title="Your Location"
                            description="Current Location"
                        />
                    )}
                    {destination && (
                        <Marker
                            coordinate={destination}
                            title="Destination"
                            description="Job Location"
                        />
                    )}
                    {polylineVisible && (
                        <Polyline
                            coordinates={polylinePoints}
                            strokeWidth={4}
                            strokeColor="blue"
                        />
                    )}
                </MapView>
                {distance && duration && (
                    <View style={styles.infoContainer}>
                        <Text>Distance: {distance}</Text>
                        <Text>Duration: {duration}</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.directionButton}
                    onPress={handleGetDirection}
                >
                    <Text style={styles.buttonText}>Job Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapWrapper: {
        flex: 1,
    },
    directionButton: {
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: [{ translateX: -75 }], // Adjusted translateX value
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: 150, // Added width to ensure consistent centering
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
    },
    infoContainer: {
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: [{ translateX: -100 }], // Adjusted translateX value
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 10,
        marginBottom: 5,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 200, // Added width to ensure consistent centering
    },
})

export default JobLocation

// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { db } from '../firebase';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { COLORS, SIZES, FONTS } from '../constants';
// import axios from 'axios';
// import * as Location from 'expo-location';
// import Header from '../components/Header';
// import polyline from '@mapbox/polyline';
// import { GOOGLE_MAPS_API_KEY } from '@env';

// const getCoordinates = async (address, apiKey) => {
//   const response = await axios.get(
//     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
//   );
//   if (response.data.status === 'OK') {
//     const { lat, lng } = response.data.results[0].geometry.location;
//     return { latitude: lat, longitude: lng };
//   } else {
//     throw new Error('Unable to geocode address');
//   }
// };

// const JobLocation = ({ route, navigation }) => {
//   const { locationId, workerId } = route.params;
//   console.log(workerId);
//   const [jobData, setJobData] = useState(null);
//   const [origin, setOrigin] = useState(null);
//   const [destination, setDestination] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [polylinePoints, setPolylinePoints] = useState([]);
//   const [polylineVisible, setPolylineVisible] = useState(false);
//   const [animationValue] = useState(new Animated.Value(0));
//   const [distance, setDistance] = useState(null);
//   const [duration, setDuration] = useState(null);
//   const apiKey = GOOGLE_MAPS_API_KEY;

//   useEffect(() => {
//     const checkPermissions = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert(
//           'Permission Required',
//           'Permission to access location is required to use this feature.',
//           [{ text: 'OK', onPress: () => navigation.goBack() }]
//         );
//         return;
//       }
//     };

//     checkPermissions();
//   }, [navigation]);

//   useEffect(() => {
//     const fetchLocation = async () => {
//       try {
//         const locationDoc = await getDoc(doc(db, 'jobs', locationId));
//         if (locationDoc.exists()) {
//           const data = locationDoc.data();
//           setJobData(data);
//           const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`;
//           const coordinates = await getCoordinates(address, apiKey);
//           setDestination(coordinates);
//         } else {
//           setError('No such document!');
//         }
//       } catch (error) {
//         setError('Error fetching document');
//         console.error('Error fetching document:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (locationId) {
//       fetchLocation();
//     }
//   }, [locationId, apiKey]);

//   const saveDirectionData = async (jobId, workerId, origin, destination, distance, duration) => {
//     Alert.alert('Success', 'Job location has been successfully recorded.');
//     try {
//       const docRef = doc(db, 'workerStatus', `${jobId}-${workerId}`);
//       await setDoc(docRef, {
//         jobId,
//         workerId,
//         origin,
//         destination,
//         distance,
//         duration,
//         timestamp: new Date()
//       });
//       console.log('Direction data saved successfully');

//     } catch (error) {
//       console.error('Error saving direction data:', error);
//       Alert.alert('Error', 'Failed to save direction data');
//     }
//   };

//   useEffect(() => {
//     const fetchExistingData = async () => {
//       try {
//         const docRef = doc(db, 'workerStatus', `${locationId}-${workerId}`);
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           setOrigin(data.origin);
//           setDestination(data.destination);
//           setDistance(data.distance);
//           setDuration(data.duration);
//           setPolylineVisible(true);

//           const directions = await getDirections(data.origin, data.destination);
//           if (directions) {
//             const decodedPoints = polyline.decode(directions.points);
//             const polylineCoordinates = decodedPoints.map(point => ({
//               latitude: point[0],
//               longitude: point[1],
//             }));
//             setPolylinePoints(polylineCoordinates);
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching existing direction data:', error);
//       }
//     };

//     if (locationId && workerId) {
//       fetchExistingData();
//     }
//   }, [locationId, workerId]);

// const handleGetDirection = async () => {
//   if (!jobData || !jobData.assignedWorkers.includes(workerId)) {
//     Alert.alert('Error', 'You are not assigned to this job');
//     return;
//   }

//   try {
//     // Check if data already exists
//     const docRef = doc(db, 'workerStatus', `${locationId}-${workerId}`);
//     const docSnap = await getDoc(docRef);
//     if (docSnap.exists()) {
//       Alert.alert('Information', 'Job location is already recorded.');
//       return;
//     }

//     let { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission to access location was denied');
//       return;
//     }

//     let userLocation = await Location.getCurrentPositionAsync({});
//     const { latitude, longitude } = userLocation.coords;
//     // const origin = { latitude, longitude };
//     const origin = { latitude: 3.1501888510212197, longitude: 101.74421351418829 };
//     setOrigin(origin);

//     if (!destination) {
//       Alert.alert('Error', 'Destination location not found');
//       return;
//     }

//     console.log('Origin:', origin);
//     console.log('Destination:', destination);

//     const directions = await getDirections(origin, destination);
//     if (directions) {
//       const decodedPoints = polyline.decode(directions.points);
//       const polylineCoordinates = decodedPoints.map(point => ({
//         latitude: point[0],
//         longitude: point[1],
//       }));
//       setPolylinePoints(polylineCoordinates);
//       setPolylineVisible(true);
//       setDistance(directions.distance);
//       setDuration(directions.duration);
//       console.log('Directions fetched successfully');
//       animatePolyline();

//       // Save direction data to Firestore
//       await saveDirectionData(locationId, workerId, origin, destination, directions.distance, directions.duration);
//     }
//   } catch (error) {
//     console.error('Error getting directions:', error);
//     Alert.alert('Error', 'Error getting directions');
//   }
// };

//   const getDirections = async (origin, destination) => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
//       );

//       if (response.data.status === 'OK') {
//         const route = response.data.routes[0];
//         console.log('Directions:', response.data);
//         return {
//           points: route.overview_polyline.points,
//           distance: route.legs[0].distance.text,
//           duration: route.legs[0].duration.text,
//         };
//       } else {
//         console.error('Directions API error:', response.data);
//         Alert.alert('Error', `Directions API error: ${response.data.status}`);
//         throw new Error('Unable to fetch directions');
//       }
//     } catch (error) {
//       console.error('Axios error:', error);
//       throw new Error('Unable to fetch directions');
//     }
//   };

//   const animatePolyline = () => {
//     Animated.timing(animationValue, {
//       toValue: 1,
//       duration: 2000,
//       useNativeDriver: true,
//     }).start();
//   };

//   if (loading) {
//     return <View style={styles.centered}><Text>Loading...</Text></View>;
//   }

//   if (error) {
//     return <View style={styles.centered}><Text>{error}</Text></View>;
//   }

//   return (
//     <View style={styles.container}>
//       <Header title="Get Location" />
//       <View style={styles.mapWrapper}>
//         <MapView
//           style={styles.mapContainer}
//           initialRegion={{
//             latitude: destination ? destination.latitude : 0,
//             longitude: destination ? destination.longitude : 0,
//             latitudeDelta: 0.0922,
//             longitudeDelta: 0.0421,
//           }}>
//           {origin && (
//             <Marker
//               coordinate={origin}
//               title="Your Location"
//               description="Current Location"
//             />
//           )}
//           {destination && (
//             <Marker
//               coordinate={destination}
//               title="Destination"
//               description="Job Location"
//             />
//           )}
//           {polylineVisible && (
//             <Polyline
//               coordinates={polylinePoints}
//               strokeWidth={4}
//               strokeColor="blue"
//             />
//           )}
//         </MapView>
//         {distance && duration && (
//           <View style={styles.infoContainer}>
//             <Text>Distance: {distance}</Text>
//             <Text>Duration: {duration}</Text>
//           </View>
//         )}
//         <TouchableOpacity style={styles.directionButton} onPress={handleGetDirection}>
//             <Text style={styles.buttonText}>Job Location</Text>
//           </TouchableOpacity>
//         {/* {!polylineVisible && (

//         )} */}
//       </View>
//     </View>

//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   mapWrapper: {
//     flex: 1,
//   },
//   directionButton: {
//     position: 'absolute',
//     bottom: 20,
//     left: '50%',
//     transform: [{ translateX: -75 }], // Adjusted translateX value
//     backgroundColor: COLORS.primary,
//     padding: 15,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 150, // Added width to ensure consistent centering
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontSize: 18,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mapContainer: {
//     flex: 1,
//   },
//   infoContainer: {
//     position: 'absolute',
//     bottom: 80,
//     left: '50%',
//     transform: [{ translateX: -100 }], // Adjusted translateX value
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     padding: 10,
//     marginBottom: 5,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 200, // Added width to ensure consistent centering
//   },
// });

// export default JobLocation;

// // import React, { useState, useEffect } from 'react';
// // import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
// // import MapView, { Marker, Polyline } from 'react-native-maps';
// // import { db } from '../firebase';
// // import { doc, getDoc } from 'firebase/firestore';
// // import { COLORS, SIZES, FONTS } from '../constants';
// // import axios from 'axios';
// // import * as Location from 'expo-location';
// // import Header from '../components/Header';
// // import polyline from '@mapbox/polyline';
// // import { GOOGLE_MAPS_API_KEY } from '@env';

// // const JobLocation = ({ route, navigation }) => {
// //   const { locationId } = route.params;
// //   const [origin, setOrigin] = useState(null);
// //   const [destination, setDestination] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [polylinePoints, setPolylinePoints] = useState([]);
// //   const [polylineVisible, setPolylineVisible] = useState(false);
// //   const [animationValue] = useState(new Animated.Value(0));
// //   const [distance, setDistance] = useState(null);
// //   const [duration, setDuration] = useState(null);
// //   const apiKey = GOOGLE_MAPS_API_KEY;
// //   const [jobData, setJobData] = useState(null);

// //   useEffect(() => {
// //     const checkPermissions = async () => {
// //       let { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== 'granted') {
// //         Alert.alert(
// //           'Permission Required',
// //           'Permission to access location is required to use this feature.',
// //           [{ text: 'OK', onPress: () => navigation.goBack() }]
// //         );
// //         return;
// //       }
// //     };

// //     checkPermissions();
// //   }, [navigation]);

// //   useEffect(() => {
// //     const fetchLocation = async () => {
// //         try {
// //             const locationDoc = await getDoc(doc(db, 'jobs', locationId));
// //             if (locationDoc.exists()) {
// //                 const data = locationDoc.data();
// //                 setJobData(data);
// //                 const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`;
// //                 const coordinates = await getCoordinates(address);
// //                 setDestination(coordinates);
// //             } else {
// //                 setError('No such document!');
// //             }
// //         } catch (error) {
// //             setError('Error fetching document');
// //             console.error('Error fetching document:', error);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     if (locationId) {
// //         fetchLocation();
// //     }
// // }, [locationId]);

// //   // useEffect(() => {
// //   //   const fetchLocation = async () => {
// //   //     try {
// //   //       const locationDoc = await getDoc(doc(db, 'jobs', locationId));
// //   //       if (locationDoc.exists()) {
// //   //         const data = locationDoc.data();
// //   //         const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`;
// //   //         const coordinates = await getCoordinates(address);
// //   //         setDestination(coordinates);
// //   //       } else {
// //   //         setError('No such document!');
// //   //       }
// //   //     } catch (error) {
// //   //       setError('Error fetching document');
// //   //       console.error('Error fetching document:', error);
// //   //     } finally {
// //   //       setLoading(false);
// //   //     }
// //   //   };

// //     const getCoordinates = async (address) => {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
// //       );
// //       if (response.data.status === 'OK') {
// //         const { lat, lng } = response.data.results[0].geometry.location;
// //         return { latitude: lat, longitude: lng };
// //       } else {
// //         throw new Error('Unable to geocode address');
// //       }
// //     };

// //     if (locationId) {
// //       fetchLocation();
// //     }
// //   }, [locationId, apiKey]);

// //   // const handleGetDirection = async () => {
// //   //   try {
// //   //     let { status } = await Location.requestForegroundPermissionsAsync();
// //   //     if (status !== 'granted') {
// //   //       Alert.alert('Permission to access location was denied');
// //   //       return;
// //   //     }

// //   //     let userLocation = await Location.getCurrentPositionAsync({});
// //   //     const { latitude, longitude } = userLocation.coords;
// //   //     //const origin = { latitude, longitude };
// //   //     const origin = { latitude: 3.149887460969768, longitude: 101.74412161472426};

// //   //     setOrigin(origin);

// //   //     if (!destination) {
// //   //       Alert.alert('Error', 'Destination location not found');
// //   //       return;
// //   //     }

// //   //     console.log('Origin:', origin);
// //   //     console.log('Destination:', destination);

// //   //     const directions = await getDirections(origin, destination);
// //   //     if (directions) {
// //   //       const decodedPoints = polyline.decode(directions.points);
// //   //       const polylineCoordinates = decodedPoints.map(point => ({
// //   //         latitude: point[0],
// //   //         longitude: point[1],
// //   //       }));
// //   //       setPolylinePoints(polylineCoordinates);
// //   //       setPolylineVisible(true);
// //   //       setDistance(directions.distance);
// //   //       setDuration(directions.duration);
// //   //       console.log('Directions fetched successfully');
// //   //       animatePolyline();
// //   //     }
// //   //   } catch (error) {
// //   //     console.error('Error getting directions:', error);
// //   //     Alert.alert('Error', 'Error getting directions');
// //   //   }
// //   // };

// // const handleGetDirection = async () => {
// //     if (!jobData || !jobData.assignedWorkers.includes(workerId)) {
// //         Alert.alert('Error', 'You are not assigned to this job');
// //         return;
// //     }

// //     try {
// //         let { status } = await Location.requestForegroundPermissionsAsync();
// //         if (status !== 'granted') {
// //             Alert.alert('Permission to access location was denied');
// //             return;
// //         }

// //         let userLocation = await Location.getCurrentPositionAsync({});
// //         const { latitude, longitude } = userLocation.coords;
// //         const origin = { latitude, longitude };
// //         setOrigin(origin);

// //         if (!destination) {
// //             Alert.alert('Error', 'Destination location not found');
// //             return;
// //         }

// //         console.log('Origin:', origin);
// //         console.log('Destination:', destination);

// //         const directions = await getDirections(origin, destination);
// //         if (directions) {
// //             const decodedPoints = polyline.decode(directions.points);
// //             const polylineCoordinates = decodedPoints.map(point => ({
// //                 latitude: point[0],
// //                 longitude: point[1],
// //             }));
// //             setPolylinePoints(polylineCoordinates);
// //             setPolylineVisible(true);
// //             setDistance(directions.distance);
// //             setDuration(directions.duration);
// //             console.log('Directions fetched successfully');
// //             animatePolyline();
// //         }
// //     } catch (error) {
// //         console.error('Error getting directions:', error);
// //         Alert.alert('Error', 'Error getting directions');
// //     }
// // };

// //   const getDirections = async (origin, destination) => {
// //     try {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
// //       );

// //       if (response.data.status === 'OK') {
// //         const route = response.data.routes[0];
// //         console.log('Directions:', response.data);
// //         return {
// //           points: route.overview_polyline.points,
// //           distance: route.legs[0].distance.text,
// //           duration: route.legs[0].duration.text,
// //         };
// //       } else {
// //         console.error('Directions API error:', response.data);
// //         Alert.alert('Error', `Directions API error: ${response.data.status}`);
// //         throw new Error('Unable to fetch directions');
// //       }
// //     } catch (error) {
// //       console.error('Axios error:', error);
// //       throw new Error('Unable to fetch directions');
// //     }
// //   };

// //   const animatePolyline = () => {
// //     Animated.timing(animationValue, {
// //       toValue: 1,
// //       duration: 2000,
// //       useNativeDriver: true,
// //     }).start();
// //   };

// //   if (loading) {
// //     return <View style={styles.centered}><Text>Loading...</Text></View>;
// //   }

// //   if (error) {
// //     return <View style={styles.centered}><Text>{error}</Text></View>;
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Header title="Get Location" />
// //       <View style={styles.mapWrapper}>
// //         <MapView
// //           style={styles.mapContainer}
// //           initialRegion={{
// //             latitude: destination ? destination.latitude : 0,
// //             longitude: destination ? destination.longitude : 0,
// //             latitudeDelta: 0.0922,
// //             longitudeDelta: 0.0421,
// //           }}>
// //           {origin && (
// //             <Marker
// //               coordinate={origin}
// //               title="Your Location"
// //               description="Current Location"
// //             />
// //           )}
// //           {destination && (
// //             <Marker
// //               coordinate={destination}
// //               title="Destination"
// //               description="Job Location"
// //             />
// //           )}
// //           {polylineVisible && (
// //             <Polyline
// //               coordinates={polylinePoints}
// //               strokeWidth={4}
// //               strokeColor="blue"
// //             />
// //           )}
// //         </MapView>
// //         {distance && duration && (
// //           <View style={styles.infoContainer}>
// //             <Text>Distance: {distance}</Text>
// //             <Text>Duration: {duration}</Text>
// //           </View>
// //         )}
// //         <TouchableOpacity style={styles.directionButton} onPress={handleGetDirection}>
// //           <Text style={styles.buttonText}>Job Location</Text>
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   mapWrapper: {
// //     flex: 1,
// //   },
// //   directionButton: {
// //     position: 'absolute',
// //     bottom: 20,
// //     left: '50%',
// //     transform: [{ translateX: -75 }], // Adjusted translateX value
// //     backgroundColor: COLORS.primary,
// //     padding: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     width: 150, // Added width to ensure consistent centering
// //   },
// //   buttonText: {
// //     color: '#ffffff',
// //     fontSize: 18,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   mapContainer: {
// //     flex: 1,
// //   },
// //   infoContainer: {
// //     position: 'absolute',
// //     bottom: 80,
// //     left: '50%',
// //     transform: [{ translateX: -100 }], // Adjusted translateX value
// //     backgroundColor: 'rgba(255, 255, 255, 0.8)',
// //     padding: 10,
// //     marginBottom: 5,
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     width: 200, // Added width to ensure consistent centering
// //   },
// // });

// // export default JobLocation;

// // import React, { useState, useEffect } from 'react';
// // import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
// // import MapView, { Marker, Polyline } from 'react-native-maps';
// // import { db } from '../firebase';
// // import { doc, getDoc } from 'firebase/firestore';
// // import { COLORS, SIZES, FONTS } from '../constants';
// // import axios from 'axios';
// // import * as Location from 'expo-location';
// // import Header from '../components/Header';
// // import polyline from '@mapbox/polyline';

// // const JobLocation = ({ route }) => {
// //   const { locationId } = route.params;
// //   const [destination, setDestination] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [polylinePoints, setPolylinePoints] = useState([]);
// //   const [polylineVisible, setPolylineVisible] = useState(false);
// //   const [animationValue] = useState(new Animated.Value(0));
// //   const apiKey = 'AIzaSyAqKCJbvo1YUX4wKMXkpLYe0Bglfxxto_g';

// //   useEffect(() => {
// //     const checkPermissions = async () => {
// //       let { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== 'granted') {
// //         Alert.alert(
// //           'Permission Required',
// //           'Permission to access location is required to use this feature.',
// //           [{ text: 'OK', onPress: () => navigation.goBack() }]
// //         );
// //         return;
// //       }
// //     };

// //     checkPermissions();
// //   }, []);

// //   useEffect(() => {
// //     const fetchLocation = async () => {
// //       try {
// //         const locationDoc = await getDoc(doc(db, 'jobs', locationId));
// //         if (locationDoc.exists()) {
// //           const data = locationDoc.data();
// //           const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`;
// //           const coordinates = await getCoordinates(address);
// //           setDestination(coordinates);
// //         } else {
// //           setError('No such document!');
// //         }
// //       } catch (error) {
// //         setError('Error fetching document');
// //         console.error('Error fetching document:', error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     const getCoordinates = async (address) => {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
// //       );
// //       if (response.data.status === 'OK') {
// //         const { lat, lng } = response.data.results[0].geometry.location;
// //         return { latitude: lat, longitude: lng };
// //       } else {
// //         throw new Error('Unable to geocode address');
// //       }
// //     };

// //     if (locationId) {
// //       fetchLocation();
// //     }
// //   }, [locationId]);

// //   const handleGetDirection = async () => {
// //     try {
// //       let { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== 'granted') {
// //         Alert.alert('Permission to access location was denied');
// //         return;
// //       }

// //       let userLocation = await Location.getCurrentPositionAsync({});
// //       const { latitude, longitude } = userLocation.coords;
// //       // const origin = { latitude, longitude };
// //       const origin = { latitude: 3.1501888510212197, longitude: 101.74421351418829 };

// //       if (!destination) {
// //         Alert.alert('Error', 'Destination location not found');
// //         return;
// //       }

// //       console.log('Origin:', origin);
// //       console.log('Destination:', destination);

// //       const directions = await getDirections(origin, destination);
// //       if (directions) {
// //         const decodedPoints = polyline.decode(directions);
// //         const polylineCoordinates = decodedPoints.map(point => ({
// //           latitude: point[0],
// //           longitude: point[1],
// //         }));
// //         setPolylinePoints(polylineCoordinates);
// //         setPolylineVisible(true);
// //         console.log('Directions fetched successfully');
// //         animatePolyline();
// //       }
// //     } catch (error) {
// //       console.error('Error getting directions:', error);
// //       Alert.alert('Error', 'Error getting directions');
// //     }
// //   };

// //   const getDirections = async (origin, destination) => {
// //     try {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
// //       );

// //       if (response.data.status === 'OK') {
// //         console.log('Directions:', response.data);
// //         return response.data.routes[0].overview_polyline.points;
// //       } else {
// //         console.error('Directions API error:', response.data);
// //         Alert.alert('Error', `Directions API error: ${response.data.status}`);
// //         throw new Error('Unable to fetch directions');
// //       }
// //     } catch (error) {
// //       console.error('Axios error:', error);
// //       throw new Error('Unable to fetch directions');
// //     }
// //   };

// //   const animatePolyline = () => {
// //     Animated.timing(animationValue, {
// //       toValue: 1,
// //       duration: 2000,
// //       useNativeDriver: true,
// //     }).start();
// //   };

// //   if (loading) {
// //     return <View style={styles.centered}><Text>Loading...</Text></View>;
// //   }

// //   if (error) {
// //     return <View style={styles.centered}><Text>{error}</Text></View>;
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Header title="Get Direction" />
// //       <MapView
// //         style={styles.mapContainer}
// //         initialRegion={{
// //           latitude: destination ? destination.latitude : 0,
// //           longitude: destination ? destination.longitude : 0,
// //           latitudeDelta: 0.0922,
// //           longitudeDelta: 0.0421,
// //         }}>
// //         {destination && (
// //           <Marker
// //             coordinate={destination}
// //             title="Destination"
// //             description="Job Location"
// //           />
// //         )}
// //         {polylineVisible && (
// //           <Polyline
// //             coordinates={polylinePoints}
// //             strokeWidth={4}
// //             strokeColor="blue"
// //           />
// //         )}
// //       </MapView>
// //       <TouchableOpacity style={styles.directionButton} onPress={handleGetDirection}>
// //         <Text style={styles.buttonText}>Get Direction</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   directionButton: {
// //     position: 'absolute',
// //     bottom: 20,
// //     left: '50%',
// //     transform: [{ translateX: -50 }],
// //     backgroundColor: COLORS.primary,
// //     padding: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //   },
// //   buttonText: {
// //     color: 'ffff',
// //     ...FONTS.h3,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   mapContainer: {
// //     flex: 1,
// //   },
// // });

// // export default JobLocation;

// // import React, { useState, useEffect } from 'react';
// // import { View, StyleSheet, Text, TouchableOpacity, Alert, Animated } from 'react-native';
// // import MapView, { Marker, Polyline } from 'react-native-maps';
// // import { COLORS, SIZES, FONTS } from '../constants';
// // import axios from 'axios';
// // import Header from '../components/Header';
// // import polyline from '@mapbox/polyline';

// // const JobLocation = () => {
// //   const [polylinePoints, setPolylinePoints] = useState([]);
// //   const [polylineVisible, setPolylineVisible] = useState(false);
// //   const [animationValue] = useState(new Animated.Value(0));
// //   const apiKey = 'AIzaSyAqKCJbvo1YUX4wKMXkpLYe0Bglfxxto_g';

// //   const origin = { latitude: 7.1407796, longitude: 125.6023461 }; // Amakan, Cabantian
// //   const destination = { latitude: 7.0779935, longitude: 125.6136525 }; // Gaisano Mall of Davao

// //   const handleGetDirection = async () => {
// //     try {
// //       console.log('Origin:', origin);
// //       console.log('Destination:', destination);

// //       const directions = await getDirections(origin, destination);
// //       if (directions) {
// //         const decodedPoints = polyline.decode(directions);
// //         const polylineCoordinates = decodedPoints.map(point => ({
// //           latitude: point[0],
// //           longitude: point[1],
// //         }));
// //         setPolylinePoints(polylineCoordinates);
// //         setPolylineVisible(true);
// //         console.log('Directions fetched successfully');
// //         animatePolyline();
// //       }
// //     } catch (error) {
// //       console.error('Error getting directions:', error);
// //       Alert.alert('Error', 'Error getting directions');
// //     }
// //   };

// //   const getDirections = async (origin, destination) => {
// //     try {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
// //       );

// //       if (response.data.status === 'OK') {
// //         console.log('Directions:', response.data);
// //         return response.data.routes[0].overview_polyline.points;
// //       } else {
// //         console.error('Directions API error:', response.data);
// //         throw new Error('Unable to fetch directions');
// //       }
// //     } catch (error) {
// //       console.error('Axios error:', error);
// //       throw new Error('Unable to fetch directions');
// //     }
// //   };

// //   const animatePolyline = () => {
// //     Animated.timing(animationValue, {
// //       toValue: 1,
// //       duration: 2000,
// //       useNativeDriver: true,
// //     }).start();
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <Header title="Get Direction" />
// //       <MapView
// //         style={styles.mapContainer}
// //         initialRegion={{
// //           latitude: (origin.latitude + destination.latitude) / 2,
// //           longitude: (origin.longitude + destination.longitude) / 2,
// //           latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 2,
// //           longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 2,
// //         }}>
// //         <Marker
// //           coordinate={origin}
// //           title="Current Location"
// //           description="Amakan, Cabantian"
// //         />
// //         <Marker
// //           coordinate={destination}
// //           title="Destination"
// //           description="Gaisano Mall of Davao"
// //         />
// //         {polylineVisible && (
// //           <Polyline
// //             coordinates={polylinePoints}
// //             strokeWidth={4}
// //             strokeColor="blue"
// //           />
// //         )}
// //       </MapView>
// //       <TouchableOpacity style={styles.directionButton} onPress={handleGetDirection}>
// //         <Text style={styles.buttonText}>Get Direction</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   directionButton: {
// //     position: 'absolute',
// //     bottom: 20,
// //     left: '50%',
// //     transform: [{ translateX: -50 }],
// //     backgroundColor: COLORS.primary,
// //     padding: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //   },
// //   buttonText: {
// //     color: COLORS.white,
// //     ...FONTS.h3,
// //   },
// //   mapContainer: {
// //     flex: 1,
// //   },
// // });

// // export default JobLocation;

// // import React, { useState, useEffect } from 'react';
// // import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
// // import MapView, { Marker, Polyline } from 'react-native-maps';
// // import { db } from '../firebase';
// // import { doc, getDoc } from 'firebase/firestore';
// // import { COLORS, SIZES, FONTS } from '../constants';
// // import axios from 'axios';
// // import * as Location from 'expo-location';
// // import Header from '../components/Header';
// // import { useNavigation } from '@react-navigation/native';
// // import polyline from '@mapbox/polyline';
// // import haversine from 'haversine-distance'; // Importing haversine package for distance calculation

// // const JobLocation = ({ route }) => {
// //   const { locationId } = route.params;
// //   const [location, setLocation] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [polylinePoints, setPolylinePoints] = useState([]);
// //   const navigation = useNavigation();

// //   const apiKey = 'AIzaSyAqKCJbvo1YUX4wKMXkpLYe0Bglfxxto_g';

// //   useEffect(() => {
// //     const checkPermissions = async () => {
// //       let { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== 'granted') {
// //         Alert.alert(
// //           'Permission Required',
// //           'Permission to access location is required to use this feature.',
// //           [{ text: 'OK', onPress: () => navigation.goBack() }]
// //         );
// //         return;
// //       }
// //     };

// //     checkPermissions();
// //   }, []);

// //   useEffect(() => {
// //     const fetchLocation = async () => {
// //       try {
// //         const locationDoc = await getDoc(doc(db, 'jobs', locationId));
// //         if (locationDoc.exists()) {
// //           const data = locationDoc.data();
// //           const address = `${data.streetAddress} ${data.locationName} ${data.block} ${data.city} ${data.country}`;
// //           const coordinates = await getCoordinates(address);
// //           setLocation(coordinates);
// //         } else {
// //           setError('No such document!');
// //         }
// //       } catch (error) {
// //         setError('Error fetching document');
// //         console.error('Error fetching document:', error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     const getCoordinates = async (address) => {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
// //       );
// //       if (response.data.status === 'OK') {
// //         const { lat, lng } = response.data.results[0].geometry.location;
// //         return { latitude: lat, longitude: lng };
// //       } else {
// //         throw new Error('Unable to geocode address');
// //       }
// //     };

// //     if (locationId) {
// //       fetchLocation();
// //     }
// //   }, [locationId]);

// //   const handleGetDirection = async () => {
// //     try {
// //       let { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== 'granted') {
// //         setError('Permission to access location was denied');
// //         return;
// //       }

// //       let userLocation = await Location.getCurrentPositionAsync({});
// //       const { latitude, longitude } = userLocation.coords;
// //       const origin = { latitude, longitude };
// //       const destination = { latitude: location.latitude, longitude: location.longitude };

// //       console.log('Origin:', origin);
// //       console.log('Destination:', destination);

// //       // Calculate the distance between origin and destination
// //       const distance = haversine(origin, destination);
// //       console.log('Distance:', distance);

// //       // If the distance is greater than 1000 km, skip the directions API call
// //       if (distance > 1000000) { // 1000 km in meters
// //         setError('The distance between the origin and destination is too large for driving directions.');
// //         return;
// //       }

// //       const directions = await getDirections(origin, destination);
// //       if (directions) {
// //         const decodedPoints = polyline.decode(directions);
// //         const polylineCoordinates = decodedPoints.map(point => ({
// //           latitude: point[0],
// //           longitude: point[1],
// //         }));
// //         setPolylinePoints(polylineCoordinates);
// //         console.log('Directions fetched successfully');
// //       }
// //     } catch (error) {
// //       console.error('Error getting directions:', error);
// //       setError('Error getting directions');
// //     }
// //   };

// //   const getDirections = async (origin, destination) => {
// //     try {
// //       const response = await axios.get(
// //         `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`
// //       );

// //       if (response.data.status === 'OK') {
// //         console.log('Directions:', response.data);
// //         return response.data.routes[0].overview_polyline.points;
// //       } else {
// //         console.error('Directions API error:', response.data);
// //         throw new Error('Unable to fetch directions');
// //       }
// //     } catch (error) {
// //       console.error('Axios error:', error);
// //       throw new Error('Unable to fetch directions');
// //     }
// //   };

// //   if (loading) {
// //     return <View style={styles.centered}><Text>Loading...</Text></View>;
// //   }

// //   if (error) {
// //     return <View style={styles.centered}><Text>{error}</Text></View>;
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <Header title="Get Direction" />
// //       <MapView
// //         style={styles.mapContainer}
// //         initialRegion={{
// //           latitude: location.latitude,
// //           longitude: location.longitude,
// //           latitudeDelta: 0.0922,
// //           longitudeDelta: 0.0421,
// //         }}>
// //         <Marker
// //           coordinate={{
// //             latitude: location.latitude,
// //             longitude: location.longitude,
// //           }}
// //           title="Move"
// //           description="Address"
// //         />
// //         {polylinePoints.length > 0 && (
// //           <Polyline
// //             coordinates={polylinePoints}
// //             strokeWidth={4}
// //             strokeColor="blue"
// //           />
// //         )}
// //       </MapView>
// //       <TouchableOpacity style={styles.directionButton} onPress={handleGetDirection}>
// //         <Text style={styles.buttonText}>Get Direction</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// //   directionButton: {
// //     position: 'absolute',
// //     bottom: 20,
// //     left: '50%',
// //     transform: [{ translateX: -50 }],
// //     backgroundColor: COLORS.primary,
// //     padding: 15,
// //     borderRadius: 30,
// //     alignItems: 'center',
// //   },
// //   buttonText: {
// //     color: COLORS.white,
// //     ...FONTS.h3,
// //   },
// //   centered: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   mapContainer: {
// //     flex: 1,
// //   },
// // });

// // export default JobLocation;
