import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function CadastroScreen() {
  const { cadastrar } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      await cadastrar(nome.trim(), email.trim(), senha);
      // Redirecionamento automático pelo AuthLayout
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <Pressable style={styles.voltar} onPress={() => router.back()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </Pressable>

        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>Comece sua jornada de aprendizado</Text>

        {/* Formulário */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor="#999"
            autoCapitalize="words"
            value={nome}
            onChangeText={setNome}
          />
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
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor="#999"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Pressable
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Criar conta</Text>
            )}
          </Pressable>
        </View>

        {/* Rodapé */}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Já tem conta? </Text>
          <Link href="/(auth)" asChild>
            <Pressable>
              <Text style={styles.rodapeLink}>Entrar</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  voltar: {
    marginBottom: 24,
  },
  voltarTexto: {
    color: '#58CC02',
    fontSize: 16,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 16,
    color: '#777',
    marginBottom: 32,
  },
  form: {
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
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
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
});
