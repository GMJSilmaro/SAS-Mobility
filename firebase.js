// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
} from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Conditionally initialize Firebase Analytics
let analytics
if (typeof window !== 'undefined' && window.navigator.cookieEnabled) {
    analytics = getAnalytics(app)
}

// Initialize Firestore
const db = getFirestore(app)

// Initialize Storage
const storage = getStorage(app)

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
})

export { db, storage, analytics, auth }
