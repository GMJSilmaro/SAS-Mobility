import React, { useCallback, useEffect, useReducer, useState } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, SIZES, icons, images } from '../constants'
import Header from '../components/Header'
import { reducer } from '../utils/reducers/formReducers'
import { validateInput } from '../utils/actions/formActions'
import Input from '../components/Input'
import Checkbox from 'expo-checkbox'
import Button from '../components/Button'
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { fetchUserData } from '../utils/fetchUserData' // Import the helper function

const isTestMode = true

const initialState = {
    inputValues: {
        workerId: isTestMode ? 'testWorkerId' : '',
        password: isTestMode ? '**********' : '',
    },
    inputValidities: {
        workerId: false,
        password: false,
    },
    formIsValid: false,
}

const Login = ({ navigation }) => {
    const [formState, dispatchFormState] = useReducer(reducer, initialState)
    const [error, setError] = useState(null)
    const [isChecked, setChecked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const inputChangedHandler = useCallback(
        (inputId, inputValue) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({ inputId, validationResult: result, inputValue })
        },
        [dispatchFormState]
    )

    useEffect(() => {
        if (error) {
            setTimeout(() => setError(null), 5000) // Reset error after 3 seconds
        }
    }, [error])

    const loginHandler = async () => {
        const { workerId, password } = formState.inputValues
        setIsLoading(true)
        try {
            const userData = await fetchUserData(workerId)

            if (!userData.activeUser) {
                throw new Error('User is not active.')
            }
            if (!userData.isFieldWorker && !userData.isAdmin) {
                throw new Error(
                    'Access denied. User is not a field worker or admin.'
                )
            }

            const email = userData.email
            await signInWithEmailAndPassword(auth, email, password)
            navigation.navigate('Main', { workerId }) // Ensure this is passing workerId
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    // const loginHandler = async () => {
    //   const { workerId, password } = formState.inputValues;
    //   setIsLoading(true);
    //   try {
    //     const userData = await fetchUserData(workerId);

    //     // Check if the user is active and either a field worker or an admin
    //     if (!userData.activeUser) {
    //       throw new Error('User is not active.');
    //     }
    //     if (!userData.isFieldWorker && !userData.isAdmin) {
    //       throw new Error('Access denied. User is not a field worker or admin.');
    //     }

    //     const email = userData.email;
    //     await signInWithEmailAndPassword(auth, email, password);
    //     navigation.navigate("Main", { screen: "Home", params: { workerId } }); // Pass workerId here
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // const loginHandler = async () => {
    //   const { workerId, password } = formState.inputValues;
    //   setIsLoading(true);
    //   try {
    //     const userData = await fetchUserData(workerId);

    //     // Check if the user is active and either a field worker or an admin
    //     if (!userData.activeUser) {
    //       throw new Error('User is not active.');
    //     }
    //     if (!userData.isFieldWorker && !userData.isAdmin) {
    //       throw new Error('Access denied. User is not a field worker or admin.');
    //     }

    //     const email = userData.email;
    //     await signInWithEmailAndPassword(auth, email, password);
    //     navigation.navigate("Main");
    //   } catch (err) {
    //     setError(err.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    return (
        <SafeAreaView style={styles.area}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.select({
                    ios: 0,
                    android: 20,
                })}
            >
                {/* <Header /> */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={images.sasLogo}
                            resizeMode="contain"
                            style={styles.logo}
                        />
                    </View>
                    <Text style={[styles.title, { color: COLORS.black }]}>
                        Login to Your Account
                    </Text>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                    <Input
                        id="workerId"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['workerId']}
                        placeholder="Worker ID"
                        placeholderTextColor={COLORS.black}
                        icon={icons.user}
                    />
                    <Input
                        id="password"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['password']}
                        autoCapitalize="none"
                        placeholder="Password"
                        placeholderTextColor={COLORS.black}
                        icon={icons.padlock}
                        secureTextEntry={true}
                    />
                    <View style={styles.checkBoxContainer}>
                        <View style={{ flexDirection: 'row' }}>
                            <Checkbox
                                style={styles.checkbox}
                                value={isChecked}
                                color={isChecked ? COLORS.IconColor : 'gray'}
                                onValueChange={setChecked}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.privacy,
                                        { color: COLORS.black },
                                    ]}
                                >
                                    Remember me
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Button
                        title={
                            isLoading ? (
                                <ActivityIndicator
                                    size="small"
                                    color={COLORS.white}
                                />
                            ) : (
                                'Login'
                            )
                        }
                        filled
                        onPress={loginHandler}
                        style={styles.button}
                        disabled={isLoading}
                    />
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('ForgotPasswordMethods')
                        }
                    >
                        <Text style={styles.forgotPasswordBtnText}>
                            Forgot the password?
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

// Add your styles here
const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    logo: {
        width: 300,
        height: 150,
        marginLeft: 20,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 32,
    },
    title: {
        fontSize: 26,
        fontFamily: 'semiBold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 22,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'regular',
        color: 'red',
        textAlign: 'center',
        marginVertical: 8,
    },
    checkBoxContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 18,
    },
    checkbox: {
        marginRight: 8,
        height: 16,
        width: 16,
        borderRadius: 4,
        borderColor: COLORS.IconColor,
        borderWidth: 2,
    },
    privacy: {
        fontSize: 12,
        fontFamily: 'regular',
        color: COLORS.black,
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 18,
        position: 'absolute',
        bottom: 12,
        right: 0,
        left: 0,
    },
    bottomLeft: {
        fontSize: 14,
        fontFamily: 'regular',
        color: 'black',
    },
    bottomRight: {
        fontSize: 16,
        fontFamily: 'medium',
        color: COLORS.primary,
    },
    button: {
        marginVertical: 6,
        width: SIZES.width - 32,
        borderRadius: 30,
        backgroundColor: COLORS.IconColor,
    },
    forgotPasswordBtnText: {
        fontSize: 16,
        fontFamily: 'semiBold',
        color: '#80b6e8',
        textAlign: 'center',
        marginTop: 12,
    },
})

export default Login

// import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
// import React, { useCallback, useEffect, useReducer, useState } from 'react';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { COLORS, SIZES, icons, images } from '../constants';
// import Header from '../components/Header';
// import { reducer } from '../utils/reducers/formReducers';
// import { validateInput } from '../utils/actions/formActions';
// import Input from '../components/Input';
// import Checkbox from 'expo-checkbox';
// import Button from '../components/Button';
// import SocialButton from '../components/SocialButton';
// import OrSeparator from '../components/OrSeparator';

// const isTestMode = true;

// const initialState = {
//   inputValues: {
//     email: isTestMode ? 'example@gmail.com' : '',
//     password: isTestMode ? '**********' : '',
//   },
//   inputValidities: {
//     email: false,
//     password: false
//   },
//   formIsValid: false,
// }

// const Login = ({ navigation }) => {
//   const [formState, dispatchFormState] = useReducer(reducer, initialState);
//   const [error, setError] = useState(null);
//   const [isChecked, setChecked] = useState(false);

//   const inputChangedHandler = useCallback(
//     (inputId, inputValue) => {
//       const result = validateInput(inputId, inputValue)
//       dispatchFormState({ inputId, validationResult: result, inputValue })
//     },
//     [dispatchFormState]
//   );

//   useEffect(() => {
//     if (error) {
//       Alert.alert('An error occured', error)
//     }
//   }, [error]);

//   // Implementing apple authentication
//   const appleAuthHandler = () => {
//     console.log("Apple Authentication")
//   };

//   // Implementing facebook authentication
//   const facebookAuthHandler = () => {
//     console.log("Facebook Authentication")
//   };

//   // Implementing google authentication
//   const googleAuthHandler = () => {
//     console.log("Google Authentication")
//   };

//   return (
//     <SafeAreaView style={styles.area}>
//       <View style={styles.container}>
//         <Header />
//         <ScrollView showsVerticalScrollIndicator={false}>
//           <View style={styles.logoContainer}>
//             <Image
//               source={images.logo}
//               resizeMode='contain'
//               style={styles.logo}
//             />
//           </View>
//           <Text style={[styles.title, {
//             color: COLORS.black
//           }]}>Login to Your Account</Text>
//           <Input
//             id="email"
//             onInputChanged={inputChangedHandler}
//             errorText={formState.inputValidities['email']}
//             placeholder="Email"
//             placeholderTextColor={COLORS.black}
//             icon={icons.email}
//             keyboardType="email-address"
//           />
//           <Input
//             onInputChanged={inputChangedHandler}
//             errorText={formState.inputValidities['password']}
//             autoCapitalize="none"
//             id="password"
//             placeholder="Password"
//             placeholderTextColor={COLORS.black}
//             icon={icons.padlock}
//             secureTextEntry={true}
//           />
//           <View style={styles.checkBoxContainer}>
//             <View style={{ flexDirection: 'row' }}>
//               <Checkbox
//                 style={styles.checkbox}
//                 value={isChecked}
//                 color={isChecked ? COLORS.primary : "gray"}
//                 onValueChange={setChecked}
//               />
//               <View style={{ flex: 1 }}>
//                 <Text style={[styles.privacy, {
//                   color: COLORS.black
//                 }]}>Remenber me</Text>
//               </View>
//             </View>
//           </View>
//           <Button
//             title="Login"
//             filled
//             onPress={() => navigation.navigate("Main")}
//             style={styles.button}
//           />
//           <TouchableOpacity
//             onPress={() => navigation.navigate("ForgotPasswordMethods")}>
//             <Text style={styles.forgotPasswordBtnText}>Forgot the password?</Text>
//           </TouchableOpacity>
//           <View>

//             {/* <OrSeparator text="or continue with" />
//             <View style={styles.socialBtnContainer}>
//               <SocialButton
//                 icon={icons.appleLogo}
//                 onPress={appleAuthHandler}
//                 tintColor={COLORS.black}
//               />
//               <SocialButton
//                 icon={icons.facebook}
//                 onPress={facebookAuthHandler}
//               />
//               <SocialButton
//                 icon={icons.google}
//                 onPress={googleAuthHandler}
//               />
//             </View> */}
//           </View>
//         </ScrollView>
//         <View style={styles.bottomContainer}>
//           <Text style={[styles.bottomLeft, {
//             color: COLORS.black
//           }]}>Don't have an account ?</Text>
//           <TouchableOpacity
//             onPress={() => navigation.navigate("Login")}>
//             <Text style={styles.bottomRight}>{"  "}Contact Administrator</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   )
// };

// const styles = StyleSheet.create({
//   area: {
//     flex: 1,
//     backgroundColor: COLORS.white
//   },
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: COLORS.white
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     tintColor: COLORS.primary
//   },
//   logoContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginVertical: 32
//   },
//   title: {
//     fontSize: 28,
//     fontFamily: "bold",
//     color: COLORS.black,
//     textAlign: "center"
//   },
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 26,
//     fontFamily: "semiBold",
//     color: COLORS.black,
//     textAlign: "center",
//     marginBottom: 22
//   },
//   checkBoxContainer: {
//     flexDirection: "row",
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 18,
//   },
//   checkbox: {
//     marginRight: 8,
//     height: 16,
//     width: 16,
//     borderRadius: 4,
//     borderColor: COLORS.primary,
//     borderWidth: 2,
//   },
//   privacy: {
//     fontSize: 12,
//     fontFamily: "regular",
//     color: COLORS.black,
//   },
//   socialTitle: {
//     fontSize: 19.25,
//     fontFamily: "medium",
//     color: COLORS.black,
//     textAlign: "center",
//     marginVertical: 26
//   },
//   socialBtnContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   bottomContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginVertical: 18,
//     position: "absolute",
//     bottom: 12,
//     right: 0,
//     left: 0,
//   },
//   bottomLeft: {
//     fontSize: 14,
//     fontFamily: "regular",
//     color: "black"
//   },
//   bottomRight: {
//     fontSize: 16,
//     fontFamily: "medium",
//     color: COLORS.primary
//   },
//   button: {
//     marginVertical: 6,
//     width: SIZES.width - 32,
//     borderRadius: 30
//   },
//   forgotPasswordBtnText: {
//     fontSize: 16,
//     fontFamily: "semiBold",
//     color: COLORS.primary,
//     textAlign: "center",
//     marginTop: 12
//   }
// })

// export default Login
