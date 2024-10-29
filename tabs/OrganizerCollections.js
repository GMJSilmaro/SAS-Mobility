import { View, FlatList, StyleSheet, Image } from 'react-native';
import React from 'react';
import { organizerCollections } from '../data';
import { SIZES } from '../constants';

const OrganizerCollections = () => {
    return (
        <View style={styles.container}>
            <FlatList
                data={organizerCollections}
                keyExtractor={item => item.id}
                numColumns={3}
                columnWrapperStyle={{ gap: 0 }}
                style={{ marginVertical: 12 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <Image
                        source={item.image}
                        resizeMode='cover'
                        style={styles.galleryImage}
                    />
                )}
            />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginVertical: 16
    },
    galleryImage: {
        width: (SIZES.width - 44) / 3,
        height: (SIZES.width - 44) / 3,
        borderRadius: 16,
        marginRight: 6,
        marginBottom: 12
    }
})

export default OrganizerCollections