import { View, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { peopleGoing } from '../data';
import PeopleGoingCard from '../components/PeopleGoingCard';

const EventDetailsPeopleGoing = () => {

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                <Header title="20,000+ Going" />
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={peopleGoing}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <PeopleGoingCard
                                name={item.name}
                                position={item.position}
                                avatar={item.avatar}
                            />
                        )}
                    />
                </ScrollView>
            </View>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16,
    },
    scrollView: {
        paddingVertical: 22
    }
})

export default EventDetailsPeopleGoing