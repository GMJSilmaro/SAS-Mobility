import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // or any other icon library

const TaskListTab = () => {
  const [selectedTab, setSelectedTab] = useState('Task List');

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Task List':
        return <TaskList />;
      case 'Private Worker Msg':
        return <PrivateWorkerMsg />;
      case 'Public Worker Msg':
        return <PublicWorkerMsg />;
      case 'Docu':
        return <Docu />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {['Task List', 'Private Worker Msg', 'Public Worker Msg', 'Docu'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonSelected,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabButtonText,
                selectedTab === tab && styles.tabButtonTextSelected,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.contentContainer}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const TaskList = () => (
  <View style={styles.taskListContainer}>
   
  </View>
);

const PrivateWorkerMsg = () => (
  <View style={styles.messageContainer}>
    <Text>Private Worker Messages</Text>
  </View>
);

const PublicWorkerMsg = () => (
  <View style={styles.messageContainer}>
    <Text>Public Worker Messages</Text>
  </View>
);

const Docu = () => (
  <View style={styles.messageContainer}>
    <Text>Documents</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    padding: 10,
  },
  tabButtonSelected: {
    borderBottomWidth: 2,
    borderBottomColor: 'blue',
  },
  tabButtonText: {
    fontSize: 16,
    color: 'gray',
  },
  tabButtonTextSelected: {
    color: 'blue',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  taskListContainer: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  taskIcon: {
    marginRight: 15,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  taskStatus: {
    color: 'gray',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskListTab;
