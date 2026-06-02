import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '@/contexts/auth-context';
import { useProgresso } from '@/contexts/progresso-context';
import { cursos } from '@/data';
import { Curso } from '@/types';

export default function HomeScreen() {
  const { usuario } = useAuth();
  const { getProgressoCurso, iniciarCurso, progresso } = useProgresso();
  const router = useRouter();

  async function handleAbrirCurso(curso: Curso) {
    if (!progresso[curso.id]?.iniciado) {
      await iniciarCurso(curso.id);
    }
    router.push(`/(app)/curso/${curso.id}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>Olá, {usuario?.nome?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitulo}>O que vamos aprender hoje?</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcone}>🔥</Text>
          <Text style={styles.streakNumero}>{usuario?.streak ?? 0}</Text>
        </View>
      </View>

      {/* Barra de XP */}
      <View style={styles.xpContainer}>
        <MaterialIcons name="bolt" size={18} color="#FFD700" />
        <Text style={styles.xpTexto}>{usuario?.xp ?? 0} XP</Text>
        <Text style={styles.nivelTexto}>Nível {usuario?.nivel ?? 1}</Text>
      </View>

      {/* Lista de cursos */}
      <FlatList
        data={cursos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item: curso }) => {
          const pct = getProgressoCurso(curso.id);
          const iniciado = progresso[curso.id]?.iniciado;

          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handleAbrirCurso(curso)}
            >
              {/* Ícone do curso */}
              <View style={[styles.cardIcone, { backgroundColor: curso.cor + '22' }]}>
                <MaterialIcons
                  name={curso.icone as any}
                  size={36}
                  color={curso.cor}
                />
              </View>

              {/* Informações */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{curso.nome}</Text>
                <Text style={styles.cardDescricao} numberOfLines={2}>
                  {curso.descricao}
                </Text>

                {/* Barra de progresso */}
                <View style={styles.progressoContainer}>
                  <View style={styles.progressoBarra}>
                    <View
                      style={[
                        styles.progressoPreenchimento,
                        { width: `${Math.round(pct * 100)}%`, backgroundColor: curso.cor },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressoTexto}>{Math.round(pct * 100)}%</Text>
                </View>
              </View>

              {/* Seta / status */}
              <View style={styles.cardAcao}>
                {iniciado ? (
                  <MaterialIcons name="chevron-right" size={24} color="#CCC" />
                ) : (
                  <View style={[styles.botaoIniciar, { backgroundColor: curso.cor }]}>
                    <Text style={styles.botaoIniciarTexto}>Iniciar</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  saudacao: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitulo: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  streakIcone: {
    fontSize: 18,
  },
  streakNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6D00',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  xpTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  nivelTexto: {
    fontSize: 13,
    color: '#777',
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIcone: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescricao: {
    fontSize: 13,
    color: '#777',
    lineHeight: 18,
  },
  progressoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressoBarra: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressoPreenchimento: {
    height: '100%',
    borderRadius: 3,
  },
  progressoTexto: {
    fontSize: 12,
    color: '#999',
    minWidth: 32,
    textAlign: 'right',
  },
  cardAcao: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoIniciar: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  botaoIniciarTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
