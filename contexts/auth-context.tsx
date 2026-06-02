import { Usuario } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Persistência local via AsyncStorage (sem backend):
//   @duolingo:usuarios  → todos os cadastros
//   @duolingo:usuario   → sessão ativa (sem senha)
interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => Promise<void>;
}

// ─── Chaves de storage ────────────────────────────────────────────────────────

const STORAGE_KEY_USUARIO = '@duolingo:usuario';
const STORAGE_KEY_USUARIOS = '@duolingo:usuarios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularNivel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function gerarId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

// useRef paralelo ao useState: callbacks assíncronos usam a ref
// para evitar ler valor desatualizado (closure stale)
  const usuarioRef = React.useRef<Usuario | null>(null);
  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  // Carrega sessão salva ao iniciar o app e verifica streak
  useEffect(() => {
    async function carregarSessao() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY_USUARIO);
        if (json) {
          const u: Usuario = JSON.parse(json);

          // Zera streak se o usuário ficou mais de 1 dia sem estudar
          if (u.ultimoEstudo && u.streak > 0) {
            const hoje = new Date().toDateString();
            const ontem = new Date(Date.now() - 86400000).toDateString();
            const ultimoEstudo = new Date(u.ultimoEstudo).toDateString();

            if (ultimoEstudo !== hoje && ultimoEstudo !== ontem) {
              u.streak = 0;
              // Persiste o streak zerado na sessão atual
              await AsyncStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(u));
              // Sincroniza na lista de usuários cadastrados
              const jsonUsuarios = await AsyncStorage.getItem(STORAGE_KEY_USUARIOS);
              if (jsonUsuarios) {
                const usuarios: Array<Usuario & { senha: string }> = JSON.parse(jsonUsuarios);
                const atualizados = usuarios.map((usr) =>
                  usr.id === u.id ? { ...usr, streak: 0 } : usr
                );
                await AsyncStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(atualizados));
              }
            }
          }

          setUsuario(u);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregarSessao();
  }, []);

  const salvarUsuario = useCallback(async (u: Usuario) => {
    await AsyncStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(u));
    setUsuario(u);
  }, []);

  /**
   * login — busca credenciais no storage e salva a sessão sem a senha.
   * Lança erro se não encontrar → capturado pelo catch na tela de login.
   */
  const login = useCallback(async (email: string, senha: string) => {
    const json = await AsyncStorage.getItem(STORAGE_KEY_USUARIOS);
    const usuarios: Array<Usuario & { senha: string }> = json ? JSON.parse(json) : [];

    const encontrado = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );

    if (!encontrado) {
      throw new Error('Email ou senha incorretos.');
    }

    const { senha: _senha, ...dadosUsuario } = encontrado;
    await salvarUsuario(dadosUsuario);
  }, [salvarUsuario]);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    const json = await AsyncStorage.getItem(STORAGE_KEY_USUARIOS);
    const usuarios: Array<Usuario & { senha: string }> = json ? JSON.parse(json) : [];

    const emailJaExiste = usuarios.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (emailJaExiste) {
      throw new Error('Este email já está cadastrado.');
    }

    const novoUsuario: Usuario & { senha: string } = {
      id: gerarId(),
      nome,
      email,
      senha,
      xp: 0,
      nivel: 1,
      streak: 0,
      conquistas: [],
      cursosIniciados: [],
    };

    await AsyncStorage.setItem(
      STORAGE_KEY_USUARIOS,
      JSON.stringify([...usuarios, novoUsuario])
    );

    const { senha: _senha, ...dadosUsuario } = novoUsuario;
    await salvarUsuario(dadosUsuario);
  }, [salvarUsuario]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_USUARIO);
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback(async (dados: Partial<Usuario>) => {
    const u = usuarioRef.current;
    if (!u) return;

    const atualizado: Usuario = {
      ...u,
      ...dados,
      nivel: dados.xp !== undefined ? calcularNivel(dados.xp) : u.nivel,
    };

    const json = await AsyncStorage.getItem(STORAGE_KEY_USUARIOS);
    const usuarios: Array<Usuario & { senha: string }> = json ? JSON.parse(json) : [];
    const atualizados = usuarios.map((usr) =>
      usr.id === atualizado.id ? { ...usr, ...atualizado } : usr
    );
    await AsyncStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(atualizados));

    await salvarUsuario(atualizado);
  }, [salvarUsuario]);

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, login, cadastrar, logout, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
