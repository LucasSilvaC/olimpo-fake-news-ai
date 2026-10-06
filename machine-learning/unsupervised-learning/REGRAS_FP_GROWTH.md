# Regras extraídas pelo FP-Growth e utilidade para o projeto

## Origem e leitura correta

Este relatório usa o [run principal sem autoria](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/run_manifest.json) e, como comparação, o [baseline com autoria](../outputs/model-comparison/fp-growth-20260929T212058Z/run_manifest.json). Os padrões foram descobertos em **4.320 notícias do treino canônico**, sem ler Fake/Real. A incidência por classe foi medida depois nas **7.200 notícias do corpus**. Essa avaliação inclui os registros de treino; portanto, não mede generalização a notícias novas.

Cada item indica que uma feature calculada nos **primeiros 300 caracteres** ficou abaixo do quantil 25% (`baixo`) ou acima do quantil 75% (`alto`) do treino. `typeTokenRatio` mede a razão de palavras distintas por token; `diversidade`, a razão de palavras distintas por palavra; `punctuationDensity`, a proporção de tokens de pontuação. `uppercaseRatio` também foi testada. `linkDensity` não gerou itens porque seus dois quantis coincidiram em zero. Empates nos limites podem fazer as faixas abrangerem mais que 25% dos registros.

Uma regra `A → B` significa que **B aparece frequentemente quando A aparece**. `support` é a fração do treino que contém ambos; `confidence` é a fração com B entre os registros com A; `lift` compara essa confidence com a frequência geral de B. A seta não implica causalidade nem prediz a classe da notícia. O Jaccard da regra compara a cobertura de A e B no treino. Os filtros configurados foram support mínimo 0,08 para os itemsets, confidence mínima 0,50, lift mínimo 1,05 e Jaccard mínimo 0,10 para destacar regras. Veja as [20 regras brutas](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/no_author_association_rules.csv) e os [10 padrões consolidados](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/no_author_consolidated_patterns.csv).

## Oito regras que passaram pelos filtros

As regras inversas compartilham o mesmo support e lift, mas têm confidence diferente. A tabela mantém as duas direções para que essa diferença fique explícita. Todos os valores são do **treino de descoberta**, arredondados a três casas.

| Regra | Support | Confidence | Lift | Jaccard |
|---|---:|---:|---:|---:|
| `diversidade_baixo → typeTokenRatio_baixo` | 0,172 | 0,684 | 2,692 | 0,516 |
| `typeTokenRatio_baixo → diversidade_baixo` | 0,172 | 0,677 | 2,692 | 0,516 |
| `typeTokenRatio_alto → diversidade_alto` | 0,166 | 0,657 | 2,557 | 0,482 |
| `diversidade_alto → typeTokenRatio_alto` | 0,166 | 0,645 | 2,557 | 0,482 |
| `typeTokenRatio_alto → punctuationDensity_baixo` | 0,138 | 0,548 | 2,163 | 0,376 |
| `punctuationDensity_baixo → typeTokenRatio_alto` | 0,138 | 0,546 | 2,163 | 0,376 |
| `typeTokenRatio_baixo → punctuationDensity_alto` | 0,138 | 0,545 | 2,137 | 0,374 |
| `punctuationDensity_alto → typeTokenRatio_baixo` | 0,138 | 0,543 | 2,137 | 0,374 |

As **12 regras restantes** continuam no CSV bruto com `passes_filters=False`. Elas envolvem `uppercaseRatio_baixo`; nenhuma atingiu simultaneamente os filtros de confidence e lift. Isso não significa que `uppercaseRatio` seja inútil: ela ainda aparece em padrões com diferenças descritivas de classe, mas suas regras de coocorrência não passaram pelo critério escolhido.

## O que os quatro pares mostram para o projeto

As porcentagens e lifts Fake/Real abaixo vêm da [avaliação posterior dos padrões sem autoria](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/no_author_pattern_evaluation.csv), no corpus completo. A prevalência global é 50% Fake e 50% Real. **Lift Fake nesta tabela é uma métrica de classe**, diferente do lift das regras acima.

| Padrão de itens | Notícias | Fake | Real | Lift Fake | Utilidade prática |
|---|---:|---:|---:|---:|---|
| `diversidade_baixo + typeTokenRatio_baixo` | 1.242 | 61,6% | 38,4% | 1,232 | Ajuda a investigar repetição e menor variedade lexical em conjunto. As duas medidas são próximas; a regra não representa duas evidências independentes. |
| `diversidade_alto + typeTokenRatio_alto` | 1.199 | 31,2% | 68,8% | 0,624 | Serve de contraste lexical para o padrão anterior e orienta inspeção de perfis de texto. |
| `punctuationDensity_baixo + typeTokenRatio_alto` | 978 | 30,9% | 69,1% | 0,618 | Aponta um perfil de menor pontuação e maior variedade de tokens para comparação exploratória. |
| `punctuationDensity_alto + typeTokenRatio_baixo` | 1.007 | 70,3% | 29,7% | 1,406 | É o maior lift Fake agregado entre os dez padrões textuais; prioriza revisão humana de exemplos e testes em novos dados. |

Essas regras ajudam a **descrever estilos recorrentes**, montar subconjuntos auditáveis de notícias e levantar hipóteses para features futuras. Elas não verificam fatos, fontes ou afirmações; portanto, não devem ser convertidas diretamente em decisão Fake/Real.

## Controle de autoria: limite dos resultados agregados

No baseline, **21 dos 31 padrões incluem autoria**. Autoria isolada já separa fortemente as classes neste corpus: 3.528 de 3.601 notícias `sem_autor` são Fake, enquanto 72 de 3.599 `com_autor` são Fake; Cramér V = **0,960**. As regras do [baseline](../outputs/model-comparison/fp-growth-20260929T212058Z/association_rules.csv) que combinam estilo e autoria podem refletir sobretudo essa composição, mesmo quando apresentam lift de coocorrência alto. Por isso o notebook [principal sem autoria](fp_growth_principal_sem_autoria_controles.ipynb) e a [comparação estratificada](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/comparison_summary.md) são a referência para interpretar o texto.

O controle mostra que o padrão `punctuationDensity_alto + typeTokenRatio_baixo`, com **70,3% Fake no total**, tem **0,7% Fake entre notícias com autor** e **98,9% Fake entre notícias sem autor**. Em cada estrato, essas porcentagens ficam próximas ou abaixo da respectiva prevalência Fake (2,0% e 98,0%). O lift Fake dentro do estrato sem autor é **1,009**. Assim, o sinal agregado não é evidência de que esse padrão textual identifique desinformação independentemente da autoria. Os estratos têm pouquíssimos exemplos da classe minoritária, e a análise é observacional.

## Uso recomendado

1. Use as regras para **explorar e auditar** perfis de escrita, mostrando os itens e exemplos cobertos ao analista.
2. Compare qualquer associação com a **baseline de autoria** e com as taxas dentro de `com_autor` e `sem_autor` antes de atribuir utilidade ao texto.
3. Para usar essas features em um detector, faça uma **avaliação preditiva separada** em notícias novas, com split por grupo/fonte e métricas como F1, precisão, recall e taxa de falso positivo. Este experimento FP-Growth não fornece essas métricas.

Reprodução: [notebook principal](fp_growth_principal_sem_autoria_controles.ipynb), [notebook baseline](fp_growth_baseline_com_autoria.ipynb), [manifesto e parâmetros do controle](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/run_manifest.json).
