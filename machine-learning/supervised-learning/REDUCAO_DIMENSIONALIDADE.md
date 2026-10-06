# Redução de dimensionalidade no classificador de fake news

Resumo dos experimentos dos notebooks `05_feature_dim_analysis`, `08_reducao_dim` e `07_teste_externo_fakerecogna`.

**Pergunta:** reduzir o número de features (hoje ~114 mil, para ~5.760 notícias de treino) melhora o F1 ou diminui o gap de generalização do `LinearSVC`?

**Resposta curta:** na validação cruzada interna (Fake.br), não. No teste externo (FakeRecogna), uma redução moderada ajuda um pouco, mas o ganho é pequeno e o modelo continua fraco fora do domínio.

## Setup

- Representação: TF-IDF `word+char`, 114.301 features, ~99,5% esparsa.
- Modelo: `LinearSVC(class_weight="balanced")`, `StratifiedKFold(5, shuffle, random_state=42)`.
- Baseline: F1 treino 1,000, **F1 CV 0,9295**, gap 0,0705.
- Toda redução é ajustada dentro do `Pipeline`, no treino de cada fold (sem vazamento).
- O `PCA` do scikit-learn não aceita matriz esparsa (centralizar a tornaria densa, ~5,3 GB). Usamos **TruncatedSVD (LSA)** + `Normalizer`, que dá a mesma ideia sem centralizar.

## Técnicas comparadas

| Técnica | Tipo | Valores testados |
|---|---|---|
| `min_df` (word × char) | poda de vocabulário | word ∈ {1,2,5,10}, char ∈ {1,3,5,10} |
| TruncatedSVD (PCA) | projeção densa, não supervisionada | d ∈ {2, 3, 5, 10, 20, 50, 100, 200, 300} |
| χ² (`SelectKBest`) | seleção univariada, supervisionada | k de 500 a 80.000 |
| L1 (`SelectFromModel`) | seleção por modelo | C ∈ {0,1; 0,3; 1; 3} |

## O que encontramos

### 1. Validação cruzada interna: a baseline completa vence

| Método | Features | F1 CV | Δ vs base | Gap |
|---|---|---|---|---|
| **Base** | 114.301 | **0,9295** | — | 0,0705 |
| χ² k=80.000 | 80.000 | 0,9291 | −0,0004 | 0,0700 |
| χ² k=50.000 | 50.000 | 0,9288 | −0,0007 | 0,0676 |
| χ² k=10.000 | 10.000 | 0,9189 | −0,0106 | 0,0509 |
| L1 C=1 | 7.854 | 0,9214 | −0,0081 | 0,0668 |
| χ² k=2.000 | 2.000 | 0,8951 | −0,0344 | 0,0297 |
| SVD d=300 | 300 | 0,9062 | −0,0233 | 0,0326 |
| SVD d=50 | 50 | 0,8663 | −0,0632 | 0,0059 |
| SVD d=10 | 10 | 0,7812 | −0,1483 | −0,0013 |
| SVD d=2 | 2 | 0,5482 | −0,3813 | −0,0001 |

- **Nenhuma técnica superou a baseline.** O desvio padrão do F1 CV é ~0,010, então χ² com k ≥ 50.000 empata com ela.
- **`min_df`:** com o `LinearSVC`, ir de 114 mil para ~40 mil features (min_df=10/10) custa só ~0,003 de F1 (0,9259 vs 0,9295). Na `LogisticRegression` a poda melhora levemente o F1 (0,9182 → 0,9205 em 5/5) e reduz o gap, mas a diferença é pequena (~0,002) frente à variação entre folds.
- **Gap × viés:** o gap só fica perto de zero quando o modelo está em *underfitting* (SVD com d ≤ 20, F1 baixo). O gap baixo vem de o modelo não ajustar nem o treino, não de generalizar melhor.
- **SVD vs χ² com o mesmo orçamento de features:** χ² é bem melhor. Com k=2.000 já bate o SVD com 100 componentes (0,8951 vs 0,8838). Os n-gramas específicos de fake news carregam o sinal, e a projeção densa dilui isso.
- **Visualização 2D (d=2):** as duas primeiras componentes explicam só ~0,75% da variância, captam padrões genéricos de linguagem (tamanho, palavras funcionais) e misturam fake e real. O F1 de ~0,55 é praticamente o acaso.
- **Conclusão:** para texto, a alta dimensionalidade esparsa (d ≫ N) é favorável a modelos lineares. Reduzir demais joga fora informação útil.

### 2. Teste externo (FakeRecogna): redução ajuda um pouco

Treino no Fake.br, avaliação em títulos do FakeRecogna (base balanceada, texto normalizado como no `01_Data_Prep`).

| Modelo | Features | F1 externo | AUC | % previsto fake |
|---|---|---|---|---|
| Base | 114.301 | 0,6122 | 0,7072 | 70,7% |
| SVD d=500 | 500 | **0,6518** | 0,7069 | 55,4% |
| SVD d=300 | 300 | 0,6439 | 0,6975 | 55,9% |
| SVD d=50 | 50 | 0,6278 | 0,6804 | 54,6% |
| SVD d=2 | 2 | 0,4004 | 0,4822 | 89,1% |
| χ² k=20.000 | 20.000 | 0,6451 | 0,7115 | 60,2% |
| χ² k=10.000 | 10.000 | 0,6448 | 0,7101 | 57,8% |

- Fora do domínio a baseline prevê "fake" em ~71% dos casos, o que indica viés de domínio. Os 0,93 de F1 interno **não se mantêm** (cai para ~0,61).
- SVD (d=300–500) e χ² (k=10–20 mil) sobem o F1 em ~0,03–0,04 e deixam a proporção de previstos fake mais perto de 50%.
- **O AUC quase não muda (~0,70–0,71).** Boa parte do ganho de F1 vem de um limiar de decisão menos enviesado, não de o modelo ordenar melhor fake e real. O ganho é real, mas modesto.
- Varrer `min_df` e `C` no teste externo também mexe pouco (F1 0,61–0,62 para `min_df`; o `C` baixo piora o F1 por enviesar para fake).
- SVD com d muito baixo (≤ 5) fica no nível do acaso também fora do domínio.

## Conclusões

1. Redução de dimensionalidade **não melhora o F1 interno** e **não reduz o gap de forma útil**: o gap menor aparece junto com underfitting.
2. Se for reduzir, preferir **seleção supervisionada (χ²)** a projeção SVD/PCA. Mantém a identidade dos n-gramas e perde muito menos.
3. Para generalização entre corpora, uma redução moderada (**χ² k≈10–20 mil** ou **SVD d≈300–500**) dá ~+0,03–0,04 de F1 externo. É um ganho pequeno, com AUC praticamente igual.
4. O gargalo real é o **viés de domínio** entre Fake.br e FakeRecogna, que redução de dimensionalidade não resolve.

## Ressalvas

- Os intervalos de desvio padrão (~0,01 na CV) e o tamanho do conjunto externo mantêm diferenças de ~0,01 dentro do ruído. Os ganhos externos devem ser lidos como indicativos.
- Cada configuração externa foi avaliada uma única vez, sem repetição nem intervalo de confiança.
- O SVD só foi testado até d=300 na CV interna (d=500 aparece apenas no teste externo).

## Arquivos

- Notebooks: `05_feature_dim_analysis.ipynb`, `08_reducao_dim.ipynb`, `07_teste_externo_fakerecogna.ipynb`
- Resultados: `resultados_min_df.csv`, `resultados_reducao_dim.csv`, `resultados_externo_dim.csv`, `resultados_externo_pca.csv`, `resultados_teste_externo.csv`
