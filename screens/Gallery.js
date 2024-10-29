import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import React from 'react';
import { COLORS, SIZES, icons } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';
import { gallery } from '../data';

const Gallery = ({ navigation }) => {
    /**
     * Render header
     */
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}>
                        <Image
                            source={icons.back}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: COLORS.greyscale900
                            }]}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: COLORS.greyscale900 }]}>Gallery</Text>
                </View>
                <TouchableOpacity>
                    <Image
                        source={icons.moreCircle}
                        resizeMode='contain'
                        style={[styles.moreIcon, {
                            tintColor: COLORS.greyscale900
                        }]}
                    />
                </TouchableOpacity>
            </View>
        )
    }

    const renderContent = () => {
        return (
            <View>
                <FlatList
                    data={gallery}
                    keyExtractor={item => item.id}
                    numColumns={3}
                    columnWrapperStyle={{ gap: 0 }}
                    style={{ marginVertical: 12 }}
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
    }
    return (
        <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
            <View style={[styles.container, { backgroundColor: COLORS.white }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    {renderContent()}
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
        padding: 16
    },
    headerContainer: {
        flexDirection: "row",
        width: SIZES.width - 32,
        justifyContent: "space-between",
        marginBottom: 0
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'bold',
        color: COLORS.black,
        marginLeft: 16
    },
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    title: {
        fontSize: 20,
        fontFamily: "bold",
        color: COLORS.black,
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

export default Gallery