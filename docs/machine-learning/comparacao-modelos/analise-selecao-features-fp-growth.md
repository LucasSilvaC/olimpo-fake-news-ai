# Análise da seleção de features para o FP-Growth

Análise realizada em 7 de outubro de 2026. Referência de produto: [`teste.md`](../../../../teste.md), no workspace Eldorado. Escopo: auditoria dos dados atuais e recomendação experimental. Os modelos, CSVs de entrada e comportamento do aplicativo foram preservados.

## Conclusão

O FP-Growth pode evoluir, mas `dataset_selecionado.csv` não deve substituir diretamente os dados do modelo. A seleção atual busca diferenças individuais entre Fake e True em textos completos. O produto do `teste.md` precisa de combinações linguísticas observáveis, reproduzíveis e úteis para reflexão numa janela de 300 caracteres.

O algoritmo de mineração e a infraestrutura linguística existente podem ser reaproveitados. As prioridades são corrigir a compatibilidade dos dados, separar artefatos de formatação, preservar atributos úteis em combinações e avaliar a contribuição de novas famílias de features. Aumento de quantidade de regras, AUC individual ou pureza Fake não demonstram ganho para o produto.

## Arquivos examinados e integridade

| Artefato | Conteúdo verificado | Uso recomendado |
|---|---|---|
| `saida_features/dataset_features.csv` | 7.200 linhas, texto, label, n_tokens e 54 atributos POS/DEP | Fonte completa de candidatos e auditoria das definições |
| `selecao/dataset_filtrado.csv` | 7.200 linhas e 34 colunas: label, texto, conjunto e 31 features | Inspeção dos textos e das features selecionadas |
| `selecao/dataset_selecionado.csv` | 7.200 linhas e 34 colunas: label, conjunto, n_tokens e as mesmas 31 features | Auditoria numérica. Não contém texto nem IDs canônicos |
| `selecao/features_selecionadas.csv` | Lista das 31 features mantidas | Resultado da seleção supervisionada atual |
| `selecao/relatorio_features.csv` | 54 atributos avaliados, 31 mantidos e 23 removidos | Explica AUC, relevância, significância e redundância |
| `selecao/divisao_treino_teste.csv` | Posição da linha e conjunto de destino | Reconstrução do experimento atual, sem misturar protocolos |
| `selecao/relevancia_features.png` | Gráfico inspecionado. Ordenação coerente com o relatório | Visualiza discriminação individual por classe |

As colunas compartilhadas dos dois datasets são exatamente iguais, inclusive label, conjunto e valores das 31 features. Os textos e valores também correspondem ao CSV original. Não há ausências no dataset selecionado. Recalcular as AUCs no treino reproduziu o relatório com diferença máxima de 0,000000499, compatível com exportação em seis casas.

Os 7.200 textos correspondem exatamente aos arquivos locais de `Fake.br-Corpus-master/full_texts`, preservando bytes de texto decodificados em UTF-8, inclusive CRLF. Duas linhas são textos duplicados da mesma classe e têm identidade ambígua usando apenas hash. A ordem ordenada de arquivos usada pelo extrator foi conferida contra o conteúdo de todas as linhas e permitiu recuperar seus IDs. Um join só por texto perderia essa distinção.

Todos os IDs recuperados existem no run linguístico de referência. Os comprimentos brutos e a presença de autoria coincidem com seu cache em todos os registros. Isso aponta para uma mudança de representação/seleção do corpus conhecido. O ZIP congelado não está disponível nesta cópia do workspace, portanto seu hash de arquivo não foi revalidado nesta auditoria.

## Por que os novos CSVs não são uma entrada intercambiável

### Janela e denominadores

O baseline [`fp_growth_baseline_com_autoria.ipynb`](../../../machine-learning/unsupervised-learning/history/mineracao-de-padroes/fp-growth-legado/fp_growth_baseline_com_autoria.ipynb) lê o corpus congelado e calcula seis medidas, incluindo autoria, nos primeiros 300 caracteres após NFKC e remoção de BOM inicial. Ele não lê os CSVs de seleção.

O extrator atual [`metadados/extracao_funcoes.py`](../../../machine-learning/metadados/extracao_funcoes.py) processa textos completos e divide contagens POS/DEP por `len(doc)`. Esse total inclui espaços adicionais e pontuação. A soma das taxas POS, separadamente da soma DEP, é aproximadamente 1 em todos os documentos, confirmando a normalização por todos os tokens.

Na variante `corrected_pos_dep` do run de 6 de outubro, POS/DEP usam tokens sem espaço e sem pontuação. Pontuação usa tokens sem espaço. São medidas distintas, mesmo quando a etiqueta gramatical tem o mesmo nome. Converter taxas completas para denominadores lexicais não reconstrói a anotação dos primeiros 300 caracteres.

7.101 textos excedem 300 caracteres. As medianas de comprimento são 5.581 caracteres nas True e 956,5 nas Fake. As medianas de tokens completos são 1.062 e 189. Portanto, trocar o recorte pelo documento completo também muda a exposição ao comprimento e à estrutura editorial.

A correlação de Spearman entre as taxas completas atuais e as taxas lexicais do recorte antigo variou de aproximadamente 0,44 a 0,57 nas seis tags POS compartilhadas. Essa comparação muda simultaneamente janela e denominador. Não permite atribuir a diferença a um único fator, mas evidencia que as representações não são equivalentes.

### Partições

A seleção atual usa 5.760 notícias de treino, 2.880 por classe, e 1.440 de teste, 720 por classe. Não há partição própria de validação. O código seleciona features apenas no treino, o que está correto dentro desse desenho.

Contudo, sua amostragem estratificada por classe não preserva pares/grupos. Dos 3.600 pares Fake/True, **1.140 foram separados entre treino e teste**, correspondendo a 31,7%. Não foram encontrados textos exatamente duplicados atravessando essa divisão, mas notícias pareadas compartilham informações e não devem ser tratadas como observações independentes.

| Partição da seleção atual | Treino canônico | Validação canônica | Teste canônico |
|---|---:|---:|---:|
| Treino | 3.454 | 1.163 | 1.143 |
| Teste | 866 | 277 | 297 |

Assim, 2.306 notícias que pertenciam à validação/teste canônicos participaram da seleção atual. Não se pode selecionar features nessa divisão e depois apresentar a avaliação canônica antiga como independente dessa seleção. Para comparar variantes, usar os mesmos IDs e grupos de treino/validação/teste e reaprender toda seleção exclusivamente no treino correspondente. O teste canônico já observado continua exploratório.

## O ranking atual favorece sinais que exigem revisão

### POS_SPACE

`POS_SPACE` lidera com AUC Fake 0,930681 no treino e 0,930551 no teste da seleção. A feature mede tokens de whitespace do tokenizer, não todos os espaços entre palavras. Sua taxa média é 0,39% nas True e 2,99% nas Fake. A taxa inclui efeitos de formatação e um denominador influenciado pelo tamanho do texto.

Reextraí 16 notícias, oito por classe, com spaCy 3.8.16 e modelo português 3.8.0. As 31 features originais foram reproduzidas com erro máximo inferior a 1×10⁻¹⁶. Ao substituir sequências de whitespace por um espaço comum e remover espaços das extremidades, `POS_SPACE` ficou zero nas 16 notícias. A taxa de ROOT também mudou em todas elas. Isso demonstra sensibilidade à transformação da entrada nessa amostra, sem estabelecer a causa de todas as diferenças de classe.

Recomendação: manter `POS_SPACE` como diagnóstico de entrada/formatação e excluí-la da descoberta principal de insights. Auditar também `DEP_dep` e `POS_SYM`. A implementação supervisionada existente, [`metadados_spacy.py`](../../../machine-learning/supervised-learning/support/metadados_spacy.py), já separa SPACE e `dep` como diagnósticos.

### Seleção individual não escolhe as melhores combinações

O EDA define relevância como `|2 × AUC − 1|`, usa Mann–Whitney com ajuste BH e remove atributos pouco relevantes, não significativos ou correlacionados com atributos mais relevantes. Esse procedimento usa a label e é supervisionado.

Ele remove `POS_ADV`, `DEP_advmod` e `DEP_ccomp` por pouca diferença individual entre classes. Remove `POS_ADJ` por correlação com `DEP_amod`. Esses quatro atributos aparecem em **18 dos 25 padrões** do painel utilizado pelo `teste.md`. Além disso, os CSVs selecionados não incluem diversidade, caixa alta ou a pontuação corrigida usadas no catálogo, e as demais taxas gramaticais têm definições incompatíveis.

Por exemplo, a AUC completa de `POS_ADV` é 0,503 no treino. Mesmo assim, a combinação de advérbios e modificadores adverbiais do recorte, R22, teve 331 ocorrências na validação e 100% de redescoberta de sua direção representativa. Essa diferença não contradiz o EDA: uma medida isolada e uma combinação sob outra representação respondem perguntas diferentes.

Não usar significância Fake/True de uma feature como requisito de entrada na descoberta principal. Avaliar qualidade de medição, interpretabilidade, cobertura, zeros e redundância no treino. Depois avaliar as combinações congeladas e, separadamente, sua composição por classe.

### Distribuições esparsas

Entre as 31 features selecionadas, `DEP_compound` e `DEP_discourse` têm quantis 25% e 75% iguais a zero no treino atual. A discretização existente as omitiria. Isso mostra que ser selecionada pelo EDA não garante gerar itens úteis no FP-Growth.

Se uma feature esparsa for relevante para observação, testar uma codificação de presença/ausência em uma ablação própria e exigir ocorrências suficientes. Não fabricar dois itens chamados alto/baixo com o mesmo limite. Não reduzir suporte apenas para obter mais regras.

## O que já melhorou no modelo existente

O run [`fp-growth-linguistic-20261006T230752Z`](../../../machine-learning/outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/variant_summary.csv) já compara representações nos mesmos IDs canônicos:

| Variante | Regras direcionais elegíveis no treino | Mantêm filtros na validação |
|---|---:|---:|
| Legado com autoria | 28 | 27 |
| Legado sem autoria | 8 | 8 |
| Estilo corrigido | 0 | 0 |
| Estilo corrigido + POS | 10 | 5 |
| Estilo corrigido + POS + DEP | 152 | 121 |

O baseline produz 31 padrões frequentes de tamanho pelo menos dois, dos quais 21 incluem autoria. Autoria tem Cramér V aproximado de 0,960 com a classe: 3.528/3.601 registros sem autor são Fake, contra 72/3.599 com autor. Preservar esse baseline como controle, usando autoria apenas na análise posterior da variante principal.

O estilo legado também tem a identidade matemática `typeTokenRatio = diversidade × (1 − punctuationDensity)`. Parte das regras antigas deriva dessa construção. A versão corrigida elimina TTR redundante e mede pontuação diretamente.

POS/DEP aumentaram a capacidade de descrever combinações. Entretanto, ADV/advmod e ADJ/amod podem anotar os mesmos tokens. As 152 regras não são 152 sinais independentes. O ranking posterior reúne 93 uniões distintas entre as regras elegíveis. O painel de 25 combina 20 globais e cinco candidatos de contraste Fake. Esses conjuntos têm papéis diferentes.

## Features prioritárias para a próxima comparação

Não há evidência suficiente para chamar os novos candidatos de melhores features definitivas. A seguinte lista prioriza utilidade observável e permite testar contribuição incremental.

| Prioridade | Família e candidatos | Pergunta/observação possível | Condição para uso |
|---|---|---|---|
| Manter como referência | Diversidade lexical, pontuação corrigida e caixa alta | Repetição, pontuação e palavras inteiramente em maiúsculas no trecho | Manter definições versionadas. Não duplicar com TTR |
| Manter | POS NOUN, PROPN, VERB, PRON, ADJ, ADV | Pessoas/objetos mencionados, verbos e modificadores previstos | Preservar ADV mesmo com baixa AUC isolada. Revisar exemplos anotados |
| Manter e revisar famílias | DEP nsubj, obj, amod, advmod, ccomp, advcl | Estrutura de afirmações, complementos e modificações | Agrupar redundância POS/DEP. Uma anotação não comprova intenção |
| Primeira ampliação | POS ADP, AUX e NUM | Relações gramaticais, construções verbais e menções numéricas | Reextrair na mesma janela. NUM não demonstra qualidade de evidência |
| Ampliação sintática pequena | DEP obl, cc, acl:relcl e nsubj:pass | Relações oblíquas, coordenação, orações relativas e voz passiva prevista | Comparar cobertura nova. Não somar tags equivalentes como evidências |
| Novas medidas editoriais | Exclamações, interrogações e aspas, com contagens e denominadores explícitos | Perguntar qual afirmação é feita e como conferir uma citação | Não estão nos CSVs atuais. Aspas não garantem fonte identificável |
| Segunda etapa | Mood=Imp/Sub por verbo elegível e Person=1/2 por token elegível | Convites à ação e posição enunciativa, conforme anotação | Sem verbos: medida ausente. Validar parser/morfologia em exemplos |
| Diagnóstico | SPACE, dep, tamanho, qualidade do recorte e taxa de ROOT | Identificar formatação, conteúdo insuficiente e sensibilidade da análise | Não usar para inferir falsidade. ROOT exige controle de segmentação |

Escolher uma medida por mecanismo quando a segunda não acrescentar cobertura ou observação. Para ROOT, preferir uma medida de tamanho de sentença revisada se ela facilitar a explicação. Não incluir taxa de ROOT e seu inverso como sinais independentes.

A seleção de exibição precisa medir também compreensão, diversidade de observações e utilidade das perguntas. Um atributo com baixa associação a Fake/True pode produzir uma observação útil. A pergunta deve se apoiar no texto efetivamente visto, com contagem, denominador e, quando pertinente, tokens destacados.

## Experimento recomendado e conexão com teste.md

1. **Congelar identidade e representação.** Exportar `record_id`, `group_id`, hash do texto original, janela, normalização, versão do extrator/modelo e denominadores. Usar o corpus congelado verificável. Preservar CRLF/BOM conforme o contrato e testar sensibilidade a normalização de whitespace separadamente.
2. **Reproduzir a referência corrigida.** Manter a janela de 300 caracteres para a primeira comparação e a representação `corrected_pos_dep`. Confirmar itens e ocorrências usando o catálogo/matriz existente. Os CSVs completos ajudam a escolher candidatos, mas suas taxas não substituem as do recorte.
3. **Ampliar por ablações pequenas.** Comparar referência, adição de ADP/AUX/NUM, pequena ampliação DEP e novas medidas editoriais. Não misturar janela nova com adição de features na mesma comparação. Texto completo e frases completas exigem condições próprias e novas discretizações.
4. **Aprender apenas no treino canônico.** Seleção por qualidade/redundância, quantis e mineração no treino. Começar com suporte 0,08, tamanho máximo três, confidence 0,50, lift 1,05 e Jaccard 0,10. Congelar limites e regras para validação.
5. **Avaliar ganho concreto.** Medir ocorrências, cobertura adicional sem redundância, famílias distintas, retenção dos filtros na validação, redescoberta por reamostragem dos grupos, sensibilidade à formatação e exemplos explicáveis. AUC individual dos CSVs permanece diagnóstico de outra tarefa.
6. **Separar comparação por classe.** Reportar contagens, frequência dentro de cada classe e composição entre ocorrências. Controlar autoria e, quando possível, origem, tema e época. Qualquer seleção por labels de validação deve ser declarada supervisionada. Teste conhecido não oferece confirmação nova.
7. **Exportar catálogo de observações.** Versionar itens, operadores, limiares completos, famílias de redundância, perguntas e status editorial. Selecionar no máximo três observações de famílias diferentes na entrada nova. A associação por classe fica na comparação opcional prevista no `teste.md`.

Para o MVP, R05 e R22 continuam candidatos a revisão de observações, com redescoberta de 97% e 100%, respectivamente. R21 tem 91,5% Fake entre suas ocorrências, mas apenas 37% de redescoberta e associação ajustada por autoria inconclusiva. Esse percentual não justifica priorizá-la. Nenhum desses resultados determina a veracidade do texto enviado.

A melhoria será demonstrada se a ampliação oferecer observações verificáveis e cobertura adicional estável sob o mesmo protocolo. Se apenas aumentar regras equivalentes ou dependentes de whitespace, o experimento não demonstrará ganho para a experiência de reflexão.

## Evidência e limites desta auditoria

As contagens, hashes dos CSVs, checagens de alinhamento, sobreposição de partições, taxas e reprodução da amostra estão em [`audit.json`](../../../machine-learning/outputs/feature-review/selecao-fp-growth-20261007/audit.json). Os resultados históricos foram conferidos nos CSVs e manifestos do run e no [painel final](../../../machine-learning/outputs/rule-ranking/linguistic-top25-final-20261006/comparison_report.md).

Esta auditoria recalculou as AUCs dos dados atuais, verificou todos os textos locais e reextraiu uma amostra de 16 documentos. Não minerou uma nova variante ampliada nem validou manualmente todas as anotações. As novas features e os critérios editoriais são propostas de teste. A comparação externa e a avaliação com usuários continuam necessárias para concluir sobre generalização e utilidade do produto.
