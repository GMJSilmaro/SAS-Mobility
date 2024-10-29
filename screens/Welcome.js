import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, icons, images } from "../constants";
import SocialButtonV2 from "../components/SocialButtonV2";

const Welcome = ({ navigation }) => {

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: COLORS.white }]}>
      <View style={[styles.container, { backgroundColor: COLORS.white }]}>
        <Image source={images.logo} resizeMode="contain" style={styles.logo} />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>
          Hello there, continue with and search the best events from around the world.
        </Text>
        <View style={{ marginVertical: 32 }}>
          <SocialButtonV2 title="Continue with Apple" icon={icons.appleLogo} onPress={() => navigation.navigate("Signup")}
            iconStyles={{ tintColor: COLORS.black }} />
          <SocialButtonV2 title="Continue with Google" icon={icons.google} onPress={() => navigation.navigate("Signup")} />
          <SocialButtonV2 title="Continue with Email" icon={icons.email2} onPress={() => navigation.navigate("Signup")} />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={[styles.loginTitle, {
            color: "black"
          }]}>Already have account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginSubtitle}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <Text style={[styles.bottomTitle, {
          color: COLORS.black
        }]}>
          By continuing, you accept the Terms Of Use and
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.bottomSubtitle, {
            color: COLORS.black
          }]}>Privacy Policy.</Text>
        </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 22,
    marginTop: -22,
    tintColor: COLORS.primary
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.black,
    marginVertical: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: "black",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  loginTitle: {
    fontSize: 14,
    fontFamily: "regular",
    color: "black",
  },
  loginSubtitle: {
    fontSize: 14,
    fontFamily: "semiBold",
    color: COLORS.primary,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 32,
    right: 0,
    left: 0,
    width: SIZES.width - 32,
    alignItems: "center",
  },
  bottomTitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
  },
  bottomSubtitle: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
    textDecorationLine: "underline",
    marginTop: 2,
  },
});

export default Welcome;