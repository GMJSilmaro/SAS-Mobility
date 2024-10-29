import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Completion = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Icon name="check-circle" size={64} color="#4CAF50" />
          <Text style={styles.summaryTitle}>Service Completed</Text>
          <Text style={styles.summaryText}>
            All tasks have been completed successfully
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="camera-alt" size={24} color="#4a90e2" />
            <Text style={styles.actionText}>Add Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="note-add" size={24} color="#4a90e2" />
            <Text style={styles.actionText}>Add Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="person" size={24} color="#4a90e2" />
            <Text style={styles.actionText}>Customer Signature</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.finishButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.buttonText}>Finish Job</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4a90e2',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  summaryText: {
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  actionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#4a90e2',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Completion;
