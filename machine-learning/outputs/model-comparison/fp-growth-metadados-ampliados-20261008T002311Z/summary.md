# FP-Growth com metadados ampliados

Extração dos atributos coletados na janela de 300 caracteres, com denominadores corrigidos. As 152 regras direcionais da referência foram reproduzidas. Os 7.200 textos coletados foram conferidos contra o ZIP congelado validado por SHA-256.

Redescoberta em 100 reamostragens dos grupos do treino, com quantis reaprendidos. Intervalos gramaticais na validação reamostram grupos com regras/limites congelados. Teste exploratório.

| Variante | Features ativas | Regras treino | Regras válidas na validação | Estáveis e válidas | Padrões elegíveis | Candidatos à revisão | Notícias adicionais vs referência |
|---|---:|---:|---:|---:|---:|---:|---:|
| referencia_corrigida | 15 | 152 | 121 | 102 | 93 | 20 | 0 |
| pos_ampliado | 18 | 189 | 153 | 126 | 118 | 20 | 36 |
| sintaxe_ampliada | 22 | 523 | 422 | 347 | 345 | 20 | 65 |
| metadados_coletados | 37 | 4350 | 3563 | 3093 | 2546 | 20 | 66 |

A última coluna compara a união de todos os padrões elegíveis. Não mede ganho de cobertura de padrões estáveis nem eficácia das perguntas.
A lista de revisão exige regras sustentadas na validação, ≥100 ocorrências e redescoberta ≥80%. O score usa estabilidade × raiz do suporte, sem label. Ela evita repetir assinaturas de famílias e coberturas com Jaccard ≥0,80. Esses cortes são uma política exploratória, não validação de utilidade do produto.

## Exemplos de novas combinações para revisão

| Variante | Padrão | Ocorrências validação | Redescoberta | Sobreposição estrutural POS/DEP |
|---|---|---:|---:|---|
| pos_ampliado | `DEP_ccomp_rate_baixo + POS_ADP_rate_alto` | 264 | 100% | False |
| pos_ampliado | `DEP_ccomp_rate_baixo + POS_AUX_rate_baixo` | 255 | 100% | False |
| pos_ampliado | `DEP_ccomp_rate_baixo + POS_NUM_rate_alto` | 247 | 100% | False |
| pos_ampliado | `DEP_advcl_rate_baixo + POS_ADP_rate_alto` | 243 | 100% | False |
| pos_ampliado | `DEP_advcl_rate_baixo + POS_NUM_rate_alto` | 224 | 100% | False |
| sintaxe_ampliada | `DEP_acl:relcl_rate_baixo + POS_PRON_rate_baixo` | 441 | 100% | False |
| sintaxe_ampliada | `DEP_nsubj:pass_rate_baixo + POS_AUX_rate_baixo` | 387 | 100% | False |
| sintaxe_ampliada | `DEP_nsubj:pass_rate_baixo + DEP_nsubj_rate_alto` | 352 | 100% | False |
| sintaxe_ampliada | `DEP_nsubj:pass_rate_baixo + DEP_obj_rate_alto` | 344 | 100% | False |
| sintaxe_ampliada | `DEP_acl:relcl_rate_baixo + DEP_nsubj:pass_rate_baixo + POS_PRON_rate_baixo` | 319 | 100% | False |
| metadados_coletados | `DEP_aux:pass_rate_baixo + DEP_nsubj:pass_rate_baixo` | 965 | 100% | False |
| metadados_coletados | `DEP_advcl_rate_baixo + DEP_aux:pass_rate_baixo + DEP_nsubj:pass_rate_baixo` | 589 | 100% | False |
| metadados_coletados | `DEP_aux:pass_rate_baixo + DEP_nsubj:pass_rate_baixo + DEP_nummod_rate_baixo` | 584 | 100% | False |
| metadados_coletados | `DEP_aux:pass_rate_baixo + DEP_ccomp_rate_baixo + DEP_nsubj:pass_rate_baixo` | 570 | 100% | False |
| metadados_coletados | `DEP_nummod_rate_baixo + POS_NUM_rate_baixo` | 560 | 100% | True |

## Uso no propósito do teste.md

Os catálogos JSON contêm itens com limiares completos, denominadores, proveniência das direções, famílias de redundância, observações e perguntas preliminares. Todos permanecem `research_only` e `comparisonEnabled=false`. Nenhuma regra foi automaticamente aprovada para exibição ao usuário.

As contagens Fake/True estão separadas por partição e autoria em `posthoc_composition.csv`, com frequência em cada classe e composição entre ocorrências. Não representam probabilidade de falsidade de uma notícia nova. As descrições automáticas com termos técnicos exigem tradução/revisão editorial.

Próxima decisão: revisar exemplos das novas famílias e medir quais acrescentam observações compreensíveis. A comparação externa e a avaliação com usuários continuam pendentes. Mais regras não demonstram melhor reflexão nem generalização.
