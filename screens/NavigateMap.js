import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Linking, Alert, PermissionsAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons'; // Import icons
import Animated, { 
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Constants
const GEOFENCE_RADIUS = 100; // meters
const LOCATION_UPDATE_INTERVAL = 5000; // 10 seconds
const UPDATE_INTERVAL = 100; // milliseconds for simulation updates

const SINGAPORE_LANDMARKS = {
  TAMPINES: {
    latitude: 1.3546,
    longitude: 103.9450
  },
  BEDOK: {
    latitude: 1.3236,
    longitude: 103.9273
  }
};

// Update these constants at the top of the file
const SINGAPORE_BOUNDS = {
    MIN_LAT: 1.22,
    MAX_LAT: 1.47,
    MIN_LNG: 103.6,
    MAX_LNG: 104.1
  };
  
  // Add this debug function
  const logCoordinates = (label, coords) => {
    console.log(`${label}:`, {
      latitude: coords?.latitude?.toFixed(6),
      longitude: coords?.longitude?.toFixed(6),
      isValid: isValidSingaporeCoordinate(coords)
    });
  };
  
  // Update the coordinate validation function
  const isValidSingaporeCoordinate = (coord) => {
    if (!coord) {
      console.log('Coordinate is null or undefined');
      return false;
    }
  
    if (typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
      console.log('Invalid coordinate types:', {
        latType: typeof coord.latitude,
        lngType: typeof coord.longitude
      });
      return false;
    }
  
    const isValid = 
      coord.latitude >= SINGAPORE_BOUNDS.MIN_LAT && 
      coord.latitude <= SINGAPORE_BOUNDS.MAX_LAT &&
      coord.longitude >= SINGAPORE_BOUNDS.MIN_LNG && 
      coord.longitude <= SINGAPORE_BOUNDS.MAX_LNG;
  
    if (!isValid) {
      console.log('Coordinate out of Singapore bounds:', coord);
    }
  
    return isValid;
  };

// Get initial/dummy location
const getDummyLocation = () => {
  return SINGAPORE_LANDMARKS.TAMPINES;
};

// Helper function to decode Google Maps polyline
const decodePoly = (encoded) => {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
};

// Add this helper function for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Returns distance in kilometers
};

const calculateInitialRoute = (start, end) => {
  if (!start || !end) return null;
  
  // Calculate direct distance using Haversine formula
  const distance = calculateDistance(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude
  );
  
  // Estimate duration (assuming average speed of 40 km/h in Singapore)
  const averageSpeedKmh = 40;
  const durationHours = distance / averageSpeedKmh;
  const durationMinutes = Math.round(durationHours * 60);
  
  return {
    distance: `${distance.toFixed(1)} km`,
    duration: `${durationMinutes} mins`,
    speed: `${averageSpeedKmh} km/h`,
    eta: new Date(Date.now() + (durationMinutes * 60000)).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  };
};

const NavigateMap = ({ navigation, route }) => {
  // Add validation check
  React.useEffect(() => {
    if (!route?.params?.location) {
      Alert.alert(
        'Error',
        'Missing location information',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }, []);

  // Add default/fallback values
  const {
    location = {
      coordinates: {
        latitude: 1.3546,
        longitude: 103.9450
      },
      address: {
        streetAddress: '',
        city: '',
        postalCode: ''
      }
    },
    locationName = 'Destination',
    customerName = '',
    jobNo = '',
    workerId = ''
  } = route?.params || {};

  const [visitedStages, setVisitedStages] = useState([0, 1]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState(null);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [initialRouteInfo, setInitialRouteInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  
  const mapViewRef = useRef(null);

  // Destination coordinates from route params
  const destinationCoords = {
    latitude: location?.coordinates?.latitude,
    longitude: location?.coordinates?.longitude,
  };

  // Initial map region
  const initialRegion = {
    ...destinationCoords,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Check if coordinates are valid for Singapore
  const isValidSingaporeCoordinate = (coord) => {
    if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
      return false;
    }
    return (
      coord.latitude >= 1.1 && 
      coord.latitude <= 1.5 && 
      coord.longitude >= 103.6 && 
      coord.longitude <= 104.1
    );
  };

  // Initial setup effect
  // Update initial location setup
useEffect(() => {
    const setupLocation = async () => {
      try {
        const dummyLocation = {
          latitude: 1.3546,    // Tampines
          longitude: 103.9450
        };
        
        console.log('Setting initial location:', dummyLocation);
        
        // First set the location
        setCurrentLocation(dummyLocation);
        
        // Then request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for navigation.');
          return;
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
              longitude: position.coords.longitude
            };
            
            if (isValidSingaporeCoordinate(newLocation)) {
              if (!isNavigating) { // Only update if not navigating
                setCurrentLocation(newLocation);
              }
            } else {
              console.log('Received invalid location from device:', newLocation);
            }
          }
        );
        
        setLocationSubscription(subscription);
      } catch (error) {
        console.error('Error setting up location:', error);
      }
    };
  
    setupLocation();
  
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  

  // Network listener setup
  const setupNetworkListener = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setIsOffline(!networkState.isConnected);
      if (!networkState.isConnected) {
        Alert.alert('Offline Mode', 'You are now in offline mode. Some features may be limited.');
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  // Start navigation function
  // Update the startNavigation function's beginning
const startNavigation = async () => {
    console.log('=== Starting Navigation ===');
    logCoordinates('Current Location', currentLocation);
    logCoordinates('Destination', destinationCoords);
  
    if (!currentLocation || !destinationCoords) {
      console.error('Missing coordinates');
      Alert.alert('Error', 'Missing location coordinates');
      return;
    }
  
    // Validate current location
    if (!isValidSingaporeCoordinate(currentLocation)) {
      console.log('Invalid current location, resetting to Tampines...');
      const validLocation = {
        latitude: 1.3546,
        longitude: 103.9450
      };
      setCurrentLocation(validLocation);
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  
    // Validate destination
    if (!isValidSingaporeCoordinate(destinationCoords)) {
      console.error('Invalid destination coordinates');
      Alert.alert('Error', 'Invalid destination location');
      return;
    }
  
    try {
      setIsNavigating(true);
  
      // Format coordinates with proper precision
      const origin = `${currentLocation.latitude.toFixed(6)},${currentLocation.longitude.toFixed(6)}`;
      const destination = `${destinationCoords.latitude.toFixed(6)},${destinationCoords.longitude.toFixed(6)}`;
  
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&region=sg&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      
      console.log('Requesting route:', { origin, destination });
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]?.steps) {
        throw new Error(`Route API error: ${data.status}`);
      }

      // Extract all points from route steps
      const allPoints = data.routes[0].legs[0].steps.reduce((points, step) => {
        if (step.polyline?.points) {
          return [...points, ...decodePoly(step.polyline.points)];
        }
        return points;
      }, []);

      if (allPoints.length === 0) {
        throw new Error('No route points available');
      }

      console.log(`Route decoded with ${allPoints.length} points`);
      setRouteCoordinates(allPoints);

      // Update route info with distance and duration
      setRouteInfo({
        distance: data.routes[0].legs[0].distance.text,
        duration: data.routes[0].legs[0].duration.text,
      });

      // Start simulation
      const interval = setInterval(() => {
        setCurrentPointIndex(prevIndex => {
          if (prevIndex >= allPoints.length - 1) {
            clearInterval(interval);
            setIsNavigating(false);
            setHasArrived(true);
            setVisitedStages(prev => [...new Set([...prev, 2])]);
            Alert.alert('Arrived', 'You have reached your destination! You can now proceed to Service Work.');
            return prevIndex;
          }

          const nextPoint = allPoints[prevIndex + 1];
          setCurrentLocation(nextPoint);

          // Update route info dynamically
          updateRouteInfo(prevIndex + 1, allPoints);

          const progress = ((prevIndex + 1) / allPoints.length * 100).toFixed(1);
          console.log(`Navigation progress: ${progress}%`);

          return prevIndex + 1;
        });
      }, UPDATE_INTERVAL);

      setSimulationInterval(interval);

      // Fit map to show route
      if (mapViewRef.current) {
        mapViewRef.current.fitToCoordinates([currentLocation, ...allPoints, destinationCoords], {
          edgePadding: {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100
          },
          animated: true
        });
      }

    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', error.message || 'Unable to fetch route information');
      setIsNavigating(false);
    }
  };

  // Stop navigation function
  const stopNavigation = () => {
    console.log('Stopping navigation');
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsNavigating(false);
    setRouteCoordinates([]);
    setCurrentPointIndex(0);
    setHasArrived(false);
    
    const dummyLocation = getDummyLocation();
    setCurrentLocation(dummyLocation);
  };

  const updateRouteInfo = (currentIndex, allPoints) => {
    if (currentIndex >= allPoints.length - 1) return;

    const remainingPoints = allPoints.slice(currentIndex);
    let remainingDistance = 0;

    for (let i = 0; i < remainingPoints.length - 1; i++) {
      remainingDistance += calculateDistance(
        remainingPoints[i].latitude,
        remainingPoints[i].longitude,
        remainingPoints[i + 1].latitude,
        remainingPoints[i + 1].longitude
      );
    }

    // Assuming an average speed of 50 km/h for estimation
    const averageSpeedKmh = 50;
    const remainingDurationHours = remainingDistance / averageSpeedKmh;
    const remainingDurationMinutes = remainingDurationHours * 60;

    setRouteInfo({
      distance: `${remainingDistance.toFixed(2)} km`,
      duration: `${Math.round(remainingDurationMinutes)} mins`,
    });
  };

  // Stage navigation handler
  const handleStagePress = (index) => {
    if (visitedStages.includes(index)) {
      if (stages[index].screen === 'ServiceTaskDetails') {
        navigation.navigate('ServiceTaskDetails', {
          jobNo: jobNo,
          workerId: workerId
        });
      } else if (stages[index].screen === 'ServiceWork' && hasArrived) {
        navigation.navigate('ServiceWork');
      } else {
        navigation.navigate(stages[index].screen);
      }
    }
  };

  // Navigation stages
  const stages = [
    { icon: 'check-circle', name: 'Details', screen: 'ServiceTaskDetails' },
    { icon: 'directions-car', name: 'Navigate', screen: 'NavigateMap' },
    { icon: 'build', name: 'Service', screen: 'ServiceWork' },
    { icon: 'assignment-turned-in', name: 'Complete', screen: 'Completion' },
  ];

  const currentStage = 1;

  // Calculate initial route info when component mounts
  useEffect(() => {
    if (currentLocation && destinationCoords && !initialRouteInfo) {
      const initial = calculateInitialRoute(currentLocation, destinationCoords);
      setInitialRouteInfo(initial);
      if (!routeInfo) {
        setRouteInfo(initial);
      }
    }
  }, [currentLocation, destinationCoords]);

  // Add these constants and states
  const EXPANDED_HEIGHT = 280; // Adjust based on your content
  const COLLAPSED_HEIGHT = 100;
  const translationY = useSharedValue(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // Add this gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startY = translationY.value;
    },
    onActive: (event, ctx) => {
      const newValue = ctx.startY + event.translationY;
      translationY.value = Math.min(EXPANDED_HEIGHT - COLLAPSED_HEIGHT, 
                                  Math.max(0, newValue));
    },
    onEnd: (event) => {
      const shouldExpand = event.velocityY < 0 || translationY.value < (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2;
      translationY.value = withSpring(
        shouldExpand ? 0 : EXPANDED_HEIGHT - COLLAPSED_HEIGHT,
        { damping: 15 }
      );
      runOnJS(setIsExpanded)(shouldExpand);
    },
  });

  // Add this animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigate to Location</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Stages */}
      <View style={styles.progressContainer}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.name}>
            <TouchableOpacity 
              onPress={() => handleStagePress(index)}
              style={[
                styles.stageButton,
                { opacity: visitedStages.includes(index) ? 1 : 0.5 }
              ]}
            >
              <Icon 
                name={stage.icon} 
                size={24} 
                color={visitedStages.includes(index) ? '#4a90e2' : '#ccc'} 
              />
              <Text style={[
                styles.stageText,
                { color: visitedStages.includes(index) ? '#4a90e2' : '#ccc' }
              ]}>
                {stage.name}
              </Text>
            </TouchableOpacity>
            {index < stages.length - 1 && (
              <View style={[
                styles.progressLine,
                { backgroundColor: index < currentStage ? '#4a90e2' : '#ccc' }
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Map */}
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
              title={locationName || "Destination"}
              description={location?.address?.streetAddress}
            >
              <View style={styles.destinationMarker}>
                <Icon name="location-on" size={30} color="red" />
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

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.locationDetails, animatedStyle]}>
          <View style={styles.dragHandle} />
          
          {isExpanded && routeInfo && (
            <View style={styles.routeInfo}>
              {/* Estimated Time Section */}
              <View style={styles.routeInfoItem}>
                <View style={styles.routeInfoContent}>
                  <Text style={styles.routeInfoTitle}>Estimated Time</Text>
                  <View style={styles.routeInfoValueContainer}>
                    <Icon name="access-time" size={16} color="#4a90e2" />
                    <Text style={styles.routeInfoValue}>{routeInfo.duration}</Text>
                  </View>
                  <Text style={styles.routeInfoDescription}>
                    Arrival at {initialRouteInfo?.eta || 'calculating...'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeInfoDivider} />

              {/* Distance Section */}
              <View style={styles.routeInfoItem}>
                <View style={styles.routeInfoContent}>
                  <Text style={styles.routeInfoTitle}>Distance</Text>
                  <View style={styles.routeInfoValueContainer}>
                    <Icon name="straighten" size={16} color="#4a90e2" />
                    <Text style={styles.routeInfoValue}>{routeInfo.distance}</Text>
                  </View>
                  <Text style={styles.routeInfoDescription}>
                    Via fastest route
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.locationHeader}>
            <Icon name="location-on" size={24} color="#4a90e2" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>{locationName}</Text>
              <Text numberOfLines={isExpanded ? undefined : 1} style={styles.locationAddress}>
                {location?.address?.streetAddress}, {location?.address?.city}, {location?.address?.postalCode}
              </Text>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, isNavigating && styles.activeButton]}
                onPress={isNavigating ? stopNavigation : startNavigation}
              >
                <Icon name="directions" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {isNavigating ? 'Stop Navigation' : 'Start Navigation'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Icon name="phone" size={24} color="#4a90e2" />
                <Text style={styles.secondaryButtonText}>Call Customer</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: '#4a90e2',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: 4,
    borderRadius: 20, // Make button oval
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stageButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#4a90e2',
    marginHorizontal: 8,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '100%',
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
  },
  locationDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  routeInfoItem: {
    flex: 1,
  },
  routeInfoContent: {
    alignItems: 'flex-start',
  },
  routeInfoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  routeInfoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  routeInfoDescription: {
    fontSize: 12,
    color: '#666',
  },
  routeInfoDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30, // Make button oval
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30, // Make button oval
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: '600',
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
});

export default NavigateMap;