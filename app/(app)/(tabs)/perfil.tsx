import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProgresso } from '@/contexts/progresso-context';
import { cursos } from '@/data';

export default function PerfilScreen() {
  const { usuario, logout, atualizarUsuario } = useAuth();
  const { getProgressoCurso, progresso } = useProgresso();

  // Estado do modal de edição
  const [modalVisivel, setModalVisivel] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroNome, setErroNome] = useState('');

  function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  function handleAbrirEdicao() {
    setNovoNome(usuario?.nome ?? '');
    setErroNome('');
    setModalVisivel(true);
  }

  async function handleSalvarNome() {
    const nomeTrimado = novoNome.trim();
    if (!nomeTrimado) {
      setErroNome('O nome não pode ficar vazio.');
      return;
    }
    if (nomeTrimado.length < 2) {
      setErroNome('O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    setSalvando(true);
    try {
      await atualizarUsuario({ nome: nomeTrimado });
      setModalVisivel(false);
    } catch {
      setErroNome('Erro ao salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // Calcula XP para o próximo nível
  const xpAtual = usuario?.xp ?? 0;
  const nivelAtual = usuario?.nivel ?? 1;
  const xpNoNivel = xpAtual % 100;
  const pctNivel = xpNoNivel / 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar e nome */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>
              {usuario?.nome?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>

          {/* Botão editar nome */}
          <Pressable style={styles.editarBtn} onPress={handleAbrirEdicao}>
            <MaterialIcons name="edit" size={14} color="#1CB0F6" />
            <Text style={styles.editarTexto}>Editar nome</Text>
          </Pressable>
        </View>

        {/* Nível e XP */}
        <View style={styles.nivelContainer}>
          <View style={styles.nivelHeader}>
            <Text style={styles.nivelTexto}>Nível {nivelAtual}</Text>
            <Text style={styles.xpTexto}>{xpNoNivel} / 100 XP</Text>
          </View>
          <View style={styles.nivelBarra}>
            <View style={[styles.nivelPreenchimento, { width: `${Math.round(pctNivel * 100)}%` }]} />
          </View>
          <Text style={styles.proximoNivel}>
            Faltam {100 - xpNoNivel} XP para o nível {nivelAtual + 1}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValor}>{usuario?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivisor} />
          <View style={styles.statItem}>
            <MaterialIcons name="bolt" size={24} color="#FFD700" />
            <Text style={styles.statValor}>{xpAtual}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
          <View style={styles.statDivisor} />
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={24} color="#58CC02" />
            <Text style={styles.statValor}>{usuario?.conquistas.length ?? 0}</Text>
            <Text style={styles.statLabel}>Conquistas</Text>
          </View>
        </View>

        {/* Cursos em andamento */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Cursos em andamento</Text>
          {cursos
            .filter((c) => progresso[c.id]?.iniciado)
            .map((curso) => {
              const pct = getProgressoCurso(curso.id);
              return (
                <View key={curso.id} style={styles.cursoItem}>
                  <MaterialIcons name={curso.icone as any} size={20} color={curso.cor} />
                  <Text style={styles.cursoNome}>{curso.nome}</Text>
                  <Text style={[styles.cursoPct, { color: curso.cor }]}>
                    {Math.round(pct * 100)}%
                  </Text>
                </View>
              );
            })}
          {!cursos.some((c) => progresso[c.id]?.iniciado) && (
            <Text style={styles.semCursos}>Nenhum curso iniciado ainda.</Text>
          )}
        </View>

        {/* Ações */}
        <View style={styles.acoes}>
          <Pressable style={styles.botaoSair} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FF4B4B" />
            <Text style={styles.botaoSairTexto}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Modal de edição de nome */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisivel(false)}>
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitulo}>Editar nome</Text>

            <TextInput
              style={[styles.modalInput, erroNome ? styles.modalInputErro : null]}
              value={novoNome}
              onChangeText={(t) => { setNovoNome(t); setErroNome(''); }}
              placeholder="Seu nome"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoFocus
              maxLength={50}
            />

            {erroNome ? <Text style={styles.modalErro}>{erroNome}</Text> : null}

            <View style={styles.modalBotoes}>
              <Pressable
                style={styles.modalBotaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBotaoSalvar, salvando && { opacity: 0.6 }]}
                onPress={handleSalvarNome}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBotaoSalvarTexto}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetra: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E8F7FF',
  },
  editarTexto: {
    fontSize: 13,
    color: '#1CB0F6',
    fontWeight: '600',
  },
  nivelContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  nivelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nivelTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  xpTexto: {
    fontSize: 14,
    color: '#777',
  },
  nivelBarra: {
    height: 10,
    backgroundColor: '#E5E5E5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  nivelPreenchimento: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 5,
  },
  proximoNivel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statDivisor: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
  },
  secao: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cursoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cursoNome: {
    flex: 1,
    fontSize: 15,
    color: '#444',
  },
  cursoPct: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  semCursos: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  acoes: {
    marginTop: 8,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF4B4B',
    borderRadius: 12,
    paddingVertical: 14,
  },
  botaoSairTexto: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  modalInputErro: {
    borderColor: '#FF4B4B',
  },
  modalErro: {
    fontSize: 13,
    color: '#FF4B4B',
    marginTop: -8,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBotaoCancelar: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBotaoCancelarTexto: {
    fontSize: 15,
    color: '#777',
    fontWeight: '600',
  },
  modalBotaoSalvar: {
    flex: 1,
    backgroundColor: '#58CC02',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBotaoSalvarTexto: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
});
