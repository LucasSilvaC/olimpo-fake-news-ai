# Avaliação externa dos padrões FP-Growth

Execute da raiz do repositório:

```bash
python machine-learning/unsupervised-learning/evaluate_patterns.py
```

O padrão de entrada é o run congelado `fp-growth-20260929T212058Z`. Para avaliar outro run que contenha os mesmos artefatos, use `--discovery-run CAMINHO`. O programa **não executa FP-Growth**, não recalcula quantis e não escolhe padrões com base nos rótulos. Ele lê `consolidated_patterns.csv` e `discretization.csv` da descoberta, aplica cada condição a todas as notícias do mesmo ZIP validado por SHA-256 e compara os pares `record_id`/`pattern_id` do treino com `pattern_membership.csv`. Uma divergência interrompe a execução.

Somente após essa conferência, os rótulos são derivados das pastas originais `fake/` e `true/` para calcular a distribuição observada. A população avaliada é o corpus inteiro; os dados do treino de descoberta estão incluídos. Esta é uma análise descritiva sobre o mesmo corpus, não um teste independente de generalização.

Os artefatos ficam em `machine-learning/outputs/model-comparison/fp-growth-evaluation-<UTC>/`:

- `pattern_evaluation.csv`: uma linha por `P01...`, com features/famílias em JSON, suporte e métricas internas da descoberta, contagens e proporções Fake/Real, baselines globais, diferenças em pontos proporcionais, lifts de classe, p de Fisher bicaudal e q com correção Benjamini–Hochberg. Métricas internas de regras vazias indicam que nenhuma regra daquele itemset passou nos filtros da apresentação.
- `news_patterns.csv`: uma linha por `record_id`, label, lista JSON de padrões correspondentes e quantidade. Notícias sem correspondência permanecem na tabela.
- `pattern_membership.csv`: pares de `record_id`, `pattern_id` e `display_id` para o corpus inteiro; permite joins posteriores.
- `summary.md`: padrões ordenados por lift Fake, lift Real e proximidade da baseline, sem atribuir categorias de classe aos padrões.
- `run_manifest.json`: origem da descoberta, hashes, contagens e confirmação da conferência do membership de treino.

O lift Fake é `P(fake | padrão) / P(fake)`; o Real é análogo. Valores próximos de 1 indicam proporção semelhante à baseline. Fisher e q são complementares e não substituem inspeção de efeito, cobertura ou dependências do corpus. Padrões se sobrepõem, logo os testes não são independentes. Autoria é fortemente associada às pastas neste corpus; diferenças ligadas a `sem_autor` podem refletir metadados da fonte em vez de uma propriedade geral de notícias falsas.
