import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ONBOARDING_KEY } from './onboarding';

export default function AppIndex() {
  const [verificando, setVerificando] = useState(true);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);

  useEffect(() => {
    async function verificar() {
      try {
        const valor = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingConcluido(valor === 'true');
      } catch {
        setOnboardingConcluido(false);
      } finally {
        setVerificando(false);
      }
    }
    verificar();
  }, []);

  if (verificando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  if (!onboardingConcluido) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
