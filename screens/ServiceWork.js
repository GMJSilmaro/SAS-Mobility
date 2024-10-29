import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, Dimensions, ActionSheetIOS, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';

const ServiceWork = ({ navigation, route }) => {
  const [visitedStages, setVisitedStages] = useState([0, 1, 2]);

  const [tasks, setTasks] = useState([
    { 
      id: 1, 
      title: 'Initial Inspection',
      description: 'Check equipment status and document initial findings',
      completed: false,
      requiredPhotos: true,
      requiredNotes: true
    },
    { 
      id: 2, 
      title: 'Maintenance Work',
      description: 'Perform required maintenance tasks',
      completed: false,
      requiredParts: true,
      subtasks: [
        { id: 'a', title: 'Replace filters', completed: false },
        { id: 'b', title: 'Check fluid levels', completed: false },
      ]
    },
    { id: 3, title: 'Test functionality', completed: false },
    { id: 4, title: 'Document findings', completed: false },
  ]);

  const stages = [
    { icon: 'check-circle', name: 'Details', screen: 'ServiceTaskDetails' },
    { icon: 'directions-car', name: 'Navigate', screen: 'NavigateMap' },
    { icon: 'build', name: 'Service', screen: 'ServiceWork' },
    { icon: 'assignment-turned-in', name: 'Complete', screen: 'Completion' },
  ];

  const currentStage = 2;

  const handleStagePress = (index) => {
    if (visitedStages.includes(index)) {
      if (stages[index].screen === 'ServiceTaskDetails') {
        navigation.navigate('ServiceTaskDetails', {
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId
        });
      } else if (stages[index].screen === 'NavigateMap') {
        navigation.navigate('NavigateMap', {
          location: route?.params?.location,
          locationName: route?.params?.locationName,
          customerName: route?.params?.customerName,
          jobNo: route?.params?.jobNo,
          workerId: route?.params?.workerId
        });
      } else {
        navigation.navigate(stages[index].screen);
      }
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

  const handleStartWork = () => {
    setTimeTracking(prev => ({
      ...prev,
      startTime: new Date(),
    }));
  };

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

  const handleCaptureSignature = () => {
    navigation.navigate('SignatureScreen', {
      onSave: (signatureImage) => {
        setSignature({
          uri: signatureImage,
          timestamp: new Date(),
        });
      },
    });
  };

  const handleCaptureCustomerSignature = () => {
    navigation.navigate('SignatureScreen', {
      onSave: (signatureImage) => {
        setCustomerSignature({
          uri: signatureImage,
          timestamp: new Date(),
        });
      },
    });
  };

  const handleBreak = (isStarting) => {
    setTimeTracking(prev => ({
      ...prev,
      breaks: isStarting 
        ? [...prev.breaks, { start: new Date(), end: null }]
        : prev.breaks.map((break_, index) => 
            index === prev.breaks.length - 1 
              ? { ...break_, end: new Date() }
              : break_
          ),
    }));
  };

  const handleEndWork = () => {
    setTimeTracking(prev => ({
      ...prev,
      endTime: new Date(),
    }));
  };

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks(prevTasks => [...prevTasks, {
        id: Date.now(), // Simple way to generate unique ID
        title: newTaskTitle.trim(),
        completed: false
      }]);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  // Add new equipment state
  const [equipments, setEquipments] = useState([
    {
      id: 1,
      name: 'Air Compressor',
      model: 'AC-2000',
      serialNumber: 'SN123456',
      status: 'In Use',
      timestamp: new Date()
    },
    {
      id: 2,
      name: 'Power Generator',
      model: 'PG-5000',
      serialNumber: 'SN789012',
      status: 'Available',
      timestamp: new Date()
    },
    {
      id: 3,
      name: 'Welding Machine',
      model: 'WM-300',
      serialNumber: 'SN345678',
      status: 'In Use',
      timestamp: new Date()
    }
  ]);

  const handleAddEquipment = (equipment) => {
    setEquipments(prev => [...prev, {
      ...equipment,
      id: Date.now(),
      timestamp: new Date(),
    }]);
  };

  // Add new state for available equipment
  const [availableEquipments] = useState([
    {
      id: 'e1',
      name: 'Air Compressor',
      model: 'AC-2000',
      serialNumber: 'SN123456',
      status: 'Available'
    },
    {
      id: 'e2',
      name: 'Power Generator',
      model: 'PG-5000',
      serialNumber: 'SN789012',
      status: 'Available'
    },
    {
      id: 'e3',
      name: 'Welding Machine',
      model: 'WM-300',
      serialNumber: 'SN345678',
      status: 'Available'
    }
  ]);

  // Add function to handle equipment selection
  const handleEquipmentSelection = () => {
    Alert.alert(
      'Select Equipment',
      'Choose equipment to add to the service work',
      availableEquipments
        .filter(equip => !equipments.some(e => e.id === equip.id))
        .map(equip => ({
          text: `${equip.name} (${equip.model})`,
          onPress: () => {
            setEquipments(prev => [...prev, {
              ...equip,
              status: 'In Use',
              timestamp: new Date()
            }]);
          }
        }))
        .concat([
          { text: 'Cancel', style: 'cancel' }
        ])
    );
  };

  // Add to state declarations
  const [serviceHistory, setServiceHistory] = useState([
    {
      date: '2024-02-15',
      type: 'Maintenance',
      technician: 'John Doe',
      notes: 'Regular maintenance performed'
    }
  ]);

  // Add to state declarations
  const [safetyChecklist, setSafetyChecklist] = useState([
    { id: 's1', item: 'PPE Equipment Check', completed: false },
    { id: 's2', item: 'Work Area Safety Check', completed: false },
    { id: 's3', item: 'Tool Inspection', completed: false },
    { id: 's4', item: 'Emergency Procedures Review', completed: false }
  ]);

  // Add new function
  const toggleSafetyItem = (id) => {
    setSafetyChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Add to state declarations
  const [diagnosticReadings, setDiagnosticReadings] = useState([]);

  // Add new function
  const addDiagnosticReading = () => {
    Alert.prompt(
      'Add Reading',
      'Enter measurement details',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Add',
          onPress: (measurement) => {
            setDiagnosticReadings(prev => [...prev, {
              id: Date.now(),
              value: measurement,
              timestamp: new Date(),
              type: 'temperature' // or pressure, voltage, etc.
            }]);
          }
        }
      ]
    );
  };

  // Add to state declarations
  const [communicationLog, setCommunicationLog] = useState([]);

  // Add new function
  const addCommunicationEntry = () => {
    Alert.prompt(
      'Add Communication Entry',
      'Enter communication details',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Add',
          onPress: (details) => {
            setCommunicationLog(prev => [...prev, {
              id: Date.now(),
              details,
              timestamp: new Date(),
              type: 'customer-contact'
            }]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Work</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Tracking</Text>
          {!timeTracking.startTime ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleStartWork}
            >
              <Icon name="play-circle-filled" size={24} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timeInfo}>
              <Text>Started: {timeTracking.startTime.toLocaleTimeString()}</Text>
              
              {/* Add Time Management controls here */}
              <View style={styles.timeControls}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleBreak(true)}
                >
                  <Icon name="pause-circle-filled" size={24} color="#f57c00" />
                  <Text style={styles.actionButtonText}>Start Break</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleEndWork}
                >
                  <Icon name="stop-circle" size={24} color="#f44336" />
                  <Text style={styles.actionButtonText}>End Work</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Used</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEquipmentSelection}
          >
            <Icon name="add-circle" size={24} color="#4a90e2" />
            <Text style={styles.actionButtonText}>Add Equipment</Text>
          </TouchableOpacity>
          
          {/* Display equipment list */}
          {equipments.map(equipment => (
            <View key={equipment.id} style={styles.equipmentItem}>
              <View style={styles.equipmentHeader}>
                <Text style={styles.equipmentName}>{equipment.name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Remove Equipment',
                      `Remove ${equipment.name} from used equipments?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => setEquipments(prev => 
                            prev.filter(e => e.id !== equipment.id)
                          )
                        }
                      ]
                    );
                  }}
                >
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.equipmentDetail}>Model: {equipment.model}</Text>
              <Text style={styles.equipmentDetail}>S/N: {equipment.serialNumber}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Checklist</Text>
            <TouchableOpacity 
              style={styles.addTaskButton}
              onPress={() => setIsAddingTask(true)}
            >
              <Icon name="add-circle" size={24} color="#4a90e2" />
            </TouchableOpacity>
          </View>

          {isAddingTask && (
            <View style={styles.addTaskContainer}>
              <TextInput
                style={styles.addTaskInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Enter new task"
                autoFocus
              />
              <View style={styles.addTaskButtons}>
                <TouchableOpacity 
                  style={[styles.taskButton, styles.cancelButton]}
                  onPress={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.taskButton, styles.addButton]}
                  onPress={handleAddTask}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {tasks.map(task => (
            <TouchableOpacity 
              key={task.id}
              style={styles.taskItem}
              onPress={() => toggleTask(task.id)}
            >
              <Icon 
                name={task.completed ? "check-circle" : "radio-button-unchecked"}
                size={24}
                color={task.completed ? "#4CAF50" : "#666"}
              />
              <Text style={[
                styles.taskText,
                task.completed && styles.completedTask
              ]}>
                {task.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddPhoto}
          >
            <Icon name="camera-alt" size={24} color="#4a90e2" />
            <Text style={styles.actionButtonText}>Add Photo</Text>
          </TouchableOpacity>
          
          {/* Display photos grid */}
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                style={styles.photoThumbnail}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter detailed notes about the service..."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technician Signature</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCaptureSignature}
          >
            <Icon name="draw" size={24} color="#4a90e2" />
            <Text style={styles.actionButtonText}>
              {signature ? 'Update Signature' : 'Capture Signature'}
            </Text>
          </TouchableOpacity>
          
          {signature && (
            <View style={styles.signatureContainer}>
              <Image
                source={{ uri: signature.uri }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeSignatureButton}
                onPress={() => setSignature(null)}
              >
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Signature</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCaptureCustomerSignature}
          >
            <Icon name="draw" size={24} color="#4a90e2" />
            <Text style={styles.actionButtonText}>
              {customerSignature ? 'Update Customer Signature' : 'Capture Customer Signature'}
            </Text>
          </TouchableOpacity>
          
          {customerSignature && (
            <View style={styles.signatureContainer}>
              <Image
                source={{ uri: customerSignature.uri }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeSignatureButton}
                onPress={() => setCustomerSignature(null)}
              >
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service History</Text>
          {serviceHistory.map((record, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>{record.date}</Text>
              <Text style={styles.historyType}>{record.type}</Text>
              <Text style={styles.historyNotes}>{record.notes}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Checklist</Text>
          {safetyChecklist.map(item => (
            <TouchableOpacity 
              key={item.id}
              style={styles.checklistItem}
              onPress={() => toggleSafetyItem(item.id)}
            >
              <Icon 
                name={item.completed ? "check-circle" : "radio-button-unchecked"}
                size={24}
                color={item.completed ? "#4CAF50" : "#666"}
              />
              <Text style={styles.checklistText}>{item.item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Readings</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={addDiagnosticReading}
          >
            <Icon name="add-circle" size={24} color="#4a90e2" />
            <Text style={styles.actionButtonText}>Add Reading</Text>
          </TouchableOpacity>
          {diagnosticReadings.map((reading, index) => (
            <View key={index} style={styles.readingItem}>
              <Text>Value: {reading.value}</Text>
              <Text>Time: {reading.timestamp.toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.completeButton,
          !allTasksCompleted && styles.disabledButton
        ]}
        disabled={!allTasksCompleted}
        onPress={() => {
          setVisitedStages(prev => [...new Set([...prev, 3])]);
          navigation.navigate('Completion');
        }}
      >
        <Text style={styles.buttonText}>Complete Service</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
  },
  taskText: {
    marginLeft: 16,
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  section: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4a90e2',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timeInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  timeControls: {
    marginTop: 16,
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  photoThumbnail: {
    width: (Dimensions.get('window').width - 48) / 3,
    height: (Dimensions.get('window').width - 48) / 3,
    borderRadius: 8,
  },
  signatureImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTaskButton: {
    padding: 4,
  },
  addTaskContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addTaskInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    fontSize: 16,
  },
  addTaskButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  taskButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: '#4a90e2',
  },
  cancelButtonText: {
    color: '#666',
  },
  addButtonText: {
    color: '#fff',
  },
  equipmentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  equipmentStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  equipmentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  signatureContainer: {
    position: 'relative',
    marginTop: 8,
  },
  removeSignatureButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: '#666',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  checklistText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  partItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  partName: {
    fontSize: 16,
    fontWeight: '500',
  },
  partQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  readingItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default ServiceWork;
