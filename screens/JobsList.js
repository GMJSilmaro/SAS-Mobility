import {
    View,
    Text,
    StyleSheet,
    TextInput,
    useWindowDimensions,
    TouchableOpacity,
} from 'react-native'
import React from 'react'
import { COLORS, SIZES } from '../constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabView, TabBar } from 'react-native-tab-view'
import { Past, Current } from '../tabs'
import { Ionicons } from '@expo/vector-icons'

const JobsList = ({ navigation, route }) => {
    const layout = useWindowDimensions()
    const { workerId } = route.params // Get workerId from route.params

    const [index, setIndex] = React.useState(1)
    const [routes] = React.useState([
        { key: 'first', title: 'Current' },
        { key: 'second', title: 'History' },
    ])

    // State for filtering and sorting
    const [customerNameFilter, setCustomerNameFilter] = React.useState('')
    const [sortByDate, setSortByDate] = React.useState('latest') // latest or oldest

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return (
                    <Current
                        workerId={workerId}
                        customerNameFilter={customerNameFilter}
                        sortByDate={sortByDate}
                    />
                )
            case 'second':
                return (
                    <Past
                        workerId={workerId}
                        customerNameFilter={customerNameFilter}
                        sortByDate={sortByDate}
                    />
                )
            default:
                return null
        }
    }

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            indicatorStyle={{
                backgroundColor: COLORS.IconColor,
            }}
            style={{
                backgroundColor: COLORS.white,
            }}
            renderLabel={({ route, focused }) => (
                <Text
                    style={[
                        {
                            color: focused ? COLORS.IconColor : 'gray',
                            fontSize: 16,
                            fontFamily: 'semiBold',
                        },
                    ]}
                >
                    {route.title}
                </Text>
            )}
        />
    )

    return (
        <SafeAreaView style={styles.area}>
            <View style={styles.container}>
                <Text style={styles.title}>Jobs</Text>

                <View style={{ flex: 1 }}>
                    <TabView
                        navigationState={{ index, routes }}
                        renderScene={renderScene}
                        onIndexChange={setIndex}
                        initialLayout={{ width: layout.width }}
                        renderTabBar={renderTabBar}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}

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
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
    },
    sortButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: COLORS.IconColor,
    },
    title: {
        fontSize: 20, // adjust as needed
        fontWeight: 'bold',
        color: COLORS.IconColor, // or any color you prefer
        textAlign: 'center',
        marginBottom: 16, // adjust as needed
    },
})

export default JobsList
