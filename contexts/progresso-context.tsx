import { getLicaoById, conquistas as listaConquistas } from '@/data';
import { ErroRegistrado, ProgressoCurso, ProgressoLicao } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ProgressoContextData {
  progresso: Record<string, ProgressoCurso>; // cursoId → progresso
  erros: ErroRegistrado[];
  carregando: boolean;
  iniciarCurso: (cursoId: string) => Promise<void>;
  concluirLicao: (licaoId: string, taxaAcerto: number) => Promise<void>;
  registrarErro: (exercicioId: string, licaoId: string) => Promise<void>;
  getLicaoConcluida: (licaoId: string) => boolean;
  getLicaoDesbloqueada: (licaoId: string) => boolean;
  getProgressoCurso: (cursoId: string) => number; // 0 a 1
  getProgressoModulo: (moduloId: string) => number; // 0 a 1
}

// ─── Chaves de storage ────────────────────────────────────────────────────────

function storageKeyProgresso(userId: string) {
  return `@duolingo:progresso:${userId}`;
}

function storageKeyErros(userId: string) {
  return `@duolingo:erros:${userId}`;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const ProgressoContext = createContext<ProgressoContextData>({} as ProgressoContextData);

export function ProgressoProvider({ children }: { children: React.ReactNode }) {
  const { usuario, atualizarUsuario } = useAuth();
  const { mostrarConquista } = useToast();
  const [progresso, setProgresso] = useState<Record<string, ProgressoCurso>>({});
  const [erros, setErros] = useState<ErroRegistrado[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Ref para sempre ter o usuario mais atual dentro dos callbacks
  const usuarioRef = React.useRef(usuario);
  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  // Ref para sempre ter o progresso mais atual dentro dos callbacks
  const progressoRef = React.useRef(progresso);
  useEffect(() => {
    progressoRef.current = progresso;
  }, [progresso]);

  // Carrega progresso do usuário logado
  useEffect(() => {
    async function carregar() {
      if (!usuario) {
        setProgresso({});
        setErros([]);
        setCarregando(false);
        return;
      }
      try {
        const [jsonProgresso, jsonErros] = await Promise.all([
          AsyncStorage.getItem(storageKeyProgresso(usuario.id)),
          AsyncStorage.getItem(storageKeyErros(usuario.id)),
        ]);
        setProgresso(jsonProgresso ? JSON.parse(jsonProgresso) : {});
        setErros(jsonErros ? JSON.parse(jsonErros) : []);
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [usuario?.id]);

  const salvarProgresso = useCallback(
    async (novoProgresso: Record<string, ProgressoCurso>) => {
      if (!usuario) return;
      await AsyncStorage.setItem(
        storageKeyProgresso(usuario.id),
        JSON.stringify(novoProgresso)
      );
      setProgresso(novoProgresso);
    },
    [usuario]
  );

  const verificarConquistas = useCallback(
    async (novoProgresso: Record<string, ProgressoCurso>) => {
      const u = usuarioRef.current;
      if (!u) return;
      const novasConquistas: string[] = [];

      for (const conquista of listaConquistas) {
        if (u.conquistas.includes(conquista.id)) continue;
        if (conquista.criterio(u, novoProgresso)) {
          novasConquistas.push(conquista.id);
        }
      }

      if (novasConquistas.length > 0) {
        await atualizarUsuario({
          conquistas: [...u.conquistas, ...novasConquistas],
        });

        for (let i = 0; i < novasConquistas.length; i++) {
          const conquistaInfo = listaConquistas.find((c) => c.id === novasConquistas[i]);
          if (conquistaInfo) {
            setTimeout(() => {
              mostrarConquista({
                icone: conquistaInfo.icone,
                titulo: conquistaInfo.titulo,
                descricao: conquistaInfo.descricao,
                cor: '#FFD700',
              });
            }, i * 3500);
          }
        }
      }
    },
    [atualizarUsuario, mostrarConquista]
  );

  const iniciarCurso = useCallback(
    async (cursoId: string) => {
      const u = usuarioRef.current;
      const prog = progressoRef.current;
      if (!u) return;

      const novoProgresso = { ...prog };
      if (!novoProgresso[cursoId]) {
        novoProgresso[cursoId] = {
          cursoId,
          iniciado: true,
          modulos: {},
          xpAcumulado: 0,
        };
        await salvarProgresso(novoProgresso);
      }

      if (!u.cursosIniciados.includes(cursoId)) {
        await atualizarUsuario({
          cursosIniciados: [...u.cursosIniciados, cursoId],
        });
      }
    },
    [salvarProgresso, atualizarUsuario]
  );

  const concluirLicao = useCallback(
    async (licaoId: string, taxaAcerto: number) => {
      const u = usuarioRef.current;
      const prog = progressoRef.current;
      if (!u) return;

      const resultado = getLicaoById(licaoId);
      if (!resultado) return;

      const { licao, modulo, curso } = resultado;

      const novoProgresso = { ...prog };
      if (!novoProgresso[curso.id]) {
        novoProgresso[curso.id] = {
          cursoId: curso.id,
          iniciado: true,
          modulos: {},
          xpAcumulado: 0,
        };
      }

      const cursoProg = novoProgresso[curso.id];
      if (!cursoProg.modulos[modulo.id]) {
        cursoProg.modulos[modulo.id] = { moduloId: modulo.id, licoes: {} };
      }

      const moduloProg = cursoProg.modulos[modulo.id];
      const licaoAnterior = moduloProg.licoes[licaoId];

      const novaLicaoProg: ProgressoLicao = {
        licaoId,
        concluida: taxaAcerto >= licao.minimoAcerto,
        taxaAcerto,
        tentativas: (licaoAnterior?.tentativas ?? 0) + 1,
        ultimaTentativa: new Date().toISOString(),
      };

      moduloProg.licoes[licaoId] = novaLicaoProg;

      let xpGanho = 0;
      if (novaLicaoProg.concluida) {
        xpGanho = Math.round(licao.xpRecompensa * taxaAcerto);
        if (taxaAcerto === 1) xpGanho = Math.round(xpGanho * 1.2);
        cursoProg.xpAcumulado += xpGanho;
      }

      await salvarProgresso(novoProgresso);

      if (xpGanho > 0) {
        const hoje = new Date().toDateString();
        const ultimoEstudo = u.ultimoEstudo
          ? new Date(u.ultimoEstudo).toDateString()
          : null;
        const ontem = new Date(Date.now() - 86400000).toDateString();

        let novoStreak = u.streak;
        if (ultimoEstudo !== hoje) {
          novoStreak = ultimoEstudo === ontem ? u.streak + 1 : 1;
        }

        await atualizarUsuario({
          xp: u.xp + xpGanho,
          streak: novoStreak,
          ultimoEstudo: new Date().toISOString(),
        });
      }

      await verificarConquistas(novoProgresso);
    },
    [salvarProgresso, atualizarUsuario, verificarConquistas]
  );

  const registrarErro = useCallback(
    async (exercicioId: string, licaoId: string) => {
      if (!usuario) return;

      const resultado = getLicaoById(licaoId);
      if (!resultado) return;

      const { modulo, curso } = resultado;

      const novoErro: ErroRegistrado = {
        exercicioId,
        licaoId,
        moduloId: modulo.id,
        cursoId: curso.id,
        timestamp: new Date().toISOString(),
      };

      const novosErros = [...erros, novoErro];
      await AsyncStorage.setItem(
        storageKeyErros(usuario.id),
        JSON.stringify(novosErros)
      );
      setErros(novosErros);
    },
    [erros, usuario]
  );

  const getLicaoConcluida = useCallback(
    (licaoId: string): boolean => {
      const resultado = getLicaoById(licaoId);
      if (!resultado) return false;
      const { modulo, curso } = resultado;
      return (
        progresso[curso.id]?.modulos[modulo.id]?.licoes[licaoId]?.concluida ?? false
      );
    },
    [progresso]
  );

  const getLicaoDesbloqueada = useCallback(
    (licaoId: string): boolean => {
      const resultado = getLicaoById(licaoId);
      if (!resultado) return false;

      const { licao, modulo, curso } = resultado;

      // Primeiro curso e primeira lição sempre desbloqueados
      if (licao.ordem === 1 && modulo.ordem === 1) return true;

      // Verifica se o curso foi iniciado
      if (!progresso[curso.id]?.iniciado) return false;

      // Lição 1 de qualquer módulo: verifica se o módulo anterior foi concluído
      if (licao.ordem === 1) {
        const moduloAnterior = curso.modulos.find((m) => m.ordem === modulo.ordem - 1);
        if (!moduloAnterior) return true;
        return moduloAnterior.licoes.every((l) =>
          progresso[curso.id]?.modulos[moduloAnterior.id]?.licoes[l.id]?.concluida
        );
      }

      // Demais lições: verifica se a lição anterior foi concluída
      const licaoAnterior = modulo.licoes.find((l) => l.ordem === licao.ordem - 1);
      if (!licaoAnterior) return true;

      return (
        progresso[curso.id]?.modulos[modulo.id]?.licoes[licaoAnterior.id]?.concluida ?? false
      );
    },
    [progresso]
  );

  const getProgressoCurso = useCallback(
    (cursoId: string): number => {
      const cursoProg = progresso[cursoId];
      if (!cursoProg) return 0;

      // Importa dinamicamente para evitar dependência circular
      const { getCursoById } = require('@/data');
      const curso = getCursoById(cursoId);
      if (!curso) return 0;

      const totalLicoes = curso.modulos.reduce(
        (acc: number, m: { licoes: unknown[] }) => acc + m.licoes.length,
        0
      );
      if (totalLicoes === 0) return 0;

      const licoesConcluidas = Object.values(cursoProg.modulos).reduce(
        (acc, mod) =>
          acc + Object.values(mod.licoes).filter((l) => l.concluida).length,
        0
      );

      return licoesConcluidas / totalLicoes;
    },
    [progresso]
  );

  const getProgressoModulo = useCallback(
    (moduloId: string): number => {
      const { getModuloById } = require('@/data');
      const resultado = getModuloById(moduloId);
      if (!resultado) return 0;

      const { modulo, curso } = resultado;
      const moduloProg = progresso[curso.id]?.modulos[modulo.id];
      if (!moduloProg) return 0;

      const total = modulo.licoes.length;
      if (total === 0) return 0;

      const concluidas = Object.values(moduloProg.licoes).filter((l) => l.concluida).length;
      return concluidas / total;
    },
    [progresso]
  );

  return (
    <ProgressoContext.Provider
      value={{
        progresso,
        erros,
        carregando,
        iniciarCurso,
        concluirLicao,
        registrarErro,
        getLicaoConcluida,
        getLicaoDesbloqueada,
        getProgressoCurso,
        getProgressoModulo,
      }}
    >
      {children}
    </ProgressoContext.Provider>
  );
}

export function useProgresso() {
  const context = useContext(ProgressoContext);
  if (!context) {
    throw new Error('useProgresso deve ser usado dentro de ProgressoProvider');
  }
  return context;
}
