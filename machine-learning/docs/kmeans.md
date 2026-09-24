# Plano de experimento: K-means

## Perguntas

1. Um K-means de novidade treinado apenas em notícias True identifica Fake como distantes dos estilos True?
2. Como referência exploratória, grupos de texto/TF-IDF revelam temas ou segmentos que ajudem a reduzir repetição no jogo?

## Implementação planejada

### Perfil de novidade, comparável a IF/LOF/OCSVM

- Usar as seis features de estilo recalculadas dos primeiros 300 caracteres; imputar e escalar ajustando os transformadores somente no True de treino.
- Testar `k` em uma grade pré-definida (1, 2, 4, 8), inicialização `k-means++`, `n_init` explícito e seed 42. Ajustar K-means só em True de treino.
- Para cada notícia nova, usar distância ao centróide mais próximo como score (maior = mais suspeita). Calibrar o corte q95 somente com True-validation; candidatos podem ser selecionados em validação, nunca no teste.
- Inspecionar se clusters representam autoria, comprimento ou uma característica espúria. Comparar com IF, LOF e One-Class SVM nos mesmos IDs.

### Perfil temático exploratório

- Usar TF-IDF de palavras/caracteres existente como representação de conteúdo; `texto_trunc` atual tem até 200 palavras. Normalizar a representação, fixar `k` antes da análise de teste e ajustar apenas no treino sem labels.
- Descrever clusters pelos termos de maior peso e exemplos próximos do centróide. Avaliar ARI/NMI e estabilidade, com labels usados somente depois do clustering.
- Identificar repetição/temas para curadoria do quiz, sem inferir Fake/True a partir do cluster.

## Comparação e saída

Seguir [comparison-protocol.md](comparison-protocol.md). K-means pode atribuir uma notícia nova ao centróide (`predict`); registrar distância e não transformar automaticamente cluster ID em classe. Comparar métricas Fake/True somente no perfil de novidade com threshold congelado. Comparar o perfil temático em quadro separado com DBSCAN/HDBSCAN.

## Riscos a explicitar

K-means exige definir `k`, tende a favorecer grupos convexos/de variância semelhante e atribui todos os pontos a algum centróide. Não tem classe nativa de ruído. Distância euclidiana em TF-IDF de alta dimensão pode refletir geometria lexical pouco útil; manter os resultados temáticos exploratórios.

