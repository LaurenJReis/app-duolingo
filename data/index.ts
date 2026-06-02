import { Curso } from '@/types';
import { cursoExpo } from './curso-expo';
import { cursoAws } from './curso-aws';

export { cursoExpo } from './curso-expo';
export { cursoAws } from './curso-aws';
export { conquistas } from './conquistas';

/** Lista de todos os cursos disponíveis na plataforma */
export const cursos: Curso[] = [cursoExpo, cursoAws];

/** Busca um curso pelo id */
export function getCursoById(id: string): Curso | undefined {
  return cursos.find((c) => c.id === id);
}

/** Busca um módulo pelo id (busca em todos os cursos) */
export function getModuloById(moduloId: string) {
  for (const curso of cursos) {
    const modulo = curso.modulos.find((m) => m.id === moduloId);
    if (modulo) return { modulo, curso };
  }
  return undefined;
}

/** Busca uma lição pelo id (busca em todos os cursos e módulos) */
export function getLicaoById(licaoId: string) {
  for (const curso of cursos) {
    for (const modulo of curso.modulos) {
      const licao = modulo.licoes.find((l) => l.id === licaoId);
      if (licao) return { licao, modulo, curso };
    }
  }
  return undefined;
}
