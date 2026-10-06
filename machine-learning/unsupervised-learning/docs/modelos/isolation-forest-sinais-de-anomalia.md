# Isolation Forest: sinais usados para marcar uma notícia como anômala

Notebook de referência: [isolation-forest.ipynb](../../history/deteccao-de-anomalias/isolation-forest.ipynb).

## Em poucas palavras

O modelo aprende o padrão das notícias **True (0)** do treino e procura registros que se destacam desse padrão. Para cada notícia, o notebook calcula seis medidas de estilo e as avalia em conjunto. Uma combinação incomum dessas medidas pode gerar um score alto e, se passar do corte, a notícia recebe `isAnomaly=True`.

Isso identifica **atipicidade em relação às notícias True usadas no treino**. Não identifica uma afirmação falsa, não verifica fatos e não estima a probabilidade de a notícia ser Fake.

## Quais sinais entram no modelo

As medidas de texto são calculadas somente nos primeiros **300 caracteres**, depois de normalização Unicode NFKC e remoção de um BOM inicial. Espaços e pontuação contam para o limite; o corte pode terminar no meio de uma palavra ou frase. Notícias com menos de 300 caracteres são mantidas com o tamanho original.

| Feature | O que é medido | Exemplo de padrão que pode contribuir para um alerta |
|---|---|---|
| `tem_autor` | Indicador `0/1` obtido dos metadados: `1` se o campo autor estiver preenchido, `0` se estiver vazio ou marcado como ausente. | Presença ou ausência de autor diferente do que o modelo costuma encontrar nas notícias True. O modelo não avalia quem é o autor nem sua credibilidade. |
| `typeTokenRatio` | Número de tokens distintos dividido pelo total de tokens no prefixo. Tokens incluem palavras, números e sinais de pontuação. | Uma proporção de tokens distintos muito diferente do padrão aprendido. |
| `linkDensity` | Quantidade de URLs `http(s)` no prefixo dividida pelo número de palavras. | Densidade de links incomum em relação ao treino. |
| `punctuationDensity` | Tokens que não são palavras divididos pelo total de tokens. Nesse cálculo, números e pontuação entram entre os tokens que não são palavras. | Uso proporcional de pontuação e números incomum em relação ao treino. |
| `uppercaseRatio` | Palavras inteiramente em maiúsculas, com mais de uma letra, divididas pelo número de palavras. | Proporção de palavras em maiúsculas fora do padrão aprendido. |
| `diversidade` | Número de palavras distintas, sem diferenciar maiúsculas de minúsculas, dividido pelo número de palavras. | Repetição ou variedade lexical proporcionalmente diferente do padrão aprendido. |

Uma proporção ausente por falta de denominador seguro vira `NaN` e é preenchida pela mediana daquela feature no treino True. `num_palavras`, contagens linguísticas históricas, categoria, data, link de origem e o rótulo True/Fake **não** são features do detector. `num_palavras` é usado apenas para calcular algumas proporções.

## Como o modelo transforma os sinais em alerta

1. O pipeline calcula essas seis features e preenche valores ausentes pela mediana das notícias True de treino.
2. O Isolation Forest aprende a distribuição conjunta dessas features usando **300 árvores**, exclusivamente em `normal_train` (notícias True). O rótulo Fake não participa do ajuste.
3. O notebook inverte o `decision_function` para que `anomalyScore` maior signifique maior atipicidade.
4. O corte é o percentil 95 dos scores de `normal_validation` (notícias True de validação). `isAnomaly=True` quando `anomalyScore >= threshold`.

Em termos simples, as árvores fazem divisões aleatórias nas medidas; combinações que ficam isoladas com mais facilidade tendem a receber score de anomalia maior. Não há uma regra individual do tipo “ter link significa Fake” ou “não ter autor significa anômala”. Uma feature isolada também não determina necessariamente o alerta: o modelo considera a combinação das seis.

## O que dá para concluir sobre uma notícia sinalizada

- O `anomalyScore` resume o quanto a combinação de features se afastou do padrão aprendido; ele não é probabilidade nem percentual de falsidade.
- `isAnomaly=True` significa que o score atingiu o corte calibrado. O corte foi escolhido para sinalizar aproximadamente 5% das notícias True de validação; empates podem elevar essa fração.
- O modelo não aponta palavras, frases ou uma feature específica como causa do alerta. As seis colunas exibidas em `Casos extremos` ajudam a inspecionar os valores, mas não são atribuições causais nem importâncias das features.
- Para explicar por que um caso recebeu o score, seria necessário comparar seus seis valores com as distribuições do treino e usar uma técnica de explicabilidade apropriada. O notebook atual não faz essa análise.
- Um texto sinalizado deve ser revisado e verificado por fontes externas. Um texto fora do padrão pode ser verdadeiro; um texto dentro do padrão também pode conter falsidade.

## Anotação manual de um caso

O notebook não tem saídas salvas no arquivo atual, então este documento descreve os sinais implementados, não casos específicos que já foram marcados. Ao executar a seção **14. Casos extremos**, use os valores calculados para preencher um registro por notícia:

| Campo | Anotação |
|---|---|
| ID da notícia |  |
| `anomalyScore` / `threshold` |  |
| `isAnomaly` |  |
| `tem_autor` |  |
| `typeTokenRatio` |  |
| `linkDensity` |  |
| `punctuationDensity` |  |
| `uppercaseRatio` |  |
| `diversidade` |  |
| Quais valores parecem mais fora do padrão True? |  |
| Revisão humana / verificação externa |  |

Para dizer que um valor é “fora do padrão”, compare-o com a distribuição correspondente em `normal_train`; não deduza isso apenas pelo valor bruto. A inspeção deve ser registrada como hipótese de revisão, não como explicação causal emitida pelo modelo.

## Referências no notebook

- Extração e fórmulas das features: seções **5–6**.
- Ajuste somente em notícias True: seção **9**.
- Score, limiar e decisão: seções **10–11**.
- Casos extremos com as seis medidas: seção **14**.
