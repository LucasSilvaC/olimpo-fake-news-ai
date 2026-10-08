# Motor de execução dos modelos

O serviço aplica o principal `sintaxe_ampliada` a textos novos. Executa equações congeladas em
`models/unsupervised/features.py`, equivalentes à extração e discretização do experimento: normalização NFKC,
remoção de BOM apenas no início e os primeiros 300 caracteres. Não minera regras,
recalcula quantis ou recebe classe, gabarito e autor durante uma análise.

`models/unsupervised/assets/product_catalog.json` é um artefato separado do catálogo científico. Contém os
20 `review_candidate` do run `fp-growth-metadados-ampliados-20261008T002311Z`,
os limites congelados e textos de observação/perguntas revisados tecnicamente
pelos agentes que implementaram a integração. Seu status é
`experimental_observation_only`; **não houve aprovação editorial humana**.
O catálogo científico continua `research_only` e não é sobrescrito.

As observações descrevem somente anotações e medidas da janela. Ausência de uma
anotação não implica ausência na notícia completa. As perguntas convidam o
jogador a identificar afirmações, contexto e fontes. A resposta não inclui
classificação, probabilidade, composição por classe ou conclusão de veracidade.
`comparisonEnabled` permanece falso.

## Organização e próximo modelo

```text
model-engine/
├── service.py                         # Serviço HTTP interno
├── models/
│   └── unsupervised/
│       ├── engine.py                  # Matcher e seleção de perguntas
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

O modelo supervisionado poderá ser integrado como outro módulo em
`models/supervised/`, com seus artefatos e contrato próprios, usando o mesmo
serviço. Essa integração ainda não está implementada. O contrato `/analyze`
atual permanece dedicado às observações socráticas do não supervisionado.
Não combinamos scores supervisionados com padrões linguísticos automaticamente.

Apenas a ferramenta de exportação offline e os testes de reprodução acessam
`machine-learning/`. O exportador compara as equações de runtime com as fontes
científicas antes de empacotar o catálogo e exige revisão caso elas divirjam.

## Executar localmente

Instale Python 3.12 ou posterior e as dependências na raiz do repositório:

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
`extractorVersion` e `comparisonEnabled: false` quando o motor está pronto.
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
`reflectionQuestions`, `redundancyFamily` e `measurements`.
Cada medição registra `feature`, `label`, `value`, `operator`, `threshold`,
`denominator` e, quando disponíveis, `count` e `denominatorCount`.
As medidas são razões brutas, sem convertê-las em percentuais de veracidade.

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
Não inclui corpus, CSVs de pesquisa nem notebooks. Python 3.12, spaCy 3.8.16,
modelo português 3.8.0, NumPy 2.5.3 e pandas 3.0.6 estão fixados. O motor não usa mlxtend ou scripts de mineração.
O serviço valida as versões do spaCy/modelo e o SHA-256 da extração/discretização do runtime ao
inicializar; hashes das fontes científicas são mantidos como procedência. As demais dependências transitivas são resolvidas pelo pip.

## Reprodução e revisão

```powershell
python -m unittest discover -s model-engine/tests -v
```

Os testes verificam extração contra quatro registros reais do corpus congelado
e suas taxas/contagens; normalização e recorte; limites exatos e valores
adjacentes; ausência versus zero; correspondência de todos os itens; seleção
determinística; catálogo sem dados de classe; HTTP válido, inválido e indisponível.
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
