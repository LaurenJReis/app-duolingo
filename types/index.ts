// ─── Autenticação ────────────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  fotoPerfil?: string;
  xp: number;
  nivel: number;
  streak: number;
  ultimoEstudo?: string; // ISO date string
  conquistas: string[]; // ids das conquistas desbloqueadas
  cursosIniciados: string[]; // ids dos cursos
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────

export type TipoExercicio =
  | 'multipla-escolha'
  | 'verdadeiro-falso'
  | 'associacao'
  | 'completar-codigo'
  | 'ordenar-passos';

export interface Exercicio {
  id: string;
  licaoId: string;
  tipo: TipoExercicio;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: string | string[]; // string para escolha única, string[] para ordenação
  explicacao: string; // exibida ao errar
  ordem: number;
}

export interface Licao {
  id: string;
  moduloId: string;
  titulo: string;
  descricao: string;
  ordem: number;
  xpRecompensa: number;
  minimoAcerto: number; // percentual mínimo para concluir (ex: 0.7 = 70%)
  exercicios: Exercicio[];
}

export interface Modulo {
  id: string;
  cursoId: string;
  titulo: string;
  descricao: string;
  ordem: number;
  icone: string; // nome do ícone MaterialIcons
  licoes: Licao[];
}

export interface Curso {
  id: string;
  nome: string;
  descricao: string;
  cor: string; // cor primária do curso
  icone: string; // nome do ícone MaterialIcons
  modulos: Modulo[];
}

// ─── Progresso ────────────────────────────────────────────────────────────────

export interface ProgressoLicao {
  licaoId: string;
  concluida: boolean;
  taxaAcerto: number; // 0 a 1
  tentativas: number;
  ultimaTentativa?: string; // ISO date string
}

export interface ProgressoModulo {
  moduloId: string;
  licoes: Record<string, ProgressoLicao>; // licaoId → progresso
}

export interface ProgressoCurso {
  cursoId: string;
  iniciado: boolean;
  modulos: Record<string, ProgressoModulo>; // moduloId → progresso
  xpAcumulado: number;
}

// ─── Gamificação ──────────────────────────────────────────────────────────────

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string; // nome do ícone MaterialIcons
  criterio: (usuario: Usuario, progresso: Record<string, ProgressoCurso>) => boolean;
}

// ─── Revisão ──────────────────────────────────────────────────────────────────

export interface ErroRegistrado {
  exercicioId: string;
  licaoId: string;
  moduloId: string;
  cursoId: string;
  timestamp: string; // ISO date string
}
