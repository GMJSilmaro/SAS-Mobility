import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EquipmentScreen = ({ navigation, route }) => {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEquipmentData = async () => {
      try {
        const jobNo = route.params?.jobNo;
        
        if (!jobNo) {
          console.log('No jobNo provided');
          return;
        }

        const jobRef = doc(db, 'jobs', jobNo);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          const equipmentArray = jobData.equipments || [];
          
          // Debug logs
          console.log('All equipment array:', equipmentArray);
          equipmentArray.forEach((equip, index) => {
            console.log(`Equipment ${index + 1}:`, {
              brand: equip.brand,
              type: equip.equipmentType,
              model: equip.modelSeries,
              serial: equip.serialNo,
              location: equip.notes
            });
          });
          
          setEquipment(equipmentArray);
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        Alert.alert('Error', 'Failed to load equipment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipmentData();
  }, [route.params?.jobNo]);

  const handleEquipmentSelect = async (item) => {
    try {
      const jobNo = route.params?.jobNo;
      const workerId = route.params?.workerId;
      
      if (!jobNo) throw new Error('Job ID is required');
      if (!workerId) throw new Error('Worker ID is required');

      let updatedSelection;
      const isSelected = selectedEquipment.some(eq => eq.serialNo === item.serialNo);

      if (isSelected) {
        // Remove from selection
        updatedSelection = selectedEquipment.filter(eq => eq.serialNo !== item.serialNo);
      } else {
        // Add to selection with additional details
        const newSelection = {
          ...item,
          usedAt: new Date().toISOString(),
          usedBy: workerId,
          serviceNotes: '', // Optional field for service notes
          workDone: '', // Optional field for work performed
        };
        updatedSelection = [...selectedEquipment, newSelection];
      }

      // Update local state
      setSelectedEquipment(updatedSelection);

      // Update Firestore
      const jobRef = doc(db, 'jobs', jobNo);
      await updateDoc(jobRef, {
        usedEquipments: updatedSelection
      });

    } catch (error) {
      console.error('Error updating equipment selection:', error);
      Alert.alert('Error', 'Failed to update equipment selection');
    }
  };

  const EquipmentItem = ({ item }) => {
    const isSelected = selectedEquipment.some(eq => eq.serialNo === item.serialNo);
    const selectedDetails = selectedEquipment.find(eq => eq.serialNo === item.serialNo);

    return (
      <TouchableOpacity 
        style={[styles.equipmentItem, isSelected && styles.equipmentItemSelected]}
        onPress={() => handleEquipmentSelect(item)}
      >
        <View style={styles.equipmentHeader}>
          <View style={styles.equipmentTitleContainer}>
            <Icon 
              name={item.equipmentType?.toLowerCase().includes('wall') ? 'ac-unit' : 'build'} 
              size={24} 
              color={isSelected ? '#10B981' : '#4a90e2'} 
            />
            <View style={styles.titleContainer}>
              <Text style={styles.equipmentTitle}>
                {item.brand} {item.modelSeries}
              </Text>
              <Text style={styles.equipmentSubtitle}>
                {item.itemName}
              </Text>
            </View>
          </View>
          <View style={[styles.typeBadge, isSelected && styles.typeBadgeSelected]}>
            {isSelected ? (
              <Icon name="check-circle" size={20} color="#10B981" />
            ) : (
              <Text style={styles.typeText}>{item.equipmentType}</Text>
            )}
          </View>
        </View>

        <View style={styles.equipmentDetails}>
          <View style={styles.detailRow}>
            <Icon name="tag" size={20} color="#64748B" />
            <Text style={styles.detailText}>Serial: {item.serialNo}</Text>
          </View>
          {item.notes && (
            <View style={styles.detailRow}>
              <Icon name="location-on" size={20} color="#64748B" />
              <Text style={styles.detailText}>{item.notes}</Text>
            </View>
          )}
          {item.itemCode && (
            <View style={styles.detailRow}>
              <Icon name="qr-code" size={20} color="#64748B" />
              <Text style={styles.detailText}>Code: {item.itemCode}</Text>
            </View>
          )}
          {isSelected && selectedDetails?.usedAt && (
            <View style={styles.selectedInfo}>
              <View style={styles.detailRow}>
                <Icon name="access-time" size={20} color="#10B981" />
                <Text style={[styles.detailText, styles.selectedText]}>
                  Selected for service at {new Date(selectedDetails.usedAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading equipment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ServiceWork', {
            jobNo: route.params?.jobNo,
            workerId: route.params?.workerId,
            usedEquipment: selectedEquipment
          })}
          style={styles.headerButton}
        >
          <Icon name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Equipment</Text>
          <Text style={styles.headerStats}>
            Selected: {selectedEquipment.length}/{equipment.length} Items
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          <View style={styles.equipmentContainer}>
            <View style={styles.cardHeader}>
              <Icon name="list" size={24} color="#4a90e2" />
              <Text style={styles.cardTitle}>Select Equipment Used</Text>
            </View>
            
            {equipment.map((item, index) => (
              <EquipmentItem key={index} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#4a90e2',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerStats: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  summaryContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  equipmentContainer: {
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
  equipmentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipmentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  equipmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  typeBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  equipmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentItemSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  typeBadgeSelected: {
    backgroundColor: '#E6FCF5',
  },
  selectedText: {
    color: '#10B981',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  equipmentSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  selectedInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
});

export default EquipmentScreen; 