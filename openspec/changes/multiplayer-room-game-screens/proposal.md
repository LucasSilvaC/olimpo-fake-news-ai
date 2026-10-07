# Proposta: Telas Multiplayer Funcionais do Ciclo de Jogo em /sala/[codigo]

## Why

Atualmente, o fluxo de jogo em `/sala/[codigo]` exibe apenas o lobby estático de espera e tentava redirecionar para telas legadas em `/olimpo/game` que não estão conectadas à sala real e contêm dados estáticos/mockados.
Para entregar um MVP multiplayer funcional e educativo, precisamos converter as 4 telas de referência do Stitch (`/references`) em componentes reais do projeto dentro de `/sala/[codigo]`, sem mocks, consumindo as Server Actions existentes (`submitVoteAction`, `advanceRoundAction`) e sincronizando todos os participantes via Server-Sent Events (SSE), onde o avanço da rodada no placar parcial é controlado exclusivamente pelo líder da sala.

## What Changes

- **Descarte de Telas Legadas**: Ignorar e desvincular quaisquer rotas/views legadas em `/olimpo/*`. Todo o ciclo de jogo acontece na rota canônica `/sala/[codigo]`.
- **Tela 1 - Checagem de Notícias** (`references/olimpo_checagem_de_not_cias`): Exibe a notícia real da rodada ativa (portal, autor, categoria, imagem, manchete e resumo) com 3 botões táteis de resposta: [V] Verdadeiro (`reliable`), [F] Falso (`unreliable`), [?] Incerto (`uncertain`). Dispara `submitVoteAction`.
- **Tela 2 - Veredito e Aguardando Checadores** (`references/olimpo_aguardando_outros_jogadores`): Exibe animação do foguete Olimpo, confirmação do veredito do usuário com pontuação obtida, gabarito oficial, régua do "Verômetro Olimpo" com o percentual real da IA (`reliabilityScore`), progresso de votação da sala em tempo real, cards de reflexão socrática e dica de fact-checking. Transiciona automaticamente para a Tela 3 quando todos votam (`ROUND_COMPLETED`).
- **Tela 3 - Placar da Rodada** (`references/olimpo_placar_da_rodada`): Exibe ranking parcial da rodada com pontuações ganhas, streaks (combo de fogo) e destaque do líder de sequência. **Apenas o líder da sala (host) visualiza o botão ativo "Avançar Rodada"**. Ao clicar, o líder dispara `advanceRoundAction` e o evento SSE (`ROUND_STARTED`) faz **todas as telas de todos os jogadores avançarem sincronizadas para a próxima notícia**.
- **Tela 4 - Placar da Partida / Classificação Final** (`references/olimpo_placar_da_partida`): Ao concluir todas as rodadas (`MATCH_FINISHED`), exibe o pódio 3D (1º Ouro, 2º Prata, 3º Bronze com acertos e precisão %), listagem dos demais participantes e botões para compartilhar ou voltar ao início.
- **Orquestrador de Sala**: Atualização de `src/app/(protected)/sala/[codigo]/page.tsx` para alternar fluidamente entre `RoomLobbyView` (quando `waiting`) e `RoomGameView` (quando `in_progress` ou `finished`), preservando a URL `/sala/[codigo]` em caso de recarregamento (F5).

## Capabilities

### Modified Capabilities

- `rooms`: O ciclo de vida da sala em `/sala/[codigo]` agora abrange a execução das rodadas in-game, com avanço de rodada restrito ao host e sincronizado via SSE para todos os clientes conectados.
- `news-voting`: A experiência do usuário de votação e checagem de fatos agora é renderizada através dos 4 estágios reais (Checagem, Aguardando, Placar da Rodada e Pódio Final), consumindo as ações `submitVoteAction` e `advanceRoundAction`.

## Impact

- **UI / Views**: Criação de `src/views/room-game/` contendo o orquestrador e os 4 estágios visuais convertidos do HTML do Stitch para componentes React/Tailwind.
- **Integração de Páginas**: Ajuste em `src/app/(protected)/sala/[codigo]/page.tsx` para passar os artigos da playlist e o estado ativo do jogo.
- **Realtime**: Conexão das telas do jogo com o canal SSE `/api/rooms/[pin]/events` (`ROUND_STARTED`, `ROUND_COMPLETED`, `MATCH_FINISHED`).
