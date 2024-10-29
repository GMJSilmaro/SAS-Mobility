import { View, Platform, Image, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { COLORS, FONTS, icons } from '../constants'
import {
    BookEvent,
    Chat,
    EventDetailsPeopleGoing,
    Explore,
    Favourite,
    Home,
    Inbox,
    Profile,
} from '../screens'
import JobsList from '../screens/JobsList'
import JobCustomersList from '../screens/JobCustomersList'

const Tab = createBottomTabNavigator()

const BottomTabNavigation = ({ route }) => {
    const { workerId } = route.params // Ensure workerId is passed here
    console.log('workerId in BottomTabNavigation:', workerId) // Check if workerId is correctly received

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 10, // Adds elevation, moving the tab bar up slightly
                    left: 10,
                    right: 10,
                    elevation: 5,
                    height: Platform.OS === 'ios' ? 90 : 70,
                    backgroundColor: COLORS.white,
                    borderRadius: 20, // Rounded corners for a modern look
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    borderTopColor: 'transparent',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={Home}
                initialParams={{ workerId }}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Image
                                source={
                                    focused ? icons.home : icons.home2Outline
                                }
                                resizeMode="contain"
                                style={{
                                    height: 24,
                                    width: 24,
                                    tintColor: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            />
                            <Text
                                style={{
                                    ...FONTS.body4,
                                    color: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            >
                                Home
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Customers"
                initialParams={{ workerId }}
                component={JobCustomersList}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Image
                                source={focused ? icons.users : icons.users}
                                resizeMode="contain"
                                style={{
                                    height: 24,
                                    width: 24,
                                    tintColor: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            />
                            <Text
                                style={{
                                    ...FONTS.body4,
                                    color: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            >
                                Customers
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Jobs List"
                component={JobsList}
                initialParams={{ workerId }} // Pass workerId here
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Image
                                source={
                                    focused ? icons.document : icons.document2
                                }
                                resizeMode="contain"
                                style={{
                                    height: 24,
                                    width: 24,
                                    tintColor: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            />
                            <Text
                                style={{
                                    ...FONTS.body4,
                                    color: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            >
                                Jobs List
                            </Text>
                        </View>
                    ),
                }}
            />
               <Tab.Screen
                name="Chat"
                component={Chat}
                initialParams={{ workerId }} // Pass workerId here
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Image
                                source={
                                    focused ? icons.document : icons.document2
                                }
                                resizeMode="contain"
                                style={{
                                    height: 24,
                                    width: 24,
                                    tintColor: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            />
                            <Text
                                style={{
                                    ...FONTS.body4,
                                    color: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            >
                                Jobs List
                            </Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                initialParams={{ workerId }}
                component={Profile}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Image
                                source={
                                    focused ? icons.user : icons.userOutline
                                }
                                resizeMode="contain"
                                style={{
                                    height: 24,
                                    width: 24,
                                    tintColor: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            />
                            <Text
                                style={{
                                    ...FONTS.body4,
                                    color: focused
                                        ? COLORS.IconColor
                                        : COLORS.gray3,
                                }}
                            >
                                Profile
                            </Text>
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    )
}

export default BottomTabNavigation

// import { View, Platform, Image, Text } from 'react-native';
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { COLORS, FONTS, icons } from '../constants';
// import { BookEvent, EventDetailsPeopleGoing, Explore, Favourite, Home, Inbox, Profile } from '../screens';
// import JobsList from '../screens/JobsList';

// const Tab = createBottomTabNavigator()

// const BottomTabNavigation = () => {

//     return (
//         <Tab.Navigator screenOptions={{
//             tabBarShowLabel: false,
//             headerShown: false,
//             tabBarStyle: {
//                 position: 'absolute',
//                 justifyContent: "center",
//                 bottom: 0,
//                 right: 0,
//                 left: 0,
//                 elevation: 0,
//                 height: Platform.OS === 'ios' ? 90 : 60,
//                 backgroundColor: COLORS.white,
//                 borderTopColor: "transparent",
//             },
//         }}>
//             <Tab.Screen
//                 name="Home"
//                 component={Home}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.home : icons.home2Outline}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Home</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             />
//                      <Tab.Screen
//                 name="Customers"
//                 component={Favourite}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.users : icons.users}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Customers</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             />
//                      <Tab.Screen
//                 name="Jobs List"
//                 component={JobsList}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.document : icons.document2}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Jobs List</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             />
//             {/* <Tab.Screen
//                 name="Explore"
//                 component={Explore}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.search3 : icons.search3}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Explore</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             /> */}

//             {/* <Tab.Screen
//                 name="Favourite"
//                 component={Favourite}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.heart2 : icons.heart2Outline}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Favourite</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             /> */}
//             {/* <Tab.Screen
//                 name="Inbox"
//                 component={Inbox}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.chatBubble2 : icons.chatBubble2Outline}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Inbox</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             /> */}
//             <Tab.Screen
//                 name="Profile"
//                 component={Profile}
//                 options={{
//                     tabBarIcon: ({ focused }) => {
//                         return (
//                             <View style={{ alignItems: "center" }}>
//                                 <Image
//                                     source={focused ? icons.user : icons.userOutline}
//                                     resizeMode='contain'
//                                     style={{
//                                         height: 24,
//                                         width: 24,
//                                         tintColor: focused ? COLORS.primary : COLORS.gray3,
//                                     }}
//                                 />
//                                 <Text style={{
//                                     ...FONTS.body4,
//                                     color: focused ? COLORS.primary : COLORS.gray3,
//                                 }}>Profile</Text>
//                             </View>
//                         )
//                     },
//                 }}
//             />
//         </Tab.Navigator>
//     )
// }

// export default BottomTabNavigation
