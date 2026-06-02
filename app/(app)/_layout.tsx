import { useAuth } from '@/contexts/auth-context';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { usuario, carregando } = useAuth();

  // Aguarda verificação da sessão
  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  // Não logado → vai para login
  if (!usuario) {
    return <Redirect href="/(auth)" />;
  }

  // Logado → renderiza o Stack normalmente
  // O redirecionamento para onboarding é feito pelo index.tsx deste grupo
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="curso/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="licao/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="revisao/index" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
