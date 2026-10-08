# Motor de execução dos modelos

O serviço aplica o principal `sintaxe_ampliada` a textos novos. Executa equações congeladas em
`models/unsupervised/features.py`, equivalentes à extração e discretização do experimento: normalização NFKC,
remoção de BOM apenas no início e os primeiros 300 caracteres. Não minera regras,
recalcula quantis ou recebe classe, gabarito e autor durante uma análise.

`models/unsupervised/assets/product_catalog.json` é um artefato separado do catálogo científico. Contém os
20 `review_candidate` do run `fp-growth-metadados-ampliados-20261008T002311Z`,
os limites congelados, textos simples de observação e frequências por classe
revisados tecnicamente pelos agentes que implementaram a integração. Seu status é
`experimental_descriptive_comparison`; **não houve aprovação editorial humana**.
O catálogo científico continua `research_only` e não é sobrescrito.

As observações descrevem as medidas identificadas automaticamente no trecho,
com exemplos em linguagem simples. O cartão principal reúne as ausências em uma
frase curta, em vez de repetir contagens zero e nomes linguísticos. Características
presentes mantêm a contagem e sua faixa em relação ao conjunto de referência.
Ausência de uma anotação não implica ausência
na notícia completa; o anotador também pode errar. Cada comparação descreve a
**combinação completa** dos critérios do padrão, sem atribuir sua frequência a
apenas um dos itens.

`comparisonEnabled` é verdadeiro no catálogo de produto. A comparação usa
exclusivamente a partição `validation`, sem separar notícias por presença de autor
(`authorScope: all`), do Fake.br-Corpus no run congelado. Cada grupo tem 720 notícias:
`fake.frequency = fake.count / 720` e `true.frequency = true.count / 720`. São
frequências **dentro de cada classe rotulada do corpus**, e não a composição de classe
entre textos que apresentam o padrão. Por exemplo, 185/720 e 256/720 no primeiro
padrão significam sua presença em 25,69% do grupo rotulado falso e 35,56% do grupo
rotulado verdadeiro nessa amostra.

A análise de uma notícia nova não recebe nem prevê uma classe. Não inclui
classificação, probabilidade de falsidade, risco, composição por classe ou conclusão
de veracidade. Os rótulos pertencem às notícias históricas do corpus. Os dois grupos
são fornecidos com igual estrutura, sem selecionar padrões pela diferença entre eles.
A referência de validação é descritiva: os padrões foram aprendidos no treino e
revistos com artefatos existentes; não há alegação de avaliação inédita ou causalidade.

## Organização e modelo supervisionado

```text
model-engine/
├── service.py                         # Serviço HTTP interno
├── models/
│   └── unsupervised/
│       ├── engine.py                  # Matcher e comparação descritiva
│       ├── features.py                # Extração/discretização independentes
│       └── assets/product_catalog.json
├── tools/export_unsupervised_catalog.py # Publicação offline dos artefatos
├── tests/                             # Testes da execução
├── requirements.txt
└── Dockerfile
```

Esta pasta é a camada de execução consumida pelo web-app. `machine-learning/`
continua responsável por experimentos, treinamento, corpus e resultados.
O serviço pode ser distribuído com apenas `model-engine/`: não importa arquivos
nem precisa localizar pastas de pesquisa durante a análise.

O modelo supervisionado executa em `models/supervised/`, com fontes congeladas,
artefato joblib e manifestos de integridade próprios, usando o mesmo
serviço. O contrato `/analyze`
atual permanece dedicado às observações e comparações descritivas do não supervisionado.
Não combinamos scores supervisionados com padrões linguísticos automaticamente.

Apenas a ferramenta de exportação offline e os testes de reprodução acessam
`machine-learning/`. O exportador compara as equações de runtime com as fontes
científicas antes de empacotar o catálogo e exige revisão caso elas divirjam.

## Executar localmente

Instale Python **3.14.2** e as dependências na raiz do repositório. O supervisionado
verifica o patch exato do Python e as versões do manifesto; outra versão deixa
apenas esse modelo indisponível. A imagem Docker fornece o ambiente validado:

```powershell
python -m venv .venv-insights
.\.venv-insights\Scripts\python.exe -m pip install -r model-engine/requirements.txt
.\.venv-insights\Scripts\python.exe model-engine/service.py
```

O serviço atende `127.0.0.1:8010` por padrão. `--host`, `--port`,
`NEWS_INSIGHTS_HOST` e `NEWS_INSIGHTS_PORT` permitem alterar esse endereço.
O processo carrega spaCy uma única vez e serializa a extração no pipeline
compartilhado. Não há cache de notícias neste motor; a persistência é do pipeline
e do catálogo em memória. As requisições não registram o corpo da notícia.

No ambiente desta implementação, o interpretador com as dependências corretas
já está em `../.codex-analysis/metadados-venv/Scripts/python.exe`.

## HTTP e integração Next.js

`GET /health` devolve HTTP 200 com `status: "ok"`, `catalogVersion`,
`extractorVersion` e `comparisonEnabled: true` quando o motor está pronto.
Se faltar o modelo ou a integridade/versões divergir, devolve HTTP 503 e
`status: "unavailable"`.

`POST /analyze` exige `Content-Type: application/json` e somente:

```json
{ "text": "Corpo completo da notícia obtido pelo parser" }
```

O corpo completo é normalizado e recortado pelo motor, sem juntar título ou
metadados. Há limite de 100 mil caracteres e de 1 MB por requisição.

| Status de análise | HTTP | Significado                                                             |
| ----------------- | ---- | ----------------------------------------------------------------------- |
| `ok`              | 200  | Pelo menos um padrão do produto corresponde integralmente.              |
| `no_match`        | 200  | O texto tem tokens elegíveis, mas nenhum padrão do produto corresponde. |
| `invalid_text`    | 400  | Texto inválido, vazio, grande demais ou sem tokens elegíveis.           |
| `unavailable`     | 503  | O motor não está pronto ou a análise falhou.                            |

JSON inválido/atributos extras também retornam 400. Corpo HTTP maior que 1 MB
retorna 413; conteúdo que não é JSON retorna 415, ambos `invalid_text`.
O serviço deve permanecer em rede privada, acessado pelo servidor Next.js.
Para exposição fora dessa rede, um proxy precisa fornecer autenticação,
limites de requisição e TLS.

Todos os status de análise possuem `analysisStatus`, `catalogVersion`,
`extractorVersion`, `analyzedText`, `characterLimit: 300`,
`quality: {empty, noEligibleTokens, truncated}` e `insights: []`.
Cada insight possui `patternId`, `observationTitle`, `observation`,
`reflectionQuestions: []`, `redundancyFamily`, `measurements` e `comparison`.
Cada medição registra `feature`, `label`, `value`, `operator`, `threshold`,
`denominator` e, quando disponíveis, `count` e `denominatorCount`. Também possui
`displayLabel` e `displayText`, descrições simples específicas de cada critério. A
observação reúne todos esses critérios, expressando contagens zero como ausência
identificada; limites e denominadores
linguísticos continuam disponíveis para detalhes de metodologia.
As medidas são razões brutas, sem convertê-las em percentuais de veracidade.

`comparison` tem este formato (exemplo do primeiro padrão):

```json
{
  "kind": "descriptive_corpus_frequency",
  "referenceDataset": "Fake.br-Corpus",
  "partition": "validation",
  "authorScope": "all",
  "sourceRun": "fp-growth-metadados-ampliados-20261008T002311Z",
  "variant": "sintaxe_ampliada",
  "scope": "matched_pattern",
  "fake": { "count": 185, "total": 720, "frequency": 0.2569444444444444 },
  "true": { "count": 256, "total": 720, "frequency": 0.35555555555555557 }
}
```

O motor valida procedência, partição, escopo, denominadores e igualdade de frequência
com `count / total` ao inicializar. Não publica `composition_fake`, `composition_true`,
confiança ou métricas direcionais das regras científicas.

Todos os itens do padrão precisam corresponder. Valores ausentes mantêm NaN
na extração/discretização e não satisfazem limites, incluindo `<= 0`.
O resultado seleciona no máximo três famílias, na ordem de prioridade congelada,
sem repetir família ou exibir simultaneamente um padrão e sua extensão.

## Contêiner

```sh
docker build -t olimpo-model-engine ./model-engine
docker run --rm -p 127.0.0.1:8010:8010 olimpo-model-engine
```

O Dockerfile copia somente motor, catálogo e fontes de extração/discretização.
Não inclui corpus, CSVs de pesquisa nem notebooks. Python 3.14.2, spaCy 3.8.16,
modelo português 3.8.0, NumPy 2.5.3 e pandas 3.0.6 estão fixados. O motor não usa mlxtend ou scripts de mineração.
O serviço valida as versões do spaCy/modelo e o SHA-256 da extração/discretização do runtime ao
inicializar; hashes das fontes científicas são mantidos como procedência. As demais dependências transitivas são resolvidas pelo pip.

## Previsão supervisionada

`POST /supervised/analyze` recebe somente `{ "text": "corpo bruto da notícia" }`.
O motor preserva o preparo do artefato: normalização, dígitos substituídos por zero
e até 100 palavras; os atributos spaCy são próprios desse modelo. Não recebe
gabarito, voto, título, autoria ou veículo. Não executa treinamento.

`fakeScore = 100 × fakeProbability`, com probabilidade calibrada da classe Fake.
Até 0,35 a classe estimada é `reliable`; a partir de 0,65 é `unreliable`; entre
esses limites é `uncertain`. Com menos de 30 palavras, retorna HTTP 200,
`insufficient_text`, classe `uncertain` e scores nulos. Entrada inválida retorna
400 (`invalid_text`); falha ou fila esgotada retorna 503 (`unavailable`), sem score.
Os limites HTTP de JSON/tamanho também se aplicam a esse endpoint.

O resultado inclui `analysisStatus`, `classification`, `fakeProbability`, `fakeScore`,
`scoreKind`, `modelVersion`, `policyVersion`, `artifactSha256`, `inferenceVersion`,
`reasons` e `inputScope`. As razões descrevem contribuições aprendidas e medidas da
escrita; não verificam fontes ou acontecimentos. A probabilidade mantém sua precisão
original e o arredondamento acontece somente na apresentação.

`GET /health/supervised` expõe disponibilidade e identidade para o cache interno do
web app. `GET /health/unsupervised` e `/health` preservam a saúde das observações.
O artefato é carregado uma vez, com validação de SHA-256, fontes congeladas,
bibliotecas, classe calibrada e rótulos. A execução é serializada com duas vagas
de espera e prazo limitado; não há compartilhamento de spaCy entre os modelos.

Para atualizar o empacotamento offline a partir das fontes controladas:

```powershell
python model-engine/tools/import_supervised_artifact.py
```

Essa ferramenta copia as fontes e o artefato já treinado, atualiza os hashes e
confere a recarga. Os módulos `modelo_olimpo.py` e `metadados_spacy.py` preservam
os imports exigidos pelo pickle. O serviço distribuído usa apenas `model-engine/`.

## Reprodução e revisão

```powershell
python -m unittest discover -s model-engine/tests -v
```

Os testes verificam extração contra quatro registros reais do corpus congelado
e suas taxas/contagens; normalização e recorte; limites exatos e valores
adjacentes; ausência versus zero; correspondência de todos os itens; seleção
determinística independente das frequências por classe; procedência e denominadores
das comparações; fidelidade dos 20 padrões aos artefatos congelados; redação simples
preservando todas as condições; HTTP válido, inválido e indisponível.
Os testes de reprodução requerem o ZIP congelado e `features.csv` do run original.
Eles são necessários apenas para verificação, não para servir notícias novas.

`python model-engine/tools/export_unsupervised_catalog.py`
reconstrói o catálogo exclusivamente a partir dos artefatos existentes; não
executa mineração. Se os candidatos mudarem, o script exige revisão dos
templates. Alterações nas fontes também exigem revisão antes da reconstrução.

Validação inicial anterior à separação: os 14 testes do principal e do motor passaram com Python 3.14.4
e as versões de bibliotecas fixadas acima. A imagem Docker também foi construída
e verificada em Linux/Python 3.12: inicialização com hashes intactos, análise
real com três famílias e denominador esperado, `GET /health`, `POST /analyze` e
ausência do corpus e dos outputs de pesquisa na imagem.

Após a separação, passaram 10 testes do motor e cinco do principal científico.
A imagem construída exclusivamente com `model-engine/` foi executada em
Linux/Python 3.12: `/health` respondeu `ok` e `/analyze` retornou três observações,
sem a pasta `machine-learning/` ou a biblioteca de mineração `mlxtend`.
O adaptador HTTP do web-app também recebeu três observações do serviço real.

Na atualização da comparação descritiva, os 13 testes do motor passaram. Nenhum
artefato científico foi modificado e não houve treinamento ou mineração. A revisão
ampliou o catálogo de produto para `sintaxe-ampliada-descriptive-comparison-v3`,
sem acrescentar padrões nem mudar critérios de correspondência ou de seleção.

Na integração supervisionada, a imagem comum passou a Python 3.14.2. A suíte
Linux completa passou com 20 testes dos dois modelos, incluindo equivalência
do artefato supervisionado e preservação das observações. Consulte o
[relatório de validação](../docs/machine-learning/validacao-integracao-supervisionado.md).
