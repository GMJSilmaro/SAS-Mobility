import { View, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { organizerEvents } from '../data';
import HorizontalEventCard from '../components/HorizontalEventCard';
import { useNavigation } from '@react-navigation/native';

const OrganizerEvents = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <FlatList
                data={organizerEvents}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    return (
                        <HorizontalEventCard
                            name={item.name}
                            image={item.image}
                            date={item.date}
                            startTime={item.startTime}
                            endTime={item.endTime}
                            isFree={item.isFree}
                            location={item.location}
                            onPress={() => navigation.navigate("EventDetails")}
                        />
                    );
                }}
            />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginVertical: 16
    }
})

export default OrganizerEvents