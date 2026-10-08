# Resultados históricos do FP-Growth linguístico

Histórico preservado. O [modelo principal atual](../../../fp_growth_principal_sem_autoria.ipynb) usa a variante `sintaxe_ampliada`; veja seus [resultados atuais](../../../REGRAS_FP_GROWTH.md).

Execução de 6 de outubro de 2026, com três agentes para extração, mineração e notebook/documentação. **A proposta foi implementada e executada nas 7.200 notícias. A representação linguística produz regras gramaticais recorrentes, mas os resultados não demonstram um detector melhor de fake news.**

Notebook executado: [fp_growth_linguistico_sem_autoria.ipynb](fp_growth_linguistico_sem_autoria.ipynb). Run completo: [`fp-growth-linguistic-20261006T230752Z`](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/run_manifest.json). Os notebooks anteriores e os quatro scripts da equipe foram preservados.

## Comparação das representações

| Variante | Padrões ≥2 itens | Regras brutas | Elegíveis treino | Mantêm filtros validação | Mantêm filtros teste |
|---|---:|---:|---:|---:|---:|
| `legacy_author` | 31 | 82 | 28 | 27 | 28 |
| `legacy_style` | 10 | 20 | 8 | 8 | 8 |
| `legacy_pos` | 65 | 134 | 18 | 13 | 14 |
| `corrected_style` | 5 | 10 | 0 | 0 | 0 |
| `corrected_pos` | 57 | 118 | 10 | 5 | 6 |
| `corrected_pos_dep` | 255 | 802 | 152 | 121 | 120 |
| `corrected_pos_dep_complete` | 273 | 934 | 172 | 138 | 135 |

Padrões são conjuntos de itens; regras são direcionais. Os 31 padrões históricos correspondem a 82 regras brutas e 28 elegíveis, não a 31 regras. Na variante corrigida com POS/DEP há **255 padrões, 802 regras brutas e 152 elegíveis**. Os mesmos filtros foram conservados: suporte ≥0,08, confidence ≥0,50, lift ≥1,05 e Jaccard ≥0,10; tamanho máximo 3.

A mineração usa 4.320 notícias de treino, com limites dos atributos aprendidos somente no treino. Validação e teste têm 1.440 notícias cada; os grupos canônicos mantêm pares Fake/True e duplicatas juntos. Classe não é feature e não decide quais regras são descobertas. Autoria entra exclusivamente na reprodução explícita `legacy_author`.

## O que mudou nas regras anteriores

1. **Retirar autoria:** preserva as 8 regras textuais elegíveis e remove as 20 regras elegíveis que usam autoria. Os padrões caem de 31 para 10; 21 dos padrões originais continham autoria.
2. **Adicionar POS mantendo o estilo antigo:** preserva as 8 regras anteriores e acrescenta 10. Assim, `legacy_pos` isola o efeito de POS, sem confundi-lo com a correção da representação.
3. **Corrigir estilo e retirar TTR:** nenhuma das 8 regras antigas permanece elegível, pois todas usavam TTR. A identidade `typeTokenRatio = diversidade × (1 − punctuationDensity)` foi eliminada da representação. `punctuationDensity_spacy` conta pontuação diretamente, excluindo espaços do denominador; números deixam de ser tratados como pontuação. Existem 5 padrões frequentes em `corrected_style`, mas suas 10 regras brutas não satisfazem todos os filtros.
4. **Adicionar POS ao estilo corrigido:** encontra as mesmas 10 regras POS que foram acrescentadas à versão antiga; 5 mantêm todos os filtros na validação. Portanto, o ganho dessas regras pode ser atribuído ao acréscimo POS, enquanto a remoção das regras TTR decorre da correção da representação.
5. **Adicionar DEP:** preserva as 10 regras de POS e acrescenta 142 elegíveis, totalizando 152. Dessas, 121 mantêm filtros na validação, 120 no teste e 95 satisfazem ambos, além de reaparecerem em ≥80% dos bootstraps de treino. O critério de 80% é um resumo diagnóstico, não um novo filtro de mineração.

A comparação exata de cada regra nova, preservada ou removida está em [rule_comparison.csv](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/rule_comparison.csv). A igualdade exige os mesmos itens e direção; atributos redefinidos não são pareados à força.

## Regras POS extraídas — lista completa das 10 elegíveis

Esta tabela contém a variante `corrected_pos` inteira, incluindo regras que não sustentam os filtros fora do treino. Maiúsculas aqui significa palavras inteiras em caixa alta, não somente inicial maiúscula. `baixo`/`alto` refere-se aos quartis aprendidos no treino; quando `uppercaseRatio_baixo` tem limite zero, significa nenhuma palavra inteira em caixa alta na janela.

| Regra | Ocorrências val. | Support val. | Confidence val. | Lift val. | Confidence teste | Lift teste | Redescoberta treino | Mantém filtros val./teste |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 237 | 16.46% | 68.90% | 1.577 | 63.23% | 1.412 | 100% | sim/sim |
| `POS_ADV_rate_alto → uppercaseRatio_baixo` | 204 | 14.17% | 54.84% | 1.255 | 53.52% | 1.195 | 65% | sim/sim |
| `POS_PRON_rate_alto → uppercaseRatio_baixo` | 202 | 14.03% | 54.30% | 1.243 | 51.48% | 1.149 | 100% | sim/sim |
| `POS_ADJ_rate_alto → uppercaseRatio_baixo` | 187 | 12.99% | 53.43% | 1.223 | 50.00% | 1.116 | 95% | sim/sim |
| `POS_NOUN_rate_alto → uppercaseRatio_baixo` | 182 | 12.64% | 50.98% | 1.167 | 53.45% | 1.193 | 97% | sim/sim |
| `POS_PROPN_rate_baixo → POS_NOUN_rate_alto` | 159 | 11.04% | 46.22% | 1.864 | 48.19% | 2.084 | 89% | não/não |
| `POS_NOUN_rate_alto → POS_PROPN_rate_baixo` | 159 | 11.04% | 44.54% | 1.864 | 51.95% | 2.084 | 81% | não/sim |
| `POS_NOUN_rate_alto + uppercaseRatio_baixo → POS_PROPN_rate_baixo` | 112 | 7.78% | 61.54% | 2.576 | 64.61% | 2.591 | 92% | não/não |
| `POS_PROPN_rate_baixo + uppercaseRatio_baixo → POS_NOUN_rate_alto` | 112 | 7.78% | 47.26% | 1.906 | 50.66% | 2.191 | 74% | não/não |
| `POS_NOUN_rate_alto + POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 112 | 7.78% | 70.44% | 1.613 | 66.47% | 1.484 | 92% | não/não |

As 5 regras POS que passam na validação também passam no teste. Entre elas, `POS_ADV_rate_alto → uppercaseRatio_baixo` tem apenas 65% de redescoberta no treino, apesar de passar nas duas partições. As outras quatro têm redescoberta de 95%–100%. Isso distingue recorrência fora do treino de estabilidade da descoberta.

## Exemplos das novas regras com sintaxe

Os exemplos abaixo foram escolhidos para mostrar associações simples e compostas que mantêm os filtros na validação, sem ordenar por composição Fake/True. As medidas do teste são apenas descrição posterior.

| Regra | Ocorrências val. | Support val. | Confidence val. | Lift val. | Confidence teste | Lift teste | Redescoberta treino | Mantém filtros val./teste |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `POS_ADV_rate_alto → DEP_advmod_rate_alto` | 331 | 22.99% | 88.98% | 3.501 | 85.12% | 3.200 | 100% | sim/sim |
| `POS_ADJ_rate_alto → DEP_amod_rate_alto` | 272 | 18.89% | 77.71% | 2.968 | 76.24% | 2.936 | 100% | sim/sim |
| `POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 237 | 16.46% | 68.90% | 1.577 | 63.23% | 1.412 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + DEP_obj_rate_baixo → POS_VERB_rate_baixo` | 124 | 8.61% | 58.22% | 2.395 | 61.89% | 2.532 | 100% | sim/sim |
| `POS_VERB_rate_baixo → DEP_advcl_rate_baixo + DEP_ccomp_rate_baixo` | 220 | 15.28% | 62.86% | 1.810 | 57.39% | 1.636 | 100% | sim/sim |

Leitura: muitos advérbios coocorrem com muitos modificadores adverbiais; muitos adjetivos coocorrem com muitos modificadores adjetivais; poucos nomes próprios coocorrem com ausência de palavras inteiras em caixa alta; poucas relações de complemento/objeto coocorrem com poucos verbos. **ADV/advmod e ADJ/amod compartilham conteúdo gramatical e anotações dos mesmos tokens.** Seus lifts altos são úteis para auditar perfis e redundância, mas não evidenciam falsidade ou um sinal independente de qualidade textual.

Para `POS_ADV_rate_alto → DEP_advmod_rate_alto`, os limites altos são 4,1667% de advérbios e 4,0816% de modificadores adverbiais. Na validação há 331 ocorrências (22,9861%), confidence 88,98% e lift 3,501. Os intervalos percentis de 95% por grupos são confidence 86,84%–91,30% e lift 3,240–3,778. Essa regra reapareceu nas 100 reamostragens do treino.

## Sensibilidade ao corte de frases

`corrected_pos_dep_complete` conserva os mesmos atributos de estilo/POS e troca DEP por relações das frases previstas que restam após descartar a última frase potencialmente cortada. A janela continua sendo 300 caracteres; não há análise do artigo completo.

A variante encontra 172 regras elegíveis; 138 mantêm os filtros na validação e 135 no teste. As 10 regras sem DEP permanecem idênticas. Há 162 regras com os novos nomes DEP_complete; isso não significa que as 142 anteriores foram refutadas, pois as definições, denominadores e limites mudaram.

Na correspondência conceitual ADV → advmod, a confidence da validação passa de 88,98% para 74,73%, o lift de 3,501 para 3,023 e as ocorrências de 331 para 278. A relação continua forte, mas a magnitude depende da janela. Nos 7.200 textos, 6.988 tiveram a última frase prevista descartada nessa aproximação; 126 ficaram sem tokens lexicais nessa visão e receberam taxa ausente, não zero. Não havia documentos vazios ou sem tokens lexicais na janela original.

## Controles de autoria e classe

Mesmo sem autoria como feature, os perfis podem se relacionar com diferenças de fonte e autoria do corpus. No padrão ADV alto + advmod alto, 62,24% das ocorrências da validação são Fake, com lift de composição Fake 1,245. Ao estratificar por autoria, esse lift cai para 1,013 no grupo com autor e 1,010 no grupo sem autor. O grupo com autor tem somente 17 notícias Fake em 723 notícias; essa composição exige cuidado na interpretação. **Lift gramatical 3,501 e lift de composição Fake 1,245 são métricas de eventos diferentes.** O enriquecimento não demonstrou ganho independente de detecção de fake news.

Tabelas posteriores à descoberta: [composição por padrão/partição/autoria](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/posthoc_pattern_composition.csv) e [distribuições dos atributos](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/posthoc_feature_distributions.csv). São descrições e não testes confirmatórios: o teste canônico já foi usado antes.

## Validação e reprodução

Passaram 14 testes semânticos e a execução das 12 células de código do notebook. As 388 linhas de regras elegíveis nas sete variantes tiveram ocorrências, suporte, confidence, lift e Jaccard recalculados independentemente nas três partições. IDs, grupos, pares, quantis exclusivos do treino, hashes e preservação dos dois notebooks anteriores foram conferidos. Veja [verification.json](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/verification.json).

Há dois procedimentos diferentes com 100 reamostragens de grupos e seed 42: validação com regras/limites congelados para intervalos de métricas; treino com quantis reaprendidos e regras redescobertas para estabilidade. Os grupos de treino são 2.159, incluindo o agrupamento de pares e duplicatas. A taxa de redescoberta compara nomes dos itens e direção; os cortes numéricos podem variar. Veja [manifesto da redescoberta](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/training_bootstrap_manifest.json).

A primeira tentativa, em `fp-growth-linguistic-20261006`, foi interrompida por um erro de combinação de tabelas vazias e está marcada como incompleta. O run válido é exclusivamente o identificado no início deste relatório.

O notebook entregue abre o run concluído por padrão. Para gerar uma nova execução, definir `EXISTING_RUN=None`. As dependências estão em `../requirements-linguistic.txt`; a extração cacheada verifica checksum, esquema, versões e definições. Os quatro scripts da equipe foram aproveitados como proposta, sem importar seus efeitos de download/execução automática. A [prévia de 12 notícias do treino](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/annotation_preview.md) oferece tokens/anotações para revisão humana; ela não constitui referência linguística validada manualmente.

**Uso recomendado:** conservar o baseline histórico para comparação, usar a variante corrigida POS para perfis gramaticais simples, e usar POS+DEP para exploração e auditoria de redundância, examinando sempre a sensibilidade ao corte. A fidelidade melhorou na unidade por notícia, nas definições e na rastreabilidade. A utilidade para prever veracidade continua não demonstrada.

## Todas as regras elegíveis de POS+DEP

A lista abaixo contém as 152 regras elegíveis em `corrected_pos_dep`, ordenadas por suporte e confidence na validação, incluindo as que falharam fora do treino. As [802 regras brutas](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/corrected_pos_dep/association_rules.csv) e as [métricas completas com intervalos](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/corrected_pos_dep/rule_metrics.csv) permanecem nos CSVs. Para a variante de frases, consulte [as 172 regras elegíveis](../../../../outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/corrected_pos_dep_complete/rule_metrics.csv).

| Regra | Ocorrências val. | Support val. | Confidence val. | Lift val. | Confidence teste | Lift teste | Redescoberta treino | Mantém filtros val./teste |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 416 | 28.89% | 95.85% | 2.882 | 96.16% | 2.843 | 100% | sim/sim |
| `DEP_advmod_rate_baixo → POS_ADV_rate_baixo` | 416 | 28.89% | 86.85% | 2.882 | 87.47% | 2.843 | 100% | sim/sim |
| `DEP_advmod_rate_alto → POS_ADV_rate_alto` | 331 | 22.99% | 90.44% | 3.501 | 85.12% | 3.200 | 100% | sim/sim |
| `POS_ADV_rate_alto → DEP_advmod_rate_alto` | 331 | 22.99% | 88.98% | 3.501 | 85.12% | 3.200 | 100% | sim/sim |
| `DEP_amod_rate_baixo → POS_ADJ_rate_baixo` | 299 | 20.76% | 74.19% | 2.619 | 75.14% | 2.855 | 100% | sim/sim |
| `POS_ADJ_rate_baixo → DEP_amod_rate_baixo` | 299 | 20.76% | 73.28% | 2.619 | 69.39% | 2.855 | 100% | sim/sim |
| `DEP_advmod_rate_baixo → DEP_advcl_rate_baixo` | 295 | 20.49% | 61.59% | 1.065 | 64.48% | 1.083 | 95% | sim/sim |
| `DEP_nsubj_rate_baixo → DEP_ccomp_rate_baixo` | 294 | 20.42% | 76.56% | 1.299 | 76.32% | 1.305 | 100% | sim/sim |
| `POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 281 | 19.51% | 80.29% | 1.362 | 79.83% | 1.365 | 100% | sim/sim |
| `POS_PRON_rate_baixo → DEP_ccomp_rate_baixo` | 281 | 19.51% | 61.49% | 1.043 | 60.83% | 1.040 | 50% | não/não |
| `POS_ADJ_rate_alto → DEP_amod_rate_alto` | 272 | 18.89% | 77.71% | 2.968 | 76.24% | 2.936 | 100% | sim/sim |
| `POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 272 | 18.89% | 77.71% | 1.343 | 74.15% | 1.246 | 100% | sim/sim |
| `DEP_amod_rate_alto → POS_ADJ_rate_alto` | 272 | 18.89% | 72.15% | 2.968 | 73.80% | 2.936 | 100% | sim/sim |
| `POS_ADV_rate_baixo → DEP_advcl_rate_baixo` | 269 | 18.68% | 61.98% | 1.071 | 66.37% | 1.115 | 99% | sim/sim |
| `DEP_advcl_rate_baixo + POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 259 | 17.99% | 96.28% | 2.895 | 97.28% | 2.876 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_advmod_rate_baixo → POS_ADV_rate_baixo` | 259 | 17.99% | 87.80% | 2.913 | 91.08% | 2.961 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + POS_ADV_rate_baixo → DEP_advcl_rate_baixo` | 259 | 17.99% | 62.26% | 1.076 | 67.14% | 1.128 | 100% | sim/sim |
| `POS_ADV_rate_baixo → DEP_advcl_rate_baixo + DEP_advmod_rate_baixo` | 259 | 17.99% | 59.68% | 2.913 | 64.56% | 2.961 | 100% | sim/sim |
| `DEP_advmod_rate_baixo → DEP_advcl_rate_baixo + POS_ADV_rate_baixo` | 259 | 17.99% | 54.07% | 2.895 | 58.73% | 2.876 | 100% | sim/sim |
| `POS_PROPN_rate_alto → DEP_advcl_rate_baixo` | 253 | 17.57% | 69.89% | 1.208 | 64.64% | 1.086 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 252 | 17.50% | 95.45% | 2.870 | 95.27% | 2.817 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + DEP_ccomp_rate_baixo → POS_ADV_rate_baixo` | 252 | 17.50% | 86.90% | 2.883 | 88.51% | 2.877 | 100% | sim/sim |
| `POS_ADV_rate_baixo → DEP_advmod_rate_baixo + DEP_ccomp_rate_baixo` | 252 | 17.50% | 58.06% | 2.883 | 59.14% | 2.877 | 100% | sim/sim |
| `DEP_advmod_rate_baixo → DEP_ccomp_rate_baixo + POS_ADV_rate_baixo` | 252 | 17.50% | 52.61% | 2.870 | 53.80% | 2.817 | 100% | sim/sim |
| `DEP_obj_rate_baixo → DEP_advcl_rate_baixo` | 251 | 17.43% | 71.92% | 1.243 | 68.70% | 1.154 | 100% | sim/sim |
| `DEP_amod_rate_alto → DEP_ccomp_rate_baixo` | 251 | 17.43% | 66.58% | 1.129 | 64.97% | 1.111 | 100% | sim/sim |
| `POS_NOUN_rate_alto → DEP_ccomp_rate_baixo` | 239 | 16.60% | 66.95% | 1.135 | 69.97% | 1.197 | 100% | sim/sim |
| `POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 237 | 16.46% | 68.90% | 1.577 | 63.23% | 1.412 | 100% | sim/sim |
| `POS_ADJ_rate_alto → DEP_ccomp_rate_baixo` | 228 | 15.83% | 65.14% | 1.105 | 64.09% | 1.096 | 99% | sim/sim |
| `diversidade_baixo → DEP_advcl_rate_baixo` | 225 | 15.62% | 63.56% | 1.099 | 63.58% | 1.068 | 98% | sim/sim |
| `POS_NOUN_rate_alto → DEP_advcl_rate_baixo` | 224 | 15.56% | 62.75% | 1.085 | 71.17% | 1.196 | 92% | sim/sim |
| `POS_PROPN_rate_alto → DEP_ccomp_rate_baixo` | 223 | 15.49% | 61.60% | 1.045 | 61.05% | 1.044 | 90% | não/não |
| `DEP_advcl_rate_baixo + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 220 | 15.28% | 80.88% | 1.372 | 77.39% | 1.324 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 220 | 15.28% | 78.29% | 1.353 | 71.89% | 1.208 | 100% | sim/sim |
| `POS_VERB_rate_baixo → DEP_advcl_rate_baixo + DEP_ccomp_rate_baixo` | 220 | 15.28% | 62.86% | 1.810 | 57.39% | 1.636 | 100% | sim/sim |
| `DEP_advmod_rate_alto → uppercaseRatio_baixo` | 205 | 14.24% | 56.01% | 1.282 | 52.74% | 1.177 | 87% | sim/sim |
| `diversidade_alto → DEP_ccomp_rate_baixo` | 205 | 14.24% | 53.66% | 0.910 | 63.99% | 1.094 | 50% | não/sim |
| `POS_ADV_rate_alto → uppercaseRatio_baixo` | 204 | 14.17% | 54.84% | 1.255 | 53.52% | 1.195 | 65% | sim/sim |
| `POS_PRON_rate_alto → uppercaseRatio_baixo` | 202 | 14.03% | 54.30% | 1.243 | 51.48% | 1.149 | 100% | sim/sim |
| `DEP_amod_rate_alto → uppercaseRatio_baixo` | 190 | 13.19% | 50.40% | 1.154 | 51.34% | 1.146 | 92% | sim/sim |
| `POS_ADV_rate_alto + uppercaseRatio_baixo → DEP_advmod_rate_alto` | 187 | 12.99% | 91.67% | 3.607 | 86.83% | 3.265 | 100% | sim/sim |
| `DEP_advmod_rate_alto + uppercaseRatio_baixo → POS_ADV_rate_alto` | 187 | 12.99% | 91.22% | 3.531 | 88.12% | 3.313 | 100% | sim/sim |
| `DEP_advmod_rate_alto + POS_ADV_rate_alto → uppercaseRatio_baixo` | 187 | 12.99% | 56.50% | 1.293 | 54.60% | 1.219 | 88% | sim/sim |
| `POS_ADJ_rate_alto → uppercaseRatio_baixo` | 187 | 12.99% | 53.43% | 1.223 | 50.00% | 1.116 | 95% | sim/sim |
| `DEP_advmod_rate_baixo + DEP_ccomp_rate_baixo → DEP_advcl_rate_baixo` | 184 | 12.78% | 63.45% | 1.097 | 65.20% | 1.096 | 97% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_advmod_rate_baixo → DEP_ccomp_rate_baixo` | 184 | 12.78% | 62.37% | 1.058 | 61.46% | 1.051 | 60% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_ADJ_rate_alto → DEP_amod_rate_alto` | 182 | 12.64% | 79.82% | 3.049 | 79.31% | 3.054 | 100% | sim/sim |
| `DEP_amod_rate_alto + DEP_ccomp_rate_baixo → POS_ADJ_rate_alto` | 182 | 12.64% | 72.51% | 2.983 | 75.72% | 3.012 | 100% | sim/sim |
| `DEP_amod_rate_alto + POS_ADJ_rate_alto → DEP_ccomp_rate_baixo` | 182 | 12.64% | 66.91% | 1.135 | 66.67% | 1.140 | 100% | sim/sim |
| `POS_ADJ_rate_alto → DEP_amod_rate_alto + DEP_ccomp_rate_baixo` | 182 | 12.64% | 52.00% | 2.983 | 50.83% | 3.012 | 62% | sim/sim |
| `POS_NOUN_rate_alto → uppercaseRatio_baixo` | 182 | 12.64% | 50.98% | 1.167 | 53.45% | 1.193 | 97% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_nsubj_rate_baixo → DEP_ccomp_rate_baixo` | 179 | 12.43% | 80.27% | 1.361 | 77.34% | 1.323 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + POS_PRON_rate_baixo → DEP_ccomp_rate_baixo` | 178 | 12.36% | 62.46% | 1.059 | 60.36% | 1.032 | 65% | sim/não |
| `DEP_nsubj_rate_baixo → POS_PRON_rate_baixo` | 177 | 12.29% | 46.09% | 1.452 | 47.66% | 1.581 | 65% | não/não |
| `DEP_advmod_rate_alto + DEP_ccomp_rate_baixo → POS_ADV_rate_alto` | 176 | 12.22% | 88.44% | 3.424 | 86.36% | 3.247 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_ADV_rate_alto → DEP_advmod_rate_alto` | 176 | 12.22% | 85.85% | 3.378 | 82.61% | 3.106 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_advmod_rate_alto → POS_ADV_rate_alto` | 173 | 12.01% | 93.01% | 3.600 | 86.57% | 3.255 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + POS_ADV_rate_alto → DEP_advmod_rate_alto` | 173 | 12.01% | 89.18% | 3.509 | 85.71% | 3.223 | 100% | sim/sim |
| `DEP_amod_rate_baixo + DEP_ccomp_rate_baixo → POS_ADJ_rate_baixo` | 172 | 11.94% | 76.79% | 2.710 | 73.16% | 2.780 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_ADJ_rate_baixo → DEP_amod_rate_baixo` | 172 | 11.94% | 73.50% | 2.626 | 66.83% | 2.749 | 100% | sim/sim |
| `POS_ADV_rate_baixo + POS_PRON_rate_baixo → DEP_advmod_rate_baixo` | 171 | 11.88% | 99.42% | 2.989 | 96.77% | 2.861 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + POS_PRON_rate_baixo → POS_ADV_rate_baixo` | 171 | 11.88% | 90.48% | 3.002 | 89.29% | 2.902 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_amod_rate_baixo → POS_ADJ_rate_baixo` | 170 | 11.81% | 76.58% | 2.703 | 74.62% | 2.835 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + POS_ADJ_rate_baixo → DEP_amod_rate_baixo` | 170 | 11.81% | 72.96% | 2.607 | 69.01% | 2.839 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_PROPN_rate_alto → DEP_advcl_rate_baixo` | 169 | 11.74% | 75.78% | 1.310 | 67.42% | 1.133 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + POS_PROPN_rate_alto → DEP_ccomp_rate_baixo` | 169 | 11.74% | 66.80% | 1.133 | 63.68% | 1.089 | 94% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_ADV_rate_baixo → DEP_advcl_rate_baixo` | 168 | 11.67% | 63.64% | 1.100 | 67.64% | 1.136 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + POS_ADV_rate_baixo → DEP_ccomp_rate_baixo` | 168 | 11.67% | 62.45% | 1.059 | 63.27% | 1.082 | 71% | sim/sim |
| `DEP_advcl_rate_baixo + POS_ADJ_rate_alto → DEP_amod_rate_alto` | 167 | 11.60% | 80.29% | 3.067 | 82.59% | 3.180 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_amod_rate_alto → POS_ADJ_rate_alto` | 167 | 11.60% | 75.23% | 3.095 | 75.51% | 3.004 | 100% | sim/sim |
| `DEP_amod_rate_alto + POS_ADJ_rate_alto → DEP_advcl_rate_baixo` | 167 | 11.60% | 61.40% | 1.061 | 67.03% | 1.126 | 54% | sim/sim |
| `POS_PROPN_rate_baixo → POS_NOUN_rate_alto` | 159 | 11.04% | 46.22% | 1.864 | 48.19% | 2.084 | 89% | não/não |
| `POS_NOUN_rate_alto → POS_PROPN_rate_baixo` | 159 | 11.04% | 44.54% | 1.864 | 51.95% | 2.084 | 81% | não/sim |
| `DEP_ccomp_rate_baixo + DEP_obj_rate_baixo → DEP_advcl_rate_baixo` | 158 | 10.97% | 74.18% | 1.282 | 66.39% | 1.116 | 100% | sim/sim |
| `POS_ADV_rate_baixo + uppercaseRatio_baixo → DEP_advmod_rate_baixo` | 153 | 10.62% | 93.87% | 2.822 | 96.72% | 2.860 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + uppercaseRatio_baixo → POS_ADV_rate_baixo` | 153 | 10.62% | 87.93% | 2.918 | 84.29% | 2.740 | 100% | sim/sim |
| `POS_ADV_rate_baixo + POS_PROPN_rate_alto → DEP_advmod_rate_baixo` | 152 | 10.56% | 97.44% | 2.929 | 96.36% | 2.849 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + POS_PROPN_rate_alto → POS_ADV_rate_baixo` | 152 | 10.56% | 86.36% | 2.866 | 88.83% | 2.887 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 152 | 10.56% | 70.70% | 1.619 | 63.11% | 1.409 | 100% | sim/sim |
| `DEP_nsubj_rate_baixo + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 150 | 10.42% | 90.91% | 1.542 | 89.93% | 1.538 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + diversidade_baixo → DEP_advcl_rate_baixo` | 150 | 10.42% | 64.66% | 1.118 | 66.67% | 1.120 | 94% | sim/sim |
| `DEP_ccomp_rate_baixo + DEP_nsubj_rate_baixo → POS_VERB_rate_baixo` | 150 | 10.42% | 51.02% | 2.099 | 51.34% | 2.100 | 48% | sim/sim |
| `DEP_advcl_rate_baixo + POS_NOUN_rate_alto → DEP_ccomp_rate_baixo` | 148 | 10.28% | 66.07% | 1.121 | 69.20% | 1.183 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_NOUN_rate_alto → DEP_advcl_rate_baixo` | 148 | 10.28% | 61.92% | 1.070 | 70.39% | 1.183 | 92% | sim/sim |
| `POS_ADJ_rate_alto + uppercaseRatio_baixo → DEP_amod_rate_alto` | 147 | 10.21% | 78.61% | 3.003 | 79.56% | 3.063 | 100% | sim/sim |
| `DEP_amod_rate_alto + uppercaseRatio_baixo → POS_ADJ_rate_alto` | 147 | 10.21% | 77.37% | 3.183 | 75.00% | 2.983 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_amod_rate_alto → DEP_ccomp_rate_baixo` | 147 | 10.21% | 66.22% | 1.123 | 63.67% | 1.089 | 97% | sim/sim |
| `DEP_amod_rate_alto + POS_ADJ_rate_alto → uppercaseRatio_baixo` | 147 | 10.21% | 54.04% | 1.237 | 52.17% | 1.165 | 97% | sim/sim |
| `POS_ADV_rate_baixo + POS_NOUN_rate_alto → DEP_advmod_rate_baixo` | 143 | 9.93% | 96.62% | 2.905 | 96.67% | 2.858 | 99% | sim/sim |
| `DEP_advmod_rate_baixo + POS_NOUN_rate_alto → POS_ADV_rate_baixo` | 143 | 9.93% | 89.94% | 2.984 | 92.06% | 2.993 | 99% | sim/sim |
| `POS_ADV_rate_baixo + uppercaseRatio_alto → DEP_advmod_rate_baixo` | 138 | 9.58% | 99.28% | 2.985 | 94.07% | 2.781 | 91% | sim/não |
| `DEP_advmod_rate_baixo + uppercaseRatio_alto → POS_ADV_rate_baixo` | 138 | 9.58% | 86.25% | 2.862 | 90.98% | 2.957 | 91% | sim/não |
| `DEP_advcl_rate_baixo + POS_ADJ_rate_alto → DEP_ccomp_rate_baixo` | 138 | 9.58% | 66.35% | 1.125 | 66.07% | 1.130 | 94% | sim/sim |
| `DEP_nsubj_rate_baixo + POS_PRON_rate_baixo → DEP_ccomp_rate_baixo` | 134 | 9.31% | 75.71% | 1.284 | 80.98% | 1.385 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + DEP_nsubj_rate_baixo → POS_PRON_rate_baixo` | 134 | 9.31% | 45.58% | 1.436 | 50.57% | 1.678 | 82% | não/sim |
| `DEP_obj_rate_baixo + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 133 | 9.24% | 82.61% | 1.428 | 75.51% | 1.269 | 100% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_obj_rate_baixo → POS_VERB_rate_baixo` | 133 | 9.24% | 52.99% | 2.180 | 54.81% | 2.242 | 96% | sim/sim |
| `POS_ADV_rate_alto + POS_PROPN_rate_baixo → DEP_advmod_rate_alto` | 132 | 9.17% | 94.29% | 3.710 | 88.65% | 3.333 | 75% | sim/sim |
| `DEP_advmod_rate_alto + POS_PROPN_rate_baixo → POS_ADV_rate_alto` | 132 | 9.17% | 90.41% | 3.500 | 92.59% | 3.481 | 75% | sim/sim |
| `DEP_nsubj_rate_baixo + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 131 | 9.10% | 81.88% | 1.389 | 74.19% | 1.269 | 94% | sim/não |
| `DEP_amod_rate_alto + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 131 | 9.10% | 68.95% | 1.169 | 66.15% | 1.131 | 99% | sim/sim |
| `DEP_amod_rate_alto + DEP_ccomp_rate_baixo → uppercaseRatio_baixo` | 131 | 9.10% | 52.19% | 1.195 | 52.26% | 1.167 | 98% | sim/sim |
| `DEP_nsubj_rate_baixo + POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 129 | 8.96% | 97.73% | 2.938 | 96.58% | 2.856 | 76% | sim/não |
| `DEP_advmod_rate_baixo + DEP_nsubj_rate_baixo → POS_ADV_rate_baixo` | 129 | 8.96% | 86.58% | 2.873 | 90.40% | 2.939 | 76% | sim/não |
| `DEP_advcl_rate_baixo + POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 127 | 8.82% | 71.35% | 1.633 | 63.55% | 1.419 | 94% | sim/sim |
| `POS_NOUN_rate_alto + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 127 | 8.82% | 69.78% | 1.184 | 71.91% | 1.230 | 97% | sim/sim |
| `POS_ADJ_rate_alto + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 127 | 8.82% | 67.91% | 1.152 | 66.85% | 1.143 | 100% | sim/sim |
| `DEP_advmod_rate_baixo + POS_PRON_rate_baixo → DEP_advcl_rate_baixo` | 127 | 8.82% | 67.20% | 1.162 | 62.50% | 1.050 | 73% | sim/não |
| `DEP_ccomp_rate_baixo + POS_ADJ_rate_alto → uppercaseRatio_baixo` | 127 | 8.82% | 55.70% | 1.275 | 52.16% | 1.164 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + POS_NOUN_rate_alto → uppercaseRatio_baixo` | 127 | 8.82% | 53.14% | 1.217 | 54.94% | 1.226 | 80% | sim/sim |
| `POS_ADV_rate_baixo + POS_VERB_rate_baixo → DEP_advmod_rate_baixo` | 126 | 8.75% | 98.44% | 2.959 | 95.12% | 2.813 | 98% | sim/sim |
| `DEP_advmod_rate_baixo + POS_VERB_rate_baixo → POS_ADV_rate_baixo` | 126 | 8.75% | 87.50% | 2.903 | 88.64% | 2.881 | 98% | sim/sim |
| `DEP_nsubj_rate_baixo + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 126 | 8.75% | 76.36% | 1.320 | 71.14% | 1.195 | 80% | sim/não |
| `DEP_advcl_rate_baixo + DEP_nsubj_rate_baixo → POS_VERB_rate_baixo` | 126 | 8.75% | 56.50% | 2.325 | 52.22% | 2.136 | 80% | sim/não |
| `POS_ADV_rate_alto + POS_PRON_rate_alto → DEP_advmod_rate_alto` | 125 | 8.68% | 94.70% | 3.726 | 89.63% | 3.370 | 66% | sim/sim |
| `DEP_advmod_rate_alto + POS_PRON_rate_alto → POS_ADV_rate_alto` | 125 | 8.68% | 89.93% | 3.481 | 84.62% | 3.181 | 66% | sim/sim |
| `DEP_obj_rate_baixo + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 124 | 8.61% | 77.02% | 1.306 | 77.04% | 1.318 | 100% | sim/sim |
| `DEP_ccomp_rate_baixo + DEP_obj_rate_baixo → POS_VERB_rate_baixo` | 124 | 8.61% | 58.22% | 2.395 | 61.89% | 2.532 | 100% | sim/sim |
| `POS_ADV_rate_baixo + diversidade_baixo → DEP_advmod_rate_baixo` | 123 | 8.54% | 96.85% | 2.912 | 97.60% | 2.886 | 91% | sim/sim |
| `DEP_advmod_rate_baixo + diversidade_baixo → POS_ADV_rate_baixo` | 123 | 8.54% | 89.13% | 2.957 | 90.37% | 2.938 | 91% | sim/sim |
| `POS_VERB_rate_baixo + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 122 | 8.47% | 84.14% | 1.427 | 82.12% | 1.404 | 97% | sim/sim |
| `DEP_advmod_rate_baixo + POS_PROPN_rate_alto → DEP_advcl_rate_baixo` | 122 | 8.47% | 69.32% | 1.198 | 68.16% | 1.145 | 70% | sim/sim |
| `DEP_advcl_rate_baixo + DEP_amod_rate_alto → uppercaseRatio_baixo` | 121 | 8.40% | 54.50% | 1.248 | 54.29% | 1.212 | 33% | sim/sim |
| `DEP_obj_rate_alto + POS_ADV_rate_baixo → DEP_advmod_rate_baixo` | 119 | 8.26% | 95.97% | 2.885 | 96.52% | 2.854 | 71% | sim/não |
| `DEP_advmod_rate_baixo + DEP_obj_rate_alto → POS_ADV_rate_baixo` | 119 | 8.26% | 89.47% | 2.969 | 83.46% | 2.713 | 71% | sim/não |
| `POS_PRON_rate_baixo + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 119 | 8.26% | 80.41% | 1.364 | 79.43% | 1.358 | 100% | sim/não |
| `DEP_advcl_rate_baixo + punctuationDensity_spacy_baixo → DEP_ccomp_rate_baixo` | 119 | 8.26% | 58.62% | 0.994 | 62.69% | 1.072 | 72% | não/sim |
| `POS_PROPN_rate_alto + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 118 | 8.19% | 84.89% | 1.468 | 78.46% | 1.318 | 75% | sim/não |
| `DEP_advcl_rate_baixo + POS_PROPN_rate_alto → POS_VERB_rate_baixo` | 118 | 8.19% | 46.64% | 1.919 | 43.59% | 1.783 | 33% | não/não |
| `DEP_advmod_rate_baixo + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 117 | 8.12% | 81.25% | 1.378 | 83.33% | 1.425 | 82% | sim/não |
| `DEP_advmod_rate_baixo + POS_PRON_rate_baixo → DEP_ccomp_rate_baixo` | 117 | 8.12% | 61.90% | 1.050 | 62.50% | 1.069 | 60% | não/não |
| `DEP_advmod_rate_baixo + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 115 | 7.99% | 79.86% | 1.381 | 75.00% | 1.260 | 69% | não/não |
| `POS_ADV_rate_baixo + punctuationDensity_spacy_baixo → DEP_advmod_rate_baixo` | 114 | 7.92% | 95.80% | 2.880 | 95.00% | 2.809 | 84% | não/não |
| `DEP_advmod_rate_baixo + punctuationDensity_spacy_baixo → POS_ADV_rate_baixo` | 114 | 7.92% | 88.37% | 2.932 | 89.76% | 2.918 | 84% | não/não |
| `POS_VERB_rate_baixo + uppercaseRatio_baixo → DEP_advcl_rate_baixo` | 114 | 7.92% | 78.62% | 1.359 | 75.50% | 1.269 | 55% | não/não |
| `POS_PRON_rate_baixo + POS_VERB_rate_baixo → DEP_advcl_rate_baixo` | 114 | 7.92% | 77.03% | 1.332 | 77.30% | 1.299 | 99% | não/não |
| `POS_NOUN_rate_alto + POS_PROPN_rate_baixo → uppercaseRatio_baixo` | 112 | 7.78% | 70.44% | 1.613 | 66.47% | 1.484 | 92% | não/não |
| `POS_PRON_rate_baixo + uppercaseRatio_baixo → DEP_ccomp_rate_baixo` | 112 | 7.78% | 62.57% | 1.061 | 64.29% | 1.099 | 53% | não/não |
| `POS_NOUN_rate_alto + uppercaseRatio_baixo → POS_PROPN_rate_baixo` | 112 | 7.78% | 61.54% | 2.576 | 64.61% | 2.591 | 92% | não/não |
| `POS_PROPN_rate_baixo + uppercaseRatio_baixo → POS_NOUN_rate_alto` | 112 | 7.78% | 47.26% | 1.906 | 50.66% | 2.191 | 74% | não/não |
| `DEP_ccomp_rate_baixo + POS_PRON_rate_alto → uppercaseRatio_baixo` | 111 | 7.71% | 56.92% | 1.303 | 50.22% | 1.121 | 67% | não/não |
| `DEP_advcl_rate_baixo + POS_NOUN_rate_alto → uppercaseRatio_baixo` | 109 | 7.57% | 48.66% | 1.114 | 51.05% | 1.140 | 59% | não/sim |
| `POS_PROPN_rate_alto + POS_VERB_rate_baixo → DEP_ccomp_rate_baixo` | 108 | 7.50% | 77.70% | 1.318 | 83.08% | 1.421 | 70% | não/não |
| `DEP_ccomp_rate_baixo + POS_PROPN_rate_alto → POS_VERB_rate_baixo` | 108 | 7.50% | 48.43% | 1.993 | 48.87% | 1.999 | 50% | não/não |
| `DEP_advmod_rate_alto + punctuationDensity_spacy_alto → POS_ADV_rate_alto` | 106 | 7.36% | 92.17% | 3.568 | 87.50% | 3.290 | 37% | não/sim |
| `POS_ADV_rate_alto + punctuationDensity_spacy_alto → DEP_advmod_rate_alto` | 106 | 7.36% | 89.08% | 3.505 | 85.61% | 3.219 | 37% | não/sim |
| `DEP_advmod_rate_alto + POS_NOUN_rate_baixo → POS_ADV_rate_alto` | 104 | 7.22% | 90.43% | 3.501 | 82.76% | 3.112 | 63% | não/sim |
| `POS_ADV_rate_alto + POS_NOUN_rate_baixo → DEP_advmod_rate_alto` | 104 | 7.22% | 85.95% | 3.382 | 85.11% | 3.200 | 63% | não/sim |
| `POS_NOUN_rate_alto + POS_PROPN_rate_baixo → DEP_ccomp_rate_baixo` | 104 | 7.22% | 65.41% | 1.109 | 70.52% | 1.206 | 100% | não/sim |
| `DEP_ccomp_rate_baixo + POS_PROPN_rate_baixo → POS_NOUN_rate_alto` | 104 | 7.22% | 48.37% | 1.951 | 54.22% | 2.345 | 100% | não/sim |
| `DEP_ccomp_rate_baixo + POS_NOUN_rate_alto → POS_PROPN_rate_baixo` | 104 | 7.22% | 43.51% | 1.822 | 52.36% | 2.100 | 78% | não/sim |
| `DEP_advcl_rate_baixo + diversidade_alto → DEP_ccomp_rate_baixo` | 102 | 7.08% | 52.31% | 0.887 | 66.81% | 1.143 | 62% | não/sim |
