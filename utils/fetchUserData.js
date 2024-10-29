// utils/fetchUserData.js
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const fetchUserData = async (workerId) => {
  const userDocRef = doc(db, 'users', workerId);
  const userDocSnapshot = await getDoc(userDocRef);
  if (userDocSnapshot.exists()) {
    return userDocSnapshot.data();
  } else {
    throw new Error('Invalid credentials');
  }
};

export { fetchUserData };
