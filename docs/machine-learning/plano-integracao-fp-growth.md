# Plano de integração do FP-Growth para reflexão sobre notícias

Proposta elaborada em 7 de outubro de 2026. Escopo: análise dos artefatos existentes e plano de implementação; não altera o comportamento do aplicativo.

## Objetivo do produto

Ao receber uma notícia, mostrar características observáveis do texto, perguntas que ajudem a examinar suas afirmações e, por escolha do usuário, uma comparação descritiva com o corpus. A decisão sobre veracidade exige evidências sobre os fatos; o padrão de escrita oferece uma oportunidade de reflexão.

Evitar indução é um objetivo a avaliar, não uma propriedade garantida pela frase “isto não é um veredito”. Mesmo percentuais corretos podem orientar a resposta. Por isso, a apresentação inicial deve privilegiar a observação e a investigação, deixando a comparação por classe numa segunda etapa.

## 1. O que os resultados atuais permitem afirmar

Fonte principal: `machine-learning/outputs/model-comparison/fp-growth-linguistic-20261006T230752Z/`, variante `corrected_pos_dep`. Para a comparação por classe, usar `machine-learning/outputs/rule-ranking/linguistic-top25-final-20261006/`.

- O FP-Growth descobriu 152 regras direcionais elegíveis no treino. O ranking reúne suas uniões de itens em 93 padrões distintos. A seta entre atributos não é uma previsão de Fake/True.
- O painel final contém 25 padrões: 20 do ranking global, todos associados a True na validação, e 5 candidatos associados a Fake acrescentados para contraste. Não são os “25 melhores” de um único ranking.
- A descoberta dos itens foi feita sem classe; o ranking posterior usou os rótulos da validação. A seleção dos insights já incorpora supervisão.
- A representação utiliza os primeiros 300 caracteres após normalização NFKC e remoção de BOM inicial, com spaCy 3.8.16 e `pt_core_news_sm` 3.8.0. Os números descrevem esse recorte.
- Na validação há 1.440 notícias, 720 Fake e 720 True. Essa composição de 50%/50% não estima a frequência de falsidade nas notícias que usuários enviarão.
- Autoria é fortemente associada à classe no corpus. Retirar autoria da descoberta não elimina associações entre estilo e origem editorial. Apenas 4 dos 25 padrões têm intervalos pontuais do excesso ajustado favoráveis à classe indicada; isso também não comprova efeitos independentes.
- O teste canônico já foi observado. Recorrência no teste e no corpus completo continua sendo evidência exploratória, sem validação externa nova.
- ADV/advmod e ADJ/amod podem descrever os mesmos tokens por duas anotações diferentes. Várias regras coincidentes não equivalem a várias evidências independentes.

### Exemplos concretos da validação

| Padrão | Descrição observável                                                                                         | Fake / True com padrão | Composição entre ocorrências | Frequência em cada classe      | Redescoberta da direção no treino |
| ------ | ------------------------------------------------------------------------------------------------------------ | ---------------------: | ---------------------------- | ------------------------------ | --------------------------------: |
| R05    | Maior proporção de substantivos e nenhuma palavra inteiramente em maiúsculas segundo a medida do experimento |               48 / 134 | 26,4% Fake; 73,6% True       | 6,7% das Fake; 18,6% das True  |                               97% |
| R21    | Proporções altas de advérbios, modificadores adverbiais e pontuação                                          |                 97 / 9 | 91,5% Fake; 8,5% True        | 13,5% das Fake; 1,3% das True  |                               37% |
| R22    | Proporções altas de advérbios e modificadores adverbiais                                                     |              206 / 125 | 62,2% Fake; 37,8% True       | 28,6% das Fake; 17,4% das True |                              100% |

“Alto” e “baixo” são limites aprendidos no treino, não juízos de qualidade. Na R05, `uppercaseRatio_baixo` tem limite zero; a medida considera palavras inteiramente em maiúsculas com mais de uma letra. Ela não mede a quantidade de letras maiúsculas.

R21 merece ficar no catálogo de pesquisa, mas não deve ser o destaque do MVP por ter 91,5%. Sua direção representativa reapareceu em apenas 37% das reamostragens do treino; o excesso Fake ajustado por autoria na validação foi −0,21 ponto percentual, com intervalo de −0,87 a +0,51. Esse ajuste é descritivo e não remove todos os confundidores.

### A frase proposta precisa separar dois denominadores

Para um padrão P:

```text
Composição Fake = Fake com P / todas as notícias com P
Frequência nas Fake = Fake com P / todas as notícias Fake
Confidence gramatical A → B = notícias com A e B / notícias com A
```

No caso R21, a descrição correta é: “Na validação desta base, 97 das 106 notícias com esta combinação foram rotuladas como falsas; 9 foram rotuladas como verdadeiras.”

Também é correto: “Esta combinação apareceu em 13,5% das notícias falsas e 1,3% das verdadeiras da validação.”

Não usar “90% das notícias falsas têm isso” para esse resultado, nem converter a composição em “sua notícia tem 91,5% de chance de ser falsa”. Não utilizar a confidence gramatical como confiança na veracidade.

## 2. Catálogo versionado de padrões

Catalogar os 93 padrões para pesquisa e auditoria. Separar esse catálogo da lista aprovada para exibição ao usuário. As regras direcionais originais permanecem como procedência; a unidade do insight é o conjunto de itens observado.

Começar com um JSON gerado offline, validado e versionado. O volume atual não exige CRUD de regras nem tabelas adicionais para cada item.

| Campo                                               | Finalidade                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `catalogVersion`, `sourceRun`, `variant`, hashes    | Identificar exatamente os artefatos utilizados                                               |
| `patternId`, `directedRuleIds`                      | Identidade estável e rastreabilidade; R01…R25 são apenas IDs de apresentação                 |
| `items[]`                                           | Feature, operador, limiar com precisão original e denominador                                |
| `observationTitle`, `observationTemplate`           | Tradução humana fiel ao atributo                                                             |
| `reflectionQuestions[]`                             | Perguntas editoriais revisadas, sem afirmações sobre fatos não examinados                    |
| `train`, `validation`, `test`, `all`                | Contagens, denominadores, composição, cobertura e baselines, separados por partição          |
| `grammarMetrics`, `rediscovery`, `classAssociation` | Separar coocorrência linguística, estabilidade da descoberta e associação posterior à classe |
| `uncertainty`, `authorControl`, `selectionRole`     | Intervalos e suas limitações, controles e papel no ranking                                   |
| `redundancyFamily`, `displayStatus`, `reviewNotes`  | Evitar repetições e registrar aprovação editorial ou motivo de restrição                     |

`displayStatus` pode ser `research_only`, `observation_only` ou `comparison_available`. A classe predominante é metadata da comparação no corpus; não é a classe atribuída à notícia nova.

Artefatos para a exportação:

1. `all_93_patterns.csv`: candidatos, IDs e motivos de exclusão.
2. `selected_rules_scatter.csv` e `global_top_rules.csv`: painel de contraste e ranking global, preservando seus papéis diferentes.
3. `corrected_pos_dep/discretization.csv`: critérios congelados e atributos omitidos.
4. `rule_metrics.csv`, `training_rediscovery_stability.csv` e manifestos: métricas e procedência.
5. `individual_items.csv` e `leave_one_item_out.csv`: apoio à revisão da redundância e contribuição de cada item. Não usar suas diferenças como explicações causais.

## 3. Experiência de uso proposta

### Entrada e observação

Oferecer URL ou texto colado. Após extrair uma URL, permitir confirmar ou corrigir o conteúdo antes da análise. Separar título do corpo; a extração deve analisar o campo que reproduz o texto do corpus, sem concatenar automaticamente título, fonte e corpo.

Mostrar qual trecho foi analisado, a limitação de 300 caracteres e até três observações não redundantes. A pergunta inicial pode ser: “Qual afirmação desta notícia você gostaria de verificar?” A resposta é opcional.

Exemplo para um texto que efetivamente corresponda a R21:

> No trecho analisado, as proporções de advérbios e pontuação ultrapassam os limites de comparação da nossa base.
>
> Quais palavras mudam a intensidade da afirmação? Se você as retirar, qual afirmação factual permanece? Que evidência ajudaria a confirmá-la ou refutá-la?

Não traduzir presença de advérbios como “manipulação”, “alarmismo” ou “sensacionalismo”. A anotação gramatical não demonstra intenção, emoção ou falsidade. Perguntas sobre intensidade são convites à leitura, não conclusões extraídas do POS.

Para um padrão de substantivos, a pergunta pode ser: “Quais pessoas, instituições ou objetos aparecem? A notícia permite localizar a fonte da afirmação?” A pergunta não pressupõe ausência de fonte.

### Comparação opcional com a base

Botão “Ver como este padrão apareceu na base”. Na abertura, mostrar ambas as classes com o mesmo peso visual, contagens e frequência por classe. Evitar um grande selo “91,5% Fake”, medidor de risco ou cores de aprovação/reprovação.

Para R21, se sua comparação vier a ser habilitada após revisão, o conteúdo seria:

> Na validação da base Fake.br, esta combinação apareceu em 97 de 720 notícias rotuladas como falsas (13,5%) e 9 de 720 rotuladas como verdadeiras (1,3%). Entre as 106 ocorrências, 91,5% eram falsas e 8,5% verdadeiras.
>
> Essa comparação descreve a base utilizada. A associação é sensível à composição por autoria e o padrão teve baixa estabilidade de redescoberta. O estilo observado não verifica os fatos desta notícia.

Oferecer “Sobre estes dados” com partição, versão, intervalos pontuais e limites da seleção. Exemplos das duas classes, quando disponíveis e revisados, ajudam a mostrar que o mesmo estilo ocorre em notícias com rótulos diferentes.

Se padrões associados a classes diferentes coincidirem, mostrar essa divergência. Não somar votos de regras, multiplicar probabilidades ou gerar um score geral de verdade. Não forçar uma regra de cada classe quando o texto não corresponder a elas.

### Jogo e estados sem insight

No jogo, mostrar observações e perguntas antes do voto. A comparação estatística por classe só deve ficar disponível após a resposta da rodada, com a restrição aplicada também no servidor. O gabarito deve continuar tendo procedência própria, separada dos padrões.

Sem correspondência: “Não encontramos um padrão do catálogo neste trecho. Você pode investigar as fontes e a afirmação principal.” Ausência de padrão não representa evidência de verdade.

Texto vazio, sem tokens elegíveis ou fora do domínio suportado: pedir conteúdo adequado ou apresentar indisponibilidade. Textos muito curtos exigem uma política de comprimento mínimo avaliada em exemplos reais; não inventar um limiar validado. Texto longo recebe análise do recorte, sem extrapolar para o documento inteiro.

## 4. Integração técnica no web-app

### Situação encontrada

- `src/views/room-lobby/ui/room-lobby-view.tsx` oferece entrada por URL e exibição das notícias da playlist, usando `AddPlaylistNewsUseCase` e o parser compartilhado em `src/lib/news/`.
- O parser compartilhado em `src/lib/news/extract-news.ts` extrai notícias para o fluxo da sala; ainda não entrega insights FP-Growth.
- `src/app/api/ai-feedback/` tem entidade, contratos, caso de uso, repositórios e serviço mock. Seu contrato exige `classification`, `confidence` e `reasons`.
- `MockAIAnalysisService` prioriza o `targetClassification` recebido; caso contrário, classifica por palavras e devolve razões e confidências fixas. Isso não implementa a reflexão proposta nem verifica as alegações contidas nas razões.
- `SubmitNewsForm` atualmente atualiza uma lista local e solicita gabarito ao criador. Não é ainda um fluxo conectado de submissão e análise.
- `RoundResultCard` recebe uma explicação em texto; é um ponto de apresentação após a rodada, não um motor de análise.

### Desenho recomendado

Criar uma funcionalidade própria `news-insights`, com contrato estruturado, sem exigir classificação. Seguir as camadas descritas em `docs/codigo/arquitetura-web-app.md`: domínio e aplicação independentes de Next.js/Drizzle; infraestrutura para o serviço linguístico; apresentação com validação; frontend consome a ação/API sem importar infraestrutura.

```text
URL ou texto → confirmação do corpo → análise linguística em Python
           → aplicação dos limites congelados → correspondência de padrões
           → seleção por elegibilidade/diversidade → observações e perguntas
           → comparação opcional autorizada pelo contexto
```

Reutilizar `linguistic_features.extract_features` e `linguistic_fp_growth.apply_discretization` em um serviço Python interno, com o pipeline carregado no início. O Next.js chama esse serviço; não executar notebook nem carregar spaCy a cada requisição. Implantação e disponibilidade do serviço são dependências do MVP.

Para cada entrada, reproduzir NFKC, remoção de BOM, corte e denominadores do experimento. Usar a variante `corrected_pos_dep`; não misturar limites de `DEP_complete` ou do legado. Não recalcular quantis com a notícia recebida, nem minerar regras online.

Uma correspondência exige **todos** os itens do padrão: união do antecedente e consequente. Feature ausente é ausência de medição; não convertê-la em zero. Itens omitidos na discretização não podem voltar como critérios ativos.

O retorno deve conter `analysisStatus`, `catalogVersion`, `extractorVersion`, trecho efetivamente analisado, indicadores de qualidade e `insights[]`. Cada insight contém `patternId`, observação, valores/limites, perguntas, família de redundância e comparação quando permitida. Não incluir `targetClassification` no contrato do matcher ou seletor.

Offsets dos tokens devem referenciar o trecho normalizado mostrado. Para destacar no texto original, será necessário mapear os offsets da normalização; NFKC pode alterar posições. Em medidas agregadas, mostrar contagem e denominador em vez de apontar uma palavra isolada como responsável pelo padrão.

No MVP, priorizar padrões aprovados para observação, estabilidade e diversidade de atributos; a ordem não deve depender da maior pureza Fake nem da resposta inicial do usuário. A política editorial pode começar exigindo redescoberta ≥80%, como proposta a avaliar, e eliminando duplicatas de família. Isso não valida associação à falsidade. R21 não passa esse limite; R22 e R05 podem ser candidatos a observações, sujeitos à revisão humana.

Resultados podem ser efêmeros na primeira versão. Se houver persistência para artigos/rodadas, criar armazenamento próprio de insights estruturados; não preencher `news_analyses.confidence` com percentuais do corpus. Cache deve depender do hash do conteúdo efetivamente analisado, versão do extrator e catálogo, não apenas `articleId`. Texto editado e catálogo atualizado invalidam o resultado anterior.

Perguntas e descrições começam como templates revisados. Um LLM não é necessário ao MVP. Caso seja acrescentado depois, recebe somente fatos estruturados e não modifica contagens, métricas ou status de evidência.

## 5. Etapas e critérios de conclusão

| Etapa               | Entrega                                                              | Critério verificável                                                                                                             |
| ------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1. Catálogo         | Exportador offline, JSON e revisão editorial inicial                 | 93 padrões rastreáveis; partições e denominadores íntegros; papéis global/contraste preservados; limites e versões coerentes     |
| 2. Motor            | Serviço Python e correspondência determinística                      | Reproduz itens e ocorrências de registros congelados; trata limites exatos, ausências e textos inadequados; não utiliza gabarito |
| 3. Fluxo individual | URL/texto, confirmação, observações, perguntas e comparação opcional | Até três famílias distintas; exemplos reais explicáveis; estados sem padrão/erro claros; nenhuma classificação criada            |
| 4. Jogo             | Observações antes do voto e comparação após a rodada                 | Servidor impede acesso antecipado à comparação por classe; insights separados do gabarito e da pontuação                         |
| 5. Avaliação        | Estudo de compreensão e nova base externa                            | Usuários distinguem frequência/composição e não tratam estilo como prova; generalização examinada fora do corpus atual           |

Testes centrais: reprodução dos itens da `discretization.csv` e da matriz `news_rule_matrix.csv`, cálculo dos dois denominadores, união completa dos itens, deduplicação de setas inversas, invalidação de cache e proteção da fase da rodada. Checar amostras do extrator antes de testar o caminho inteiro.

Para estudar indução, comparar de forma planejada perguntas sem estatísticas, perguntas com estatísticas opcionais e estatísticas diretamente expostas. Observar mudança de julgamento, justificativas, consulta de fontes e compreensão das limitações. Não otimizar apenas acertos Fake/True ou cliques em avisos.

Antes de habilitar amplamente a comparação por classe, avaliar novos textos com diversidade de época, tema e fonte, preservando separação por origem na avaliação. Verificar se as associações persistem e se os usuários transferem indevidamente o percentual da base para a notícia recebida. O corpus atual não resolve essa questão.

## Recomendação para a primeira implementação

Começar no extrator individual, com catálogo versionado, análise fiel ao recorte, observações verificáveis e perguntas revisadas. Manter a comparação por classe como recurso opcional e experimental após revisão dos padrões. A integração no jogo vem depois que o contrato e a experiência individual estiverem verificados.

O principal valor entregue é tornar o raciocínio do usuário mais explícito: qual afirmação está sendo examinada, quais elementos do texto ele observou e que evidência poderia mudar sua conclusão.
