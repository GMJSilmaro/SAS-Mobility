import { View, StyleSheet, FlatList, Text } from 'react-native';
import React from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import PeopleGoingCard from '../components/PeopleGoingCard';
import { useRoute } from '@react-navigation/native';

const JobDetailsAssignedWorkers = () => {
    const route = useRoute();
    const { workerCount, workerProfiles } = route.params;

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title={`${workerCount} Assigned Workers`} />
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={workerProfiles}
                        keyExtractor={item => item.workerId}
                        renderItem={({ item }) => (
                            <PeopleGoingCard
                                name={item.name}
                                avatar={item.profilePicture}
                                primaryPhone={item.primaryPhone}
                                workerId={item.workerId}
                            />
                        )}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
    },
    scrollView: {
        paddingVertical: 22,
    },
});

export default JobDetailsAssignedWorkers;
