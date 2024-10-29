import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Button,
} from 'react-native'
import { db } from '../firebase' // Adjust the path as necessary
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
} from 'firebase/firestore'
import { COLORS } from '../constants'
import { FontAwesome } from '@expo/vector-icons' // Import FontAwesome for the star icon

const JobTasks = ({ route }) => {
    const { jobNo } = route.params // Get jobNo from navigation params
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastCompletedTask, setLastCompletedTask] = useState(null)
    const [undoVisible, setUndoVisible] = useState(false)
    const [highlightedTasks, setHighlightedTasks] = useState(new Set()) // State to track highlighted tasks

    // New state variables for adding tasks
    const [newTaskName, setNewTaskName] = useState('')
    const [newTaskDescription, setNewTaskDescription] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState(false) // false = low priority, true = high priority

    useEffect(() => {
        const fetchTasks = async () => {
            if (!db) {
                console.error('Firestore database not initialized')
                return
            }

            try {
                const q = query(
                    collection(db, 'jobs'),
                    where('jobNo', '==', jobNo)
                )
                const querySnapshot = await getDocs(q)
                const tasksData = querySnapshot.docs.reduce((acc, doc) => {
                    const jobData = doc.data()
                    if (jobData.taskList && Array.isArray(jobData.taskList)) {
                        acc.push(
                            ...jobData.taskList.map((task) => ({
                                taskName: task.taskName,
                                taskDescription: task.taskDescription,
                                isComplete: task.isComplete,
                                isPriority: task.isPriority,
                                isHighlighted: task.isHighlighted || false, // Include isHighlighted field
                            }))
                        )
                    }
                    return acc
                }, [])

                setTasks(tasksData)
            } catch (error) {
                console.error('Error fetching tasks: ', error)
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
    }, [jobNo])

    const addTask = async () => {
        if (!newTaskName.trim() || !newTaskDescription.trim()) {
            Alert.alert(
                'Validation Error',
                'Please provide a task name and description.'
            )
            return
        }

        const newTask = {
            taskName: newTaskName,
            taskDescription: newTaskDescription,
            isComplete: false,
            isPriority: newTaskPriority,
            isHighlighted: false,
        }

        try {
            const q = query(collection(db, 'jobs'), where('jobNo', '==', jobNo))
            const querySnapshot = await getDocs(q)
            const jobDoc = querySnapshot.docs[0]

            if (jobDoc) {
                const jobRef = doc(db, 'jobs', jobDoc.id)
                await updateDoc(jobRef, {
                    taskList: arrayUnion(newTask),
                })

                setTasks((prevTasks) => [...prevTasks, newTask])
                setNewTaskName('')
                setNewTaskDescription('')
                setNewTaskPriority(false)
            }
        } catch (error) {
            console.error('Error adding new task: ', error)
        }
    }

    const toggleHighlight = async (taskName) => {
        setHighlightedTasks((prev) => {
            const newHighlightedTasks = new Set(prev)
            if (newHighlightedTasks.has(taskName)) {
                newHighlightedTasks.delete(taskName) // Remove highlight
            } else {
                newHighlightedTasks.add(taskName) // Add highlight
            }
            return newHighlightedTasks
        })

        try {
            const taskIndex = tasks.findIndex(
                (task) => task.taskName === taskName
            )
            if (taskIndex === -1) return

            const updatedTask = {
                ...tasks[taskIndex],
                isHighlighted: !tasks[taskIndex].isHighlighted, // Toggle highlight
            }

            // Update Firestore
            const q = query(collection(db, 'jobs'), where('jobNo', '==', jobNo))
            const querySnapshot = await getDocs(q)
            const jobDoc = querySnapshot.docs[0]

            if (jobDoc) {
                const jobRef = doc(db, 'jobs', jobDoc.id)
                const updatedtaskList = tasks.map((t, index) =>
                    index === taskIndex ? updatedTask : t
                )

                await updateDoc(jobRef, {
                    taskList: updatedtaskList,
                })

                setTasks(updatedtaskList)
            }
        } catch (error) {
            console.error('Error toggling task highlight: ', error)
        }
    }

    const completeTask = async (task) => {
        const updatedStatus = true // Mark as complete

        // Set the last completed task and make the undo visible
        setLastCompletedTask(task)
        setUndoVisible(true)

        try {
            const q = query(collection(db, 'jobs'), where('jobNo', '==', jobNo))
            const querySnapshot = await getDocs(q)
            const jobDoc = querySnapshot.docs[0]

            if (jobDoc) {
                const jobRef = doc(db, 'jobs', jobDoc.id)

                // Update Firestore with the new task list including the timestamp for the completed task
                const updatedtaskList = tasks.map((t) => {
                    // Check if the current task is the one being marked as complete
                    if (t.taskName === task.taskName) {
                        return {
                            ...t,
                            isComplete: updatedStatus, // Mark as complete
                            timestamp: new Date().toISOString(), // Add timestamp when marking as complete
                        }
                    }
                    // Preserve existing task details for other tasks
                    return {
                        ...t,
                        // No need to update isComplete and timestamp here
                    }
                })

                console.log('Updated Task List:', updatedtaskList) // Debugging step to log the updated task list

                await updateDoc(jobRef, {
                    taskList: updatedtaskList,
                })

                setTasks(updatedtaskList) // Update local state
            }
        } catch (error) {
            console.error('Error updating task status: ', error)
        }

        setTimeout(() => {
            setUndoVisible(false)
        }, 10000)
    }

    const undoCompletedTask = async () => {
        if (!lastCompletedTask) return // No task to undo

        const updatedTask = { ...lastCompletedTask, isComplete: false } // Set isComplete to false

        try {
            const q = query(collection(db, 'jobs'), where('jobNo', '==', jobNo))
            const querySnapshot = await getDocs(q)
            const jobDoc = querySnapshot.docs[0]

            if (jobDoc) {
                const jobRef = doc(db, 'jobs', jobDoc.id)

                // Update Firestore
                await updateDoc(jobRef, {
                    taskList: tasks.map((t) => ({
                        taskName: t.taskName,
                        taskDescription: t.taskDescription,
                        isComplete:
                            t.taskName === lastCompletedTask.taskName
                                ? false
                                : t.isComplete,
                        isPriority: t.isPriority,
                        isHighlighted: t.isHighlighted,
                    })),
                })

                // Update local state
                setTasks((prevTasks) =>
                    prevTasks.map((t) =>
                        t.taskName === lastCompletedTask.taskName
                            ? updatedTask
                            : t
                    )
                )
                setUndoVisible(false)
                setLastCompletedTask(null) // Reset last completed task
            }
        } catch (error) {
            console.error('Error undoing task completion: ', error)
        }
    }

    const showCompletionAlert = (task) => {
        Alert.alert(
            'Confirm Task Completion',
            `Are you sure you want to mark "${task.taskName}" as completed?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: () => completeTask(task),
                },
            ],
            { cancelable: true }
        )
    }

    const sortTasksByPriority = (taskList) => {
        return taskList.sort((a, b) => {
            // Sort high priority (true) before low priority (false)
            return b.isPriority - a.isPriority
        })
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tasks for Job: {jobNo}</Text>

            <Text style={styles.label}>Add New Task</Text>
            <TextInput
                style={styles.input}
                placeholder="Task Name"
                value={newTaskName}
                onChangeText={setNewTaskName}
            />
            <TextInput
                style={styles.input}
                placeholder="Task Description"
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
            />
            <View style={styles.priorityContainer}>
                <Text>Priority:</Text>
                <TouchableOpacity
                    onPress={() => setNewTaskPriority((prev) => !prev)}
                >
                    <Text style={{ color: newTaskPriority ? 'red' : 'green' }}>
                        {newTaskPriority ? 'High Priority' : 'Low Priority'}
                    </Text>
                </TouchableOpacity>
            </View>
            <Button title="Add Task" onPress={addTask} />

            <Text style={styles.label}>Ongoing Tasks</Text>
            <FlatList
                data={sortTasksByPriority(
                    tasks.filter((task) => !task.isComplete)
                )}
                keyExtractor={(item) => item.taskName}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            showCompletionAlert(item)
                        }}
                        style={[
                            styles.taskContainer,
                            highlightedTasks.has(item.taskName) &&
                                styles.highlightedTask, // Apply highlighted style
                        ]}
                    >
                        <View style={styles.taskDetails}>
                            <Text style={styles.taskName}>
                                {item.taskName}
                                {item.isPriority
                                    ? ' (High Priority)'
                                    : ' (Low Priority)'}
                            </Text>
                            <Text style={styles.taskDescription}>
                                {item.taskDescription}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => toggleHighlight(item.taskName)}
                        >
                            <FontAwesome
                                name={
                                    highlightedTasks.has(item.taskName)
                                        ? 'star'
                                        : 'star-o'
                                }
                                size={24}
                                color="gold"
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            <Text style={styles.label}>Completed Tasks</Text>
            <FlatList
                data={sortTasksByPriority(
                    tasks.filter((task) => task.isComplete)
                )}
                keyExtractor={(item) => item.taskName}
                renderItem={({ item }) => (
                    <View style={styles.completedTaskContainer}>
                        <Text style={styles.completedTaskName}>
                            {item.taskName}
                        </Text>
                        <Text style={styles.completedTaskDescription}>
                            {item.taskDescription}
                        </Text>
                        {item.timestamp && (
                            <Text style={styles.taskTimestamp}>
                                Completed at:{' '}
                                {new Date(item.timestamp).toLocaleString()}
                            </Text>
                        )}
                    </View>
                )}
            />

            {undoVisible && lastCompletedTask && (
                <View style={styles.undoContainer}>
                    <Text style={styles.undoText}>
                        Task "{lastCompletedTask.taskName}" completed.
                    </Text>
                    <TouchableOpacity onPress={undoCompletedTask}>
                        <Text style={styles.undoButton}>Undo</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

// Add your styles here
const styles = {
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 10,
    },
    taskContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    taskDetails: {
        flex: 1,
    },
    taskName: {
        fontWeight: 'bold',
    },
    taskDescription: {
        color: '#666',
    },
    completedTaskContainer: {
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    completedTaskName: {
        textDecorationLine: 'line-through',
    },
    completedTaskDescription: {
        color: '#aaa',
    },
    undoContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    undoText: {
        fontSize: 16,
    },
    undoButton: {
        color: COLORS.IconColor,
        fontWeight: 'bold',
    },
    priorityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    // highlightedTask: {
    //     backgroundColor: '#e0f7fa', // Add highlight color
    // },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}

export default JobTasks
