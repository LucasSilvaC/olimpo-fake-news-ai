# Tarefas: refatoração arquitetural dos fluxos de jogo

## 1. Linha de base e contratos

- [x] 1.1 Atualizar `main` e criar branch `refactor/architecture-mvvm-ddd`.
- [x] 1.2 Registrar arquitetura atual, contextos e violações com evidências.
- [x] 1.3 Executar linha de base: lint, typecheck e build passaram. A suíte unitária completa passou com timeout de 15 s; o timeout padrão de 5 s registrou uma expiração isolada, que passou ao ser executada com 15 s.
- [x] 1.4 Confirmar todos os emissores de `RoundCompletedLeaderboardEntry`: `submit-vote` e `conclude-round` enviam `roundDelta` e `isCorrect`.

## 2. Frontend: FSD e MVVM

- [x] 2.1 Publicar estágios em `widgets/game-stages/index.ts` e remover imports profundos entre views.
- [x] 2.2 Extrair orquestração do multiplayer para `useRoomGameViewModel`; manter a view como composição/renderização.
- [x] 2.3 Extrair estado, presença, navegação e Server Actions do lobby para `useRoomLobbyViewModel`; dividir lista e painel do baralho em componentes locais.
- [x] 2.4 Extrair estado, resposta e progressão do desafio solo para `useChallengeGameViewModel`; manter pontuação/XP como resultado do servidor.
- [x] 2.5 Separar estado local e efeitos de `NewsCheckStage` no ViewModel da feature de votação.
- [x] 2.6 Remover cálculos duplicados de pontuação na UI e consumir somente os resultados do servidor.

## 3. Backend: fronteiras DDD

- [x] 3.1 Remover imports de tipos Drizzle das entidades; definir tipos puros e mapear persistência nos adapters.
- [x] 3.2 Fazer ports dos três contextos usar contratos de domínio/aplicação, não linhas Drizzle.
- [x] 3.3 Remover dependência de `global-challenges` sobre `news-voting` com vocabulário compartilhado mínimo.
- [x] 3.4 Remover adapters concretos dos casos de uso e compor implementações nas composition roots.
- [x] 3.5 Atualizar actions, mapeadores e testes para as fronteiras novas preservando regras de jogo.

## 4. Verificação e documentação

- [x] 4.1 Atualizar testes de comportamento e mapeamento nos contextos e componentes diretamente afetados.
- [x] 4.2 Validar lint, typecheck, testes afetados, suíte unitária e build. Resultado final: 55 arquivos passaram, 2 foram ignorados; 452 testes passaram e 5 foram ignorados. A suíte usou timeout de 15 s para acomodar o teste que expirou no limite padrão durante a linha de base.
- [x] 4.3 Atualizar `docs/codigo/arquitetura-web-app.md`, ADR e o diagrama/decisões do `README.md`.
- [x] 4.4 Revisar o diff pelos workflows Acrux de arquitetura, segurança e code review; ajustar fronteiras de imports, mocks de composition root, contratos de DTO/evento e achados do lint.
