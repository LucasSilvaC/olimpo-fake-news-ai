# Verificação da integração socrática

Verificação realizada em 7 de outubro de 2026, horário de São Paulo.

## Implementação verificada

- Principal `sintaxe_ampliada`, catálogo experimental separado com 20 padrões.
- Extração congelada em spaCy 3.8.16 e modelo português 3.8.0, NFKC/BOM e 300 caracteres.
- `POST /api/news-insights` autenticado, com participação e rodada verificadas.
- Uso do corpo salvo pelo parser, com fallback para extração quando vazio.
- Até três famílias, perguntas socráticas e medições, sem campos de classe/confiança.
- Estados sem padrão, texto inadequado e indisponibilidade sem bloquear o voto.
- Troca de rodada cancela pedidos e impede apresentação de respostas antigas.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Python: principal e motor | 14 testes passaram |
| Vitest completo | 360 testes passaram; 4 ignorados pela configuração existente |
| Testes legados do parser/rede | 25 testes passaram |
| TypeScript e ESLint global | Sem erros |
| Build de produção Next.js | Concluído, incluindo `/api/news-insights` |
| Docker Python 3.12 | Build, motor real, `/health` e `/analyze` verificados |
| Docker Compose | Configuração validada |
| Parser HTML → banco → API → modelo real → tela → voto | Passou |

O teste integrado usou banco e Redis Docker isolados, sem editar `.env` ou os
dados da aplicação. O HTML de teste foi processado pelo parser real; o serviço
Python produziu três famílias. Foram verificados 401 sem sessão, 403 fora da
sala, 409 para rodada futura e 400 para texto arbitrário no contrato do jogo.
A votação como `uncertain` foi registrada pela ação real do jogo.

As capturas [desktop](desktop.png) e [celular](mobile.png) foram inspecionadas.
O celular foi verificado em 390 × 844 pixels, sem rolagem horizontal. Na primeira
verificação a seção de medições estava aberta; as capturas atualizadas descritas
abaixo mostram a entrada com os detalhes recolhidos.

Reprodução: `scripts/check-news-insights.ts`, conforme as variáveis e os
pré-requisitos em `README.md`. O script encerra seu servidor e exclui os registros
temporários, inclusive quando uma verificação falha.

## Limites desta entrega

O HTML da integração é uma fixture controlada, não uma alegação factual externa.
As requisições e bloqueios de rede do parser são verificados pela suíte legada;
o fallback da API é testado com dependências injetadas. O modelo foi exercitado
com extração real e registros congelados, não com um mock.

Na primeira entrega não houve aprovação editorial humana, estudo de compreensão,
avaliação externa nova ou validação de veracidade. A comparação por classe estava
desabilitada antes e depois do voto. Não há cache de notícias no motor; o pipeline e catálogo
permanecem carregados no processo.

## Separação do motor de execução

O serviço e seus artefatos foram movidos para `model-engine/`, com o módulo
`models/unsupervised/`. As equações de extração e discretização foram isoladas
dos imports científicos, mantendo equivalência com os registros congelados.
O exportador offline verifica essa equivalência antes de gerar o catálogo.

Na verificação da separação passaram 10 testes do motor, cinco do principal
científico e 19 testes do contrato HTTP no web-app. TypeScript e a configuração
Docker Compose também passaram. O adaptador HTTP do web-app recebeu três
observações do serviço real iniciado por `model-engine/service.py`.

A imagem Docker foi construída usando apenas `model-engine/`. Dentro dela,
sem `machine-learning/` e sem `mlxtend`, `/health` respondeu `ok` e `/analyze`
retornou três observações com o modelo real.

O supervisionado poderá receber um módulo próprio nessa camada; sua integração
ao serviço não faz parte desta reorganização.

## Comparação descritiva — 8 de outubro de 2026

A apresentação agora mostra características da escrita e a frequência da combinação
completa nas duas classes da amostra de validação do Fake.br-Corpus. Os 20 padrões,
seus critérios e a prioridade foram mantidos. As comparações usam contagens e
populações de `validation/all`, com 720 notícias rotuladas como falsas e 720 como
verdadeiras. Os percentuais são frequências dentro de cada classe, não composição
entre ocorrências nem probabilidade para a notícia da rodada.

O catálogo do produto foi atualizado para `sintaxe-ampliada-descriptive-comparison-v3`.
Os artefatos científicos não foram modificados. A API valida contagens, denominadores,
frequências e escopo; classificação e confiança continuam excluídas. As duas classes
têm a mesma apresentação visual. Termos técnicos e o recorte de 300 caracteres
ficam nos detalhes, com contagens e referência disponíveis ao jogador.

Passaram 13 testes do motor, 375 testes do web-app (quatro ignorados), TypeScript,
ESLint dos arquivos alterados e build de produção. A integração isolada percorreu
parser real → banco → API autenticada → motor real → cartões → voto. Verificou
as frequências, os denominadores, os bloqueios de acesso e a votação real.

As capturas de desktop e celular foram atualizadas e inspecionadas; o celular
mantém largura de 390 pixels sem rolagem horizontal. O teste também verifica a
expansão da metodologia e da referência. Os detalhes ficam recolhidos nas capturas
atuais. O serviço Docker principal foi atualizado, mantendo os dados da plataforma.

A descrição do corpus é experimental. Não houve novo estudo de compreensão,
avaliação externa ou estimativa de intervalos por classe. A integração do
supervisionado permanece uma etapa separada.

## Painel lateral recolhido — 8 de outubro de 2026

O bloco de observações saiu do fluxo principal da página e passou a abrir pelo
ícone lateral. O conteúdo continua igual, em um painel com rolagem interna e
botão de fechamento. A cada rodada o painel começa fechado. O diálogo utiliza
a primitiva acessível Base UI já instalada no projeto.

Passaram os 11 testes de interação da rodada, TypeScript, ESLint e build de
produção. A integração real confirmou abertura, fechamento pelo botão, clique
fora e Esc, detalhes expandíveis, comparação, ausência de rolagem horizontal no
celular e voto após fechar. As capturas do painel aberto foram atualizadas; a
entrada recolhida está em [desktop](desktop-collapsed.png) e
[celular](mobile-collapsed.png). Banco e Redis usados no teste eram isolados.
