# FP-Growth: padrões frequentes de estilo

Execute o [notebook do baseline com autoria](../../history/mineracao-de-padroes/fp-growth-legado/fp_growth_baseline_com_autoria.ipynb) em um kernel Python 3, a partir de uma pasta do repositório.

O notebook usa o ZIP Fake.br identificado e validado pelo SHA-256 do manifesto DBSCAN, e somente os `record_id` do treino canônico. Altere `RUN_ARGS` para `--protocol temporal` se desejar o treino temporal. A pasta de saída segue `machine-learning/outputs/model-comparison/fp-growth-<UTC>/`. Não há leitura dos rótulos, classificação ou comparação Fake/True.

As seis medidas seguem `hdbscan.ipynb`: autoria, type-token ratio, densidade de links, densidade de pontuação, razão de palavras maiúsculas e diversidade lexical, calculadas nos primeiros 300 caracteres. A discretização usa os quantis 25% e 75% do treino, produzindo itens `*_baixo` e `*_alto`; autoria gera `com_autor` e `sem_autor`. Valores ausentes não ativam um item. Features com quantis iguais são omitidas e registradas no manifesto, pois não permitem separar níveis baixos e altos. Empates nos limites podem produzir faixas maiores que 25%.

`diversidade_baixo` já expressa mais repetição lexical pela definição existente. Criar também `alta_repeticao = 1 - diversidade` duplicaria exatamente a mesma informação. Subjetividade e contagem de exclamações não existem entre as seis medidas; este experimento não as introduz. `punctuationDensity` mede toda a pontuação, não apenas exclamações.

Os filtros padrão são `--min-support 0.08`, `--max-len 3`, `--min-confidence 0.5`, `--min-lift 1.05`, `--min-jaccard 0.1` e `--redundancy-jaccard 0.9`. Todos podem ser alterados pela CLI, assim como `--low-quantile` e `--high-quantile`.

## Arquivos

- `summary.md`: vinte padrões de maior support e vinte regras de maior lift, legíveis rapidamente.
- `frequent_itemsets.csv`: `pattern_id`, `features` em JSON, tamanho e support. `max_rule_confidence`, `max_rule_lift` e `max_rule_jaccard` resumem a melhor regra **que passou nos filtros** para aquele itemset; ficam vazios quando não existe regra elegível. Não são métricas intrínsecas do itemset.
- `association_rules.csv`: **todas** as regras derivadas dos itemsets frequentes, antes dos filtros de confidence, lift e Jaccard. Inclui antecedente, consequente e conjunto completo em arrays JSON, `pattern_id`, tamanho, support, confidence, lift, Jaccard e `passes_filters`. O Jaccard é a interseção/união das notícias que contêm antecedente e consequente. Os filtros afetam somente a escolha de associações na visão consolidada.
- `similar_patterns.csv`: pares de padrões com Jaccard alto entre suas coberturas por notícia. Um arquivo só com cabeçalho significa que nenhum par atingiu o limite.
- `pattern_membership.csv`: associação `record_id` ↔ `pattern_id` para itemsets de tamanho pelo menos 2. Permite cruzamentos futuros sem incluir classe ou texto nos outputs atuais.
- `run_manifest.json`: corpus, protocolo, limites, quantis, features e contagens para reprodução.

## Consolidação

O FP-Growth e seus CSVs brutos permanecem preservados. `consolidated_patterns.csv` tem uma linha por itemset de tamanho pelo menos 2, com ID legível estável na ordem de suporte (`P01`, `P02`, ...), famílias, métricas máximas das regras elegíveis, até duas associações principais, lista de padrões relacionados e motivos de redundância. Regras inversas compartilham o mesmo itemset e aparecem juntas. `is_primary` e `representative_id` identificam a visão resumida: um padrão posterior com Jaccard de cobertura pelo menos `--consolidation-jaccard` (padrão 0,75) recebe o primeiro representante da ordem de suporte. A linha continua no CSV. O resumo Markdown mostra os representantes e suas associações principais.

`closed` marca itemsets sem superconjunto frequente com exatamente o mesmo suporte. É uma marcação pós-processada, sem alterar a mineração. Extensões cujo suporte cai no máximo `--extension-tolerance` (padrão 0,03) são relacionadas e marcadas; regras da mesma família são apenas sinalizadas. Famílias derivadas das definições existentes: `typeTokenRatio`/`diversidade` = lexical, `punctuationDensity`/`uppercaseRatio` = estilo, `linkDensity` = estrutura, autoria = metadata. Não há feature semântica nesta representação.

`discretization.csv` registra por item o operador, os quantis, os limites numéricos, valores ausentes e eventual omissão. Os mesmos valores constam no manifesto. IDs de exibição são reproduzíveis para o mesmo corpus e parâmetros, mas podem mudar se o suporte ou a discretização mudar; `pattern_id` é derivado das features e serve para cruzar os CSVs.

Os quantis e o suporte descrevem esse treino específico. Coocorrência, confidence e lift não indicam causalidade, veracidade ou qualidade factual da notícia.
