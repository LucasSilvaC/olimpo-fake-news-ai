# Proposta: refatoração arquitetural dos fluxos de jogo

**Data**: 2026-10-17
**Branch**: `refactor/architecture-mvvm-ddd`

## Problema

Lobby, partida multiplayer e desafio solo mantêm estado, efeitos, chamadas a Server Actions, adaptação de dados e renderização em views extensas. A pontuação também é recalculada no cliente. No servidor, entidades de domínio importam tipos do esquema Drizzle, contratos de repositório expõem tipos de persistência, casos de uso instanciam adapters concretos e `global-challenges` depende do value object de `news-voting`.

## Resultado pretendido

Reduzir acoplamento entre view, aplicação, domínio e persistência nos três fluxos de jogo; tornar os módulos compartilhados explícitos; e manter o servidor como fonte única de resultados e pontuação. A mudança preserva os contratos externos, regras de jogo, rotas e aparência atual.

## Escopo

- `web-app`: `room-lobby`, `room-game`, `challenge` e componentes de etapa compartilhados.
- Backend dos contextos `rooms`, `news-voting` e `global-challenges`.
- Atualização da documentação de arquitetura e dos testes diretamente afetados.

## Fora deste recorte

- Aplicação `docu-app`, motor de ML, conteúdo de apresentação e grandes arquivos compostos somente por dados/fixtures.
- Novas regras de produto, migrações de banco e mudanças nos contratos HTTP ou de Server Actions.
- Garantia literal de ausência de débito técnico futuro; o critério é eliminar as violações identificadas neste recorte e deixar as restantes registradas.

## Capacidades

Nenhuma capacidade nova. A implementação é estrutural e deve manter os requisitos existentes de `rooms`, `news-voting`, `gamification` e `solo-challenges`.
