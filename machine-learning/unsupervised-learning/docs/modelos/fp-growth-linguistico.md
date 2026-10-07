# FP-Growth linguístico sem autoria

O [notebook linguístico](../../history/mineracao-de-padroes/fp-growth-linguistico/fp_growth_linguistico_sem_autoria.ipynb) incorpora a proposta dos scripts da equipe em uma extração por notícia. Cada transação corresponde a um `record_id` canônico, com contagens, denominadores e taxas POS/DEP. Essa unidade permite medir coocorrências reais entre atributos do mesmo texto; os totais agregados por classe dos scripts originais não são usados como transações.

Os notebooks [baseline com autoria](../../fp_growth_baseline_com_autoria.ipynb) e [principal sem autoria](../../fp_growth_principal_sem_autoria_controles.ipynb) permanecem preservados. O novo experimento compara representações nos mesmos IDs e produz regras direcionais e padrões consolidados como unidades diferentes.

## Resultados executados em 6 de outubro de 2026

O [run executado](../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/run_manifest.json) reproduziu o baseline e minerou as sete variantes no corpus de 7.200 notícias. A [tabela completa](../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/variant_summary.csv) separa regras direcionais de padrões. A interpretação das regras e a comparação detalhada estão no [relatório de resultados](../../REGRAS_FP_GROWTH_LINGUISTICO.md).

| Variante | Padrões frequentes de tamanho ≥2 | Regras elegíveis no treino | Mantêm filtros na validação | Mantêm filtros no teste |
|---|---:|---:|---:|---:|
| `legacy_author` | 31 | 28 | 27 | 28 |
| `legacy_style` | 10 | 8 | 8 | 8 |
| `legacy_pos` | 65 | 18 | 13 | 14 |
| `corrected_style` | 5 | 0 | 0 | 0 |
| `corrected_pos` | 57 | 10 | 5 | 6 |
| `corrected_pos_dep` | 255 | 152 | 121 | 120 |
| `corrected_pos_dep_complete` | 273 | 172 | 138 | 135 |

A correção de estilo, sozinha, deixou **zero regras elegíveis**. As oito anteriores sem autoria dependiam de TTR, retirado por redundância. Acrescentar POS ao estilo legado preservou essas oito regras e acrescentou dez; a versão com estilo corrigido manteve somente essas dez novas regras POS. Acrescentar DEP preservou as dez regras POS e acrescentou 142 no treino. A comparação usa identidade exata dos itens/direção, e não equivalência de significado.

As cinco regras POS que mantiveram os filtros na validação são `POS_PROPN_rate_baixo → uppercaseRatio_baixo` e `POS_PRON_rate_alto`, `POS_NOUN_rate_alto`, `POS_ADJ_rate_alto`, `POS_ADV_rate_alto → uppercaseRatio_baixo`. Seus lifts de validação variaram de **1,167 a 1,577**. Elas descrevem coocorrências entre gramática e baixa proporção de caixa alta na janela.

Exemplos da versão POS+DEP, com métricas de **validação**, sem seleção por classe:

| Regra | Notícias com ambos os itens | Suporte | Confidence | Lift |
|---|---:|---:|---:|---:|
| `POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 416 | 0,289 | 0,959 | 2,882 |
| `DEP_advmod_rate_alto → POS_ADV_rate_alto` | 331 | 0,230 | 0,904 | 3,501 |
| `POS_ADV_rate_alto → DEP_advmod_rate_alto` | 331 | 0,230 | 0,890 | 3,501 |
| `DEP_amod_rate_baixo → POS_ADJ_rate_baixo` | 299 | 0,208 | 0,742 | 2,619 |
| `DEP_nsubj_rate_baixo → DEP_ccomp_rate_baixo` | 294 | 0,204 | 0,766 | 1,299 |

As associações ADV/`advmod` e ADJ/`amod` são fortes, mas parcialmente refletem a relação entre duas anotações dos mesmos tokens. Portanto, as 152 regras não constituem 152 evidências independentes. A variante com descarte da última frase alterou substancialmente a identidade dos itens DEP e a quantidade de regras, reforçando a necessidade de interpretar a sintaxe junto à sensibilidade ao corte. A contribuição comprovada desta implementação é maior fidelidade e rastreabilidade da representação por notícia; ela não demonstra capacidade de classificação Fake/True.

## Execução e artefatos

Use Python 3 e instale `python -m pip install -r machine-learning/requirements-linguistic.txt` a partir da raiz do repositório. O arquivo fixa spaCy 3.8.16 e `pt_core_news_sm` 3.8.0; Jupyter precisa de `ipykernel`, incluído nas dependências. Nesta sessão foi usado o ambiente isolado `Eldorado/.codex-analysis/metadados-venv/`.

Execute as células do notebook em sequência. O código reprodutível fica nos módulos [linguistic_features.py](../../history/mineracao-de-padroes/fp-growth-linguistico/linguistic_features.py) e [linguistic_fp_growth.py](../../history/mineracao-de-padroes/fp-growth-linguistico/linguistic_fp_growth.py), para evitar duplicar implementações de extração e mineração. O ponto de entrada Python é `run_experiment(output_dir=None, force_extract=False, bootstrap_repetitions=100)`, que retorna o diretório do run. O notebook também permite configurar `EXISTING_RUN` para inspecionar um run concluído.

As saídas ficam em `machine-learning/outputs/model-comparison/fp-growth-linguistic-<UTC>/`. O nome UTC evita colisões e o manifesto registra os parâmetros. Os artefatos principais são:

| Artefato | Conteúdo |
|---|---|
| `run_manifest.json` | Corpus, hashes, versões, janela, IDs, parâmetros e procedência. |
| `linguistic_features.csv` | Contagens, denominadores, taxas e indicadores de qualidade por notícia. |
| `split_assignments.csv` | IDs, partição e grupo/pareamento canônico. |
| `feature_audit.csv` | Distribuições, zeros, ausências e qualidade dos atributos. |
| `annotation_preview.csv` e `annotation_preview.md` | Amostra reproduzível de textos do treino e anotações previstas, quando gerada pelo acompanhamento do run. |
| `variant_summary.csv` | Quantidade de atributos, itens, regras e padrões por variante; regras que mantêm filtros fora do treino. |
| `comparisons.csv` | Quantidades de regras novas, preservadas e removidas nas ablações. |
| `rule_comparison.csv` | Identidade e itens de cada regra nova, preservada ou removida em cada comparação. |
| `training_rediscovery_stability.csv` | Frequência de redescoberta de cada regra após reamostragem dos grupos do treino e reaprendizado de quantis. |
| `training_bootstrap_summary.csv` e `training_bootstrap_manifest.json` | Contagens por repetição e procedência da redescoberta no treino. |
| `posthoc_pattern_composition.csv` e `posthoc_feature_distributions.csv` | Descrição posterior por classe, autoria e partição, sem alterar a descoberta. |
| `<variante>/discretization.csv` | Quantis do treino, cobertura real e atributos omitidos. |
| `<variante>/all_rules.csv` | Todas as regras direcionais extraídas. |
| `<variante>/eligible_rules.csv` | Regras que passaram os filtros do treino. |
| `<variante>/rule_metrics.csv` | Métricas das regras elegíveis congeladas em treino, validação e teste; intervalos bootstrap da validação. |
| `<variante>/frequent_itemsets.csv` | Conjuntos frequentes de itens. |
| `<variante>/consolidated_patterns.csv` | Padrões consolidados, sem contar cada direção como um padrão diferente. |

O cache linguístico só é reutilizado quando sua procedência é compatível. Para refazer a extração, configure `FORCE_EXTRACT=True`. A origem é o ZIP congelado validado por SHA-256; a execução não usa downloads mutáveis de `master`.

## O que foi controlado

O texto de todas as variantes vem dos primeiros **300 caracteres após normalização NFKC**, preservando caixa, acentos, pontuação e palavras funcionais. POS/DEP é calculado nesse mesmo recorte. O experimento não mistura textos completos com os recortes do baseline.

Há 4.320 notícias de treino, 1.440 de validação e 1.440 de teste no split canônico pareado. Fake e True do mesmo par permanecem no mesmo grupo. Autoria e rótulo não entram na descoberta das variantes linguísticas; o baseline com autoria aparece exclusivamente como referência explícita.

Os quantis 25% e 75% são aprendidos no treino e aplicados congelados às outras partições. `baixo` e `alto` descrevem esses limites, sem representar valores absolutos, qualidade de escrita ou veracidade. Empates e concentração em zero mudam a cobertura real; limites coincidentes e taxas totalmente ausentes são registrados e omitidos quando necessário. Um zero válido não vira dado ausente.

Os parâmetros de mineração conservam suporte mínimo 0,08 e tamanho máximo de itemset 3. Uma regra elegível precisa de confidence ≥0,50, lift ≥1,05 e Jaccard ≥0,10. A auditoria de similaridade entre coberturas de padrões do baseline é preservada e registrada em `similar_patterns.csv`; ela é distinta do Jaccard de antecedente/consequente usado no filtro das regras. No treino, suporte 0,08 requer pelo menos 346 notícias. Os padrões consolidados e as regras direcionais não têm a mesma contagem.

## Ablações e interpretação da diferença

| Variante | Representação e finalidade |
|---|---|
| `legacy_author` | Reproduz o baseline original com autoria. |
| `legacy_style` | Retira autoria e reproduz a representação textual do principal anterior. |
| `legacy_pos` | Acrescenta seis taxas POS ao estilo legado; isola o efeito de POS. |
| `corrected_style` | Corrige a definição de pontuação e elimina TTR redundante, sem POS/DEP. |
| `corrected_pos` | Acrescenta seis taxas POS ao estilo corrigido. |
| `corrected_pos_dep` | Acrescenta seis taxas DEP na janela de 300 caracteres. |
| `corrected_pos_dep_complete` | Troca somente as taxas DEP por uma versão que descarta a última frase potencialmente truncada. |

No estilo antigo, `typeTokenRatio = diversidade × (1 − punctuationDensity)`. Além disso, a medida antiga de pontuação inclui números. A correção conta pontuação com `token.is_punct`, mantém uma representação lexical auditável e retira TTR. Assim, a comparação `legacy_style → corrected_style` mede alteração de representação; seus efeitos não podem ser atribuídos a POS.

As comparações de regras usam igualdade exata dos itens e da direção. Alterar o nome ou a definição de uma feature gera itens distintos e não autoriza parear semanticamente as regras como se fossem idênticas. A leitura final deve considerar simultaneamente a quantidade de regras, a cobertura e as métricas fora do treino. Mais regras não demonstram melhor qualidade nem capacidade de detectar fake news.

## Denominadores e qualidade

`tokens_all` conta todos os tokens. `tokens_nonspace` exclui espaços e é o denominador da pontuação. `tokens_lexical` exclui espaços e pontuação, mantendo números, e é o denominador das taxas POS e DEP. Uma tag ausente recebe contagem zero em um documento válido. Documento sem tokens elegíveis recebe taxa ausente e indicador de qualidade, sem inventar uma transação linguística.

A extração mantém `quality_empty`, `quality_noeligible`, `quality_truncated`, `quality_complete_last_sentence_dropped` e `quality_complete_noeligible`. As contagens e taxas não são arredondadas antes da discretização. `feature_audit.csv` e a amostra reproduzível do notebook permitem conferir denominadores e distribuição por notícia, em vez de totais por classe.

O corte de 300 caracteres pode interromper uma frase e afetar o parser. Na variante de sensibilidade, quando o recorte parece terminar sem pontuação final, a última frase prevista é descartada para as taxas DEP, com denominador próprio `tokens_complete_lexical`. O texto completo não é reparsed. Essa aproximação não garante frases completas nem equivale a analisar o artigo inteiro; a diferença entre as duas variantes mede sensibilidade ao corte.

## Glossário linguístico

| Taxa | Significado aproximado da anotação |
|---|---|
| `POS_ADJ_rate` | Adjetivos. |
| `POS_ADV_rate` | Advérbios. |
| `POS_NOUN_rate` | Substantivos comuns. |
| `POS_PROPN_rate` | Nomes próprios. |
| `POS_VERB_rate` | Verbos conforme a tag atribuída pelo modelo. |
| `POS_PRON_rate` | Pronomes. |
| `DEP_nsubj_rate` | Sujeitos nominais. |
| `DEP_obj_rate` | Objetos diretos. |
| `DEP_amod_rate` | Modificadores adjetivais de nomes. |
| `DEP_advmod_rate` | Modificadores adverbiais. |
| `DEP_ccomp_rate` | Complementos oracionais com sujeito próprio. |
| `DEP_advcl_rate` | Orações adverbiais. |
| `DEP_complete_*` | As mesmas relações na aproximação com descarte da última frase potencialmente truncada. |

Essas anotações são **previsões do modelo spaCy**, não verdade linguística revisada manualmente. POS e DEP classificam os mesmos tokens de maneiras diferentes: suas porcentagens não devem ser somadas como uma única distribuição. ADJ e `amod` podem compartilhar informação; remover a identidade matemática do baseline não elimina todas as relações estruturais entre os novos atributos.

A prévia de anotações, gerada pelo módulo [annotation_preview.py](../../history/mineracao-de-padroes/fp-growth-linguistico/annotation_preview.py), registra tokens, offsets, POS, DEP, cabeça sintática e elegibilidade lexical de uma amostra reproduzível do treino. Gerar ou inspecionar essa prévia não equivale a validação linguística humana com referência anotada; sua função é permitir a revisão dos exemplos.

## Regras fora do treino e limites da conclusão

Suporte é a incidência conjunta de antecedente e consequente. Confidence é a frequência do consequente entre as notícias com antecedente; lift compara essa frequência com a prevalência geral do consequente. A seta descreve associação, sem causalidade ou decisão Fake/True.

As regras são descobertas no treino e depois aplicadas congeladas na validação e no teste. Os mesmos filtros são conferidos nessas partições, sem reaprender quantis nem minerar regras novas. O notebook apresenta as regras linguísticas que mantêm os filtros na validação em ordem de suporte e confidence, independentemente de classe.

Os 100 bootstraps de seed 42 da validação reamostram grupos pareados para calcular intervalos percentis de 95% de confidence e lift, além da fração de reamostragens em que os filtros são satisfeitos. Esse procedimento mede a variação das métricas das regras congeladas, sem redescobri-las. Repetições com denominador inválido não entram nos intervalos; a quantidade de repetições válidas é informada. O procedimento não corrige seleção entre múltiplas regras nem demonstra causalidade.

Separadamente, o módulo [linguistic_stability.py](../../history/mineracao-de-padroes/fp-growth-linguistico/linguistic_stability.py) reamostra os grupos inteiros do **treino**, respeitando pares e duplicatas, em 100 repetições de seed 42. Em cada repetição reaprende os quantis e minera novamente. A frequência de redescoberta usa igualdade dos nomes dos itens e da direção, sem pressupor cortes numéricos ou cobertura idênticos. As variantes recebem a mesma sequência de reamostragens. O notebook verifica a procedência e mostra essa estabilidade junto às métricas fora do treino.

O módulo [linguistic_posthoc.py](../../history/mineracao-de-padroes/fp-growth-linguistico/linguistic_posthoc.py) descreve a composição das regras congeladas por classe, autoria e partição. O lift de composição Fake dessa tabela é distinto do lift de coocorrência. As tabelas são posteriores à descoberta e não selecionam atributos ou regras; os estratos com classe minoritária pequena precisam ser interpretados junto às contagens.

O teste canônico já foi visto em experimentos anteriores. Esta execução é exploratória: sustentação em validação/teste ajuda a auditar a recorrência dos perfis, mas uma confirmação de utilidade preditiva exige dados ainda não usados ou validação externa. Não há F1, acurácia ou ROC-AUC neste experimento não supervisionado. A melhoria implementada é de fidelidade da representação e rastreabilidade; a qualidade empírica das novas associações precisa ser lida nas métricas efetivamente produzidas.
