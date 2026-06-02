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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar() {
    if (!email.trim()) {
      setErro('Informe seu email.');
      return;
    }

    setErro('');
    setCarregando(true);

    try {
      const json = await AsyncStorage.getItem('@duolingo:usuarios');
      const usuarios: Array<{ email: string }> = json ? JSON.parse(json) : [];
      const existe = usuarios.some(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!existe) {
        setErro('Nenhuma conta encontrada com este email.');
        return;
      }

      setEnviado(true);
    } catch {
      setErro('Erro ao verificar email. Tente novamente.');
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
        <Pressable style={styles.voltar} onPress={() => router.back()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </Pressable>

        <Text style={styles.titulo}>Recuperar senha</Text>
        <Text style={styles.subtitulo}>
          Informe seu email e enviaremos as instruções para redefinir sua senha.
        </Text>

        {enviado ? (
          <View style={styles.sucessoContainer}>
            <Text style={styles.sucessoIcone}>✉️</Text>
            <Text style={styles.sucessoTitulo}>Email enviado!</Text>
            <Text style={styles.sucessoTexto}>
              Verifique sua caixa de entrada e siga as instruções.
            </Text>
            <Pressable style={styles.botao} onPress={() => router.back()}>
              <Text style={styles.botaoTexto}>Voltar ao login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => { setEmail(t); setErro(''); }}
            />

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <Pressable
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={handleEnviar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoTexto}>Enviar instruções</Text>
              )}
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  voltar: {
    marginBottom: 32,
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
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    color: '#777',
    lineHeight: 22,
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
  sucessoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  sucessoIcone: {
    fontSize: 56,
    marginBottom: 8,
  },
  sucessoTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sucessoTexto: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },
});
