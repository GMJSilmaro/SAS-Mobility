import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { db } from '../firebase';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { isAfter, parseISO } from 'date-fns';

const Future = ({ workerId }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(
          collection(db, 'jobs'),
          where('assignedWorkers', 'array-contains', workerId)
        );
        const querySnapshot = await getDocs(q);
        const jobsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Fetched jobs:', jobsData);

        // Filter jobs to include only those with a startDate strictly after today's date
        const today = new Date();
        console.log('Today:', today);

        const futureJobs = jobsData.filter(job => {
          if (!job.startDate) {
            console.warn(`Job with ID ${job.id} does not have a startDate`);
            return false;
          }
          const jobDate = parseISO(job.startDate);
          console.log('Job Date:', jobDate, 'isAfter:', isAfter(jobDate, today));
          return isAfter(jobDate, today);
        });

        console.log('Future Jobs:', futureJobs);
        setJobs(futureJobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [workerId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobItem}>
            <Text style={styles.jobTitle}>{item.jobName}</Text>
            <Text>{`Job No#: ${item.jobNo}`}</Text>
            <Text>{`Start Date: ${item.startDate}`}</Text>
            <Text>{`End Date: ${item.endDate}`}</Text>
            <Text>{`Description: ${item.description}`}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text>No future jobs found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  jobItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Future;
