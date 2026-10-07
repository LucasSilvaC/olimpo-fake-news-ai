# Revisão de metadados para o FP-Growth

Análise de 6 de outubro de 2026. **Vale aproveitar a extração de POS e dependências sintáticas, adaptando-a para produzir uma linha por notícia e avaliando-a em um novo notebook. Os arquivos atuais não devem alimentar diretamente a mineração.** O baseline com autoria deve continuar disponível para reprodução; a variante linguística deve ser comparada também ao principal sem autoria.

Foram encontrados quatro scripts em `Eldorado/metadados/`, sem CSVs revisados ou novos textos nessa pasta. Eles constituem uma proposta de extração e análise, não evidência de que o dataset já tenha sido corrigido. Os atributos do spaCy são anotações estimadas por um modelo; acrescentá-los não valida automaticamente a veracidade nem corrige os metadados originais.

## O que foi executado

- Leitura do ZIP local de 7.200 notícias, validado contra o SHA-256 do manifesto DBSCAN e o commit `780f5516c4ae070761632d98ac3368f3ded09d35`.
- Execução das funções do notebook do baseline no treino canônico de 4.320 notícias. Resultado reproduzido: **41 itemsets frequentes, 82 regras brutas, 28 regras elegíveis e 31 padrões de tamanho ≥2; 21 padrões incluem autoria**. Padrões consolidados e regras direcionais têm contagens diferentes.
- Execução das funções originais `metaExtractionFromDataset` e `formatarMetadados` em 100 textos completos do treino, sorteados com `random_state=42`. Python 3.14.4, spaCy 3.8.16, `pt_core_news_sm` 3.8.0, em ambiente virtual separado.
- Execução das funções do EDA para testar sua compatibilidade com o CSV novo.

Os scripts `extracao_true.py` e `extracao_false.py` não foram executados de ponta a ponta: ambos baixam `master`, enquanto a auditoria reutilizou o corpus congelado do experimento. Nenhum notebook ou script original foi alterado. **Não foi minerada uma variante enriquecida com POS/DEP**; portanto, ainda não existe demonstração de ganho de estabilidade, utilidade ou generalização das regras.

As evidências, os CSVs da amostra e uma cópia do script de auditoria estão em [`../../../machine-learning/outputs/metadata-review/20261006/`](../../../machine-learning/outputs/metadata-review/20261006/). O ambiente usado está em `Eldorado/.codex-analysis/metadados-venv/`.

## Decisão por arquivo

| Arquivo | Aproveitar | Adaptação necessária para Jupyter |
|---|---|---|
| `extracao_funcoes.py` | **Prioridade alta:** `nlp.pipe`, contagens POS/DEP e separação explícita entre `Tipo` e `Tag` | Substituir o acumulador global por um registro para cada `record_id`; gerar contagens e taxas precisas; receber o pipeline como argumento ou carregá-lo em célula de configuração; conservar o texto e sua procedência. |
| `extracao_true.py` | A intenção de conferir o corpus True | Unificar o carregamento das duas origens usando o ZIP já validado. Separar classe da tabela de atributos usada na mineração. Evitar segundo download, extração na pasta corrente e execução automática ao importar. |
| `extracao_false.py` | A intenção de conferir o corpus Fake | Mesma adaptação do script True; não é necessário manter dois fluxos de extração linguística. |
| `eda-depracated.py` | A ideia de comparar POS/DEP e visualizar distribuições | Reescrever filtros e gráficos para o esquema novo. Usar taxas por notícia e mostrar distribuição, não apenas barras de totais por classe. Manter como análise descritiva separada da escolha de regras. |

`carregar_textos` atribui IDs como `1` para Fake e `1t` para True. Isso evita a colisão simples entre esses dois arquivos, mas não corresponde aos IDs canônicos `fake/1` e `true/1` do notebook. Converter explicitamente e verificar unicidade, cobertura dos IDs e correspondência com as partições. O número comum do par deve continuar disponível para manter Fake/True alinhados no mesmo grupo de divisão.

## Problemas que precisam ser resolvidos

### 1. A agregação perde a unidade de transação

`metaExtractionFromDataset`, linhas 22–31, soma tudo em um único `Counter`. Na amostra, **100 notícias viraram 53 linhas de tags, com 77.425 tokens agregados**. Não há como determinar se um mesmo texto tinha simultaneamente muitos adjetivos e poucos verbos. Essa coocorrência por notícia é precisamente o que o FP-Growth precisa.

Os dois CSVs por classe são úteis para descrever o corpus. Usá-los como duas transações não descobre padrões nas 7.200 notícias; replicar seus valores em cada notícia também fabricaria atributos derivados da classe.

### 2. O denominador e o nível de agregação mudam a interpretação

`len(doc)` inclui pontuação e tokens de espaço. A amostra continha 575 tokens de espaço; a frase de prova confirmou `\n\n` anotado como `SPACE`. Convém guardar três denominadores: todos os tokens, tokens sem espaço e tokens lexicais sem espaço/pontuação. Escolher e documentar um denominador para cada taxa; números permanecem tokens lexicais nessa convenção, a menos que se decida excluí-los explicitamente.

Para POS lexical, uma definição inicial clara é `POS_ADJ_rate = número de ADJ / tokens lexicais`. Para DEP lexical, contar e dividir usando o mesmo conjunto de tokens elegíveis. Pontuação precisa de uma medida própria, calculada sobre tokens sem espaço. Documento vazio ou sem tokens elegíveis gera taxa ausente e indicador de qualidade; tag inexistente em documento válido gera contagem zero.

O percentual agregado é ponderado pelo comprimento: `soma(contagem) / soma(tokens)`. Ele difere da média das taxas por notícia. Na amostra, usando tokens lexicais, NOUN foi **22,65% no agregado e 22,12% na média por notícia**. O FP-Growth calcula suporte contando notícias, por isso deve receber as taxas individuais.

`formatarMetadados` arredonda percentuais a duas casas e remove o total de tokens do CSV. Manter o total e as taxas sem arredondamento no artefato de atributos; arredondar somente a apresentação. POS e DEP são duas classificações dos mesmos tokens: suas porcentagens não formam juntas uma única distribuição de 100%.

### 3. Corpus e janela de texto precisam ser comparáveis

Os scripts usam textos completos de `master`; o baseline usa um commit fixo e os primeiros **300 caracteres após normalização NFKC**. No ZIP congelado, a mediana do comprimento é **956,5 caracteres para Fake e 5.581 para True**. Contagens absolutas e porcentagens agregadas são particularmente vulneráveis a essa diferença. Mesmo taxas podem mudar com o comprimento, gênero e posição no texto.

Na primeira comparação, aplicar POS ao mesmo recorte normalizado de 300 caracteres e usar os mesmos IDs de treino. Isso isola melhor o acréscimo de atributos. Para DEP, o corte pode interromper a última frase e prejudicar a análise sintática; registrar essa limitação e fazer uma experiência separada com frases completas/janela definida antes da avaliação. Texto completo ou `size_normalized_texts` são outras condições experimentais, com manifesto próprio; não são substituições silenciosas do recorte atual.

Preservar caixa, acentos, pontuação e palavras funcionais no texto fornecido ao spaCy. A documentação do corpus distingue textos originais, textos truncados por par e textos pré-processados; as versões não são intercambiáveis para medir estilo e sintaxe. [Fonte: Fake.br-Corpus](https://github.com/roneysco/Fake.br-Corpus#readme).

### 4. O EDA está incompatível com a revisão

O CSV novo tem `Tipo`, `Tag`, `Quantidade` e `Porcentagem (%)`; o EDA espera `Metadado`. A chamada `collectMetadado(csv_novo, 'pos')` reproduziu **`KeyError: 'Metadado'`**. O primeiro gráfico também pede essa coluna ausente. `taxa_extracao` exige a linha `quant_tokens`, removida pelo exportador novo.

O filtro correto passa a ser `df[df.Tipo.eq('POS')]` ou `df[df.Tipo.eq('DEP')]`. O modo `morph` anunciado na docstring não é implementado e gera `ValueError`; o extrator também não lê `token.morph`. O bloco comentado de função nas linhas 41–48 deixou código indentado após `return`, portanto inacessível. `plotData` cria uma figura extra antes de `df.plot`. São razões para adaptar a visualização, sem copiar o arquivo inteiro para o notebook.

### 5. Há redundâncias no baseline antes mesmo de acrescentar POS

Na função `style`, chamando `D` o número de palavras distintas, `W` o número de palavras e `T` o número de tokens:

```text
typeTokenRatio = D/T
diversidade = D/W
punctuationDensity = (T-W)/T
typeTokenRatio = diversidade × (1 − punctuationDensity)
```

A identidade foi confirmada nos 4.320 registros, com erro máximo de `1,11 × 10⁻¹⁶`. Portanto, uma regra entre esses atributos pode refletir sua construção matemática. No run histórico, `typeTokenRatio_alto → punctuationDensity_baixo` tem lift de aproximadamente **2,163**; isso, sozinho, não prova um fenômeno independente de escrita. A marcação atual de famílias lexical/estilo não captura essa dependência entre famílias.

Além disso, `T-W` inclui números, e não apenas pontuação. O nome `punctuationDensity` é mais restrito que sua implementação. Usar `token.is_punct` pode melhorar a definição em uma variante, mas muda o atributo e precisa de nova versão. Para a nova experiência, testar uma representação que conserve diversidade lexical e pontuação diretamente medida e retire o TTR redundante, registrando essa ablação separadamente da adição de POS.

Autoria também merece controle: os resultados históricos mostram Cramér V de aproximadamente 0,960 com a classe. Isso explica a relevância de comparar com o [principal sem autoria](../../../machine-learning/unsupervised-learning/history/mineracao-de-padroes/fp-growth-legado/fp_growth_principal_sem_autoria_controles.ipynb), mantendo a estratificação posterior. `linkDensity` já é omitida no treino porque os dois quantis são zero; `uppercaseRatio_baixo` cobre 43,56%, devido aos empates. A discretização linguística deve registrar cobertura real, zeros e faixas omitidas, em vez de assumir que todo quartil representa 25% das notícias.

## Integração recomendada em Jupyter

Criar uma variante proposta `fp_growth_linguistico_sem_autoria.ipynb`, com estas etapas:

1. **Configuração e procedência:** corpus/hash, IDs e grupos canônicos, janela, normalização, versões spaCy/modelo e denominadores. Inicialmente conservar suporte 0,08, `max_len=3` e os filtros existentes. No treino de 4.320 notícias, suporte 0,08 exige pelo menos 346 ocorrências.
2. **Extração por documento:** reutilizar a leitura do ZIP, executar `nlp.pipe` e produzir uma tabela indexada por `record_id`, sem classe nem autoria entre os atributos de descoberta. Começar com taxas `POS_ADJ`, `POS_ADV`, `POS_NOUN`, `POS_PROPN`, `POS_VERB` e `POS_PRON`; são candidatos, não seleção comprovada. Examinar zeros, ausências e anotação em uma amostra de treino.
3. **DEP como segunda ablação:** depois de verificar as anotações, experimentar `nsubj`, `obj`, `amod`, `advmod`, `ccomp` e `advcl`. Conferir dependências entre medidas: por exemplo, `amod` e ADJ podem carregar informações semelhantes. Contagem de ROOT também se relaciona à quantidade de frases. Acrescentar todas as tags de uma vez amplia regras redundantes e comparações.
4. **Transações e mineração:** ajustar `FEATURES`, `FAMILIES`, `family`, `transactions` e `read_corpus`. No baseline, os pontos estão nas células de código 3, 5, 7, 9 e 11, usando índices de célula iniciados em zero. A nova extração entra após a leitura do texto; `mine` e `consolidate` podem ser reaproveitados após conferir que tratam resultados vazios. Declarar famílias POS/sintaxe sem pressupor independência.
5. **Quantis aprendidos no treino:** aplicar limites congelados na validação; quantis iguais e distribuições totalmente ausentes devem ser omitidos/registrados. Zero válido não é dado ausente. Não arredondar as taxas antes dos quantis nem recalcular cortes por classe. Acrescentar novas linhas a `discretization.csv` e os detalhes linguísticos ao manifesto.
6. **Avaliação da utilidade das regras:** comparar estilo sem autoria, estilo+POS e estilo+POS+DEP nos mesmos IDs. Medir suporte, confidence, lift e cobertura na validação usando as regras congeladas; examinar número de ocorrências, redundância e estabilidade por reamostragem de grupos do treino. A unidade de reamostragem deve respeitar os pares Fake/True. Mais regras ou maior lift no treino não bastam.
7. **Leitura Fake/True separada:** depois da descoberta, cruzar classes e autoria para descrição e controles. O principal atual faz a avaliação agregada no corpus completo, incluindo treino; acrescentar resultados por partição para avaliar estabilidade fora da descoberta. A comparação de veracidade também precisa respeitar os pares/grupos; testes que tratam todas as notícias como independentes não acomodam esse alinhamento. Como já há resultados conhecidos no teste canônico, uma conclusão confirmatória da nova variante exige avaliação ainda não usada ou validação externa adequada.

O pipeline português é voltado a texto jornalístico e possui componentes para anotações linguísticas, mas previsões podem errar. Conferir manualmente uma amostra e manter os componentes que produzem POS/DEP. `ner` pode ser desativado se entidades não forem usadas; desativar o parser elimina as dependências necessárias. [Modelos portugueses](https://spacy.io/models/pt), [processamento e componentes do spaCy](https://spacy.io/usage/processing-pipelines).

Os metadados originais do corpus já incluem contagens de verbos, substantivos, adjetivos, advérbios e pronomes. Antes de recalcular tudo, auditá-los pode esclarecer correspondências e divergências. Não tratá-los como equivalentes às contagens do spaCy sem verificar tokenizer, janela e definições. DEP constitui uma adição mais direta ao conjunto atual; POS dá descritores gramaticais mais interpretáveis, cuja utilidade deve ser medida. Nenhuma dessas tags, isoladamente, mede subjetividade, qualidade factual ou falsidade.

**Recomendação:** aproveitar primeiro o núcleo de `extracao_funcoes.py`, corrigir unidade por notícia, IDs, denominadores e procedência, e comparar uma variante pequena de POS sem autoria. Adaptar o EDA para auditar essa tabela. Incorporar DEP depois da conferência de janela/anotação. A aprovação metodológica é para esse experimento controlado; o ganho empírico ainda precisa ser demonstrado.
