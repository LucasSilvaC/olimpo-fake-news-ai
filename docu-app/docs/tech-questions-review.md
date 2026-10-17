# Conferência do dossiê tech-questions

Conferido em 09/10/2026 contra código, manifestos, CSVs e saídas persistidas deste repositório. Material consultado: `C:/Users/CUL7CA/Desktop/Eldorado/tech-questions/tech-questions/`, incluindo README e os seis capítulos. O dossiê orientou os tópicos dos dois guias; os números e as respostas publicados usam as evidências do modelo efetivamente adotado. O original externo foi preservado.

Os guias completos estão disponíveis em `/{pt-BR,en,es}/docs/modelo-supervisionado` e `/{pt-BR,en,es}/docs/modelo-nao-supervisionado`. As respostas corrigidas, limitações e fontes estão traduzidas nos três idiomas.

| Material | Problema encontrado | Tratamento nos guias |
|---|---|---|
| README | Reúne experimentos de épocas e protocolos diferentes sob uma defesa única | Identificar modelo, configuração, execução, partição e caráter exploratório de cada resultado |
| 01 — EDA, features e vieses | Atribuição de divisão por grupos ao supervisionado principal; invariância estrita de MATTR; alegação de eliminação de vazamento | Supervisionado usa divisão estratificada por notícia, 5.760/1.440. FP-Growth usa grupos canônicos 4.320/1.440/1.440. MATTR não integra os 24 atributos finais. Taxas/recorte não eliminam todos os vieses |
| 02 — Supervisionado e validação | Cinco folds como ótimo provado; diferença menor que desvio padrão como significância; separabilidade garantida por alta dimensão; tempos universais; teste intocado | Publicar a CV do notebook 12 e distinguir desvio padrão de intervalo/teste estatístico. Explicar o compromisso de projeto e ausência de comparação local com BERT. Manifesto final refaz o ajuste nas 7.200 notícias |
| 03 — Dimensionalidade e generalização | PCA sempre incompatível com esparsidade; OOM inevitável; 70,7% previstos Fake confundido com falso positivo; melhora externa como garantia universal | PCA admite entrada esparsa em alguns solvers. Matriz histórica 5.760×114.301 float64: 5.266.990.080 bytes, sem buffers, não prova OOM. Falso positivo divide somente pelas notícias True. Principal: F1 externo ≈0,638 e AUC ≈0,677, em títulos |
| 04 — Não supervisionado e anomalias | q95 como garantia de 5% de erro em produção; One-Class SVM RBF como hiperesfera rígida; novidade como falsidade; Reliable Negatives como verdades certificadas | Restringir q95 à calibração empírica, sujeita a empates e mudança de domínio. Separar anomalia de falsidade e RN heurísticos de rótulos verificados. Não transportar métricas desses experimentos para o FP-Growth atual |
| 05 — FP-Growth | Oito regras históricas apresentadas como principal; TTR e janela título+lead; uppercaseRatio por caracteres; operadores estritos; consequente Fake; interpretação causal/sensacionalista; velocidade garantida | Principal da raiz: 22 atributos ativos, corpo bruto de 300 caracteres, 523 regras elegíveis, 345 padrões e 20 candidatos no produto. uppercaseRatio conta palavras inteiramente maiúsculas com comprimento >1. Cortes inclusivos ≤Q25/≥Q75. Classe e autoria ficam fora da mineração/ranking. Confidence é coocorrência gramatical |
| 06 — Perguntas de banca | Repete absolutos sobre cegamento, isolamento de narrativas, estilo universal e superioridade dos métodos | Substituir por respostas compatíveis com o código, métricas de cada protocolo, limitações de transferência e validações ainda necessárias |

## Evidências usadas

- Pipeline: `machine-learning/supervised-learning/modelo_olimpo.py` e extrator `support/metadados_spacy.py`.
- CV/teste do principal: `machine-learning/supervised-learning/data/resultados/resultados_selectk_svd500_{cv,teste}.csv`.
- Calibração e reajuste final: `model-engine/models/supervised/assets/olimpo-svm-spacy-chi2k10k-svd500-v1.json`, `serving_manifest.json` e exportador de pesquisa.
- Principal não supervisionado: `machine-learning/unsupervised-learning/fp_growth_principal.py` e notebook da mesma raiz.
- Execução: `machine-learning/outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z/`, especialmente manifesto, discretização, regras, métricas, candidatos, composição e resumo de variantes.
- Produto: `model-engine/models/unsupervised/assets/product_catalog.json`, motores Python, serviço HTTP e integração no `web-app`.
- Teoria: [LinearSVC](https://scikit-learn.org/stable/modules/generated/sklearn.svm.LinearSVC.html), [calibração](https://scikit-learn.org/stable/modules/calibration.html), [PCA](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html) e [FP-Growth do mlxtend](https://rasbt.github.io/mlxtend/user_guide/frequent_patterns/fpgrowth/).

Não foi necessário repetir treinamento ou mineração para publicar estes guias. A conferência das métricas usa os artefatos persistidos; os testes de modelos já executados na auditoria anterior verificam integridade e contratos, sem provar generalização. Resultados históricos não confirmados para o principal não foram reproduzidos como números atuais.

## Atualização dos dados

`pnpm check:models` compara o snapshot com dez fontes, recalcula os F1 macro das 19 matrizes, verifica isolamento dos grupos, frequências count/total, paridade dos seis guias, tabelas e referências locais. Se o joblib estiver presente, também confere seu hash e tamanho exato; se estiver ausente, informa que não verificou o binário.

Depois de uma atualização intencional dos modelos, execute `pnpm check:models --update`, revise texto e traduções à luz dos novos resultados, e execute novamente `pnpm check:models`, `pnpm typecheck`, `pnpm lint` e `pnpm build`. Atualizar somente o snapshot não valida automaticamente a narrativa nem substitui a avaliação científica.

## Validação da publicação local

TypeScript, ESLint, build de produção e `check:models` passaram. As seis rotas retornaram HTTP 200 sem erros JavaScript no navegador. Em cada idioma, o guia supervisionado tem 12 seções e oito tabelas; o FP-Growth tem 13 seções e nove tabelas, incluindo os 20 padrões do catálogo de produto. Foram conferidos links de seção, células preenchidas e ausência de transbordamento horizontal da página em 1.440 px e 390 px; tabelas largas mantêm rolagem própria.

Nesta máquina Windows, o cache padrão do SWC falhou na validação das permissões de um ancestral. Build e servidor funcionaram com um cache dedicado, sem alterar permissões globais ou dependências:

```powershell
$env:SWC_NATIVE_BINDING_CACHE = Join-Path $env:USERPROFILE '.cache/swc-docu-app'
pnpm build
pnpm start --port 3010
```
