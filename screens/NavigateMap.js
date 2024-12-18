import React, { useEffect, useState, useRef } from 'react'
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Linking,
    Alert,
    PermissionsAndroid,
    Animated,
    ScrollView,
    ActivityIndicator,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import MapView, {
    Marker,
    Callout,
    Circle,
    PROVIDER_GOOGLE,
    Polyline,
} from 'react-native-maps'
import * as Location from 'expo-location'
import * as Network from 'expo-network'
import { MaterialIcons } from '@expo/vector-icons' // Import icons
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Constants
const GEOFENCE_RADIUS = 100 // meters
const LOCATION_UPDATE_INTERVAL = 5000 // 10 seconds DEFAULT 10000
const UPDATE_INTERVAL = 100 // DEFAULT 300 milliseconds for simulation updates

const SINGAPORE_LANDMARKS = {
    TAMPINES: {
        latitude: 1.3546,
        longitude: 103.945,
    },
    BEDOK: {
        latitude: 1.3236,
        longitude: 103.9273,
    },
}

// Update these constants at the top of the file
const SINGAPORE_BOUNDS = {
    MIN_LAT: 1.22,
    MAX_LAT: 1.47,
    MIN_LNG: 103.6,
    MAX_LNG: 104.1,
}

// Add this debug function
const logCoordinates = (label, coords) => {
    console.log(`${label}:`, {
        latitude: coords?.latitude?.toFixed(6),
        longitude: coords?.longitude?.toFixed(6),
        isValid: isValidSingaporeCoordinate(coords),
    })
}

// Update the coordinate validation function
const isValidSingaporeCoordinate = (coord) => {
    if (!coord) {
        console.log('Coordinate is null or undefined')
        return false
    }

    if (
        typeof coord.latitude !== 'number' ||
        typeof coord.longitude !== 'number'
    ) {
        console.log('Invalid coordinate types:', {
            latType: typeof coord.latitude,
            lngType: typeof coord.longitude,
        })
        return false
    }

    const isValid =
        coord.latitude >= SINGAPORE_BOUNDS.MIN_LAT &&
        coord.latitude <= SINGAPORE_BOUNDS.MAX_LAT &&
        coord.longitude >= SINGAPORE_BOUNDS.MIN_LNG &&
        coord.longitude <= SINGAPORE_BOUNDS.MAX_LNG

    if (!isValid) {
        console.log('Coordinate out of Singapore bounds:', coord)
    }

    return isValid
}

// Get initial/dummy location
const getDummyLocation = () => {
    return SINGAPORE_LANDMARKS.TAMPINES
}

// Helper function to decode Google Maps polyline
const decodePoly = (encoded) => {
    const points = []
    let index = 0,
        len = encoded.length
    let lat = 0,
        lng = 0

    while (index < len) {
        let shift = 0,
            result = 0
        let byte
        do {
            byte = encoded.charCodeAt(index++) - 63
            result |= (byte & 0x1f) << shift
            shift += 5
        } while (byte >= 0x20)
        const dlat = result & 1 ? ~(result >> 1) : result >> 1
        lat += dlat

        shift = 0
        result = 0
        do {
            byte = encoded.charCodeAt(index++) - 63
            result |= (byte & 0x1f) << shift
            shift += 5
        } while (byte >= 0x20)
        const dlng = result & 1 ? ~(result >> 1) : result >> 1
        lng += dlng

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        })
    }
    return points
}

// Add this helper function for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Returns distance in kilometers
}

const calculateInitialRoute = (start, end) => {
    if (!start || !end) return null

    // Calculate direct distance using Haversine formula
    const distance = calculateDistance(
        start.latitude,
        start.longitude,
        end.latitude,
        end.longitude
    )

    // Estimate duration (assuming average speed of 40 km/h in Singapore)
    const averageSpeedKmh = 40
    const durationHours = distance / averageSpeedKmh
    const durationMinutes = Math.round(durationHours * 60)

    return {
        distance: `${distance.toFixed(1)} km`,
        duration: `${durationMinutes} mins`,
        speed: `${averageSpeedKmh} km/h`,
        eta: new Date(Date.now() + durationMinutes * 60000).toLocaleTimeString(
            'en-US',
            {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }
        ),
    }
}

const NavigateMap = ({ navigation, route }) => {
    // Add state for job data
    const [jobData, setJobData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Add useEffect to fetch job data
    useEffect(() => {
        console.log('NavigateMap - Received Params:', {
            jobNo: route?.params?.jobNo,
            workerId: route?.params?.workerId,
        })

        const fetchJobData = async () => {
            try {
                if (!route?.params?.jobNo) {
                    throw new Error('Job number is required')
                }

                const jobRef = doc(db, 'jobs', route.params.jobNo)
                const jobSnap = await getDoc(jobRef)

                if (!jobSnap.exists()) {
                    throw new Error('Job not found')
                }

                const data = jobSnap.data()
                console.log('Fetched job data:', data)
                setJobData(data)
            } catch (error) {
                console.error('Error fetching job data:', error)
                Alert.alert('Error', 'Failed to load job details')
            } finally {
                setLoading(false)
            }
        }

        fetchJobData()
    }, [route?.params?.jobNo])

    // Update the default/fallback values to use jobData
    const {
        location = {
            coordinates: {
                latitude: jobData?.location?.coordinates?.latitude || 1.3069676,
                longitude:
                    jobData?.location?.coordinates?.longitude || 103.8212575,
            },
            address: {
                streetAddress:
                    jobData?.location?.address?.streetAddress ||
                    '19 NASSIM HILL SITE OFFICE',
                city: jobData?.location?.address?.city || '',
                postalCode: jobData?.location?.address?.postalCode || '',
            },
        },
        locationName = jobData?.locationName || '19 NASSIM SITE OFFICE',
        customerName = jobData?.customerName || 'C000001 - 19 NASSIM PROJECT',
        jobNo = jobData?.jobNo || '000013',
        contact = jobData?.contact || {
            contactFullname: 'Jayson Butler',
            mobilePhone: '809483',
            phoneNumber: '098287374837',
        },
    } = route?.params || {}

    const [visitedStages, setVisitedStages] = useState([0, 1])
    const [currentLocation, setCurrentLocation] = useState(null)
    const [isOffline, setIsOffline] = useState(false)
    const [routeInfo, setRouteInfo] = useState(null)
    const [hasArrived, setHasArrived] = useState(false)
    const [locationSubscription, setLocationSubscription] = useState(null)
    const [routeCoordinates, setRouteCoordinates] = useState([])
    const [isNavigating, setIsNavigating] = useState(false)
    const [simulationInterval, setSimulationInterval] = useState(null)
    const [currentPointIndex, setCurrentPointIndex] = useState(0)
    const [initialRouteInfo, setInitialRouteInfo] = useState(null)
    const [showDetails, setShowDetails] = useState(true)
    const [showRouteInfo, setShowRouteInfo] = useState(true)

    const mapViewRef = useRef(null)

    // Destination coordinates from route params
    const destinationCoords = {
        latitude: location?.coordinates?.latitude,
        longitude: location?.coordinates?.longitude,
    }

    // Initial map region
    const initialRegion = {
        ...destinationCoords,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    }

    // Check if coordinates are valid for Singapore
    const isValidSingaporeCoordinate = (coord) => {
        if (
            !coord ||
            typeof coord.latitude !== 'number' ||
            typeof coord.longitude !== 'number'
        ) {
            return false
        }
        return (
            coord.latitude >= 1.1 &&
            coord.latitude <= 1.5 &&
            coord.longitude >= 103.6 &&
            coord.longitude <= 104.1
        )
    }

    // Initial setup effect
    // Update initial location setup
    useEffect(() => {
        const setupLocation = async () => {
            try {
                const dummyLocation = {
                    latitude: 1.3546, // Tampines
                    longitude: 103.945,
                }

                console.log('Setting initial location:', dummyLocation)

                // First set the location
                setCurrentLocation(dummyLocation)

                // Then request permissions
                const { status } =
                    await Location.requestForegroundPermissionsAsync()
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Denied',
                        'Location permission is required for navigation.'
                    )
                    return
                }

                // Start location updates with validation
                const subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: LOCATION_UPDATE_INTERVAL,
                        distanceInterval: 10,
                    },
                    (position) => {
                        const newLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        }

                        if (isValidSingaporeCoordinate(newLocation)) {
                            if (!isNavigating) {
                                // Only update if not navigating
                                setCurrentLocation(newLocation)
                            }
                        } else {
                            console.log(
                                'Received invalid location from device:',
                                newLocation
                            )
                        }
                    }
                )

                setLocationSubscription(subscription)
            } catch (error) {
                console.error('Error setting up location:', error)
            }
        }

        setupLocation()

        return () => {
            if (locationSubscription) {
                locationSubscription.remove()
            }
        }
    }, [])

    // Network listener setup
    const setupNetworkListener = async () => {
        try {
            const networkState = await Network.getNetworkStateAsync()
            setIsOffline(!networkState.isConnected)
            if (!networkState.isConnected) {
                Alert.alert(
                    'Offline Mode',
                    'You are now in offline mode. Some features may be limited.'
                )
            }
        } catch (error) {
            console.error('Network error:', error)
        }
    }

    // Start navigation function
    // Update the startNavigation function's beginning
    const startNavigation = async () => {
        console.log('=== Starting Navigation ===')
        logCoordinates('Current Location', currentLocation)
        logCoordinates('Destination', destinationCoords)

        if (!currentLocation || !destinationCoords) {
            console.error('Missing coordinates')
            Alert.alert('Error', 'Missing location coordinates')
            return
        }

        // Validate current location
        if (!isValidSingaporeCoordinate(currentLocation)) {
            console.log('Invalid current location, resetting to Tampines...')
            const validLocation = {
                latitude: 1.3546,
                longitude: 103.945,
            }
            setCurrentLocation(validLocation)
            // Wait a bit for state to update
            await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Validate destination
        if (!isValidSingaporeCoordinate(destinationCoords)) {
            console.error('Invalid destination coordinates')
            Alert.alert('Error', 'Invalid destination location')
            return
        }

        try {
            setIsNavigating(true)

            // Format coordinates with proper precision
            const origin = `${currentLocation.latitude.toFixed(6)},${currentLocation.longitude.toFixed(6)}`
            const destination = `${destinationCoords.latitude.toFixed(6)},${destinationCoords.longitude.toFixed(6)}`

            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&region=sg&key=${process.env.GOOGLE_MAPS_API_KEY}`

            console.log('Requesting route:', { origin, destination })
            const response = await fetch(url)
            const data = await response.json()

            if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]?.steps) {
                throw new Error(`Route API error: ${data.status}`)
            }

            // Extract all points from route steps
            const allPoints = data.routes[0].legs[0].steps.reduce(
                (points, step) => {
                    if (step.polyline?.points) {
                        return [...points, ...decodePoly(step.polyline.points)]
                    }
                    return points
                },
                []
            )

            if (allPoints.length === 0) {
                throw new Error('No route points available')
            }

            console.log(`Route decoded with ${allPoints.length} points`)
            setRouteCoordinates(allPoints)

            // Update route info with distance and duration
            setRouteInfo({
                distance: data.routes[0].legs[0].distance.text,
                duration: data.routes[0].legs[0].duration.text,
            })

            // Start simulation
            const interval = setInterval(() => {
                setCurrentPointIndex((prevIndex) => {
                    if (prevIndex >= allPoints.length - 1) {
                        clearInterval(interval)
                        setIsNavigating(false)
                        setHasArrived(true)
                        setVisitedStages((prev) => [...new Set([...prev, 2])])
                        Alert.alert(
                            'Arrived',
                            'You have reached your destination! You can now proceed to Service Work.'
                        )
                        return prevIndex
                    }

                    const nextPoint = allPoints[prevIndex + 1]
                    setCurrentLocation(nextPoint)

                    // Update route info dynamically
                    updateRouteInfo(prevIndex + 1, allPoints)

                    const progress = (
                        ((prevIndex + 1) / allPoints.length) *
                        100
                    ).toFixed(1)
                    console.log(`Navigation progress: ${progress}%`)

                    return prevIndex + 1
                })
            }, UPDATE_INTERVAL)

            setSimulationInterval(interval)

            // Fit map to show route
            if (mapViewRef.current) {
                mapViewRef.current.fitToCoordinates(
                    [currentLocation, ...allPoints, destinationCoords],
                    {
                        edgePadding: {
                            top: 100,
                            right: 100,
                            bottom: 100,
                            left: 100,
                        },
                        animated: true,
                    }
                )
            }
        } catch (error) {
            console.error('Navigation error:', error)
            Alert.alert(
                'Navigation Error',
                error.message || 'Unable to fetch route information'
            )
            setIsNavigating(false)
        }
    }

    // Stop navigation function
    const stopNavigation = () => {
        console.log('Stopping navigation')
        if (simulationInterval) {
            clearInterval(simulationInterval)
            setSimulationInterval(null)
        }
        setIsNavigating(false)
        setRouteCoordinates([])
        setCurrentPointIndex(0)
        setHasArrived(false)

        const dummyLocation = getDummyLocation()
        setCurrentLocation(dummyLocation)
    }

    const updateRouteInfo = (currentIndex, allPoints) => {
        if (currentIndex >= allPoints.length - 1) return

        const remainingPoints = allPoints.slice(currentIndex)
        let remainingDistance = 0

        for (let i = 0; i < remainingPoints.length - 1; i++) {
            remainingDistance += calculateDistance(
                remainingPoints[i].latitude,
                remainingPoints[i].longitude,
                remainingPoints[i + 1].latitude,
                remainingPoints[i + 1].longitude
            )
        }

        // Assuming an average speed of 50 km/h for estimation
        const averageSpeedKmh = 50
        const remainingDurationHours = remainingDistance / averageSpeedKmh
        const remainingDurationMinutes = remainingDurationHours * 60

        setRouteInfo({
            distance: `${remainingDistance.toFixed(2)} km`,
            duration: `${Math.round(remainingDurationMinutes)} mins`,
        })
    }

    // Stage navigation handler
    const handleStagePress = (index) => {
        if (visitedStages.includes(index)) {
            const navigationParams = {
                jobNo: route?.params?.jobNo,
                workerId: route?.params?.workerId,
                location: route?.params?.location,
                locationName: route?.params?.locationName,
                customerName: route?.params?.customerName,
            }

            navigation.navigate(stages[index].screen, navigationParams)
        }
    }

    // Navigation stages
    const stages = [
        { icon: 'check-circle', name: 'Details', screen: 'ServiceTaskDetails' },
        { icon: 'directions-car', name: 'Navigate', screen: 'NavigateMap' },
        { icon: 'build', name: 'Service', screen: 'ServiceWork' },
        {
            icon: 'assignment-turned-in',
            name: 'Complete',
            screen: 'Completion',
        },
    ]

    const currentStage = 1

    // Calculate initial route info when component mounts
    useEffect(() => {
        if (currentLocation && destinationCoords && !initialRouteInfo) {
            const initial = calculateInitialRoute(
                currentLocation,
                destinationCoords
            )
            setInitialRouteInfo(initial)
            if (!routeInfo) {
                setRouteInfo(initial)
            }
        }
    }, [currentLocation, destinationCoords])

    // Update the callCustomer function to use jobData
    const callCustomer = () => {
        const phoneNumber = `tel:${jobData?.contact?.phoneNumber || jobData?.contact?.mobilePhone}`
        Linking.openURL(phoneNumber).catch((err) =>
            console.error('Error calling customer:', err)
        )
    }

    // Add loading indicator
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4a90e2" />
                    <Text style={styles.loadingText}>
                        Fetching Map Location details...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                >
                    <Icon name="arrow-back-ios" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Navigate to Location</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <Icon name="more-horiz" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Progress Icons */}
            <View style={styles.progressContainer}>
                {stages.map((stage, index) => (
                    <React.Fragment key={stage.name}>
                        <TouchableOpacity
                            onPress={() => handleStagePress(index)}
                            style={styles.stageButton}
                        >
                            <Icon
                                name={stage.icon}
                                size={24}
                                color={
                                    visitedStages.includes(index)
                                        ? '#4a90e2'
                                        : '#ccc'
                                }
                            />
                            <Text
                                style={[
                                    styles.stageText,
                                    {
                                        color: visitedStages.includes(index)
                                            ? '#4a90e2'
                                            : '#ccc',
                                    },
                                ]}
                            >
                                {stage.name}
                            </Text>
                        </TouchableOpacity>
                        {index < stages.length - 1 && (
                            <View
                                style={[
                                    styles.progressLine,
                                    {
                                        backgroundColor: visitedStages.includes(
                                            index + 1
                                        )
                                            ? '#4a90e2'
                                            : '#ccc',
                                    },
                                ]}
                            />
                        )}
                    </React.Fragment>
                ))}
            </View>

            {/* Map Container with Overlaid Route Info */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapViewRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={false}
                    followsUserLocation={isNavigating}
                    showsMyLocationButton={true}
                    showsCompass={true}
                >
                    {/* Current Location Marker */}
                    {currentLocation && (
                        <Marker
                            coordinate={currentLocation}
                            title="Current Location"
                        >
                            <View style={styles.currentLocationMarker}>
                                <View style={styles.currentLocationInner} />
                                <View style={styles.currentLocationOuter} />
                            </View>
                        </Marker>
                    )}

                    {/* Destination Marker */}
                    {destinationCoords && destinationCoords.latitude && (
                        <Marker
                            coordinate={destinationCoords}
                            title={locationName || 'Destination'}
                            description={location?.address?.streetAddress}
                        >
                            <View style={styles.destinationMarker}>
                                <Icon
                                    name="location-on"
                                    size={30}
                                    color="red"
                                />
                            </View>
                        </Marker>
                    )}

                    {/* Route Line */}
                    {isNavigating && routeCoordinates.length > 0 && (
                        <Polyline
                            coordinates={routeCoordinates}
                            strokeWidth={4}
                            strokeColor="#4a90e2"
                            lineDashPattern={[0]}
                            lineCap="round"
                            lineJoin="round"
                            geodesic={true}
                        />
                    )}

                    {/* Geofence Circle */}
                    {destinationCoords && (
                        <Circle
                            center={destinationCoords}
                            radius={GEOFENCE_RADIUS}
                            fillColor="rgba(74, 144, 226, 0.1)"
                            strokeColor="rgba(74, 144, 226, 0.5)"
                            strokeWidth={2}
                        />
                    )}
                </MapView>
            </View>

            {/* Bottom Details Panel */}
            <View style={styles.bottomDetailsContainer}>
                {/* Journey Information */}
                <View style={styles.routeInfoContainer}>
                    <View style={styles.routeInfoCard}>
                        <Icon name="schedule" size={20} color="#4a90e2" />
                        <Text style={styles.routeInfoValue}>
                            {routeInfo?.duration || 'N/A'}
                        </Text>
                        <Text style={styles.routeInfoLabel}>ETA</Text>
                    </View>
                    <View style={styles.routeInfoDivider} />
                    <View style={styles.routeInfoCard}>
                        <Icon name="directions-car" size={20} color="#4a90e2" />
                        <Text style={styles.routeInfoValue}>
                            {routeInfo?.distance || 'N/A'}
                        </Text>
                        <Text style={styles.routeInfoLabel}>Distance</Text>
                    </View>
                </View>

                {/* Customer & Location Info */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Icon name="person" size={20} color="#4a90e2" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>
                                {jobData?.contact?.contactFullname || 'No Name'}
                            </Text>
                            <Text style={styles.infoSubtitle}>
                                {jobData?.contact?.phoneNumber ||
                                    jobData?.contact?.mobilePhone ||
                                    'No Phone'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Icon name="location-on" size={20} color="#4a90e2" />
                        <Text style={styles.infoTitle} numberOfLines={1}>
                            {jobData?.location?.address?.streetAddress ||
                                'No Address'}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            isNavigating && styles.stopButton,
                        ]}
                        onPress={
                            isNavigating ? stopNavigation : startNavigation
                        }
                    >
                        <Icon
                            name={isNavigating ? 'stop' : 'navigation'}
                            size={20}
                            color="white"
                        />
                        <Text style={styles.buttonText}>
                            {isNavigating
                                ? 'Stop Navigation'
                                : 'Start Navigation'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={callCustomer}
                    >
                        <Icon name="phone" size={20} color="#4a90e2" />
                        <Text style={styles.buttonText2}>Call Customer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#4a90e2',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerButton: {
        padding: 4,
        borderRadius: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    stageButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 70,
    },
    stageText: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#ccc',
        marginHorizontal: 8,
    },
    mapContainer: {
        flex: 1.2, // Increase this value to make the map larger
        backgroundColor: 'transparent',
    },
    overlaidRouteInfo: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 1,
    },
    routeInfoCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    routeInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    routeInfoItem: {
        alignItems: 'center',
        flex: 1,
    },
    routeInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    routeInfoLabel: {
        fontSize: 12,
        color: '#666',
    },
    routeInfoDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#eee',
        marginHorizontal: 16,
    },
    expandButton: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    currentLocationMarker: {
        position: 'relative',
        width: 22,
        height: 22,
    },
    currentLocationInner: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#4a90e2',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
        top: 5,
        left: 5,
    },
    currentLocationOuter: {
        position: 'absolute',
        width: 22,
        height: 22,
        backgroundColor: 'rgba(74, 144, 226, 0.2)',
        borderRadius: 11,
    },
    destinationMarker: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        padding: 4,
    },
    detailsContainer: {
        backgroundColor: 'transparent',
        padding: 16,
    },

    // Route Info Styles
    routeInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
    },
    routeInfoCard: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    routeInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    routeInfoLabel: {
        fontSize: 12,
        color: '#666',
    },
    routeInfoDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#eee',
        marginHorizontal: 12,
    },

    // Info Container Styles
    infoContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    infoSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 8,
    },

    // Action Buttons Styles
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4a90e2',
        padding: 12,
        borderRadius: 25,
        gap: 8,
    },
    stopButton: {
        backgroundColor: '#e74c3c',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#4a90e2',
        padding: 12,
        borderRadius: 25,
        gap: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    buttonText2: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
    },
    secondaryButton: {
        color: '#4a90e2',
    },
    offlineIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    offlineText: {
        fontSize: 12,
        color: '#ff6b6b',
        fontWeight: '500',
    },
    activeButton: {
        backgroundColor: '#2ecc71',
    },
    bottomDetailsContainer: {
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        gap: 12,
    },
    routeInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
    },
    routeInfoCard: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    routeInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    routeInfoLabel: {
        fontSize: 12,
        color: '#666',
    },
    routeInfoDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#eee',
        marginHorizontal: 12,
    },

    // Details Card Styles
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailsContent: {
        flex: 1,
    },
    detailsLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    detailsSubtitle: {
        fontSize: 14,
        color: '#666',
    },

    // Button Styles
    actionButtonsContainer: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#4a90e2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#4a90e2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    stopButton: {
        backgroundColor: '#e74c3c',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        borderWidth: 1.5,
        borderColor: '#4a90e2',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#4a90e2',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
})

export default NavigateMap
