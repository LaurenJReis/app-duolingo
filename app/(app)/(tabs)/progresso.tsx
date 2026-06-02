import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useProgresso } from '@/contexts/progresso-context';
import { cursos, getLicaoById } from '@/data';
import { conquistas as listaConquistas } from '@/data';

export default function ProgressoScreen() {
  const { usuario } = useAuth();
  const { getProgressoCurso, getProgressoModulo, progresso, erros } = useProgresso();
  const router = useRouter();

  const conquistasDesbloqueadas = listaConquistas.filter((c) =>
    usuario?.conquistas.includes(c.id)
  );

  // Monta histórico de lições concluídas
  const historicoLicoes = (() => {
    const lista: {
      licaoId: string;
      titulo: string;
      cursoNome: string;
      corCurso: string;
      taxaAcerto: number;
      tentativas: number;
      ultimaTentativa: string;
    }[] = [];

    for (const cursoProg of Object.values(progresso)) {
      for (const moduloProg of Object.values(cursoProg.modulos)) {
        for (const licaoProg of Object.values(moduloProg.licoes)) {
          if (!licaoProg.concluida) continue;
          const dados = getLicaoById(licaoProg.licaoId);
          if (!dados) continue;
          lista.push({
            licaoId: licaoProg.licaoId,
            titulo: dados.licao.titulo,
            cursoNome: dados.curso.nome,
            corCurso: dados.curso.cor,
            taxaAcerto: licaoProg.taxaAcerto,
            tentativas: licaoProg.tentativas,
            ultimaTentativa: licaoProg.ultimaTentativa ?? '',
          });
        }
      }
    }

    // Ordena por data mais recente
    return lista.sort(
      (a, b) => new Date(b.ultimaTentativa).getTime() - new Date(a.ultimaTentativa).getTime()
    );
  })();

  function formatarData(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const hoje = new Date();
    const diff = Math.floor((hoje.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titulo}>Meu Progresso</Text>

        {/* Estatísticas gerais */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="bolt" size={28} color="#FFD700" />
            <Text style={styles.statValor}>{usuario?.xp ?? 0}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValor}>{usuario?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="military-tech" size={28} color="#58CC02" />
            <Text style={styles.statValor}>{usuario?.nivel ?? 1}</Text>
            <Text style={styles.statLabel}>Nível</Text>
          </View>
        </View>

        {/* Botão de revisão inteligente */}
        <Pressable
          style={({ pressed }) => [styles.revisaoBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(app)/revisao')}
        >
          <View style={styles.revisaoBtnIcone}>
            <MaterialIcons name="replay" size={22} color="#1CB0F6" />
          </View>
          <View style={styles.revisaoBtnInfo}>
            <Text style={styles.revisaoBtnTitulo}>Revisão Inteligente</Text>
            <Text style={styles.revisaoBtnSubtitulo}>
              {erros.length > 0
                ? `${new Set(erros.map((e) => e.licaoId)).size} lições para revisar`
                : 'Sem erros registrados'}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#CCC" />
        </Pressable>

        {/* Progresso por curso */}
        {cursos.map((curso) => {
          const cursoProg = progresso[curso.id];
          if (!cursoProg?.iniciado) return null;

          const pctCurso = getProgressoCurso(curso.id);

          return (
            <View key={curso.id} style={styles.secao}>
              <View style={styles.secaoHeader}>
                <MaterialIcons name={curso.icone as any} size={22} color={curso.cor} />
                <Text style={styles.secaoTitulo}>{curso.nome}</Text>
                <Text style={[styles.pctTexto, { color: curso.cor }]}>
                  {Math.round(pctCurso * 100)}%
                </Text>
              </View>

              {/* Barra geral do curso */}
              <View style={styles.barraCurso}>
                <View
                  style={[
                    styles.barraCursoPreenchimento,
                    { width: `${Math.round(pctCurso * 100)}%`, backgroundColor: curso.cor },
                  ]}
                />
              </View>

              {/* Progresso por módulo */}
              {curso.modulos.map((modulo) => {
                const pctModulo = getProgressoModulo(modulo.id);
                return (
                  <View key={modulo.id} style={styles.moduloRow}>
                    <MaterialIcons name={modulo.icone as any} size={16} color="#999" />
                    <Text style={styles.moduloNome} numberOfLines={1}>
                      {modulo.titulo}
                    </Text>
                    <View style={styles.moduloBarra}>
                      <View
                        style={[
                          styles.moduloBarraPreenchimento,
                          {
                            width: `${Math.round(pctModulo * 100)}%`,
                            backgroundColor: curso.cor + 'AA',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.moduloPct}>{Math.round(pctModulo * 100)}%</Text>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Histórico de lições */}
        {historicoLicoes.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>
              Histórico ({historicoLicoes.length} {historicoLicoes.length === 1 ? 'lição' : 'lições'})
            </Text>
            {historicoLicoes.map((item) => (
              <View key={item.licaoId} style={styles.historicoItem}>
                <View style={[styles.historicoIndicador, { backgroundColor: item.corCurso }]} />
                <View style={styles.historicoInfo}>
                  <Text style={styles.historicoTitulo} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={styles.historicoCurso}>{item.cursoNome}</Text>
                </View>
                <View style={styles.historicoStats}>
                  <Text style={[
                    styles.historicoTaxa,
                    { color: item.taxaAcerto >= 0.8 ? '#58CC02' : item.taxaAcerto >= 0.6 ? '#FF9900' : '#FF4B4B' }
                  ]}>
                    {Math.round(item.taxaAcerto * 100)}%
                  </Text>
                  <Text style={styles.historicoData}>{formatarData(item.ultimaTentativa)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Conquistas */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>
            Conquistas ({conquistasDesbloqueadas.length}/{listaConquistas.length})
          </Text>
          <View style={styles.conquistasGrid}>
            {listaConquistas.map((conquista) => {
              const desbloqueada = usuario?.conquistas.includes(conquista.id);
              return (
                <View
                  key={conquista.id}
                  style={[styles.conquistaItem, !desbloqueada && styles.conquistaBloqueada]}
                >
                  <MaterialIcons
                    name={conquista.icone as any}
                    size={28}
                    color={desbloqueada ? '#FFD700' : '#CCC'}
                  />
                  <Text
                    style={[
                      styles.conquistaNome,
                      !desbloqueada && styles.conquistaNomeBloqueada,
                    ]}
                    numberOfLines={2}
                  >
                    {conquista.titulo}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 28,
  },
  statValor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  secao: {
    marginBottom: 24,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  secaoTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  pctTexto: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  barraCurso: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barraCursoPreenchimento: {
    height: '100%',
    borderRadius: 5,
  },
  moduloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  moduloNome: {
    fontSize: 13,
    color: '#555',
    width: 120,
  },
  moduloBarra: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  moduloBarraPreenchimento: {
    height: '100%',
    borderRadius: 3,
  },
  moduloPct: {
    fontSize: 12,
    color: '#999',
    width: 32,
    textAlign: 'right',
  },
  conquistasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  conquistaItem: {
    width: '30%',
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  conquistaBloqueada: {
    backgroundColor: '#F5F5F5',
  },
  conquistaNome: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },
  conquistaNomeBloqueada: {
    color: '#BBB',
  },
  revisaoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D0EEFF',
  },
  revisaoBtnIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revisaoBtnInfo: {
    flex: 1,
  },
  revisaoBtnTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  revisaoBtnSubtitulo: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  // Histórico de lições
  historicoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  historicoIndicador: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  historicoInfo: {
    flex: 1,
    gap: 2,
  },
  historicoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  historicoCurso: {
    fontSize: 12,
    color: '#999',
  },
  historicoStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  historicoTaxa: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  historicoData: {
    fontSize: 11,
    color: '#BBB',
  },
});
