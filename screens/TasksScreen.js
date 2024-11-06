import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    TextInput,
    Alert,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { format } from 'date-fns'

const TasksScreen = ({ navigation, route }) => {
    const [tasks, setTasks] = useState(route.params?.taskList || [])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddModalVisible, setIsAddModalVisible] = useState(false)
    const [workerName, setWorkerName] = useState('')
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        completed: false,
        id: '',
        requiredNotes: false,
        requiredPhotos: false,
        isRequired: false,
    })
    const [workerDetails, setWorkerDetails] = useState({})

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                const jobNo = route.params?.jobNo
                const workerId = route.params?.workerId

                if (!jobNo) throw new Error('Job ID is required')

                const jobRef = doc(db, 'jobs', jobNo)
                const jobSnap = await getDoc(jobRef)

                if (jobSnap.exists()) {
                    const jobData = jobSnap.data()
                    setTasks(jobData.taskList || [])
                }

                if (workerId) {
                    const userRef = doc(db, 'users', workerId)
                    const userSnap = await getDoc(userRef)

                    if (userSnap.exists()) {
                        const userData = userSnap.data()
                        setWorkerName(userData.fullName || '')
                        setWorkerDetails((prev) => ({
                            ...prev,
                            [workerId]: userData,
                        }))
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                Alert.alert('Error', 'Failed to load job data')
            } finally {
                setIsLoading(false)
            }
        }

        fetchJobData()
    }, [route.params?.jobNo, route.params?.workerId])

    const handleUpdateStatus = async (taskID, isDone) => {
        try {
            const jobNo = route.params?.jobNo
            const workerId = route.params?.workerId
            if (!jobNo) throw new Error('Job ID is required')

            const updatedTasks = tasks.map((task) =>
                task.taskID === taskID
                    ? {
                          ...task,
                          completed: isDone,
                          completionDate: isDone
                              ? new Date().toISOString()
                              : null,
                          completedBy: isDone ? workerId : null,
                      }
                    : task
            )
            setTasks(updatedTasks)

            const jobRef = doc(db, 'jobs', jobNo)
            await updateDoc(jobRef, {
                taskList: updatedTasks,
            })

            const allTasksCompleted = updatedTasks.every(
                (task) => task.completed
            )
            if (allTasksCompleted) {
                Alert.alert(
                    'Congratulations! 🎉',
                    'You have completed all tasks for this job. Great work!',
                    [
                        {
                            text: 'OK',
                            onPress: () => console.log('Alert closed'),
                        },
                    ]
                )
            }
        } catch (error) {
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.taskID === taskID
                        ? {
                              ...task,
                              completed: !isDone,
                              completionDate: !isDone
                                  ? new Date().toISOString()
                                  : null,
                              completedBy: !isDone ? workerId : null,
                          }
                        : task
                )
            )
            console.error('Error updating task:', error)
            Alert.alert('Error', 'Failed to update task status')
        }
    }

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            Alert.alert('Error', 'Task name is required')
            return
        }

        try {
            const jobNo = route.params?.jobNo
            if (!jobNo) throw new Error('Job ID is required')

            const jobRef = doc(db, 'jobs', jobNo)
            const jobSnap = await getDoc(jobRef)

            if (!jobSnap.exists()) throw new Error('Job not found')

            const jobData = jobSnap.data()

            const maxId = Math.max(
                ...jobData.taskList.map((task) =>
                    typeof task.id === 'number' ? task.id : 0
                ),
                0
            )

            const newTaskData = {
                ...newTask,
                id: maxId + 1,
                title: newTask.title,
                description: newTask.description,
                completed: false,
                requiredNotes: Boolean(newTask.requiredNotes),
                requiredPhotos: Boolean(newTask.requiredPhotos),
            }

            const updatedTaskList = [...jobData.taskList, newTaskData]

            await updateDoc(jobRef, {
                taskList: updatedTaskList,
            })

            setTasks(updatedTaskList)
            setIsAddModalVisible(false)
            setNewTask({
                title: '',
                description: '',
                assignedTo: workerName,
                completed: false,
                id: '',
                requiredNotes: false,
                requiredPhotos: false,
                isRequired: false,
            })
        } catch (error) {
            console.error('Error adding task:', error)
            Alert.alert('Error', 'Failed to add task')
        }
    }

    const taskStats = useMemo(() => {
        const total = tasks.length
        const completed = tasks.filter((t) => t.completed).length
        const pending = total - completed
        const priority = tasks.filter((t) => t.isPriority).length

        return {
            total,
            completed,
            pending,
            priority,
            completionRate:
                total > 0 ? Math.round((completed / total) * 100) : 0,
        }
    }, [tasks])

    const TaskItem = React.memo(
        ({ task, onPress }) => (
            <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={onPress}
            >
                <View style={styles.taskHeader}>
                    <View style={styles.taskLeftSection}>
                        <View style={styles.checkboxContainer}>
                            <View
                                style={[
                                    styles.checkbox,
                                    task.completed && styles.checkboxChecked,
                                ]}
                            >
                                {task.completed && (
                                    <Icon name="check" size={16} color="#fff" />
                                )}
                            </View>
                        </View>
                        <View style={styles.taskTitleContainer}>
                            <Text
                                style={[
                                    styles.taskTitle,
                                    task.completed && styles.taskTitleCompleted,
                                ]}
                            >
                                {task.title || task.taskName}
                            </Text>
                            <View style={styles.badgeContainer}>
                                {task.isRequired && (
                                    <View style={styles.requiredBadge}>
                                        <Icon
                                            name="star"
                                            size={16}
                                            color="#DC2626"
                                        />
                                        <Text style={styles.requiredText}>
                                            Priority
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: task.completed
                                    ? '#10B981'
                                    : '#F59E0B',
                            },
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {task.completed ? 'COMPLETED' : 'PENDING'}
                        </Text>
                    </View>
                </View>

                {task.description && (
                    <Text style={styles.descriptionText}>
                        {task.description}
                    </Text>
                )}

                <View style={styles.taskFooter}>
                    <View style={styles.taskMetadata}>
                        <Text style={styles.timestampText}>
                            {task.createdAt
                                ? `Created: ${format(new Date(task.createdAt), 'MMM d, yyyy h:mm a')}`
                                : ''}
                        </Text>
                        {task.completed && (
                            <>
                                {task.completedBy && (
                                    <Text style={styles.completedByText}>
                                        Completed by:{' '}
                                        {workerDetails[task.completedBy]
                                            ?.fullName || 'Unknown Worker'}
                                    </Text>
                                )}
                                {task.completionDate && (
                                    <Text style={styles.timestampText}>
                                        on{' '}
                                        {format(
                                            new Date(task.completionDate),
                                            'MMM d, yyyy h:mm a'
                                        )}
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        ),
        (prevProps, nextProps) =>
            prevProps.task.id === nextProps.task.id &&
            prevProps.task.completed === nextProps.task.completed
    )

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading tasks...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate('ServiceWork', {
                            jobNo: route.params?.jobNo,
                            workerId: route.params?.workerId,
                            updatedTasks: tasks,
                        })
                    }
                    style={styles.headerButton}
                >
                    <Icon name="arrow-back-ios" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Work Tasks</Text>
                    <Text style={styles.headerStats}>
                        Tasks: {taskStats.completed}/{taskStats.total} Complete
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setIsAddModalVisible(true)}
                >
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.mainContent}>
                    {/* Summary Section */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.cardHeader}>
                            <Icon name="analytics" size={24} color="#4a90e2" />
                            <Text style={styles.cardTitle}>Task Summary</Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: '#EBF5FF' },
                                    ]}
                                >
                                    <Icon
                                        name="assignment"
                                        size={24}
                                        color="#4a90e2"
                                    />
                                </View>
                                <Text style={styles.statCount}>
                                    {taskStats.total}
                                </Text>
                                <Text style={styles.statTitle}>
                                    Total Tasks
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: '#E6FCF5' },
                                    ]}
                                >
                                    <Icon
                                        name="check-circle"
                                        size={24}
                                        color="#10B981"
                                    />
                                </View>
                                <Text style={styles.statCount}>
                                    {taskStats.completed}
                                </Text>
                                <Text style={styles.statTitle}>Completed</Text>
                            </View>

                            <View style={styles.statItem}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: '#FEF3C7' },
                                    ]}
                                >
                                    <Icon
                                        name="pending-actions"
                                        size={24}
                                        color="#F59E0B"
                                    />
                                </View>
                                <Text style={styles.statCount}>
                                    {taskStats.pending}
                                </Text>
                                <Text style={styles.statTitle}>Pending</Text>
                            </View>

                            <View style={styles.statItem}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: '#FEE2E2' },
                                    ]}
                                >
                                    <Icon
                                        name="priority-high"
                                        size={24}
                                        color="#EF4444"
                                    />
                                </View>
                                <Text style={styles.statCount}>
                                    {taskStats.priority}
                                </Text>
                                <Text style={styles.statTitle}>Priority</Text>
                            </View>
                        </View>

                        <View style={styles.completionRateContainer}>
                            <Text style={styles.completionRateText}>
                                Completion Rate: {taskStats.completionRate}%
                            </Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${taskStats.completionRate}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Task List with optimized rendering */}
                    <View style={styles.tasksContainer}>
                        <View style={styles.cardHeader}>
                            <Icon name="list" size={24} color="#4a90e2" />
                            <Text style={styles.cardTitle}>Task List</Text>
                        </View>

                        {tasks.map((task) => (
                            <TaskItem
                                key={task.taskID}
                                task={task}
                                onPress={() =>
                                    handleUpdateStatus(
                                        task.taskID,
                                        !task.completed
                                    )
                                }
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Add Task Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Task</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Task Name"
                            value={newTask.title}
                            onChangeText={(text) =>
                                setNewTask((prev) => ({ ...prev, title: text }))
                            }
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            multiline
                            numberOfLines={4}
                            value={newTask.description}
                            onChangeText={(text) =>
                                setNewTask((prev) => ({
                                    ...prev,
                                    description: text,
                                }))
                            }
                        />

                        <View style={styles.priorityToggle}>
                            <TouchableOpacity
                                onPress={() =>
                                    setNewTask((prev) => ({
                                        ...prev,
                                        isRequired: !prev.isRequired,
                                    }))
                                }
                                style={styles.checkboxContainer}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        newTask.isRequired &&
                                            styles.checkboxChecked,
                                    ]}
                                >
                                    {newTask.isRequired && (
                                        <Icon
                                            name="check"
                                            size={16}
                                            color="#fff"
                                        />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    Priority
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() =>
                                    setNewTask((prev) => ({
                                        ...prev,
                                        requiredNotes: !prev.requiredNotes,
                                    }))
                                }
                                style={styles.checkboxContainer}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        newTask.requiredNotes &&
                                            styles.checkboxChecked,
                                    ]}
                                >
                                    {newTask.requiredNotes && (
                                        <Icon
                                            name="check"
                                            size={16}
                                            color="#fff"
                                        />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    Requires Notes
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() =>
                                    setNewTask((prev) => ({
                                        ...prev,
                                        requiredPhotos: !prev.requiredPhotos,
                                    }))
                                }
                                style={styles.checkboxContainer}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        newTask.requiredPhotos &&
                                            styles.checkboxChecked,
                                    ]}
                                >
                                    {newTask.requiredPhotos && (
                                        <Icon
                                            name="check"
                                            size={16}
                                            color="#fff"
                                        />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    Requires Photos
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                                onPress={() => {
                                    setIsAddModalVisible(false)
                                    setNewTask({
                                        title: '',
                                        description: '',
                                        assignedTo: workerName,
                                        completed: false,
                                        id: '',
                                        requiredNotes: false,
                                        requiredPhotos: false,
                                        isRequired: false,
                                    })
                                }}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleAddTask}
                            >
                                <Text style={styles.saveButtonText}>
                                    Add Task
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#4a90e2',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerStats: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
        marginTop: 4,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        width: 40,
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    mainContent: {
        padding: 16,
    },
    summaryContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
        color: '#1E293B',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statCount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        color: '#64748B',
    },
    completionRateContainer: {
        marginTop: 8,
    },
    completionRateText: {
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 8,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4a90e2',
    },
    tasksContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    taskItem: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748B',
    },
    taskFooter: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 120,
        justifyContent: 'center',
    },
    startButton: {
        backgroundColor: '#2563EB',
    },
    completeButton: {
        backgroundColor: '#10B981',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E2E8F0',
    },
    saveButton: {
        backgroundColor: '#2563EB',
    },
    cancelButtonText: {
        color: '#64748B',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    taskTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    priorityText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    timestampText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    descriptionText: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    priorityToggle: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4a90e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4a90e2',
    },
    taskLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#94A3B8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskMetadata: {
        flex: 1,
    },
    completedByText: {
        fontSize: 12,
        color: '#4a90e2',
        fontWeight: '500',
        marginTop: 4,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 14,
        color: '#1E293B',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },

    requiredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    requiredText: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
})

export default React.memo(TasksScreen)
