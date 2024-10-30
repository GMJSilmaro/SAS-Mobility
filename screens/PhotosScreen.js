import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Alert,
  Platform,
  ActionSheetIOS,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PhotosScreen = ({ navigation, route }) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const jobNo = route.params?.jobNo;
        if (!jobNo) {
          setIsLoading(false);
          return;
        }

        const jobRef = doc(db, 'jobs', jobNo);
        const jobSnap = await getDoc(jobRef);
        
        if (jobSnap.exists()) {
          const jobData = jobSnap.data();
          setPhotos(jobData.photos || []);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [route.params?.jobNo]);

  const handleAddPhoto = () => {
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
        const newPhoto = {
          uri: result.assets[0].uri,
          timestamp: new Date().toISOString(),
          type: 'photo',
          description: ''
        };
        
        await savePhotoToFirestore([...photos, newPhoto]);
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
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
        const newPhoto = {
          uri: result.assets[0].uri,
          timestamp: new Date().toISOString(),
          type: 'photo',
          description: ''
        };
        
        await savePhotoToFirestore([...photos, newPhoto]);
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const savePhotoToFirestore = async (updatedPhotos) => {
    try {
      const jobNo = route.params?.jobNo;
      if (!jobNo) throw new Error('Job ID is required');

      const jobRef = doc(db, 'jobs', jobNo);
      await updateDoc(jobRef, {
        photos: updatedPhotos
      });
    } catch (error) {
      console.error('Error saving photo to Firestore:', error);
      Alert.alert('Error', 'Failed to save photo');
    }
  };

  const handleDeletePhoto = async (index) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);
            await savePhotoToFirestore(updatedPhotos);
            setPhotos(updatedPhotos);
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Icon name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Photos</Text>
          <Text style={styles.headerStats}>
            {photos.length} Photos Taken
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleAddPhoto}
        >
          <Icon name="add-a-photo" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.photoCard}
                onLongPress={() => handleDeletePhoto(index)}
              >
                <Image 
                  source={{ uri: photo.uri }} 
                  style={styles.photoImage}
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTimestamp}>
                    {new Date(photo.timestamp).toLocaleTimeString()}
                  </Text>
                  <Icon name="delete" size={20} color="#DC2626" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {photos.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="photo-library" size={48} color="#94A3B8" />
              <Text style={styles.emptyStateText}>No photos taken yet</Text>
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
              >
                <Icon name="add-a-photo" size={24} color="#fff" />
                <Text style={styles.addPhotoButtonText}>Take First Photo</Text>
              </TouchableOpacity>
            </View>
          )}
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: (Dimensions.get('window').width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  photoImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  photoTimestamp: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 24,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PhotosScreen; 