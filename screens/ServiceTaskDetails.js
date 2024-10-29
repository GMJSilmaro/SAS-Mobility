import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { COLORS } from '../constants';

const ServiceTaskDetails = ({ navigation, route }) => {
  const [jobData, setJobData] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});
  const { jobNo, workerId } = route.params;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  // Add this function to fetch worker details
  const fetchWorkerDetails = async (workerIds) => {
    try {
      const workerPromises = workerIds.map(async (worker) => {
        const userRef = doc(db, 'users', worker.workerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return { [worker.workerId]: userSnap.data() };
        }
        return { [worker.workerId]: null };
      });

      const workers = await Promise.all(workerPromises);
      const workersObj = workers.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setWorkerDetails(workersObj);
    } catch (error) {
      console.error('Error fetching worker details:', error);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const jobRef = doc(db, 'jobs', jobNo);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const data = jobSnap.data();
          setJobData(data);
          // Fetch worker details if there are assigned workers
          if (data.assignedWorkers?.length > 0) {
            fetchWorkerDetails(data.assignedWorkers);
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
    };

    fetchJobDetails();
  }, [jobNo]);

  // Add this function to check if worker has already accepted
  useEffect(() => {
    const checkAcceptanceStatus = () => {
      if (jobData?.acceptedWorkers?.includes(workerId)) {
        setHasAccepted(true);
      }
    };

    if (jobData) {
      checkAcceptanceStatus();
    }
  }, [jobData, workerId]);

  // Add this function to update job acceptance in Firestore
  const updateJobAcceptance = async () => {
    try {
      const jobRef = doc(db, 'jobs', jobNo);
      await updateDoc(jobRef, {
        acceptedWorkers: arrayUnion(workerId)
      });
      setHasAccepted(true);
    } catch (error) {
      console.error('Error updating job acceptance:', error);
      Alert.alert('Error', 'Failed to update job acceptance status');
    }
  };

  // Add this new function to reset job acceptance
  const resetJobAcceptance = async () => {
    try {
      const jobRef = doc(db, 'jobs', jobNo);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        const currentAcceptedWorkers = jobSnap.data().acceptedWorkers || [];
        const updatedAcceptedWorkers = currentAcceptedWorkers.filter(id => id !== workerId);
        
        await updateDoc(jobRef, {
          acceptedWorkers: updatedAcceptedWorkers
        });
        
        setHasAccepted(false);
        Alert.alert('Success', 'Job acceptance has been reset');
      }
    } catch (error) {
      console.error('Error resetting job acceptance:', error);
      Alert.alert('Error', 'Failed to reset job acceptance status');
    }
  };

  // Add this function to show reset confirmation
  const confirmReset = () => {
    Alert.alert(
      'Reset Acceptance',
      'Are you sure you want to reset your acceptance for this job?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetJobAcceptance
        }
      ]
    );
  };

  // Define stages with their properties
  const stages = [
    { icon: 'check-circle', name: 'Details', screen: 'ServiceTaskDetails' },
    { icon: 'directions-car', name: 'Navigate', screen: 'NavigateMap' },
    { icon: 'build', name: 'Service', screen: 'ServiceWork' },
    { icon: 'assignment-turned-in', name: 'Complete', screen: 'Completion' },
  ];

  const currentStage = 0;

  const handleStagePress = (index) => {
    if (index <= currentStage || (index === 1 && jobData)) {  // Allow Navigate stage if we have jobData
      if (stages[index].screen === 'NavigateMap') {
        navigation.navigate('NavigateMap', {
          location: jobData.location,
          locationName: jobData.locationName,
          customerName: jobData.customerName,
          jobNo: jobNo,
          workerId: workerId
        });
      } else {
        navigation.navigate(stages[index].screen);
      }
    }
  };

  // Add this new component for the confirmation modal
  const ConfirmationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showConfirmation}
      onRequestClose={() => setShowConfirmation(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Safety Confirmation</Text>
          </View>
          
          <View style={styles.modalBody}>
            <Icon name="check" size={40} color="#90EE90" style={styles.checkIcon} />
            <Text style={styles.confirmationText}>
              I confirm that I have completed the following points (as far as applicable) for this assignment:
            </Text>
            
            <View style={styles.confirmationPoints}>
              <Text style={styles.pointText}>
                - I, {workerDetails[workerId]?.fullName || 'Technician'}, am clear on the work that needs to be performed.
              </Text>
              <Text style={styles.pointText}>
                - Emergency exits, surrounding and possible environmental impacts have been assessed.
              </Text>
              <Text style={styles.pointText}>
                - Appropriate safety-measures have been taken prior to any work beginning.
              </Text>
            </View>
            
            <Text style={styles.safetyText}>Please work safe.</Text>

            <Pressable 
              style={styles.checkboxContainer}
              onPress={() => setIsAgreed(!isAgreed)}
            >
              <View style={styles.checkbox}>
                {isAgreed && <Icon name="check" size={16} color="#4a90e2" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the safety requirements above
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => {
                setShowConfirmation(false);
                setIsAgreed(false);
              }}
            >
              <Text style={styles.modalButtonText}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.confirmButton,
                !isAgreed && styles.disabledButton
              ]}
              disabled={!isAgreed}
              onPress={async () => {
                if (!hasAccepted) {
                  await updateJobAcceptance();
                }
                setShowConfirmation(false);
                setIsAgreed(false);
                navigation.navigate('NavigateMap', {
                  location: jobData.location,
                  locationName: jobData.locationName,
                  customerName: jobData.customerName,
                  jobNo: jobNo,           
                  workerId: workerId      
                });
              }}
            >
              <Text style={[
                styles.modalButtonText, 
                styles.confirmButtonText,
                !isAgreed && styles.disabledButtonText
              ]}>
                CONFIRM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Update the Accept Job button to show different text based on acceptance status
  const handleNavigatePress = () => {
    // Check if worker is assigned to this job
    const isAssigned = jobData?.assignedWorkers?.some(w => w.workerId === workerId);
    
    if (!isAssigned) {
      Alert.alert(
        'Access Denied',
        'You are not assigned to this job. Please contact your supervisor.'
      );
      return;
    }

    if (!jobData?.location?.coordinates) {
      Alert.alert(
        'Missing Location',
        'This job does not have valid location coordinates.'
      );
      return;
    }

    // Show confirmation modal only if not accepted before
    if (!hasAccepted) {
      setShowConfirmation(true);
    } else {
      navigation.navigate('NavigateMap', {
        location: jobData.location,
        locationName: jobData.locationName,
        customerName: jobData.customerName,
        jobNo: jobNo,
        workerId: workerId
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="more-vert" size={24} color="#fff" />
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
                color={index <= currentStage ? '#4a90e2' : '#ccc'} 
              />
              <Text style={[
                styles.stageText,
                { color: index <= currentStage ? '#4a90e2' : '#ccc' }
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

      {/* Main Content */}
      {jobData && (
        <View style={styles.mainContent}>
          {/* Time and Priority */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {jobData.startTime} - {jobData.endTime}
            </Text>
            <View style={[
              styles.priorityBadge,
              jobData.priority?.toLowerCase() === 'high' && styles.highPriorityBadge,
              jobData.priority?.toLowerCase() === 'medium' && styles.mediumPriorityBadge,
              jobData.priority?.toLowerCase() === 'low' && styles.lowPriorityBadge,
            ]}>
              <Text style={[
                styles.priorityText,
                jobData.priority?.toLowerCase() === 'high' && styles.highPriorityText,
              ]}>
                {jobData.priority}
              </Text>
            </View>
          </View>

          <Text style={styles.ticketTitle}>{jobData.jobName}</Text>
          
          <View style={styles.tagContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {jobData.jobContactType?.name || jobData.jobContactType || 'N/A'}
              </Text>
            </View>
            <View style={[styles.tag, styles.activeTag]}>
              <Text style={{ color: '#fff' }}>{jobData.jobStatus}</Text>
            </View>
          </View>

          {/* Job Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Information</Text>
            <View style={styles.detailRow}>
              <View style={styles.labelContainer}>
                <Icon name="assignment" size={20} color="#666" />
                <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Job No.</Text>
              </View>
              <Text style={styles.detailValue}>{jobData.jobNo}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.labelContainer}>
                <Icon name="confirmation-number" size={20} color="#666" />
                <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Service Call ID</Text>
              </View>
              <Text style={styles.detailValue}>{jobData.serviceCallID}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.labelContainer}>
                <Icon name="receipt" size={20} color="#666" />
                <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Sales Order ID</Text>
              </View>
              <Text style={styles.detailValue}>{jobData.salesOrderID}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.labelContainer}>
                <Icon name="schedule" size={20} color="#666" />
                <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Schedule Session</Text>
              </View>
              <Text style={styles.detailValue}>{jobData.scheduleSession}</Text>
            </View>
            {/*             
            <View style={styles.detailRow}>
              <View style={styles.labelContainer}>
                <Icon name="error-outline" size={20} color="#666" />
                <Text style={[styles.detailLabel, { marginLeft: 8 }]}>Problem Category</Text>
              </View>
              <Text style={styles.detailValue}>{jobData.problemCategory || 'N/A'}</Text>
            </View> */}
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <Icon name="person" size={24} color="#666" />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{jobData.customerName}</Text>
                  <Text style={styles.customerContact}>
                    Phone: {jobData.customerPhone || 'N/A'}
                  </Text>
                  <Text style={styles.customerContact}>
                    Email: {jobData.customerEmail || 'N/A'}
                  </Text>
                  <Text style={styles.customerContact}>
                    Contact Person: {jobData.contactPerson || 'N/A'}
                  </Text>
                  {jobData.customerNotes && (
                    <Text style={styles.customerNotes}>
                      Notes: {jobData.customerNotes}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Location Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Information</Text>
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <Icon name="location-on" size={24} color="#666" />
                <View style={styles.customerInfo}>
                  <Text style={styles.locationName}>{jobData.locationName}</Text>
                  <Text style={styles.customerContact}>
                    {jobData.location?.address?.streetAddress}
                  </Text>
                  <Text style={styles.customerContact}>
                    {jobData.location?.address?.city}, {jobData.location?.address?.state}
                  </Text>
                  <Text style={styles.customerContact}>
                    {jobData.location?.address?.postalCode}
                  </Text>
                  {jobData.locationNotes && (
                    <Text style={styles.customerNotes}>
                      Access Notes: {jobData.locationNotes}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('NavigateMap')}>
                  <Icon name="directions" size={24} color="#4a90e2" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Assigned Workers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Workers</Text>
            {jobData.assignedWorkers && jobData.assignedWorkers.map((worker, index) => {
              const userDetail = workerDetails[worker.workerId];
              const isCurrentUser = worker.workerId === workerId;
              
              return (
                <View key={index} style={[
                  styles.workerCard,
                  isCurrentUser && styles.currentWorkerCard
                ]}>
                  <View style={styles.workerHeader}>
                    <Icon 
                      name="engineering" 
                      size={24} 
                      color={isCurrentUser ? '#4a90e2' : '#666'} 
                    />
                    <View style={styles.workerInfo}>
                      <Text style={[
                        styles.workerName,
                        isCurrentUser && styles.currentWorkerName
                      ]}>
                        {userDetail?.fullName || userDetail?.displayName || `Worker ${worker.workerId}`}
                        {isCurrentUser && ' (You)'}
                      </Text>
                      <Text style={styles.workerDetail}>
                        Role: {userDetail?.role || 'Technician'}
                      </Text>
                      <Text style={styles.workerDetail}>
                        ID: {worker.workerId}
                      </Text>
                      {userDetail?.phone && (
                        <Text style={styles.workerDetail}>
                          Phone: {userDetail.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Service Requirements */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Task List</Text>
            {jobData.taskList && jobData.taskList.map((task, index) => (
              <View key={index} style={styles.workOrderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{task.taskName}</Text>
                  <Text style={styles.detailValue}>{task.isDone ? 'Completed' : 'Pending'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          {/* <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Icon name="description" size={20} color="#4a90e2" />
              <Text style={styles.secondaryButtonText}>View Manual</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Icon name="history" size={20} color="#4a90e2" />
              <Text style={styles.secondaryButtonText}>Service History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Icon name="chat" size={20} color="#4a90e2" />
              <Text style={styles.secondaryButtonText}>Support</Text>
            </TouchableOpacity>
          </View> */}

          {/* Navigate Button */}
          <View style={styles.buttonContainer}>
            {hasAccepted ? (
              <>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={handleNavigatePress}
                >
                  <Text style={styles.acceptButtonText}>
                    PROCEED TO NAVIGATION
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.acceptButton, styles.resetButton]}
                  onPress={confirmReset}
                >
                  <Text style={styles.acceptButtonText}>
                    CANCEL JOB
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={handleNavigatePress}
              >
                <Text style={styles.acceptButtonText}>
                  START JOB
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ConfirmationModal />
        </View>
      )}
    </ScrollView>
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
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#4a90e2',
    marginHorizontal: 8,
  },
  mainContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#666',
  },
  priorityBadge: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0', // default color
  },
  highPriorityBadge: {
    backgroundColor: '#ffebee', // light red background
    borderWidth: 1,
    borderColor: '#ef5350', // red border
  },
  mediumPriorityBadge: {
    backgroundColor: '#fff3e0', // light yellow background
    borderWidth: 1,
    borderColor: '#ffd700', // yellow border
  },
  lowPriorityBadge: {
    backgroundColor: '#e8f5e9', // light green background
    borderWidth: 1,
    borderColor: '#4caf50', // green border
  },
  priorityText: {
    fontSize: 12,
    color: '#000',
  },
  highPriorityText: {
    color: '#d32f2f', // dark red text
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  activeTag: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: '#000',
    fontSize: 12,
  },
  detailsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '500',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  relatedItemText: {
    marginLeft: 16,
  },
  relatedItemTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  relatedItemDetail: {
    color: '#666',
    fontSize: 13,
  },
  customerCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  customerContact: {
    color: '#666',
    fontSize: 14,
  },
  customerNotes: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  secondaryButtonText: {
    color: '#4a90e2',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 30,
    marginTop: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  workerDetail: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentWorkerCard: {
    borderWidth: 1,
    borderColor: '#4a90e2',
    backgroundColor: '#f0f8ff',
  },
  currentWorkerName: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#4267B2', // Facebook blue color
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  checkIcon: {
    marginBottom: 15,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  confirmationPoints: {
    width: '100%',
    marginVertical: 15,
  },
  pointText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  safetyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#f0f8ff',
  },
  confirmButtonText: {
    color: '#4a90e2',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  disabledButtonText: {
    color: '#999',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 12,
  },
  resetButton: {
    backgroundColor: '#dc3545',
    borderRadius: 30,
  }
});

export default ServiceTaskDetails;
