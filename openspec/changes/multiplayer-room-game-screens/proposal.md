# Proposta: Telas Multiplayer Funcionais do Ciclo de Jogo em /sala/[codigo]

## Why

Atualmente, o fluxo de jogo em `/sala/[codigo]` exibe apenas o lobby estático de espera e tentava redirecionar para telas legadas em `/olimpo/game` que não estão conectadas à sala real e contêm dados estáticos/mockados.
Para entregar um MVP multiplayer funcional e educativo, precisamos converter as 4 telas de referência do Stitch (projeto `projects/9030925616201935052`, obtidas via Stitch MCP) em componentes reais do projeto dentro de `/sala/[codigo]`, sem mocks, consumindo as Server Actions existentes (`submitVoteAction`, `advanceRoundAction`) e sincronizando todos os participantes via Server-Sent Events (SSE), onde o avanço da rodada no placar parcial é controlado exclusivamente pelo líder da sala.

## What Changes

- **Descarte de Telas Legadas**: Ignorar e desvincular quaisquer rotas/views legadas em `/olimpo/*`. Todo o ciclo de jogo acontece na rota canônica `/sala/[codigo]`.
- **Tela 1 - Checagem de Notícias** (Stitch: `projects/9030925616201935052/screens/4dcb0041d5e54be1957c83e95f7216f3`): Exibe a notícia real da rodada ativa (portal, autor, categoria, imagem, manchete e resumo) com 3 botões táteis de resposta: [V] Verdadeiro (`reliable`), [F] Falso (`unreliable`), [?] Incerto (`uncertain`). Dispara `submitVoteAction`.
- **Tela 2 - Veredito e Aguardando Checadores** (Stitch: `projects/9030925616201935052/screens/ea97b5c9e6ba47f59042e5351af78d53`): Exibe animação do foguete Olimpo, confirmação do veredito do usuário com pontuação obtida, gabarito oficial, régua do "Verômetro Olimpo" com o percentual real da IA (`reliabilityScore`), progresso de votação da sala em tempo real, cards de reflexão socrática e dica de fact-checking. Transiciona automaticamente para a Tela 3 quando todos votam (`ROUND_COMPLETED`).
- **Tela 3 - Placar da Rodada** (Stitch: `projects/9030925616201935052/screens/b40c8bc9b29e4226adb7ead197db629d`): Exibe ranking parcial da rodada com pontuações ganhas, streaks (combo de fogo) e destaque do líder de sequência. **Apenas o líder da sala (host) visualiza o botão ativo "Avançar Rodada"**. Ao clicar, o líder dispara `advanceRoundAction` e o evento SSE (`ROUND_STARTED`) faz **todas as telas de todos os jogadores avançarem sincronizadas para a próxima notícia**.
- **Tela 4 - Placar da Partida / Classificação Final** (Stitch: `projects/9030925616201935052/screens/0a69d2a233a542f48924199d99f552eb`): Ao concluir todas as rodadas (`MATCH_FINISHED`), exibe o pódio 3D (1º Ouro, 2º Prata, 3º Bronze com acertos e precisão %), listagem dos demais participantes e botões para compartilhar ou voltar ao início.
- **Orquestrador de Sala**: Atualização de `src/app/(protected)/sala/[codigo]/page.tsx` para alternar fluidamente entre `RoomLobbyView` (quando `waiting`) e `RoomGameView` (quando `in_progress` ou `finished`), preservando a URL `/sala/[codigo]` em caso de recarregamento (F5).

## Capabilities

### Modified Capabilities

- `rooms`: O ciclo de vida da sala em `/sala/[codigo]` agora abrange a execução das rodadas in-game, com avanço de rodada restrito ao host e sincronizado via SSE para todos os clientes conectados.
- `news-voting`: A experiência do usuário de votação e checagem de fatos agora é renderizada através dos 4 estágios reais (Checagem, Aguardando, Placar da Rodada e Pódio Final), consumindo as ações `submitVoteAction` e `advanceRoundAction`.

## Impact

- **UI / Views**: Criação de `src/views/room-game/` contendo o orquestrador e os 4 estágios visuais convertidos do Stitch MCP (projeto `projects/9030925616201935052`) para componentes React/Tailwind.
- **Integração de Páginas**: Ajuste em `src/app/(protected)/sala/[codigo]/page.tsx` para passar os artigos da playlist e o estado ativo do jogo.
- **Realtime**: Conexão das telas do jogo com o canal SSE `/api/rooms/[pin]/events` (`ROUND_STARTED`, `ROUND_COMPLETED`, `MATCH_FINISHED`).
