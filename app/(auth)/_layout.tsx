import { useAuth } from '@/contexts/auth-context';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { usuario, carregando } = useAuth();

  // Aguarda verificação da sessão salva
  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  // Se já está logado, redireciona para o app (index decide onboarding ou tabs)
  if (usuario) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="recuperar-senha" />
    </Stack>
  );
}
