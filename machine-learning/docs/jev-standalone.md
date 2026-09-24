# Plano de experimento: Jev sozinho

## Objetivo

Medir um baseline externo de decisão sobre Fake.br e compará-lo aos modelos locais. Jev não é método não supervisionado nem substitui fact-checking: é um serviço TypeSafe de respostas estruturadas por API, como Choice, Score e Noul.

## Gate de custo — obrigatório

Na checagem de 2026-09-23, a TypeSafe publicava entrada a US$ 42/bilhão de tokens (US$ 0,042/milhão) e saída gratuita. O contrato prevê créditos comprados e promocionais; créditos promocionais ficam a critério da empresa. Portanto, só executar se:

- a equipe confirmar que há crédito promocional sem custo e suficiente para toda a amostra pré-fixada;
- limite de gasto pago e recarga automática estiverem desativados;
- a cotação atual do fornecedor for consultada antes da execução.

Sem crédito gratuito suficiente, não chamar a API: gerar status `skipped_no_free_credit` no relatório e concluir a comparação Jev como não executada. Não usar chave ou conta não fornecida pela equipe e não fazer uma chamada de teste faturável. Fontes: [preços TypeSafe](https://typesafe.ai/), [anúncio oficial](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [termos de créditos, seção 8.2](https://typesafe.ai/legal/mca).

## Protocolo de entrada e perguntas

1. Seguir o mesmo `record_id` e o split canônico de [comparison-protocol.md](comparison-protocol.md). A amostra Jev deve ser fixada antes de olhar suas respostas.
2. Passar apenas informação pública/autorizada que o jogador teria: texto da notícia e, se disponível e acordado para esse experimento, título, fonte e data. Não enviar labels, pasta fake/true, IDs do corpus, nome do par nem rótulos de fact-check como contexto.
3. Armazenar a string de estado efetivamente enviada e o limite de texto. Testar primeiro a versão comparável ao texto local (`texto_trunc` de até 200 palavras); uma segunda condição com o texto completo deve ter rótulo próprio e não ser misturada com a primeira.
4. Fazer uma pergunta `Choice` com opções estáveis `fake`, `real`, `needs_verification`, incluindo critérios que distinguem “não há evidência suficiente” de “verdadeiro”. Armazenar classe escolhida, distribuição de probabilidades, confiança, tokens, latência, versão do modelo e custo/crédito consumido.
5. Tratar `needs_verification` como abstenção, sem remover esses registros da avaliação. Reportar cobertura e acurácia/F1 seletivos; para a comparação binária adicional, definir uma regra de desempate/calibração em validação e congelá-la.

## Métricas e comparação

No mesmo conjunto de teste, comparar Jev sozinho com LR, LinearSVC, RF, IF, LOF, One-Class SVM, PU Learning e os novos métodos elegíveis. Usar as métricas comuns, mais cobertura/abstenção, calibração, custo e latência. Não assumir que probabilidades do fornecedor estão calibradas para português/Fake.br; medir Brier/calibration curve no conjunto adequado e nunca calibrar no teste.

Não executar se o gasto deixar de ser zero. Caso créditos gratuitos cubram só uma parte, usar uma amostra aleatória pré-fixada e avaliar todos os modelos locais exatamente nos mesmos IDs; rotular o resultado como parcial.

## Segurança dos dados

Guardar `TYPESAFE_API_KEY` apenas no ambiente de execução do servidor/notebook; nunca persistir, imprimir ou colocar em frontend. Enviar somente notícias públicas ou autorizadas pela equipe. A API do Jev recebe o estado externo; não usar conteúdo privado de desafios de usuários sem uma decisão de privacidade separada.

