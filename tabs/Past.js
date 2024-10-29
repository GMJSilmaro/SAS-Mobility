import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { db } from '../firebase'
import { query, collection, where, getDocs } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons' // Importing icons
import { COLORS } from '../constants'
import { format } from 'date-fns' // Importing date-fns to format dates

const Past = ({ workerId }) => {
    const [jobs, setJobs] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
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

                setJobs(jobsData)
            } catch (error) {
                console.error('Error fetching jobs:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchJobs()
    }, [workerId])

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
                    <View style={styles.card}>
                        <Text style={styles.jobTitle}>{item.jobName}</Text>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="briefcase-outline"
                                size={16}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobInfoText}>
                                {`Job No: ${item.jobNo}`}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={16}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobInfoText}>
                                {`Start Date: ${
                                    item.startDate
                                        ? format(
                                              new Date(item.startDate),
                                              'MMMM d, yyyy'
                                          )
                                        : 'N/A'
                                }`}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="calendar-outline"
                                size={16}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobInfoText}>
                                {`End Date: ${
                                    item.endDate
                                        ? format(
                                              new Date(item.endDate),
                                              'MMMM d, yyyy'
                                          )
                                        : 'N/A'
                                }`}
                            </Text>
                        </View>

                        <View style={styles.jobInfoRow}>
                            <Ionicons
                                name="document-text-outline"
                                size={16}
                                color={COLORS.IconColor}
                            />
                            <Text style={styles.jobInfoText}>
                                {item.description}
                            </Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text>No past jobs found</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3, // For Android shadow
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    jobInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    jobInfoText: {
        fontSize: 14,
        marginLeft: 8,
        color: '#555',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default Past

// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, FlatList } from 'react-native';
// import { db } from '../firebase';
// import { query, collection, where, getDocs } from 'firebase/firestore';
// import { isBefore, parseISO } from 'date-fns';

// const Past = ({ workerId }) => {
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

//         // Filter jobs to include only those with a startDate before today's date
//         const today = new Date();
//         const pastJobs = jobsData.filter(job => {
//           if (!job.startDate) {
//             console.warn(`Job with ID ${job.id} does not have a startDate`);
//             return false;
//           }
//           const jobDate = parseISO(job.startDate);
//           return isBefore(jobDate, today);
//         });

//         setJobs(pastJobs);
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
//             <Text>No past jobs found</Text>
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

// export default Past;

// // import React, { useEffect, useState } from 'react';
// // import { View, Text, StyleSheet, FlatList } from 'react-native';
// // import { db } from '../firebase';
// // import { query, collection, where, getDocs } from 'firebase/firestore';
// // import { format, isBefore } from 'date-fns';

// // const Past = ({ workerId }) => {
// //   const [jobs, setJobs] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const fetchJobs = async () => {
// //       try {
// //         const q = query(
// //           collection(db, 'jobs'),
// //           where('assignedWorkers', 'array-contains', workerId)
// //         );
// //         const querySnapshot = await getDocs(q);
// //         const jobsData = querySnapshot.docs.map(doc => ({
// //           id: doc.id,
// //           ...doc.data(),
// //         }));

// //         // Filter jobs to include only those with a startDate before today's date
// //         const today = new Date();
// //         const pastJobs = jobsData.filter(job => isBefore(new Date(job.startDate), today));

// //         setJobs(pastJobs);
// //         setLoading(false);
// //       } catch (error) {
// //         console.error('Error fetching jobs:', error);
// //         setLoading(false);
// //       }
// //     };

// //     fetchJobs();
// //   }, [workerId]);

// //   if (loading) {
// //     return (
// //       <View style={styles.container}>
// //         <Text>Loading...</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <FlatList
// //         data={jobs}
// //         keyExtractor={(item) => item.id}
// //         renderItem={({ item }) => (
// //           <View style={styles.jobItem}>
// //             <Text style={styles.jobTitle}>{item.jobName}</Text>
// //             <Text>{`Start Date: ${item.startDate}`}</Text>
// //             <Text>{`End Date: ${item.endDate}`}</Text>
// //             <Text>{`Description: ${item.description}`}</Text>
// //           </View>
// //         )}
// //         ListEmptyComponent={() => (
// //           <View style={styles.emptyContainer}>
// //             <Text>No past jobs found</Text>
// //           </View>
// //         )}
// //       />
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //     backgroundColor: 'white',
// //   },
// //   jobItem: {
// //     padding: 16,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#ccc',
// //   },
// //   jobTitle: {
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //   },
// //   emptyContainer: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// // });

// // export default Past;
