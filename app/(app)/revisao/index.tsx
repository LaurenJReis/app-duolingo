import React, { useMemo } from 'react';
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
import { useProgresso } from '@/contexts/progresso-context';
import { getLicaoById } from '@/data';
import { ErroRegistrado } from '@/types';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface LicaoComErros {
  licaoId: string;
  titulo: string;
  moduloTitulo: string;
  cursoNome: string;
  corCurso: string;
  totalErros: number;
  ultimoErro: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RevisaoScreen() {
  const router = useRouter();
  const { erros } = useProgresso();

  // Agrupa erros por lição e calcula estatísticas
  const licoesComErros = useMemo<LicaoComErros[]>(() => {
    if (!erros || erros.length === 0) return [];

    // Agrupa por licaoId
    const mapa: Record<string, ErroRegistrado[]> = {};
    for (const erro of erros) {
      if (!mapa[erro.licaoId]) mapa[erro.licaoId] = [];
      mapa[erro.licaoId].push(erro);
    }

    const resultado: LicaoComErros[] = [];

    for (const [licaoId, errosLicao] of Object.entries(mapa)) {
      const dadosLicao = getLicaoById(licaoId);
      if (!dadosLicao) continue;

      const { licao, modulo, curso } = dadosLicao;

      // Ordena por timestamp para pegar o mais recente
      const ordenados = [...errosLicao].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      resultado.push({
        licaoId,
        titulo: licao.titulo,
        moduloTitulo: modulo.titulo,
        cursoNome: curso.nome,
        corCurso: curso.cor,
        totalErros: errosLicao.length,
        ultimoErro: ordenados[0].timestamp,
      });
    }

    // Ordena por total de erros (mais erros primeiro)
    return resultado.sort((a, b) => b.totalErros - a.totalErros);
  }, [erros]);

  // ─── Tela vazia ──────────────────────────────────────────────────────────────

  if (licoesComErros.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.voltarBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitulo}>Revisão</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.vazioContainer}>
          <Text style={styles.vazioIcone}>🎯</Text>
          <Text style={styles.vazioTitulo}>Sem erros registrados</Text>
          <Text style={styles.vazioDescricao}>
            Complete algumas lições e os exercícios que você errar aparecerão aqui para revisão.
          </Text>
          <Pressable style={styles.botaoIniciar} onPress={() => router.back()}>
            <Text style={styles.botaoIniciarTexto}>Ir para os cursos</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Lista de lições para revisar ────────────────────────────────────────────

  function formatarData(iso: string): string {
    const data = new Date(iso);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.voltarBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitulo}>Revisão Inteligente</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Subtítulo */}
      <View style={styles.subtituloContainer}>
        <Text style={styles.subtitulo}>
          {licoesComErros.length} {licoesComErros.length === 1 ? 'lição' : 'lições'} para revisar
        </Text>
        <Text style={styles.subtituloDescricao}>
          Baseado nos seus erros anteriores
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={licoesComErros}
        keyExtractor={(item) => item.licaoId}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(`/(app)/licao/${item.licaoId}`)}
          >
            {/* Indicador de cor do curso */}
            <View style={[styles.cardIndicador, { backgroundColor: item.corCurso }]} />

            <View style={styles.cardConteudo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardCurso}>{item.cursoNome}</Text>
                <Text style={styles.cardData}>{formatarData(item.ultimoErro)}</Text>
              </View>
              <Text style={styles.cardTitulo}>{item.titulo}</Text>
              <Text style={styles.cardModulo}>{item.moduloTitulo}</Text>

              {/* Badge de erros */}
              <View style={styles.cardFooter}>
                <View style={styles.erroBadge}>
                  <MaterialIcons name="error-outline" size={14} color="#FF4B4B" />
                  <Text style={styles.erroBadgeTexto}>
                    {item.totalErros} {item.totalErros === 1 ? 'erro' : 'erros'}
                  </Text>
                </View>
                <View style={styles.revisarBotao}>
                  <Text style={[styles.revisarTexto, { color: item.corCurso }]}>
                    Revisar
                  </Text>
                  <MaterialIcons name="chevron-right" size={16} color={item.corCurso} />
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListHeaderComponent={null}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  voltarBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },

  // Subtítulo
  subtituloContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtituloDescricao: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },

  // Lista
  lista: {
    padding: 16,
    gap: 12,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIndicador: {
    width: 5,
  },
  cardConteudo: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCurso: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  cardData: {
    fontSize: 11,
    color: '#BBB',
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  cardModulo: {
    fontSize: 13,
    color: '#777',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  erroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  erroBadgeTexto: {
    fontSize: 12,
    color: '#FF4B4B',
    fontWeight: '600',
  },
  revisarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  revisarTexto: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Vazio
  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  vazioIcone: {
    fontSize: 64,
    marginBottom: 8,
  },
  vazioTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  vazioDescricao: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },
  botaoIniciar: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  botaoIniciarTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
