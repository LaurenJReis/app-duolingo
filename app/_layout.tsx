import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { ProgressoProvider } from '@/contexts/progresso-context';
import { ToastProvider } from '@/contexts/toast-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * RootLayout — layout raiz, envolve todo o app com os providers globais.
 * Ordem importa: ProgressoProvider depende do AuthProvider para ler userId.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ToastProvider>
        <ProgressoProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              {/* Grupo de autenticação (login, cadastro, recuperar senha) */}
              <Stack.Screen name="(auth)" />
              {/* Grupo principal do app (tabs + telas internas) */}
              <Stack.Screen name="(app)" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ProgressoProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
