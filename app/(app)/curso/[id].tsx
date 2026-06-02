import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getCursoById } from '@/data';
import { useProgresso } from '@/contexts/progresso-context';
import { Licao, Modulo } from '@/types';

export default function CursoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getLicaoConcluida, getLicaoDesbloqueada, getProgressoModulo } = useProgresso();

  const curso = getCursoById(id);

  if (!curso) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.erro}>Curso não encontrado.</Text>
      </SafeAreaView>
    );
  }

  // Calcula a próxima lição a ser feita (desbloqueada e não concluída)
  const proximaLicaoId = (() => {
    for (const modulo of curso.modulos) {
      for (const licao of modulo.licoes) {
        if (getLicaoDesbloqueada(licao.id) && !getLicaoConcluida(licao.id)) {
          return licao.id;
        }
      }
    }
    return null;
  })();

  function handleLicao(licao: Licao, desbloqueada: boolean) {
    if (!desbloqueada) return;
    router.push(`/(app)/licao/${licao.id}`);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: curso.cor + '11' }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: curso.cor }]}>
        <Pressable onPress={() => router.back()} style={styles.voltarBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          <MaterialIcons name={curso.icone as any} size={32} color="#fff" />
          <Text style={styles.headerTitulo}>{curso.nome}</Text>
          <Text style={styles.headerDescricao}>{curso.descricao}</Text>
        </View>
      </View>

      {/* Trilha */}
      <ScrollView contentContainerStyle={styles.trilha}>
        {curso.modulos.map((modulo: Modulo) => {
          const pctModulo = getProgressoModulo(modulo.id);
          const moduloConcluido = pctModulo === 1;

          return (
            <View key={modulo.id} style={styles.moduloContainer}>
              {/* Cabeçalho do módulo */}
              <View style={styles.moduloHeader}>
                <View style={[styles.moduloIcone, { backgroundColor: curso.cor + '22' }]}>
                  <MaterialIcons name={modulo.icone as any} size={22} color={curso.cor} />
                </View>
                <View style={styles.moduloInfo}>
                  <Text style={styles.moduloOrdem}>Módulo {modulo.ordem}</Text>
                  <Text style={styles.moduloTitulo}>{modulo.titulo}</Text>
                </View>
                {moduloConcluido && (
                  <MaterialIcons name="check-circle" size={22} color={curso.cor} />
                )}
              </View>

              {/* Barra de progresso do módulo */}
              <View style={styles.moduloBarra}>
                <View
                  style={[
                    styles.moduloBarraPreenchimento,
                    { width: `${Math.round(pctModulo * 100)}%`, backgroundColor: curso.cor },
                  ]}
                />
              </View>

              {/* Lições */}
              <View style={styles.licoesContainer}>
                {modulo.licoes.map((licao: Licao) => {
                  const concluida = getLicaoConcluida(licao.id);
                  const desbloqueada = getLicaoDesbloqueada(licao.id);
                  const eProxima = licao.id === proximaLicaoId;

                  return (
                    <Pressable
                      key={licao.id}
                      style={({ pressed }) => [
                        styles.licaoItem,
                        concluida && styles.licaoConcluida,
                        !desbloqueada && styles.licaoBloqueada,
                        eProxima && { borderColor: curso.cor, borderWidth: 2 },
                        pressed && desbloqueada && styles.licaoPressed,
                      ]}
                      onPress={() => handleLicao(licao, desbloqueada)}
                      disabled={!desbloqueada}
                    >
                      {/* Ícone de status */}
                      <View
                        style={[
                          styles.licaoIcone,
                          concluida
                            ? { backgroundColor: curso.cor }
                            : desbloqueada
                            ? { backgroundColor: curso.cor + '22' }
                            : { backgroundColor: '#F0F0F0' },
                        ]}
                      >
                        {concluida ? (
                          <MaterialIcons name="check" size={18} color="#fff" />
                        ) : desbloqueada ? (
                          <MaterialIcons name="play-arrow" size={18} color={curso.cor} />
                        ) : (
                          <MaterialIcons name="lock" size={18} color="#CCC" />
                        )}
                      </View>

                      {/* Informações da lição */}
                      <View style={styles.licaoInfo}>
                        <Text
                          style={[
                            styles.licaoTitulo,
                            !desbloqueada && styles.licaoTextoBloqueado,
                          ]}
                        >
                          {licao.titulo}
                        </Text>
                        <Text
                          style={[
                            styles.licaoDescricao,
                            !desbloqueada && styles.licaoTextoBloqueado,
                          ]}
                          numberOfLines={1}
                        >
                          {licao.descricao}
                        </Text>
                      </View>

                      {/* Badge "Continuar" na próxima lição */}
                      {eProxima && (
                        <View style={[styles.continuarBadge, { backgroundColor: curso.cor }]}>
                          <Text style={styles.continuarTexto}>Continuar</Text>
                        </View>
                      )}

                      {/* XP */}
                      {!eProxima && (
                        <View style={styles.licaoXp}>
                          <MaterialIcons
                            name="bolt"
                            size={14}
                            color={desbloqueada ? '#FFD700' : '#CCC'}
                          />
                          <Text
                            style={[
                              styles.licaoXpTexto,
                              !desbloqueada && styles.licaoTextoBloqueado,
                            ]}
                          >
                            {licao.xpRecompensa}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  erro: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  voltarBtn: {
    marginBottom: 12,
    width: 36,
  },
  headerInfo: {
    gap: 4,
  },
  headerTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  headerDescricao: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  trilha: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  moduloContainer: {
    gap: 12,
  },
  moduloHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduloIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduloInfo: {
    flex: 1,
  },
  moduloOrdem: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moduloTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  moduloBarra: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  moduloBarraPreenchimento: {
    height: '100%',
    borderRadius: 2,
  },
  licoesContainer: {
    gap: 8,
  },
  licaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  licaoConcluida: {
    borderColor: '#E8F5E9',
    backgroundColor: '#F9FFF9',
  },
  licaoBloqueada: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  licaoPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  licaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  licaoInfo: {
    flex: 1,
    gap: 2,
  },
  licaoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  licaoDescricao: {
    fontSize: 12,
    color: '#777',
  },
  licaoTextoBloqueado: {
    color: '#BBB',
  },
  licaoXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  licaoXpTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  continuarBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  continuarTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
