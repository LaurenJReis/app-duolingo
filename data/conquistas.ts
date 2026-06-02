import { Conquista } from '@/types';

export const conquistas: Conquista[] = [
  {
    id: 'primeira-licao',
    titulo: 'Primeiro Passo',
    descricao: 'Conclua sua primeira lição.',
    icone: 'star',
    criterio: (_usuario, progresso) => {
      return Object.values(progresso).some((curso) =>
        Object.values(curso.modulos).some((modulo) =>
          Object.values(modulo.licoes).some((licao) => licao.concluida)
        )
      );
    },
  },
  {
    id: 'streak-3',
    titulo: '3 Dias Seguidos',
    descricao: 'Estude por 3 dias consecutivos.',
    icone: 'local-fire-department',
    criterio: (usuario) => usuario.streak >= 3,
  },
  {
    id: 'streak-7',
    titulo: 'Uma Semana',
    descricao: 'Estude por 7 dias consecutivos.',
    icone: 'whatshot',
    criterio: (usuario) => usuario.streak >= 7,
  },
  {
    id: 'streak-30',
    titulo: 'Mês Dedicado',
    descricao: 'Estude por 30 dias consecutivos.',
    icone: 'emoji-events',
    criterio: (usuario) => usuario.streak >= 30,
  },
  {
    id: 'nivel-5',
    titulo: 'Nível 5',
    descricao: 'Alcance o nível 5.',
    icone: 'military-tech',
    criterio: (usuario) => usuario.nivel >= 5,
  },
  {
    id: 'nivel-10',
    titulo: 'Nível 10',
    descricao: 'Alcance o nível 10.',
    icone: 'workspace-premium',
    criterio: (usuario) => usuario.nivel >= 10,
  },
  {
    id: 'modulo-expo-1',
    titulo: 'Fundamentos Expo',
    descricao: 'Conclua o módulo de Fundamentos do curso Expo.',
    icone: 'phone-android',
    criterio: (_usuario, progresso) => {
      const cursoExpo = progresso['expo'];
      if (!cursoExpo) return false;
      const modulo = cursoExpo.modulos['expo-m1'];
      if (!modulo) return false;
      return Object.values(modulo.licoes).every((l) => l.concluida);
    },
  },
  {
    id: 'modulo-aws-1',
    titulo: 'Cloud Iniciante',
    descricao: 'Conclua o módulo de Conceitos de Cloud do curso AWS.',
    icone: 'cloud-done',
    criterio: (_usuario, progresso) => {
      const cursoAws = progresso['aws'];
      if (!cursoAws) return false;
      const modulo = cursoAws.modulos['aws-m1'];
      if (!modulo) return false;
      return Object.values(modulo.licoes).every((l) => l.concluida);
    },
  },
  {
    id: 'dois-cursos',
    titulo: 'Multitarefa',
    descricao: 'Inicie os dois cursos disponíveis.',
    icone: 'layers',
    criterio: (usuario) =>
      usuario.cursosIniciados.includes('expo') && usuario.cursosIniciados.includes('aws'),
  },
  {
    id: 'xp-500',
    titulo: '500 XP',
    descricao: 'Acumule 500 pontos de experiência.',
    icone: 'bolt',
    criterio: (usuario) => usuario.xp >= 500,
  },
];
