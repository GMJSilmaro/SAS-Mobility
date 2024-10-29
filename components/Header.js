// Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Header = ({ title }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    zIndex: 10, // Ensures the header is on top
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;


// import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
// import React from 'react';
// import { SIZES, COLORS, icons } from '../constants';
// import { useNavigation } from '@react-navigation/native';

// const Header = ({ title }) => {
//   const navigation = useNavigation();

//   return (
//     <View style={[styles.container, {
//       backgroundColor: COLORS.white
//     }]}>
//       <TouchableOpacity
//         onPress={() => navigation.goBack()}>
//         <Image
//           source={icons.back}
//           resizeMode='contain'
//           style={[styles.backIcon, {
//             tintColor: COLORS.greyscale900
//           }]} />
//       </TouchableOpacity>
//       <Text style={[styles.title, {
//         color: COLORS.greyscale900
//       }]}>{title}</Text>
//     </View>
//   )
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: COLORS.white,
//     width: SIZES.width - 32,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   backIcon: {
//     width: 24,
//     height: 24,
//     marginRight: 16
//   },
//   title: {
//     fontSize: 24,
//     fontFamily: "bold",
//     color: COLORS.black
//   }
// })

// export default Header