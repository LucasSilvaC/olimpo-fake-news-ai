# Referência corrigida

Reprodução do experimento histórico com seis POS e seis DEP. Base de comparação; não é o principal.

Esta execução tem 15 features ativas, 152 regras direcionais elegíveis e 93 padrões distintos. 121 regras mantêm os filtros na validação; 102 também têm redescoberta ≥80%.

Os parâmetros, origem e versões estão no [manifesto do run](../run_manifest.json). Consulte [os resultados do principal](../../../../unsupervised-learning/REGRAS_FP_GROWTH.md).

- [Regras e métricas](rule_metrics.csv): direções e métricas por partição.
- [Padrões e fila de revisão](pattern_candidates.csv): uniões de itens e critérios de seleção.
- [Candidatos à revisão](review_candidates.csv): observações preliminares, sem seleção por classe.
- [Composição por classe e autoria](posthoc_composition.csv): contagens e denominadores separados.
- [Catálogo de pesquisa](pattern_catalog.json): itens, limites, perguntas e procedência.

O teste já conhecido é exploratório. Os catálogos permanecem `research_only`; as associações por classe não representam probabilidade de falsidade de uma notícia nova. Os CSVs e manifestos originais deste run foram preservados na reorganização.
