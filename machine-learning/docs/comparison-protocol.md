# Protocolo comum de comparação

Todo novo método deve seguir este protocolo para que seus resultados possam ser comparados aos baselines existentes. Se um algoritmo não puder produzir previsões em registros fora do treino, reportá-lo como clustering exploratório, sem colocá-lo no ranking de classificação.

## 1. Dados e identificação

- Usar como referência o Fake.br com revisão fixada nos notebooks atuais de anomalia (`780f5516c4ae070761632d98ac3368f3ded09d35`) e registrar URL e SHA-256 do arquivo baixado.
- Preservar um `record_id` estável por notícia e um `group_id` para notícia duplicada, par temático ou história equivalente, quando identificável.
- Manter exatamente `0 = True`, `1 = Fake`. IDs, pastas de origem e labels servem para auditoria/avaliação, nunca como feature.
- Não presumir que `dados_preparados.pkl` ou `transformers.pkl` estão versionados; são ignorados pelo `.gitignore`. Reproduzir a preparação a partir da fonte fixada ou registrar claramente quais artefatos locais foram usados.
- Ajustar imputação, normalização, vocabulário TF-IDF, redução de dimensão e qualquer outra transformação usando apenas o treino.

## 2. Partições

Criar uma partição canônica com treino, validação e teste, seed 42, garantindo que o mesmo `record_id` e o mesmo `group_id` nunca apareçam em mais de uma partição. Tentar também uma avaliação secundária com fonte/editora ou período temporal retido, quando houver dados suficientes.

Os notebooks supervisionados atuais usam divisão aleatória estratificada 80/20 e os de anomalia têm protocolos próprios. Esses números antigos são úteis para reproduzir trabalhos anteriores, mas **não são uma comparação principal justa**. Na rodada comparativa, treinar novamente os baselines elegíveis com as mesmas notícias e IDs da partição canônica. Manter a reprodução do split antigo como resultado secundário.

Rótulos de validação podem ser usados para escolher hiperparâmetros, calibrar scores/limiares ou mapear clusters para Fake/True. Congelar essas escolhas antes de abrir o teste. Nunca escolher parâmetros, limiares ou regras com resultados do teste.

## 3. Duas formas de avaliar clustering

### Descoberta de grupos

Fazer o ajuste com labels ocultos. Reportar número e tamanho dos clusters, fração de ruído/sem atribuição, estabilidade entre seeds e parâmetros, e métricas internas apropriadas. Depois do ajuste, usar labels somente para análise externa (por exemplo, ARI/NMI e composição Fake/True dos grupos). Essa análise não deve ser apresentada como classificador.

### Comparação como detector Fake/True

Só incluir um clusterer no ranking de classificação quando houver uma estratégia explícita para pontuar e atribuir **notícias novas** sem ajustar o modelo no teste. Calibrar a interpretação do score/cluster usando validação e reportar que a etapa de mapeamento foi supervisionada por validação. DBSCAN/HDBSCAN podem exigir implementação/estimador com predição fora da amostra; se isso não estiver disponível e documentado, manter apenas a avaliação de descoberta de grupos.

Para detectores one-class, preservar a hipótese dos notebooks atuais: ajustar somente com True de treino, definir score de suspeita em que valores maiores indiquem maior desvio, e escolher limiar apenas com True-validation (q95 como comparação-base). Um alerta ou ruído não significa prova de notícia falsa.

## 4. Features para comparações

Manter duas trilhas separadas e não misturar os resultados sem identificação:

1. **Estilo, próxima aos detectores atuais:** os seis atributos recomputáveis nos notebooks atuais, derivados dos primeiros 300 caracteres: presença de autor, TTR, densidade de links, densidade de pontuação, razão de maiúsculas e diversidade. Imputar com estatísticas do treino e escalar conforme necessário para distância. Preservar a coluna binária de autoria sem deixá-la dominar a distância.
2. **Texto/conteúdo:** o corpus preparado nos notebooks supervisionados usa `texto_trunc` (200 palavras) e TF-IDF de palavras e/ou caracteres, opcionalmente com metadados. Comparar um método baseado em texto como trilha separada. Para projeções ou embeddings adicionados, registrar modelo, versão, custo e ajuste feito apenas com treino. Não afirmar que agrupamentos temáticos predizem veracidade.

## 5. Métricas

Para métodos que geram decisão Fake/True, calcular em exatamente os mesmos IDs de teste:

- Macro-F1 e balanced accuracy como métricas principais;
- precisão e recall para Fake, FPR (taxa de falsos alertas) em True, acurácia, ROC-AUC e Average Precision;
- cobertura/abstenção, quando o método pode responder “incerto” ou “revisar”;
- Brier score e curva de calibração somente para scores interpretáveis como probabilidade. Não chamar anomaly score ou confiança de probabilidade de falsidade sem validação.

Para clustering exploratório, não forçar acurácia/F1: incluir ARI/NMI pós-ajuste, estabilidade, número de grupos, tamanhos e ruído/abstenção. Comparar essas métricas em tabela própria.

Reportar média e desvio entre folds/seeds no treino/validação. Dar um único resultado final no teste congelado. Se testar o Jev apenas num subconjunto por limite de créditos, avaliar todos os baselines também exatamente nesse subconjunto e marcá-lo como comparação parcial.

## 6. Relatório e artefatos por execução

Salvar, sem dados brutos ou chaves:

- `metrics.csv`: uma linha por método, configuração, protocolo e partição;
- `predictions.csv` ou formato equivalente: `record_id`, label externo (somente para análise), score/probabilidades, decisão e status de revisão;
- `run_manifest.json`: revisão/hash do corpus, IDs da partição, seed, versões, features, parâmetros, estratégia de score/limiar e se houve API/custo;
- uma tabela consolidada comparando cada execução aos baselines no mesmo protocolo.

Sugestão de destino: `machine-learning/outputs/model-comparison/<run_id>/`. Nunca salvar API keys, textos privados, nem resultados sem custo declarado.

## 7. Integridade do experimento

- Criar novos notebooks/scripts para experimentos. Preservar os notebooks existentes e seus outputs; não reescrever históricos para acomodar os métodos novos.
- Registrar configurações antes de avaliar o teste e apresentar os resultados observados mesmo quando forem piores que o baseline.
- Não alegar melhora sem comparar no mesmo split/IDs, na mesma unidade de análise (notícia) e com a mesma regra de decisão.
- Se o resultado parecer quase perfeito, verificar duplicatas, pares temáticos, fonte/editora, comprimento e qualquer pista de origem antes de concluir que generaliza.

