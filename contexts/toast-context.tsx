import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ToastData {
  icone: string;
  titulo: string;
  descricao: string;
  cor?: string;
}

interface ToastContextData {
  mostrarConquista: (dados: ToastData) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarConquista = useCallback((dados: ToastData) => {
    // Cancela timer anterior se houver
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast(dados);

    // Anima entrada
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Esconde após 3s
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToast(null));
    }, 3000);
  }, [opacidade, translateY]);

  return (
    <ToastContext.Provider value={{ mostrarConquista }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: opacidade,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.iconeContainer, { backgroundColor: (toast.cor ?? '#FFD700') + '33' }]}>
            <MaterialIcons
              name={toast.icone as any}
              size={24}
              color={toast.cor ?? '#FFD700'}
            />
          </View>
          <View style={styles.textoContainer}>
            <Text style={styles.conquista}>🏆 Conquista desbloqueada!</Text>
            <Text style={styles.titulo}>{toast.titulo}</Text>
            <Text style={styles.descricao} numberOfLines={1}>
              {toast.descricao}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    zIndex: 9999,
  },
  iconeContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoContainer: {
    flex: 1,
    gap: 1,
  },
  conquista: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  titulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  descricao: {
    fontSize: 12,
    color: '#777',
  },
});
