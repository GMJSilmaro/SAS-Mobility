import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { db } from '../firebase'
import { query, collection, where, getDocs } from 'firebase/firestore'
import { isSameDay, parseISO } from 'date-fns'

const Current = ({ workerId }) => {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const q = query(
                    collection(db, 'jobs'),
                    where('assignedWorkers', 'array-contains', workerId)
                )
                const querySnapshot = await getDocs(q)
                const jobsData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))

                // Filter jobs to include only those with a startDate equal to today's date
                const today = new Date()
                const currentJobs = jobsData.filter((job) => {
                    if (!job.startDate) {
                        console.warn(
                            `Job with ID ${job.id} does not have a startDate`
                        )
                        return false
                    }
                    const jobDate = parseISO(job.startDate)
                    return isSameDay(jobDate, today)
                })

                setJobs(currentJobs)
            } catch (error) {
                console.error('Error fetching jobs:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchJobs()
    }, [workerId])

    // Function to format date into a more readable format
    const formatDate = (date) => {
        if (!date) return 'N/A' // Handle missing date
        const options = { year: 'numeric', month: 'long', day: 'numeric' }
        return new Date(date).toLocaleDateString(undefined, options)
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        )
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
                        {/* Format the start and end date */}
                        <Text>{`Start Date: ${formatDate(item.startDate)}`}</Text>
                        <Text>{`End Date: ${formatDate(item.endDate)}`}</Text>
                        <Text>{`Description: ${item.description}`}</Text>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text>No current jobs found</Text>
                    </View>
                )}
            />
        </View>
    )
}

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
})

export default Current

// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, FlatList } from 'react-native';
// import { db } from '../firebase';
// import { query, collection, where, getDocs } from 'firebase/firestore';
// import { isSameDay, parseISO } from 'date-fns';

// const Current = ({ workerId }) => {
//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         const q = query(
//           collection(db, 'jobs'),
//           where('assignedWorkers', 'array-contains', workerId)
//         );
//         const querySnapshot = await getDocs(q);
//         const jobsData = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         // Filter jobs to include only those with a startDate equal to today's date
//         const today = new Date();
//         const currentJobs = jobsData.filter(job => {
//           if (!job.startDate) {
//             console.warn(`Job with ID ${job.id} does not have a startDate`);
//             return false;
//           }
//           const jobDate = parseISO(job.startDate);
//           return isSameDay(jobDate, today);
//         });

//         setJobs(currentJobs);
//       } catch (error) {
//         console.error('Error fetching jobs:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchJobs();
//   }, [workerId]);

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={jobs}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.jobItem}>
//             <Text style={styles.jobTitle}>{item.jobName}</Text>
//             <Text>{`Start Date: ${item.startDate}`}</Text>
//             <Text>{`End Date: ${item.endDate}`}</Text>
//             <Text>{`Description: ${item.description}`}</Text>
//           </View>
//         )}
//         ListEmptyComponent={() => (
//           <View style={styles.emptyContainer}>
//             <Text>No current jobs found</Text>
//           </View>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: 'white',
//   },
//   jobItem: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   jobTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default Current;
