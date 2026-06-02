# Requirements Document

## Introduction

Este documento descreve os requisitos para a continuação do MVP da plataforma de aprendizado gamificado (inspirada no Duolingo), construída com Expo ~54 / React Native 0.81 / expo-router ~6. O escopo cobre as cinco funcionalidades restantes do MVP:

1. **Edição de perfil** — permitir ao usuário alterar o próprio nome (RF04, sem expo-image-picker).
2. **Histórico de lições concluídas** — nova seção na tela de Progresso exibindo lições concluídas com taxa de acerto (RF14 / RF21).
3. **Toast/banner de conquista desbloqueada** — componente global no layout raiz que notifica o usuário ao desbloquear uma conquista (RF18).
4. **Tela de onboarding** — fluxo simples exibido uma única vez para novos usuários logo após o cadastro.
5. **Melhorias de UX** — loading state na tela de lição enquanto os dados carregam; empty state na home quando nenhum curso foi iniciado.

A stack é: Expo ~54, expo-router ~6, React Native 0.81, react-native-reanimated ~4.1, expo-haptics, AsyncStorage, MaterialIcons. Sem bibliotecas externas de toast/modal. Paleta: #58CC02 (verde), #1CB0F6 (azul), #FF4B4B (vermelho), #FFD700 (amarelo). Padrões: contextos com `useCallback` + AsyncStorage, `StyleSheet.create`.

---

## Glossary

- **App**: A aplicação mobile Expo/React Native descrita neste documento.
- **AuthContext**: Contexto React que gerencia autenticação e dados do usuário logado (`auth-context.tsx`).
- **ProgressoContext**: Contexto React que gerencia progresso de cursos, lições e erros (`progresso-context.tsx`).
- **Usuario**: Tipo TypeScript que representa o usuário logado, contendo `id`, `nome`, `email`, `xp`, `nivel`, `streak`, `conquistas`, `cursosIniciados`.
- **ProgressoLicao**: Tipo TypeScript que representa o progresso de uma lição, contendo `licaoId`, `concluida`, `taxaAcerto`, `tentativas`, `ultimaTentativa`.
- **Conquista**: Tipo TypeScript que representa uma conquista gamificada, contendo `id`, `titulo`, `descricao`, `icone` e função `criterio`.
- **AsyncStorage**: Biblioteca `@react-native-async-storage/async-storage` usada para persistência local.
- **RootLayout**: Componente `app/_layout.tsx`, ponto de montagem global do App.
- **AppLayout**: Componente `app/(app)/_layout.tsx`, layout das rotas autenticadas.
- **HomeScreen**: Tela `app/(app)/(tabs)/index.tsx`, lista os cursos disponíveis.
- **ProgressoScreen**: Tela `app/(app)/(tabs)/progresso.tsx`, exibe progresso, conquistas e revisão.
- **PerfilScreen**: Tela `app/(app)/(tabs)/perfil.tsx`, exibe dados do usuário.
- **LicaoScreen**: Tela `app/(app)/licao/[id].tsx`, executa os exercícios de uma lição.
- **OnboardingScreen**: Nova tela `app/onboarding.tsx`, exibida uma única vez para novos usuários.
- **ConquistaBanner**: Novo componente `components/conquista-banner.tsx`, exibe notificação de conquista desbloqueada.
- **EditarPerfilModal**: Novo componente `components/editar-perfil-modal.tsx`, modal inline para edição do nome.
- **StorageKey**: Chave de string usada para identificar dados no AsyncStorage.

---

## Requirements

### Requirement 1 — Edição de Nome no Perfil

**User Story:** Como usuário logado, quero editar meu nome de exibição diretamente na tela de perfil, para que meu nome reflita como desejo ser identificado na plataforma.

#### Acceptance Criteria

1. WHEN o usuário pressiona o botão "Editar nome" na PerfilScreen, THE App SHALL exibir o EditarPerfilModal com um campo de texto pré-preenchido com o nome atual do usuário.

2. WHILE o EditarPerfilModal está aberto, THE App SHALL manter o campo de texto editável e exibir os botões "Cancelar" e "Salvar".

3. WHEN o usuário pressiona "Salvar" com um nome válido (mínimo 2 caracteres, máximo 50 caracteres, sem espaços em branco somente), THE AuthContext SHALL persistir o novo nome via `atualizarUsuario` e fechar o EditarPerfilModal.

4. IF o usuário pressiona "Salvar" com um nome inválido (menos de 2 caracteres ou composto apenas por espaços em branco), THEN THE App SHALL exibir uma mensagem de erro inline no EditarPerfilModal sem fechar o modal.

5. WHEN o usuário pressiona "Cancelar" no EditarPerfilModal, THE App SHALL fechar o modal sem alterar o nome do usuário.

6. WHEN o nome é salvo com sucesso, THE PerfilScreen SHALL exibir imediatamente o novo nome sem necessidade de recarregar a tela.

7. THE AuthContext SHALL sincronizar o nome atualizado tanto na chave `@duolingo:usuario` quanto na lista `@duolingo:usuarios` no AsyncStorage.

---

### Requirement 2 — Histórico de Lições Concluídas

**User Story:** Como usuário, quero ver o histórico das lições que já concluí com a respectiva taxa de acerto, para que eu possa acompanhar meu desempenho ao longo do tempo.

#### Acceptance Criteria

1. THE ProgressoScreen SHALL exibir uma seção "Histórico de Lições" após a seção de conquistas, listando todas as lições concluídas do usuário em ordem cronológica decrescente (mais recente primeiro).

2. WHEN uma lição está concluída (`ProgressoLicao.concluida === true`), THE ProgressoScreen SHALL exibir para cada item: título da lição, nome do módulo, nome do curso, taxa de acerto em percentual e data da última tentativa formatada como "DD/MM/AAAA".

3. WHEN o usuário não possui nenhuma lição concluída, THE ProgressoScreen SHALL exibir um empty state com ícone e texto "Nenhuma lição concluída ainda. Comece a estudar!" na seção de histórico.

4. THE ProgressoScreen SHALL exibir a taxa de acerto de cada lição com cor indicativa: verde (#58CC02) para taxa ≥ 70%, amarelo (#FFD700) para taxa entre 50% e 69%, e vermelho (#FF4B4B) para taxa < 50%.

5. WHEN o usuário conclui uma nova lição, THE ProgressoContext SHALL atualizar o estado de progresso de forma que a ProgressoScreen reflita a nova lição no histórico sem necessidade de reiniciar o App.

---

### Requirement 3 — Banner de Conquista Desbloqueada

**User Story:** Como usuário, quero ser notificado visualmente quando desbloquear uma conquista, para que eu me sinta recompensado pelo meu progresso.

#### Acceptance Criteria

1. THE RootLayout SHALL montar o ConquistaBanner como filho global, sobreposto ao conteúdo de todas as telas, com `position: absolute` e `zIndex` suficiente para ficar acima da navegação.

2. WHEN o ProgressoContext detecta que uma nova conquista foi desbloqueada (lista `novasConquistas` não vazia em `verificarConquistas`), THE ProgressoContext SHALL emitir o evento de conquista para o ConquistaBanner via contexto ou callback compartilhado.

3. WHEN o ConquistaBanner recebe uma conquista para exibir, THE ConquistaBanner SHALL animar a entrada do banner a partir do topo da tela usando `react-native-reanimated` (slide down + fade in) em 300 ms.

4. WHILE o ConquistaBanner está visível, THE ConquistaBanner SHALL exibir o ícone da conquista (MaterialIcons), o texto "Conquista desbloqueada!" e o título da conquista.

5. WHEN o ConquistaBanner é exibido, THE App SHALL acionar `expo-haptics` com `notificationAsync(NotificationFeedbackType.Success)` para feedback tátil.

6. WHEN 3 segundos se passam após a exibição do ConquistaBanner, THE ConquistaBanner SHALL animar a saída (slide up + fade out) em 300 ms e se tornar invisível.

7. IF múltiplas conquistas são desbloqueadas simultaneamente, THEN THE ConquistaBanner SHALL exibi-las em fila, aguardando a animação de saída de cada uma antes de exibir a próxima.

8. THE ConquistaBanner SHALL ser implementado sem bibliotecas externas de toast ou modal, usando apenas `react-native-reanimated` e componentes nativos do React Native.

---

### Requirement 4 — Tela de Onboarding

**User Story:** Como novo usuário que acabou de se cadastrar, quero ver uma tela de boas-vindas com orientações básicas sobre a plataforma, para que eu entenda como funciona antes de começar a estudar.

#### Acceptance Criteria

1. WHEN um usuário conclui o cadastro com sucesso, THE App SHALL navegar para a OnboardingScreen antes de redirecionar para a HomeScreen.

2. THE OnboardingScreen SHALL exibir no mínimo 3 slides com conteúdo sobre: (a) boas-vindas e proposta da plataforma, (b) como funcionam as lições e o XP, (c) streak e conquistas.

3. WHEN o usuário pressiona "Próximo" no último slide, THE App SHALL marcar o onboarding como concluído persistindo a flag `@duolingo:onboarding_concluido:{userId}` no AsyncStorage e navegar para a HomeScreen.

4. WHEN o usuário pressiona "Pular" em qualquer slide, THE App SHALL marcar o onboarding como concluído e navegar para a HomeScreen.

5. WHEN o App é iniciado e o usuário já está logado com a flag de onboarding concluído presente no AsyncStorage, THE App SHALL navegar diretamente para a HomeScreen sem exibir a OnboardingScreen.

6. THE OnboardingScreen SHALL exibir indicadores de paginação (dots) que refletem o slide atual e o total de slides.

7. THE OnboardingScreen SHALL suportar navegação por swipe horizontal entre os slides, além dos botões "Próximo" e "Anterior".

---

### Requirement 5 — Loading State na Tela de Lição

**User Story:** Como usuário, quero ver um indicador de carregamento enquanto os dados da lição são preparados, para que eu saiba que o App está processando e não trave sem feedback.

#### Acceptance Criteria

1. WHEN a LicaoScreen é montada e `getLicaoById(id)` ainda não retornou resultado, THE LicaoScreen SHALL exibir um `ActivityIndicator` centralizado com a cor primária do curso (#58CC02 como fallback).

2. IF `getLicaoById(id)` retorna `null` ou `undefined` após o carregamento, THEN THE LicaoScreen SHALL exibir uma mensagem "Lição não encontrada." com um botão "Voltar" que aciona `router.back()`.

3. WHEN os dados da lição estão disponíveis, THE LicaoScreen SHALL ocultar o `ActivityIndicator` e exibir o conteúdo do exercício sem piscar ou recarregar a tela.

---

### Requirement 6 — Empty State na Home

**User Story:** Como usuário que ainda não iniciou nenhum curso, quero ver uma mensagem encorajadora na tela inicial, para que eu seja motivado a começar meu primeiro curso.

#### Acceptance Criteria

1. WHEN o usuário está logado e nenhum curso possui `progresso[cursoId]?.iniciado === true`, THE HomeScreen SHALL exibir um empty state abaixo do cabeçalho com ícone, título "Comece sua jornada!" e subtítulo "Escolha um curso abaixo e dê o primeiro passo.".

2. WHEN pelo menos um curso está iniciado, THE HomeScreen SHALL ocultar o empty state e exibir a lista de cursos normalmente.

3. THE HomeScreen SHALL sempre exibir a lista completa de cursos disponíveis, independentemente do estado de progresso, para que o usuário possa iniciar qualquer curso.

4. WHEN o usuário pressiona o botão "Iniciar" em um curso no empty state ou na lista, THE HomeScreen SHALL chamar `iniciarCurso(curso.id)` e navegar para a tela do curso sem exibir erros.
