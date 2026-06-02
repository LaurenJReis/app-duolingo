import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Slides ───────────────────────────────────────────────────────────────────

const slides = [
  {
    id: '1',
    icone: '🦜',
    titulo: 'Bem-vindo!',
    descricao: 'Aprenda Expo e AWS de forma progressiva, interativa e gamificada — como no Duolingo.',
    cor: '#58CC02',
  },
  {
    id: '2',
    icone: '📚',
    titulo: 'Trilhas de aprendizado',
    descricao: 'Avance por módulos e lições em sequência. Cada conteúdo desbloqueado ao concluir o anterior.',
    cor: '#1CB0F6',
  },
  {
    id: '3',
    icone: '⚡',
    titulo: 'Ganhe XP e suba de nível',
    descricao: 'Complete lições para ganhar experiência, subir de nível e manter sua sequência diária.',
    cor: '#FFD700',
  },
  {
    id: '4',
    icone: '🏆',
    titulo: 'Conquistas e revisão',
    descricao: 'Desbloqueie conquistas por marcos atingidos e revise os exercícios que você errou.',
    cor: '#FF9900',
  },
];

export const ONBOARDING_KEY = '@duolingo:onboarding_concluido';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const [indiceAtual, setIndiceAtual] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  async function handleConcluir() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // mesmo com erro, segue para o app
    }
    router.replace('/(app)/(tabs)');
  }

  function handleProximo() {
    if (indiceAtual < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: indiceAtual + 1, animated: true });
      setIndiceAtual(indiceAtual + 1);
    } else {
      handleConcluir();
    }
  }

  async function handlePular() {
    await handleConcluir();
  }

  const slide = slides[indiceAtual];

  return (
    <SafeAreaView style={styles.container}>
      {/* Botão pular */}
      <View style={styles.topBar}>
        {indiceAtual < slides.length - 1 ? (
          <Pressable onPress={handlePular} style={styles.pularBtn}>
            <Text style={styles.pularTexto}>Pular</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.slideIcone}>{item.icone}</Text>
            <Text style={[styles.slideTitulo, { color: item.cor }]}>{item.titulo}</Text>
            <Text style={styles.slideDescricao}>{item.descricao}</Text>
          </View>
        )}
      />

      {/* Indicadores de página */}
      <View style={styles.indicadores}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicador,
              i === indiceAtual
                ? [styles.indicadorAtivo, { backgroundColor: slide.cor }]
                : styles.indicadorInativo,
            ]}
          />
        ))}
      </View>

      {/* Botão de ação */}
      <View style={styles.rodape}>
        <Pressable
          style={[styles.botao, { backgroundColor: slide.cor }]}
          onPress={handleProximo}
        >
          <Text style={styles.botaoTexto}>
            {indiceAtual < slides.length - 1 ? 'Próximo' : 'Começar agora'}
          </Text>
          <MaterialIcons
            name={indiceAtual < slides.length - 1 ? 'arrow-forward' : 'check'}
            size={20}
            color="#fff"
          />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pularBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pularTexto: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  slideIcone: {
    fontSize: 96,
    marginBottom: 8,
  },
  slideTitulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slideDescricao: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  indicador: {
    height: 8,
    borderRadius: 4,
  },
  indicadorAtivo: {
    width: 24,
  },
  indicadorInativo: {
    width: 8,
    backgroundColor: '#E5E5E5',
  },
  rodape: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  botao: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
