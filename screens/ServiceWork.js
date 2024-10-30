import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, Dimensions, ActionSheetIOS, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ServiceWork = ({ navigation, route }) => {
  const [visitedStages, setVisitedStages] = useState([0, 1, 2]);

  const [tasks, setTasks] = useState([]);

  const stages = [
    { icon: 'check-circle', name: 'Details', screen: 'ServiceTaskDetails' },
    { icon: 'directions-car', name: 'Navigate', screen: 'NavigateMap' },
    { icon: 'build', name: 'Service', screen: 'ServiceWork' },
    { icon: 'assignment-turned-in', name: 'Complete', screen: 'Completion' }
  ];

  const currentStage = 2;

  const isWorkInProgress = () => {
    return timeTracking.startTime && !timeTracking.endTime;
  };

  const handleStagePress = (index) => {
    if (isWorkInProgress()) {
      Alert.alert(
        'Work in Progress',
        'Please end your current work before navigating away.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (visitedStages.includes(index)) {
      const navigationParams = {
        jobNo: route?.params?.jobNo,
        workerId: route?.params?.workerId,
        location: route?.params?.location,
        locationName: route?.params?.locationName,
        customerName: route?.params?.customerName
      };

      navigation.navigate(stages[index].screen, navigationParams);
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const allTasksCompleted = tasks.every(task => task.completed);

  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [signature, setSignature] = useState(null);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [timeTracking, setTimeTracking] = useState({
    startTime: null,
    endTime: null,
    breaks: [],
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [lastPauseTime, setLastPauseTime] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);

  const [equipments, setEquipments] = useState([]);

  // Add the effect to handle updated tasks from the Tasks screen
  useEffect(() => {
    if (route.params?.updatedTasks) {
      setTasks(route.params.updatedTasks);
    }
  }, [route.params?.updatedTasks]);

  // Add this useEffect to fetch equipment data
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const jobNo = route?.params?.jobNo;
        console.log('Fetching equipment for jobNo:', jobNo);

        if (!jobNo) {
          console.log('No jobNo provided, skipping fetch');
          return;
        }

        const jobRef = doc(db, 'jobs', jobNo);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          const equipmentArray = jobData.equipments || [];
          
          console.log('Job data:', jobData);
          console.log('Equipment array:', equipmentArray);
          console.log('Equipment count:', equipmentArray.length);
          
          equipmentArray.forEach((equip, index) => {
            console.log(`Equipment ${index + 1}:`, {
              brand: equip.Brand,
              type: equip.EquipmentType,
              model: equip.ModelSeries,
              serial: equip.SerialNo,
              location: equip.Notes
            });
          });
          
          setEquipments(equipmentArray);
        } else {
          console.log('Job document does not exist');
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
      }
    };

    fetchEquipment();
  }, [route?.params?.jobNo]);

  // Also add this useEffect to log when equipment state changes
  useEffect(() => {
    console.log('Equipment state updated:', equipments);
    console.log('Total equipment count:', equipments.length);
    
    const typeCount = equipments.reduce((acc, equip) => {
      const type = equip.EquipmentType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log('Equipment types breakdown:', typeCount);
  }, [equipments]);

  // Add this useEffect to fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const jobNo = route?.params?.jobNo;
        console.log('Fetching tasks for jobNo:', jobNo);

        if (!jobNo) {
          console.log('No jobNo provided, skipping task fetch');
          return;
        }

        const jobRef = doc(db, 'jobs', jobNo);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          const taskList = jobData.taskList || [];
          console.log('Tasks from Firebase:', taskList);
          console.log('Total tasks:', taskList.length);
          console.log('Completed tasks:', taskList.filter(t => t.completed).length);
          
          setTasks(taskList);
        } else {
          console.log('Job document does not exist');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [route?.params?.jobNo]);

  const handleStartWork = () => {
    Alert.alert(
      'Start Working',
      'Are you sure you want to start working?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: () => {
            console.log('Starting job...');
            const startTime = new Date();
            setTimeTracking(prev => ({
              ...prev,
              startTime: startTime,
            }));

            // Start the timer
            const interval = setInterval(() => {
              if (!isOnBreak) {
                const currentTime = new Date();
                const totalElapsedTime = currentTime - startTime;
                const actualElapsedTime = totalElapsedTime - totalPausedTime;
                const elapsedSeconds = Math.floor(actualElapsedTime / 1000);
                setElapsedTime(elapsedSeconds);
              }
            }, 1000);
            setTimerInterval(interval);
          }
        }
      ]
    );
  };

  const handleBreak = () => {
    console.log('Break button pressed. Current break status:', isOnBreak);
    
    if (!isOnBreak) {
      // Starting a break
      console.log('Starting break...');
      setLastPauseTime(new Date());
      setIsOnBreak(true);
      
      // Clear existing interval
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    } else {
      // Resuming work
      console.log('Resuming work...');
      const now = new Date();
      const pauseDuration = now - lastPauseTime;
      setTotalPausedTime(prev => prev + pauseDuration);
      setIsOnBreak(false);
      
      // Restart the timer
      const startTime = timeTracking.startTime;
      const interval = setInterval(() => {
        const currentTime = new Date();
        const totalElapsedTime = currentTime - startTime;
        const actualElapsedTime = totalElapsedTime - (totalPausedTime + pauseDuration);
        const elapsedSeconds = Math.floor(actualElapsedTime / 1000);
        setElapsedTime(elapsedSeconds);
      }, 1000);
      setTimerInterval(interval);
    }
  };

  const handleEndWork = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // If ending while on break, calculate final paused time
    if (isOnBreak && lastPauseTime) {
      const finalPauseDuration = new Date() - lastPauseTime;
      setTotalPausedTime(prev => prev + finalPauseDuration);
    }
    
    setTimeTracking(prev => ({
      ...prev,
      endTime: new Date(),
    }));
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const handleAddPhoto = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await takePhoto();
          } else if (buttonIndex === 2) {
            await pickImage();
          }
        }
      );
    } else {
      // For Android, show a simple Alert
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
        ],
        { cancelable: true }
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotos(prevPhotos => [...prevPhotos, {
          uri: result.assets[0].uri,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotos(prevPhotos => [...prevPhotos, {
          uri: result.assets[0].uri,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTechnicianSignature = () => {
    navigation.navigate('TechnicianSignature', {
      jobNo: route?.params?.jobNo,
      workerId: route?.params?.workerId,
    });
  };

  const handleCustomerSignature = () => {
    navigation.navigate('CustomerSignature', {
      jobNo: route?.params?.jobNo,
      workerId: route?.params?.workerId,
    });
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  // Add useEffect to log state changes
  useEffect(() => {
    console.log('isOnBreak changed:', isOnBreak);
  }, [isOnBreak]);

  useEffect(() => {
    console.log('timeTracking changed:', timeTracking);
  }, [timeTracking]);

  useEffect(() => {
    console.log('elapsedTime changed:', elapsedTime);
  }, [elapsedTime]);

  const handleBackPress = () => {
    if (isWorkInProgress()) {
      Alert.alert(
        'Work in Progress',
        'Please end your current work before leaving this screen.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.goBack();
  };

  useEffect(() => {
    console.log('ServiceWork - Initial Route Params:', {
      jobNo: route?.params?.jobNo,
      workerId: route?.params?.workerId,
      location: route?.params?.location,
    });
  }, []);

  // Add this new function near your other handlers
  const handleActionPress = (action) => {
    if (!timeTracking.startTime) {
      Alert.alert(
        'Start Work Required',
        'Please start work before accessing this feature.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // If work is started, proceed with the original action
    action.onPress();
  };

  // Update the quickActions mapping in the JSX
  const quickActions = [
    { 
      icon: 'assignment', 
      title: 'Tasks', 
      color: '#4a90e2', 
      count: `${tasks.filter(t => t.completed).length}/${tasks.length}`,
      onPress: () => {
        console.log('ServiceWork - Navigation Params:', {
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId
        });
        
        navigation.navigate('Tasks', { 
          taskList: tasks,
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId
        });
      }
    },
    { 
      icon: 'build', 
      title: 'Equipment', 
      color: '#9C27B0', 
      count: `${equipments.length} Items`,
      onPress: () => {
        navigation.navigate('Equipment', {
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId,
          equipment: equipments
        });
      }
    },
    
    { 
      icon: 'photo-camera', 
      title: 'Photos', 
      color: '#FF9800', 
      count: `${photos.length} Taken`,
      onPress: () => {
        navigation.navigate('Photos', {
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId,
          photos: photos
        });
      }
    },
    { 
      icon: 'description', 
      title: 'Report', 
      color: '#673AB7', 
      count: 'Required',
      onPress: () => handleReport()
    },
    { 
      icon: 'edit', 
      title: 'Technician Signature', 
      color: '#4CAF50', 
      count: 'Required',
      onPress: () => handleTechnicianSignature()
    },
    { 
      icon: 'person', 
      title: 'Customer Signature', 
      color: '#2196F3', 
      count: 'Required',
      onPress: () => handleCustomerSignature()
    }
   
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={[
            styles.headerButton,
            isWorkInProgress() && styles.disabledHeaderButton
          ]}
        >
          <Icon name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Work</Text>
        <TouchableOpacity 
          style={[
            styles.headerButton,
            isWorkInProgress() && styles.disabledHeaderButton
          ]}
          disabled={isWorkInProgress()}
        >
          <Icon name="more-horiz" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Icons */}
      <View style={styles.progressContainer}>
        {stages.map((stage, index) => (
          <React.Fragment key={stage.name}>
            <TouchableOpacity 
              onPress={() => handleStagePress(index)}
              style={[
                styles.stageButton,
                isWorkInProgress() && styles.disabledStageButton
              ]}
              disabled={isWorkInProgress()}
            >
              <Icon 
                name={stage.icon} 
                size={24} 
                color={visitedStages.includes(index) ? '#4a90e2' : '#ccc'} 
              />
              <Text style={[
                styles.stageText,
                { color: visitedStages.includes(index) ? '#4a90e2' : '#ccc' },
                isWorkInProgress() && styles.disabledStageText
              ]}>
                {stage.name}
              </Text>
            </TouchableOpacity>
            {index < stages.length - 1 && (
              <View style={[
                styles.progressLine,
                { backgroundColor: visitedStages.includes(index + 1) ? '#4a90e2' : '#ccc' }
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          {/* Improved Time Tracking Card */}
          <View style={styles.timeTrackingContainer}>
            <View style={styles.cardHeader}>
              <Icon name="schedule" size={24} color="#4a90e2" />
              <Text style={styles.cardTitle}>Time Tracking</Text>
            </View>
            
            {timeTracking.startTime ? (
              <View style={styles.timeInfo}>
                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Start Time</Text>
                    <Text style={styles.timeValue}>
                      {new Date(timeTracking.startTime).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Elapsed Time</Text>
                    <Text style={[styles.timeValue, styles.elapsedTime]}>
                      {formatElapsedTime(elapsedTime)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timeActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, isOnBreak ? styles.resumeButton : styles.breakButton]}
                    onPress={handleBreak}
                  >
                    <Icon 
                      name={isOnBreak ? "play-arrow" : "pause"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.actionButtonText}>
                      {isOnBreak ? 'Resume Work' : 'Take Break'}
                    </Text>
                  </TouchableOpacity>
                  
                  {!timeTracking.endTime && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.endButton]}
                      onPress={handleEndWork}
                    >
                      <Icon name="stop" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>End Work</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={handleStartWork}
              >
                <Icon name="play-arrow" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Start Work</Text>
              </TouchableOpacity>
            )}
          </View>
            {/* Updated Quick Actions Grid */}
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.quickActionCard}
                  onPress={() => handleActionPress(action)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${action.color}15` }]}>
                    <Icon name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionCount}>{action.count}</Text>
                </TouchableOpacity>
              ))}
            </View>

          {/* Enhanced Notes Section */}
          <View style={styles.notesSection}>
            <View style={styles.cardHeader}>
              <Icon name="note" size={24} color="#4a90e2" />
              <Text style={styles.cardTitle}>Technician Notes</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Enter technician notes..."
              value={notes}
              onChangeText={setNotes}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Complete Button */}
      <TouchableOpacity 
        style={[
          styles.completeButton,
          (!allTasksCompleted || !timeTracking.endTime) && styles.disabledButton
        ]}
        disabled={!allTasksCompleted || !timeTracking.endTime}
        onPress={() => {
          setVisitedStages(prev => [...new Set([...prev, 3])]);
          navigation.navigate('Completion', {
            jobNo: route?.params?.jobNo,
            workerId: route?.params?.workerId
          });
        }}
      >
        <Text style={styles.completeButtonText}>
          {!timeTracking.endTime 
            ? 'End Work Required'
            : !allTasksCompleted 
              ? 'Complete All Tasks'
              : 'Complete Service'
          }
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  timeTrackingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1E293B',
  },
  timeInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  breakButton: {
    backgroundColor: '#FF9800',
  },
  endButton: {
    backgroundColor: '#F44336',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (Dimensions.get('window').width - 44) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  quickActionCount: {
    fontSize: 12,
    color: '#64748B',
  },
  mainCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mainCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mainCardCount: {
    fontSize: 12,
    color: '#64748B',
  },
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1E293B',
  },
  completeButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  elapsedTime: {
    color: '#4a90e2',
    fontWeight: '700',
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
  resumeButton: {
    backgroundColor: '#4CAF50', // Green color for resume
  },
  disabledHeaderButton: {
    opacity: 0.5,
  },
  disabledStageButton: {
    opacity: 0.5,
  },
  disabledStageText: {
    opacity: 0.5,
  }
});

export default ServiceWork;
