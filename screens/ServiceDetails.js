import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ServiceDetails = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipment Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Model Number</Text>
          <Text style={styles.value}>MDL-2024-XYZ</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Serial Number</Text>
          <Text style={styles.value}>SN-789456</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Installation Date</Text>
          <Text style={styles.value}>01/15/2023</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service History</Text>
        {/* Add service history items */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
});

export default ServiceDetails;
