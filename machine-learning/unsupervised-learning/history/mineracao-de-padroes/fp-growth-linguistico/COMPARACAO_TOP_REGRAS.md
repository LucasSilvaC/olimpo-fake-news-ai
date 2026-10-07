# Comparação dos padrões linguísticos por classe

O recorte escolhido contém **25 padrões: 20 do ranking global e 5 candidatos Fake para contraste**. A análise usa as 7.200 notícias do experimento congelado: 4.320 no treino, 1.440 na validação e 1.440 no teste, com 50% Fake e 50% True em cada partição. Os atributos descrevem os primeiros 300 caracteres normalizados de cada notícia.

As 152 regras direcionais de `corrected_pos_dep` foram agrupadas em 93 combinações distintas de atributos. A→B e B→A podem descrever o mesmo conjunto de notícias; por isso, cada combinação recebe um ponto nos gráficos. Nenhuma regra do modelo anterior foi apagada ou reminerada nesta comparação.

Consulte o [relatório completo das 25 regras](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/comparison_report.md) e o [manifesto da execução](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/ranking_manifest.json).

## O que significa “melhor” neste recorte

O ranking mede utilidade para comparar as classes, combinando:

- **Separação:** limite inferior do intervalo de 95% da proporção da classe predominante acima da proporção dessa classe na validação (50%).
- **Cobertura:** fração das notícias dessa classe que contêm o padrão.
- **Estabilidade:** frequência de redescoberta da direção representativa nas reamostragens do treino.
- **Diversidade:** excluir candidatos cuja cobertura se sobrepõe em pelo menos 80% pelo índice de Jaccard a um padrão já selecionado.

O score multiplica a margem de separação pela raiz da cobertura e pela estabilidade. Exige ao menos 100 ocorrências na validação e q≤0,05 em permutações por grupos com correção Benjamini–Yekutieli sobre os 93 candidatos. Foram usadas 1.000 reamostragens por grupos para os intervalos e 4.999 permutações. A fórmula completa está no relatório e no [script](compare_linguistic_rules.py).

O top20 global favoreceu somente True. Para examinar os padrões associados a Fake, foram acrescentados cinco candidatos elegíveis dessa classe, identificados como `fake_contrast`. Esse acréscimo foi decidido depois de observar o resultado global e é exploratório; os cinco não são apresentados como superiores aos vinte globais. A estabilidade entra no score como penalização, sem exigir um mínimo de 80%.

A descoberta original não usa classe. Esta etapa usa os rótulos da validação para selecionar e ordenar os padrões, portanto é uma análise posterior supervisionada. Os percentuais do teste e do corpus inteiro não entram na seleção. O teste já havia sido examinado no trabalho anterior e não constitui confirmação nova e independente.

## Como ler as porcentagens

“91,51% das ocorrências são Fake” significa `Fake com padrão / todas as notícias com padrão`. “O padrão aparece em 13,47% das Fake” significa `Fake com padrão / todas as notícias Fake`. Os dois números respondem a perguntas diferentes e estão disponíveis para todas as regras.

Exemplos na validação; todos os itens da combinação precisam estar presentes:

| ID | Padrão resumido | Ocorrências | Fake entre ocorrências | True entre ocorrências | Cobertura nas Fake | Cobertura nas True |
|---|---|---:|---:|---:|---:|---:|
| R01 | Sem advérbios/modificadores adverbiais + poucos verbos | 126 | 19,05% | 80,95% | 3,33% | 14,17% |
| R03 | Sem modificadores adverbiais/complementos oracionais + poucos verbos | 117 | 16,24% | 83,76% | 2,64% | 13,61% |
| R21 | Muitos advérbios/modificadores adverbiais + muita pontuação | 106 | 91,51% | 8,49% | 13,47% | 1,25% |
| R22 | Muitos advérbios/modificadores adverbiais | 331 | 62,24% | 37,76% | 28,61% | 17,36% |
| R23 | Muitos advérbios/modificadores adverbiais + poucos substantivos comuns | 104 | 74,04% | 25,96% | 10,69% | 3,75% |

Os limites de “muitos” e “poucos” foram aprendidos no treino. Para R21, por exemplo: modificadores adverbiais ≥4,08%, advérbios ≥4,17% e pontuação ≥15,87%. A coluna `thresholds_pct` preserva os limites precisos, sem o arredondamento desta apresentação. POS/DEP usam tokens lexicais; pontuação usa tokens sem espaços. “Sem” se refere à anotação na janela de 300 caracteres, não ao texto completo.

## O que os resultados permitem interpretar

R21 tem o maior percentual Fake dos 93 candidatos: 97 Fake e 9 True na validação. No teste, esse percentual cai para **84,03%**; no corpus inteiro, é **85,19%**. A redescoberta da direção representativa no treino é somente **37%**, contra **100%** para R22. R21 é mais concentrado em Fake, enquanto R22 é mais estável e cobre mais notícias Fake.

Ao remover apenas a condição de pontuação de R21, obtém-se R22: a concentração Fake cai de **91,51% para 62,24%**, diferença de **29,27 pontos percentuais**. Ao remover isoladamente cada uma das duas condições adverbiais, a concentração não cai. Neste recorte, a condição de pontuação acrescenta a maior separação observada nessa combinação. Isso não estabelece causalidade. As remoções de todos os padrões estão em [leave_one_item_out.csv](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/leave_one_item_out.csv).

**A composição de autoria explica boa parte da associação bruta.** Na validação, a proporção Fake é **2,35%** entre notícias com autor e **98,05%** entre notícias sem autor. Para R21, as nove ocorrências com autor são True e as 97 sem autor são Fake. Após padronizar descritivamente os estratos de autoria, o excesso Fake é **−0,21 pp**, com intervalo de 95% de **[−0,87; 0,51] pp**.

Nenhum dos cinco candidatos Fake apresenta intervalo ajustado por autoria inteiramente favorável a Fake. Quatro dos vinte candidatos True apresentam essa condição na validação (R01, R06, R09 e R10), mas esses intervalos são pontuais, não corrigidos pela seleção ou por comparações múltiplas. Há poucas notícias das classes minoritárias em cada estrato de autoria, limitando a interpretação. O ranking fornece hipóteses sobre linguagem, estilo e composição do corpus; não demonstra o que torna uma afirmação verdadeira ou falsa.

## Dados para os gráficos

- [selected_rules_scatter.csv](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/selected_rules_scatter.csv): 25 linhas, IDs, descrições, limites, contagens, percentuais, intervalos, score, estabilidade e autoria por partição.
- [all_93_patterns.csv](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/all_93_patterns.csv): todos os candidatos, score e motivos de exclusão.
- [news_rule_matrix.csv](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/news_rule_matrix.csv): 7.200 linhas com ID da notícia, classe, grupo, partição e presença de R01…R25.
- [individual_items.csv](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/individual_items.csv): percentuais dos atributos discretizados isolados.
- [Dispersão de cobertura por classe](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/class_coverage_scatter.png) e [matriz de dispersão](../../../../outputs/rule-ranking/linguistic-top25-porcentagens-20261006/scatter_matrix.png): gráficos já gerados.

Para a dispersão principal, use **X = `validation_true_coverage_pct`** e **Y = `validation_fake_coverage_pct`**. Acima da diagonal estão padrões proporcionalmente mais frequentes em Fake; abaixo, em True. Use tamanho para ocorrências e cor para classe predominante. Fake% e True% entre ocorrências somam 100%, portanto usá-los juntos como eixos produziria uma reta.

Todos os campos terminados em `_pct` usam escala **0–100**; diferenças terminadas em `_pp` usam pontos percentuais. Treino, validação, teste e corpus completo têm prefixos `train_`, `validation_`, `test_` e `all_`. O corpus completo inclui as três partições e não é uma avaliação adicional.
