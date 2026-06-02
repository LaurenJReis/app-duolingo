import { useProgresso } from '@/contexts/progresso-context';
import { getLicaoById } from '@/data';
import { Exercicio } from '@/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ─── Tipos internos ───────────────────────────────────────────────────────────

type EstadoResposta = 'aguardando' | 'correto' | 'incorreto';

// acertosRef espelha o estado acertos para leitura segura em funções async
// (evita closure stale: o callback leria o valor antigo do useState)
export default function LicaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { concluirLicao, registrarErro } = useProgresso();

  const resultado = getLicaoById(id);

  // ─── Estado da lição ────────────────────────────────────────────────────────
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [estadoResposta, setEstadoResposta] = useState<EstadoResposta>('aguardando');
  const [acertos, setAcertos] = useState(0);
  const [concluida, setConcluida] = useState(false);
  const [xpGanho, setXpGanho] = useState(0);
  const [taxaFinalSalva, setTaxaFinalSalva] = useState(0);
  const [acertosFinaisSalvos, setAcertosFinaisSalvos] = useState(0);
  // Ref para acertos — evita problema de closure com estado assíncrono
  const acertosRef = useRef(0);

  // Animações — devem ficar antes de qualquer early return
  const progressoAnim = useRef(new Animated.Value(0)).current;
  const conclusaoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!resultado) return;
    const total = resultado.licao.exercicios.length;
    const pct = total > 0 ? indiceAtual / total : 0;
    Animated.timing(progressoAnim, {
      toValue: pct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [indiceAtual, resultado]);

  useEffect(() => {
    if (concluida) {
      Animated.spring(conclusaoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    }
  }, [concluida]);

  if (!resultado) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.erro}>Lição não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const { licao, curso } = resultado;
  const exercicios = licao.exercicios.sort((a, b) => a.ordem - b.ordem);
  const exercicioAtual: Exercicio | undefined = exercicios[indiceAtual];
  const totalExercicios = exercicios.length;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function handleSelecionarResposta(opcao: string) {
    if (estadoResposta !== 'aguardando') return;
    setRespostaSelecionada(opcao);
  }

  async function handleConfirmar() {
    if (!respostaSelecionada || !exercicioAtual) return;

    const correta = Array.isArray(exercicioAtual.respostaCorreta)
      ? exercicioAtual.respostaCorreta.includes(respostaSelecionada)
      : respostaSelecionada === exercicioAtual.respostaCorreta;

    if (correta) {
      setEstadoResposta('correto');
      acertosRef.current += 1;
      setAcertos(acertosRef.current);
    } else {
      setEstadoResposta('incorreto');
      await registrarErro(exercicioAtual.id, licao.id);
    }
  }

  async function handleProximo() {
    const proximoIndice = indiceAtual + 1;

    if (proximoIndice >= totalExercicios) {
      // Usa a ref para ter o valor exato — sem problema de closure
      const acertosFinais = acertosRef.current;
      const taxaFinal = totalExercicios > 0 ? acertosFinais / totalExercicios : 0;

      await concluirLicao(licao.id, taxaFinal);

      // Calcula XP estimado para exibir (mesma lógica do contexto)
      let xp = Math.round(licao.xpRecompensa * taxaFinal);
      if (taxaFinal === 1) xp = Math.round(xp * 1.2);

      setXpGanho(xp);
      setTaxaFinalSalva(taxaFinal);
      setAcertosFinaisSalvos(acertosFinais);
      setConcluida(true);

      // Atualiza barra para 100%
      Animated.timing(progressoAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      setIndiceAtual(proximoIndice);
      setRespostaSelecionada(null);
      setEstadoResposta('aguardando');
    }
  }

  // ─── Tela de conclusão ───────────────────────────────────────────────────────

  if (concluida) {
    const acertosFinais = acertosFinaisSalvos;
    const taxaFinal = taxaFinalSalva;
    const passou = taxaFinal >= licao.minimoAcerto;

    function handleConclusaoBotao() {
      if (passou) {
        router.back();
      } else {
        acertosRef.current = 0;
        setIndiceAtual(0);
        setRespostaSelecionada(null);
        setEstadoResposta('aguardando');
        setAcertos(0);
        setConcluida(false);
        setXpGanho(0);
        setTaxaFinalSalva(0);
        setAcertosFinaisSalvos(0);
        progressoAnim.setValue(0);
        conclusaoAnim.setValue(0);
      }
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.conclusaoContainer}>
          <Text style={styles.conclusaoIcone}>{passou ? '🎉' : '😅'}</Text>
          <Text style={styles.conclusaoTitulo}>
            {passou ? 'Lição concluída!' : 'Quase lá!'}
          </Text>
          <Text style={styles.conclusaoSubtitulo}>
            {passou
              ? 'Ótimo trabalho! Continue assim.'
              : `Você precisa de ${Math.round(licao.minimoAcerto * 100)}% de acerto. Tente novamente!`}
          </Text>

          {/* Estatísticas com animação de entrada */}
          <Animated.View
            style={[
              styles.statsContainer,
              {
                opacity: conclusaoAnim,
                transform: [
                  {
                    scale: conclusaoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValor}>{acertosFinais}/{totalExercicios}</Text>
              <Text style={styles.statLabel}>Acertos</Text>
            </View>
            <View style={styles.statDivisor} />
            <View style={styles.statItem}>
              <Text style={styles.statValor}>{Math.round(taxaFinal * 100)}%</Text>
              <Text style={styles.statLabel}>Taxa</Text>
            </View>
            {passou && (
              <>
                <View style={styles.statDivisor} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValor, { color: '#FFD700' }]}>+{xpGanho}</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
              </>
            )}
          </Animated.View>

          <Pressable
            style={[styles.botaoConclusao, { backgroundColor: passou ? curso.cor : '#FF4B4B' }]}
            onPress={handleConclusaoBotao}
          >
            <Text style={styles.botaoConclusaoTexto}>
              {passou ? 'Continuar' : 'Tentar novamente'}
            </Text>
          </Pressable>

          {!passou && (
            <Pressable style={styles.botaoVoltar} onPress={() => router.back()}>
              <Text style={styles.botaoVoltarTexto}>Voltar à trilha</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!exercicioAtual) return null;

  // ─── Tela de exercício ───────────────────────────────────────────────────────

  const corCurso = curso.cor;
  const feedbackVisivel = estadoResposta !== 'aguardando';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.fecharBtn}>
          <MaterialIcons name="close" size={24} color="#999" />
        </Pressable>

        {/* Barra de progresso */}
        <View style={styles.progressoContainer}>
          <View style={styles.progressoBarra}>
            <Animated.View
              style={[
                styles.progressoPreenchimento,
                {
                  width: progressoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: corCurso,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.contadorTexto}>
          {indiceAtual + 1}/{totalExercicios}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pergunta */}
        <View style={styles.perguntaContainer}>
          <Text style={styles.tipoExercicio}>
            {exercicioAtual.tipo === 'verdadeiro-falso'
              ? 'Verdadeiro ou Falso?'
              : 'Escolha a resposta correta'}
          </Text>
          <Text style={styles.pergunta}>{exercicioAtual.pergunta}</Text>
        </View>

        {/* Opções */}
        <View style={styles.opcoesContainer}>
          {exercicioAtual.opcoes.map((opcao) => {
            const selecionada = respostaSelecionada === opcao;
            const correta = opcao === exercicioAtual.respostaCorreta;
            const mostrarCorreta = feedbackVisivel && correta;
            const mostrarErrada = feedbackVisivel && selecionada && !correta;

            let corBorda = '#E5E5E5';
            let corFundo = '#fff';

            if (mostrarCorreta) {
              corBorda = '#58CC02';
              corFundo = '#F0FFF0';
            } else if (mostrarErrada) {
              corBorda = '#FF4B4B';
              corFundo = '#FFF0F0';
            } else if (selecionada && !feedbackVisivel) {
              corBorda = corCurso;
              corFundo = corCurso + '15';
            }

            return (
              <Pressable
                key={opcao}
                style={({ pressed }) => [
                  styles.opcao,
                  {
                    borderColor: corBorda,
                    backgroundColor: corFundo,
                    opacity: pressed && !feedbackVisivel ? 0.85 : 1,
                  },
                ]}
                onPress={() => handleSelecionarResposta(opcao)}
                disabled={feedbackVisivel}
              >
                <View style={styles.opcaoInner}>
                  <View
                    style={[
                      styles.opcaoIndicador,
                      {
                        borderColor: corBorda,
                        backgroundColor: mostrarCorreta
                          ? '#58CC02'
                          : mostrarErrada
                          ? '#FF4B4B'
                          : selecionada && !feedbackVisivel
                          ? corCurso
                          : 'transparent',
                      },
                    ]}
                  >
                    {mostrarCorreta && (
                      <MaterialIcons name="check" size={14} color="#fff" />
                    )}
                    {mostrarErrada && (
                      <MaterialIcons name="close" size={14} color="#fff" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.opcaoTexto,
                      mostrarCorreta && { color: '#2E7D32', fontWeight: '600' },
                      mostrarErrada && { color: '#C62828', fontWeight: '600' },
                      selecionada && !feedbackVisivel && { color: '#333', fontWeight: '600' },
                    ]}
                  >
                    {opcao}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Feedback e botão de ação */}
      <View
        style={[
          styles.rodape,
          feedbackVisivel && {
            backgroundColor: estadoResposta === 'correto' ? '#F0FFF0' : '#FFF0F0',
            borderTopColor: estadoResposta === 'correto' ? '#58CC02' : '#FF4B4B',
          },
        ]}
      >
        {feedbackVisivel && (
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHeader}>
              <MaterialIcons
                name={estadoResposta === 'correto' ? 'check-circle' : 'cancel'}
                size={22}
                color={estadoResposta === 'correto' ? '#58CC02' : '#FF4B4B'}
              />
              <Text
                style={[
                  styles.feedbackTitulo,
                  { color: estadoResposta === 'correto' ? '#2E7D32' : '#C62828' },
                ]}
              >
                {estadoResposta === 'correto' ? 'Correto!' : 'Incorreto'}
              </Text>
            </View>
            {estadoResposta === 'incorreto' && (
              <Text style={styles.feedbackExplicacao}>
                {exercicioAtual.explicacao}
              </Text>
            )}
          </View>
        )}

        <Pressable
          style={[
            styles.botaoAcao,
            !respostaSelecionada && !feedbackVisivel && styles.botaoDesabilitado,
            feedbackVisivel && {
              backgroundColor: estadoResposta === 'correto' ? '#58CC02' : '#FF4B4B',
            },
          ]}
          onPress={feedbackVisivel ? handleProximo : handleConfirmar}
          disabled={!respostaSelecionada && !feedbackVisivel}
        >
          <Text style={styles.botaoAcaoTexto}>
            {feedbackVisivel
              ? indiceAtual + 1 >= totalExercicios
                ? 'Ver resultado'
                : 'Próximo'
              : 'Confirmar'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fecharBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressoContainer: {
    flex: 1,
  },
  progressoBarra: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressoPreenchimento: {
    height: '100%',
    borderRadius: 4,
  },
  contadorTexto: {
    fontSize: 13,
    color: '#999',
    minWidth: 36,
    textAlign: 'right',
  },
  conteudo: {
    padding: 24,
    paddingBottom: 16,
    flexGrow: 1,
  },
  perguntaContainer: {
    marginBottom: 28,
  },
  tipoExercicio: {
    fontSize: 13,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pergunta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
  },
  opcoesContainer: {
    gap: 12,
  },
  opcao: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
  },
  opcaoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  opcaoIndicador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcaoTexto: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  rodape: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  feedbackContainer: {
    gap: 6,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackExplicacao: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  botaoAcao: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoDesabilitado: {
    backgroundColor: '#E5E5E5',
  },
  botaoAcaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conclusaoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  conclusaoIcone: {
    fontSize: 72,
    marginBottom: 8,
  },
  conclusaoTitulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  conclusaoSubtitulo: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValor: {
    fontSize: 24,
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
  botaoConclusao: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  botaoConclusaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoVoltar: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoVoltarTexto: {
    color: '#999',
    fontSize: 15,
  },
});
