# Controles de autoria do FP-Growth

Execute da raiz do repositório:

```bash
python machine-learning/unsupervised-learning/fp_growth_controls.py
```

O baseline de descoberta `fp-growth-20260929T212058Z` e sua avaliação `fp-growth-evaluation-20260929T213741Z` são lidos e conferidos por hash; não são alterados. O corpus é o mesmo ZIP validado por SHA-256. A saída segue `machine-learning/outputs/model-comparison/fp-growth-controls-<UTC>/`, com `run_manifest.json` e `comparison_summary.md`.

O controle A cruza diretamente a autoria com os rótulos e grava `author_only_evaluation.csv`. O resumo traz a tabela de contingência, Fisher bicaudal, qui-quadrado e Cramér V (`|phi|` para 2×2).

O controle B retira apenas `tem_autor` da descoberta. Reutiliza os mesmos IDs de treino, itens textuais e critérios de discretização persistidos, `min_support`, tamanho máximo, filtros de regras e consolidação. A descoberta é executada antes da leitura dos rótulos. Os artefatos `no_author_frequent_itemsets.csv`, `no_author_association_rules.csv`, `no_author_consolidated_patterns.csv`, `no_author_discretization.csv` e `no_author_train_pattern_membership.csv` registram o resultado congelado. `no_author_pattern_membership.csv` aplica esses padrões a todo o corpus; o recorte de treino é conferido exatamente com o membership recém-persistido antes de qualquer avaliação de classe. `no_author_pattern_evaluation.csv` contém as métricas externas.

O controle C usa o mesmo membership de B e mede cada padrão dentro dos estratos `com_autor` e `sem_autor`. `author_stratified_pattern_evaluation.csv` apresenta contagens, suporte, baseline do próprio estrato, proporções, deltas e lifts. Fisher bicaudal e q Benjamini–Hochberg são calculados separadamente em cada estrato. `comparison_patterns.csv` junta o baseline e o controle B por **igualdade exata das features ordenadas**; itemsets estruturalmente diferentes não são pareados.

`baseline_metadata_patterns.csv` mantém os 21 padrões originais que contêm autoria e coloca sua proporção Fake ao lado da proporção da autoria isolada. A comparação é descritiva e não atribui causalidade aos itens textuais adicionais.

O corpus tem forte associação entre autoria e rótulo, e cada estrato contém poucos exemplos de uma das classes. Lifts condicionais podem parecer grandes mesmo com diferenças absolutas pequenas. Os resultados são descritivos do corpus inteiro, que inclui o treino de descoberta; não medem generalização nem causalidade e não criam um classificador.
