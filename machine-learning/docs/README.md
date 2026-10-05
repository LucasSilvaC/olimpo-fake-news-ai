# Planos de comparação de modelos

Esta documentação orienta uma IA ou pessoa que for implementar os experimentos de DBSCAN, HDBSCAN, K-means e Jev. O objetivo é medir se cada experimento melhora a detecção de notícias Fake no Fake.br e comparar os resultados com os modelos já existentes.

Estes arquivos são **planos**: não implementam os modelos, não executam notebooks e não fazem chamadas à API do Jev.

## Documentos

- [Protocolo comum de comparação](comparison-protocol.md): dados, partições, métricas, artefatos e regras para uma comparação justa.
- [Modelos de referência existentes](current-baselines.md): inventário dos baselines locais e ressalvas para reproduzi-los.
- [Plano DBSCAN](dbscan.md)
- [Plano HDBSCAN](hdbscan.md)
- [Plano K-means](kmeans.md)
- [Plano Jev sozinho](jev-standalone.md): execução condicionada à existência de crédito gratuito suficiente.
- [Plano Jev como auxiliar](jev-assisted.md): comparação de um modelo local com e sem o sinal do Jev.

## Sequência recomendada para implementação

1. Ler o protocolo e reproduzir os baselines locais em uma partição comum e sem vazamento por notícia/tema.
2. Implementar cada método de clustering como experimento separado. Primeiro, avaliar descoberta de grupos; só tratar cluster como decisão Fake/True se houver uma regra de validação documentada.
3. Verificar o custo e a disponibilidade da API do Jev. Rodar o teste solo apenas se a conta tiver créditos promocionais gratuitos que cubram a amostra planejada, com limite de gasto pago igual a zero.
4. Depois de escolher o melhor baseline local usando apenas validação, comparar esse modelo com a versão auxiliada pelo Jev.
5. Atualizar o mesmo relatório consolidado com todos os resultados obtidos no mesmo conjunto de teste. Não selecionar o vencedor olhando o teste.

## Leitura atual do repositório

O README do projeto descreve o Olimpo como uma plataforma educativa e gamificada de avaliação de notícias. O README chama o machine learning de pipeline complementar. Os notebooks existentes refletem esse caráter experimental: há classificadores supervisionados, PU Learning e detectores de anomalia que modelam o padrão das notícias True. Um score de anomalia não comprova falsidade.

O conjunto principal de comparação deve incluir, no mínimo, Regressão Logística, LinearSVC e Random Forest supervisionados; Isolation Forest, LOF e One-Class SVM; PU Learning; e os métodos novos deste plano. Variantes antigas são referências secundárias, a menos que sejam reproduzidas no protocolo comum.

O contrato de classe é `0 = True` e `1 = Fake`. Não incluir rótulos, nomes de pastas, identificadores de pares ou informação derivada do rótulo nas features.

## Fonte de custo do Jev

Na verificação de 2026-09-23, a TypeSafe publicava preço de entrada de **US$ 42 por bilhão de tokens**; a saída era anunciada como gratuita. O contrato da empresa diz que o uso consome créditos comprados ou promocionais, e que a empresa pode conceder créditos promocionais, mas não é obrigada a fazê-lo. Portanto, o Jev **não é gratuito por padrão**. Só executar quando houver saldo promocional sem custo confirmado e suficiente para toda a amostra planejada; desligar recarga automática e abortar sem crédito. Não fazer chamadas neste trabalho de documentação.

Fontes oficiais: [preços TypeSafe](https://typesafe.ai/), [anúncio do Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [contrato de uso, seção 8.2](https://typesafe.ai/legal/mca).

