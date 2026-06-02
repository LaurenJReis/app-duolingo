import { useAuth } from '@/contexts/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // 🔧 TEMPORÁRIO: limpa todo o storage para testar o onboarding do zero
  async function handleResetStorage() {
    await AsyncStorage.clear();
    setErro('Storage limpo! Cadastre-se novamente.');
  }

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha email e senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await login(email.trim(), senha);
      // Redirecionamento automático pelo AuthLayout
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo / título */}
        <Text style={styles.logo}>🦜</Text>
        <Text style={styles.titulo}>Duolingo Clone</Text>
        <Text style={styles.subtitulo}>Aprenda tecnologia todo dia</Text>

        {/* Formulário */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Pressable
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </Pressable>

          <Link href="/(auth)/recuperar-senha" asChild>
            <Pressable style={styles.linkContainer}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>
          </Link>
        </View>

        {/* Rodapé */}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Não tem conta? </Text>
          <Link href="/(auth)/cadastro" asChild>
            <Pressable>
              <Text style={styles.rodapeLink}>Cadastre-se</Text>
            </Pressable>
          </Link>
        </View>

        {/* 🔧 TEMPORÁRIO: botão para limpar storage e testar onboarding */}
        <Pressable onPress={handleResetStorage} style={styles.resetBtn}>
          <Text style={styles.resetTexto}>🔧 Resetar dados (teste)</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 72,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#58CC02',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 16,
    color: '#777',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  erro: {
    color: '#FF4B4B',
    fontSize: 14,
    textAlign: 'center',
  },
  botao: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    color: '#1CB0F6',
    fontSize: 14,
  },
  rodape: {
    flexDirection: 'row',
    marginTop: 40,
  },
  rodapeTexto: {
    color: '#777',
    fontSize: 15,
  },
  rodapeLink: {
    color: '#58CC02',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resetBtn: {
    marginTop: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetTexto: {
    color: '#ccc',
    fontSize: 13,
  },
});
