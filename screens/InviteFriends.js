import { View, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import { COLORS } from '../constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { ScrollView } from 'react-native-virtualized-view';
import { friends } from '../data';
import InviteFriendCard from '../components/InviteFriendCard';

const InviteFriends = () => {

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Header title="Invite Friends" />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <FlatList
            data={friends}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <InviteFriendCard
                name={item.name}
                phoneNumber={item.phoneNumber}
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

export default InviteFriends