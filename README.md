# Duolingo Clone

App mobile de aprendizado gamificado feito com Expo + React Native. O usuário aprende tecnologia (AWS e Expo) por meio de lições interativas com XP, streak diário, conquistas e revisão de erros.

## Stack

- **Expo Router** — navegação baseada em arquivos (file-based routing)
- **React Native** — componentes de UI
- **TypeScript** — tipagem estática
- **AsyncStorage** — persistência local (sem backend)
- **Context API** — estado global compartilhado entre telas

## Rodando o projeto

```bash
npm install
npx expo start
```

## Estrutura

```
app/
├── _layout.tsx          # Layout raiz com os providers (Auth, Toast, Progresso)
├── (auth)/              # Rotas públicas: login, cadastro, recuperar senha
└── (app)/               # Rotas protegidas (exige login)
    ├── (tabs)/          # Abas: Aprender, Progresso, Perfil
    ├── curso/[id].tsx   # Trilha de módulos e lições
    ├── licao/[id].tsx   # Execução dos exercícios
    └── revisao/         # Revisão dos exercícios errados

components/    # Componentes reutilizáveis (ActivityCard, etc.)
contexts/      # Auth, Progresso e Toast
data/          # Conteúdo dos cursos (módulos, lições, exercícios)
types/         # Interfaces TypeScript do domínio
constants/     # Tema de cores e fontes
```

O Expo Router usa a pasta `app/` como sistema de rotas. Grupos entre parênteses como `(auth)` e `(app)` organizam as rotas sem afetar a URL e permitem layouts separados por contexto (público vs. protegido). Cada `_layout.tsx` define a navegação do grupo — o de `(app)` verifica se há usuário logado e redireciona se não houver.

## Navegação

Dois tipos de navegador:

- **Stack** — fluxos lineares com histórico (auth e telas internas do app)
- **Tabs** — três abas fixas na parte inferior (Aprender, Progresso, Perfil)

```typescript
router.push(`/(app)/licao/${id}`)   // empilha, permite voltar
router.replace('/(app)')            // substitui, sem histórico
router.back()                       // volta na pilha
<Redirect href="/(auth)" />         // redireciona durante render (usado nos layouts)
```

Cada tela pode ter animação própria configurada no `_layout.tsx`:
- `licao/[id]` → `slide_from_bottom` (aparece como modal)
- `curso/[id]` → `slide_from_right`

## Autenticação e dados

Toda persistência é feita com AsyncStorage (chave-valor local no dispositivo):

| Chave | O que guarda |
|-------|-------------|
| `@duolingo:usuarios` | Lista de cadastros com senha |
| `@duolingo:usuario` | Sessão ativa sem senha |
| `@duolingo:progresso:{userId}` | Progresso por curso/módulo/lição |
| `@duolingo:erros:{userId}` | Exercícios errados para revisão |

O `AuthProvider` lê a sessão ao iniciar. Se o usuário ficou mais de 1 dia sem estudar, o streak é zerado nesse momento. O `ProgressoProvider` só carrega depois que o usuário está disponível, pois precisa do `userId` para montar a chave.

## Estado global

Três contextos independentes declarados no layout raiz:

- **AuthContext** — usuário logado, login, cadastro, logout, atualização de dados
- **ProgressoContext** — progresso por curso/módulo/lição, erros, cálculo de percentuais
- **ToastContext** — notificações animadas (conquistas desbloqueadas)

Dentro dos contextos, `useRef` é usado em paralelo com `useState` para valores lidos dentro de callbacks assíncronos — sem isso, o callback leria o valor do estado no momento da sua criação (closure stale), não o valor atual.

## Fluxo de uma lição

1. Usuário abre `curso/[id]` e pressiona uma lição desbloqueada
2. App navega para `licao/[id]` com `router.push`
3. Exercícios são carregados com `getLicaoById(id)` e exibidos um por vez
4. Ao confirmar resposta: acerto incrementa `acertosRef.current`, erro chama `registrarErro()`
5. Ao terminar: `concluirLicao(licaoId, taxaAcerto)` salva o resultado, atualiza XP e streak, e verifica conquistas
6. Tela de resultado exibe acertos, taxa e XP ganho com animação `Animated.spring`
7. `router.back()` volta para o curso, que re-renderiza com a lição marcada como concluída

## Desbloqueio de lições

Sequencial dentro de cada módulo — cada lição exige que a anterior tenha sido concluída (taxa ≥ `minimoAcerto`). A primeira lição do primeiro módulo é sempre aberta.

## Gamificação

- **XP** — proporcional à taxa de acerto; bônus de 20% para acerto perfeito
- **Nível** — `floor(xp / 100) + 1`, recalculado automaticamente
- **Streak** — dias consecutivos de estudo; reinicia se houver gap de mais de 1 dia
- **Conquistas** — critérios avaliados após cada lição; exibidas via toast animado
- **Revisão inteligente** — lições com erros ficam acessíveis em `revisao/`

## ActivityCard

Componente em `components/ActivityCard.tsx` com três variantes controladas pela prop `variant`:

- `default` — card padrão com gradiente por dificuldade e XP
- `compact` — versão menor para listas densas
- `large` — versão expandida com estatísticas e barra de progresso

Centraliza a lógica de cores por dificuldade e a animação de escala ao pressionar, evitando duplicação nas telas que listam atividades.
