import { useState, useCallback, useEffect, useReducer } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import Button from '../components/Button';
import { fetchUserData } from '../utils/fetchUserData';

const isTestMode = true;

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
};

const Login = ({ navigation }) => {
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [error, setError] = useState(null);
    const [isChecked, setChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const inputChangedHandler = useCallback(
        (inputId, inputValue) => {
            const result = validateInput(inputId, inputValue);
            dispatchFormState({ inputId, validationResult: result, inputValue });
        },
        [dispatchFormState]
    );

    useEffect(() => {
        if (error) {
            setTimeout(() => setError(null), 5000);
        }
    }, [error]);

    const loginHandler = async () => {
        const { workerId, password } = formState.inputValues;
        setIsLoading(true);
        try {
            const userData = await fetchUserData(workerId);

            if (!userData.activeUser) {
                throw new Error('User is not active.');
            }
            if (!userData.isFieldWorker && !userData.isAdmin) {
                throw new Error('Access denied. User is not a field worker or admin.');
            }

            const email = userData.email;
            await signInWithEmailAndPassword(auth, email, password);
            navigation.navigate('Main', { workerId });
        } catch (err) {
            setError(err.message);
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
