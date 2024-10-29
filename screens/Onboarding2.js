import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageContainer from '../components/PageContainer';
import DotsView from '../components/DotsView';
import Button from '../components/Button';
import Onboarding1Styles from '../styles/OnboardingStyles';
import { COLORS, images } from '../constants';

const Onboarding2 = ({ navigation }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 1) {
          clearInterval(intervalId);
          return prevProgress;
        }
        return prevProgress + 0.5;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (progress >= 1) {
      // navigate to the onboarding3 screen 
      navigation.navigate('Onboarding3')
    }
  }, [progress, navigation]);

  return (
    <SafeAreaView style={Onboarding1Styles.container}>
      <PageContainer>
        <View style={Onboarding1Styles.contentContainer}>
          <Image
            source={images.onboarding2}
            resizeMode="contain"
            style={Onboarding1Styles.illustration}
          />
          <Image
            source={images.ornament}
            resizeMode='contain'
            style={Onboarding1Styles.ornament}
          />
          <View style={Onboarding1Styles.buttonContainer}>
            <View style={Onboarding1Styles.titleContainer}>
              <Text style={Onboarding1Styles.title}>Enjoy your booking process with</Text>
              <Text style={Onboarding1Styles.subTitle}>EVENTA</Text>
            </View>

            <Text style={Onboarding1Styles.description}>
              Thousands of the best event at affordable prices only for you.
            </Text>

            <View style={Onboarding1Styles.dotsContainer}>
              {progress < 1 && <DotsView progress={progress} numDots={4} />}
            </View>
            <Button
              title="Next"
              filled
              onPress={() => navigation.navigate('Onboarding2')}
              style={Onboarding1Styles.nextButton}
            />
            <Button
              title="Skip"
              onPress={() => navigation.navigate('Login')}
              textColor={COLORS.primary}
              style={Onboarding1Styles.skipButton}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
};

export default Onboarding2;