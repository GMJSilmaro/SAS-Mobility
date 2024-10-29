import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import Button from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import CheckBox from 'expo-checkbox';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { COLORS } from '../constants';

const JobsImages = ({ navigation, route }) => {
  const { jobNo, workerId } = route.params;
  const [images, setImages] = useState([null, null, null, null, null, null, null, null]);
  const [damageReported, setDamageReported] = useState(false);
  const [showMoreImages, setShowMoreImages] = useState(false);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your camera roll to upload images.');
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExistingImages();
    }, [navigation])
  );

  const fetchExistingImages = async () => {
    try {
      const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingImages = docSnap.data().imageReports?.[0]?.images || [];
        let newImages = [...images];
        for (let i = 0; i < existingImages.length; i++) {
          newImages[i] = existingImages[i];
        }
        setImages(newImages);
      }
    } catch (error) {
      console.error("Error fetching existing images:", error);
    }
  };

  const uploadImageAsync = async (uri, index) => {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const blob = await response.blob();
    const imageRef = ref(storage, `jobs/${jobNo}-${workerId}/${index}`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  };

  const pickImage = async (index) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('ImagePicker Result:', result);

      if (!result.canceled) {
        const uploadURL = await uploadImageAsync(result.assets[0].uri, index);
        let newImages = [...images];
        newImages[index] = uploadURL;
        setImages(newImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick the image.');
    }
  };

  const handleSubmit = async () => {
    if (images.every(image => image === null)) {
      Alert.alert("Error", "Please upload at least one image.");
      return;
    }

    try {
      const uploadPromises = images.map((image, index) => {
        if (image !== null && image.startsWith("file")) {
          return uploadImageAsync(image, index);
        }
        return image;
      });

      const downloadURLs = await Promise.all(uploadPromises);

      const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
      const docSnap = await getDoc(docRef);

      let updatedImages = images;
      if (docSnap.exists()) {
        const existingImageReport = docSnap.data().imageReports?.[0];
        if (existingImageReport) {
          updatedImages = existingImageReport.images.map((url, index) => downloadURLs[index] || url);
        }
      }

      const imageReport = {
        images: updatedImages,
        damageReported,
      };

      console.log("Submitting image report:", imageReport);

      await updateDoc(docRef, {
        imageReports: [imageReport],  // Replace the entire imageReports array
      });

      Alert.alert("Success", "Images uploaded successfully.");
      console.log("Images uploaded successfully.");
      fetchExistingImages();
    } catch (error) {
      Alert.alert("Error", "Failed to upload images.");
      console.error("Failed to upload images:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Header title="Worker Side" />
        <Text style={styles.instruction}>Take at least 1 photo of the building or any proof of job completed!</Text>
        <View style={styles.imageContainer}>
          {images.slice(0, 4).map((image, index) => (
            <TouchableOpacity key={index} onPress={() => pickImage(index)} style={styles.imageBox}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <AntDesign name="camera" size={40} color="gray" />
              )}
            </TouchableOpacity>
          ))}
          {showMoreImages && images.slice(4).map((image, index) => (
            <TouchableOpacity key={index + 4} onPress={() => pickImage(index + 4)} style={styles.imageBox}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <AntDesign name="camera" size={40} color="gray" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => setShowMoreImages(!showMoreImages)} style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>
            {showMoreImages ? "Hide" : "Show More"}
          </Text>
        </TouchableOpacity>
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            <AntDesign name="exclamationcircleo" size={16} color="red" />
            Caused any damage during the job? Please tick the box below.
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={damageReported}
            onValueChange={setDamageReported}
            color="#6200EE"
            style={styles.checkbox}
          />
          <Text style={styles.checkboxLabel}>
            I caused damage during the job. <Text style={styles.learnMore}>Learn more</Text>
          </Text>
        </View>
        <Button title="Submit" onPress={handleSubmit} filled style={styles.submitButton} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  instruction: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageBox: {
    width: '48%',
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  warningContainer: {
    marginVertical: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
  },
  warningText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  learnMore: {
    color: 'blue',
  },
  submitButton: {
    marginTop: 15,
  },
  toggleButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleButtonText: {
    fontSize: 16,
    color: COLORS.primary, 
  },
});

export default JobsImages;


// import React, { useState, useEffect, useCallback } from 'react';
// import { StyleSheet, Text, View, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
// import { AntDesign } from '@expo/vector-icons';
// import { useFocusEffect } from '@react-navigation/native';
// import Header from '../components/Header';
// import Button from '../components/Button';
// import * as ImagePicker from 'expo-image-picker';
// import CheckBox from 'expo-checkbox';
// import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage } from '../firebase';
// import { COLORS } from '../constants';

// const JobsImages = ({ navigation, route }) => {
//   const { jobNo, workerId } = route.params;
//   const [images, setImages] = useState([null, null, null, null, null, null, null, null]);
//   const [damageReported, setDamageReported] = useState(false);
//   const [showMoreImages, setShowMoreImages] = useState(false);

//   const requestPermission = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Denied', 'We need access to your camera roll to upload images.');
//     }
//   };

//   useEffect(() => {
//     requestPermission();
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       fetchExistingImages();
//     }, [navigation])
//   );

//   const fetchExistingImages = async () => {
//     try {
//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       const docSnap = await getDoc(docRef);
//       if (docSnap.exists()) {
//         const existingImages = docSnap.data().imageReports?.[0]?.images || [];
//         let newImages = [...images];
//         for (let i = 0; i < existingImages.length; i++) {
//           newImages[i] = existingImages[i];
//         }
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error("Error fetching existing images:", error);
//     }
//   };

//   const uploadImageAsync = async (uri, index) => {
//     const response = await fetch(uri);
//     if (!response.ok) {
//       throw new Error(`Network response was not ok: ${response.statusText}`);
//     }
//     const blob = await response.blob();
//     const imageRef = ref(storage, `jobs/${jobNo}-${workerId}/${index}`);
//     await uploadBytes(imageRef, blob);
//     const downloadURL = await getDownloadURL(imageRef);
//     return downloadURL;
//   };

//   const pickImage = async (index) => {
//     try {
//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       console.log('ImagePicker Result:', result);

//       if (!result.canceled) {
//         const uploadURL = await uploadImageAsync(result.assets[0].uri, index);
//         let newImages = [...images];
//         newImages[index] = uploadURL;
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick the image.');
//     }
//   };

//   const handleSubmit = async () => {
//     if (images.every(image => image === null)) {
//       Alert.alert("Error", "Please upload at least one image.");
//       return;
//     }

//     try {
//       const uploadPromises = images.map((image, index) => {
//         if (image !== null && image.startsWith("file")) {
//           return uploadImageAsync(image, index);
//         }
//         return image;
//       });

//       const downloadURLs = await Promise.all(uploadPromises);

//       const imageReport = {
//         images: downloadURLs.filter(url => url !== null),
//         damageReported,
//       };

//       console.log("Submitting image report:", imageReport);

//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       await updateDoc(docRef, {
//         imageReports: arrayUnion(imageReport),
//       });

//       Alert.alert("Success", "Images uploaded successfully.");
//       console.log("Images uploaded successfully.");
//       fetchExistingImages();
//     } catch (error) {
//       Alert.alert("Error", "Failed to upload images.");
//       console.error("Failed to upload images:", error);
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContainer}>
//       <View style={styles.container}>
//         <Header title="Worker Side" />
//         <Text style={styles.instruction}>Take at least 1 photo of the building or any proof of job completed!</Text>
//         <View style={styles.imageContainer}>
//           {images.slice(0, 4).map((image, index) => (
//             <TouchableOpacity key={index} onPress={() => pickImage(index)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//           {showMoreImages && images.slice(4).map((image, index) => (
//             <TouchableOpacity key={index + 4} onPress={() => pickImage(index + 4)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//         </View>
//         <TouchableOpacity onPress={() => setShowMoreImages(!showMoreImages)} style={styles.toggleButton}>
//           <Text style={styles.toggleButtonText}>
//             {showMoreImages ? "Hide" : "Show More"}
//           </Text>
//         </TouchableOpacity>
//         <View style={styles.warningContainer}>
//           <Text style={styles.warningText}>
//             <AntDesign name="exclamationcircleo" size={16} color="red" />
//             Caused any damage during the job? Please tick the box below.
//           </Text>
//         </View>
//         <View style={styles.checkboxContainer}>
//           <CheckBox
//             value={damageReported}
//             onValueChange={setDamageReported}
//             color="#6200EE"
//             style={styles.checkbox}
//           />
//           <Text style={styles.checkboxLabel}>
//             I caused damage during the job. <Text style={styles.learnMore}>Learn more</Text>
//           </Text>
//         </View>
//         <Button title="Submit" onPress={handleSubmit} filled style={styles.submitButton} />
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 16,
//   },
//   instruction: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   imageContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   imageBox: {
//     width: '48%',
//     height: 150,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     borderRadius: 8,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   warningContainer: {
//     marginVertical: 16,
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#fff5f5',
//   },
//   warningText: {
//     color: 'red',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   checkbox: {
//     marginRight: 8,
//   },
//   checkboxLabel: {
//     fontSize: 16,
//   },
//   learnMore: {
//     color: 'blue',
//   },
//   submitButton: {
//     marginTop: 15,
//   },
//   toggleButton: {
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   toggleButtonText: {
//     fontSize: 16,
//     color: COLORS.primary, 
//   },
// });

// export default JobsImages;

// import React, { useState, useEffect } from 'react';
// import { StyleSheet, Text, View, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
// import { AntDesign } from '@expo/vector-icons';
// import Header from '../components/Header';
// import Button from '../components/Button';
// import * as ImagePicker from 'expo-image-picker';
// import CheckBox from 'expo-checkbox';
// import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage } from '../firebase';
// import { COLORS } from '../constants';

// const JobsImages = ({ navigation, route }) => {
//   const { jobNo, workerId } = route.params;
//   const [images, setImages] = useState([null, null, null, null, null, null, null, null]);
//   const [damageReported, setDamageReported] = useState(false);
//   const [showMoreImages, setShowMoreImages] = useState(false);

//   const requestPermission = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Denied', 'We need access to your camera roll to upload images.');
//     }
//   };

//   useEffect(() => {
//     requestPermission();
//     fetchExistingImages();
//   }, []);

//   const fetchExistingImages = async () => {
//     try {
//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       const docSnap = await getDoc(docRef);
//       if (docSnap.exists()) {
//         const existingImages = docSnap.data().imageReports?.[0]?.images || [];
//         let newImages = [...images];
//         for (let i = 0; i < existingImages.length; i++) {
//           newImages[i] = existingImages[i];
//         }
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error("Error fetching existing images:", error);
//     }
//   };

//   const uploadImageAsync = async (uri, index) => {
//     const response = await fetch(uri);
//     if (!response.ok) {
//       throw new Error(`Network response was not ok: ${response.statusText}`);
//     }
//     const blob = await response.blob();
//     const imageRef = ref(storage, `jobs/${jobNo}-${workerId}/${index}`);
//     await uploadBytes(imageRef, blob);
//     const downloadURL = await getDownloadURL(imageRef);
//     return downloadURL;
//   };

//   const pickImage = async (index) => {
//     try {
//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       console.log('ImagePicker Result:', result);

//       if (!result.canceled) {
//         const uploadURL = await uploadImageAsync(result.assets[0].uri, index);
//         let newImages = [...images];
//         newImages[index] = uploadURL;
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick the image.');
//     }
//   };

//   const handleSubmit = async () => {
//     if (images.every(image => image === null)) {
//       Alert.alert("Error", "Please upload at least one image.");
//       return;
//     }

//     try {
//       const uploadPromises = images.map((image, index) => {
//         if (image !== null && image.startsWith("file")) {
//           return uploadImageAsync(image, index);
//         }
//         return image;
//       });

//       const downloadURLs = await Promise.all(uploadPromises);

//       const imageReport = {
//         images: downloadURLs.filter(url => url !== null),
//         damageReported,
//       };

//       console.log("Submitting image report:", imageReport);

//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       await updateDoc(docRef, {
//         imageReports: arrayUnion(imageReport),
//       });

//       Alert.alert("Success", "Images uploaded successfully.");
//       console.log("Images uploaded successfully.");
//       fetchExistingImages();
//     } catch (error) {
//       Alert.alert("Error", "Failed to upload images.");
//       console.error("Failed to upload images:", error);
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContainer}>
//       <View style={styles.container}>
//         <Header title="Worker Side" />
//         <Text style={styles.instruction}>Take at least 1 photo of the building or any proof of job completed!</Text>
//         <View style={styles.imageContainer}>
//           {images.slice(0, 4).map((image, index) => (
//             <TouchableOpacity key={index} onPress={() => pickImage(index)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//           {showMoreImages && images.slice(4).map((image, index) => (
//             <TouchableOpacity key={index + 4} onPress={() => pickImage(index + 4)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//         </View>
//         <TouchableOpacity onPress={() => setShowMoreImages(!showMoreImages)} style={styles.toggleButton}>
//           <Text style={styles.toggleButtonText}>
//             {showMoreImages ? "Hide" : "Show More"}
//           </Text>
//         </TouchableOpacity>
//         <View style={styles.warningContainer}>
//           <Text style={styles.warningText}>
//             <AntDesign name="exclamationcircleo" size={16} color="red" />
//             Caused any damage during the job? Please tick the box below.
//           </Text>
//         </View>
//         <View style={styles.checkboxContainer}>
//           <CheckBox
//             value={damageReported}
//             onValueChange={setDamageReported}
//             color="#6200EE"
//             style={styles.checkbox}
//           />
//           <Text style={styles.checkboxLabel}>
//             I caused damage during the job. <Text style={styles.learnMore}>Learn more</Text>
//           </Text>
//         </View>
//         <Button title="Submit" onPress={handleSubmit} filled style={styles.submitButton} />
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 16,
//   },
//   instruction: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   imageContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   imageBox: {
//     width: '48%',
//     height: 150,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     borderRadius: 8,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   warningContainer: {
//     marginVertical: 16,
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#fff5f5',
//   },
//   warningText: {
//     color: 'red',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   checkbox: {
//     marginRight: 8,
//   },
//   checkboxLabel: {
//     fontSize: 16,
//   },
//   learnMore: {
//     color: 'blue',
//   },
//   submitButton: {
//     marginTop: 15,
//   },
//   toggleButton: {
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   toggleButtonText: {
//     fontSize: 16,
//     color: COLORS.primary, 
//   },
// });

// export default JobsImages;



// import React, { useState, useEffect } from 'react';
// import { StyleSheet, Text, View, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
// import { AntDesign } from '@expo/vector-icons';
// import Header from '../components/Header';
// import Button from '../components/Button';
// import * as ImagePicker from 'expo-image-picker';
// import CheckBox from 'expo-checkbox';
// import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage } from '../firebase';
// import { COLORS } from '../constants';

// const JobsImages = ({ navigation, route }) => {
//   const { jobNo, workerId } = route.params;
//   const [images, setImages] = useState([null, null, null, null, null, null, null, null]);
//   const [damageReported, setDamageReported] = useState(false);
//   const [showMoreImages, setShowMoreImages] = useState(false);

//   const requestPermission = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Permission Denied', 'We need access to your camera roll to upload images.');
//     }
//   };

//   useEffect(() => {
//     requestPermission();
//     fetchExistingImages();
//   }, []);

//   const fetchExistingImages = async () => {
//     try {
//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       const docSnap = await getDoc(docRef);
//       if (docSnap.exists()) {
//         const existingImages = docSnap.data().imageReports?.[0]?.images || [];
//         let newImages = [...images];
//         for (let i = 0; i < existingImages.length; i++) {
//           newImages[i] = existingImages[i];
//         }
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error("Error fetching existing images:", error);
//     }
//   };

//   const uploadImageAsync = async (uri, index) => {
//     const response = await fetch(uri);
//     const blob = await response.blob();
//     const imageRef = ref(storage, `jobs/${jobNo}-${workerId}/${index}`);
//     await uploadBytes(imageRef, blob);
//     const downloadURL = await getDownloadURL(imageRef);
//     return downloadURL;
//   };

//   const pickImage = async (index) => {
//     try {
//       let result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       console.log('ImagePicker Result:', result);

//       if (!result.cancelled) {
//         const uploadURL = await uploadImageAsync(result.assets[0].uri, index);
//         let newImages = [...images];
//         newImages[index] = uploadURL;
//         setImages(newImages);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick the image.');
//     }
//   };

//   const handleSubmit = async () => {
//     if (images.every(image => image === null)) {
//       Alert.alert("Error", "Please upload at least one image.");
//       return;
//     }
  
//     const uploadImageAsync = async (uri, index) => {
//       const response = await fetch(uri);
//       const blob = await response.blob();
//       const imageRef = ref(storage, `jobs/${jobNo}-${workerId}/${index}`);
//       await uploadBytes(imageRef, blob);
//       const downloadURL = await getDownloadURL(imageRef);
//       return downloadURL;
//     };
  
//     try {
//       // Upload images and get download URLs
//       const uploadPromises = images.map((image, index) => {
//         if (image !== null) {
//           return uploadImageAsync(image.uri, index);
//         }
//         return null;
//       });
//       const downloadURLs = await Promise.all(uploadPromises);
  
//       const imageReport = {
//         images: downloadURLs.filter(url => url !== null),
//         damageReported,
//       };
  
//       console.log("Submitting image report:", imageReport);
  
//       const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//       await updateDoc(docRef, {
//         imageReports: arrayUnion(imageReport),
//       });
  
//       Alert.alert("Success", "Images uploaded successfully.");
//       console.log("Images uploaded successfully.");
//       fetchExistingImages(); // Refresh the existing images
//     } catch (error) {
//       Alert.alert("Error", "Failed to upload images.");
//       console.error("Failed to upload images:", error);
//     }
//   };

//   // const handleSubmit = async () => {
//   //   if (images.every(image => image === null)) {
//   //     Alert.alert("Error", "Please upload at least one image.");
//   //     return;
//   //   }

//   //   const imageReport = {
//   //     images: images.filter(image => image !== null),
//   //     damageReported,
//   //   };

//   //   console.log("Submitting image report:", imageReport);

//   //   try {
//   //     const docRef = doc(db, 'workerStatus', `${jobNo}-${workerId}`);
//   //     await updateDoc(docRef, {
//   //       imageReports: arrayUnion(imageReport),
//   //     });
//   //     Alert.alert("Success", "Images uploaded successfully.");
//   //     console.log("Images uploaded successfully.");
//   //     fetchExistingImages(); // Refresh the existing images
//   //   } catch (error) {
//   //     Alert.alert("Error", "Failed to upload images.");
//   //     console.error("Failed to upload images:", error);
//   //   }
//   // };

//   return (
//     <ScrollView contentContainerStyle={styles.scrollContainer}>
//       <View style={styles.container}>
//         <Header title="Worker Side" />
//         <Text style={styles.instruction}>Take at least 1 photo of the building or any proof of job completed!</Text>
//         <View style={styles.imageContainer}>
//           {images.slice(0, 4).map((image, index) => (
//             <TouchableOpacity key={index} onPress={() => pickImage(index)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//           {showMoreImages && images.slice(4).map((image, index) => (
//             <TouchableOpacity key={index + 4} onPress={() => pickImage(index + 4)} style={styles.imageBox}>
//               {image ? (
//                 <Image source={{ uri: image }} style={styles.image} />
//               ) : (
//                 <AntDesign name="camera" size={40} color="gray" />
//               )}
//             </TouchableOpacity>
//           ))}
//         </View>
//         <TouchableOpacity onPress={() => setShowMoreImages(!showMoreImages)} style={styles.toggleButton}>
//           <Text style={styles.toggleButtonText}>
//             {showMoreImages ? "Hide" : "Show More"}
//           </Text>
//         </TouchableOpacity>
//         <View style={styles.warningContainer}>
//           <Text style={styles.warningText}>
//             <AntDesign name="exclamationcircleo" size={16} color="red" />
//             Caused any damage during the job? Please tick the box below.
//           </Text>
//         </View>
//         <View style={styles.checkboxContainer}>
//           <CheckBox
//             value={damageReported}
//             onValueChange={setDamageReported}
//             color="#6200EE"
//             style={styles.checkbox}
//           />
//           <Text style={styles.checkboxLabel}>
//             I caused damage during the job. <Text style={styles.learnMore}>Learn more</Text>
//           </Text>
//         </View>
//         <Button title="Submit" onPress={handleSubmit} filled style={styles.submitButton} />
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 16,
//   },
//   instruction: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   imageContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   imageBox: {
//     width: '48%',
//     height: 150,
//     backgroundColor: '#f0f0f0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//     borderRadius: 8,
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//   },
//   warningContainer: {
//     marginVertical: 16,
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: '#fff5f5',
//   },
//   warningText: {
//     color: 'red',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   checkboxContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 5,
//   },
//   checkbox: {
//     marginRight: 8,
//   },
//   checkboxLabel: {
//     fontSize: 16,
//   },
//   learnMore: {
//     color: 'blue',
//   },
//   submitButton: {
//     marginTop: 15,
//   },
//   toggleButton: {
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   toggleButtonText: {
//     fontSize: 16,
//     color: COLORS.primary, 
//   },
// });

// export default JobsImages;
