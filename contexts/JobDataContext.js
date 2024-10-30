import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const JobDataContext = createContext();

export const JobDataProvider = ({ children }) => {
  const [jobCache, setJobCache] = useState({});

  const fetchJobData = async (jobNo) => {
    try {
      // Check cache first
      const cachedData = await AsyncStorage.getItem(`job_${jobNo}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        
        // Use cache if it's less than 1 hour old
        if (cacheAge < 3600000) { // 1 hour in milliseconds
          console.log('Using cached job data');
          return data;
        }
      }

      // If no cache or cache is old, fetch from Firebase
      console.log('Fetching fresh job data from Firebase');
      const jobRef = doc(db, 'jobs', jobNo);
      const jobSnap = await getDoc(jobRef);
      
      if (jobSnap.exists()) {
        const jobData = jobSnap.data();
        
        // Cache the new data
        const cacheData = {
          data: jobData,
          timestamp: Date.now()
        };
        await AsyncStorage.setItem(`job_${jobNo}`, JSON.stringify(cacheData));
        
        return jobData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching job data:', error);
      return null;
    }
  };

  const invalidateJobCache = async (jobNo) => {
    await AsyncStorage.removeItem(`job_${jobNo}`);
  };

  return (
    <JobDataContext.Provider value={{ fetchJobData, invalidateJobCache }}>
      {children}
    </JobDataContext.Provider>
  );
};

export const useJobData = () => useContext(JobDataContext); 