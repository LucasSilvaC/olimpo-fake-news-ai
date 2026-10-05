# Baselines atuais a incluir

Este inventário aponta para os experimentos já existentes. A IA que implementar os novos métodos deve comparar todos eles no protocolo de [comparison-protocol.md](comparison-protocol.md), usando as mesmas notícias/IDs e o mesmo teste. Não comparar diretamente scores ou métricas de splits incompatíveis.

## Supervisionados

Os notebooks [02_LR_training.ipynb](../supervised-learning/02_LR_training.ipynb), [03_SVM_training.ipynb](../supervised-learning/03_SVM_training.ipynb) e [04_RF_training.ipynb](../supervised-learning/04_RF_training.ipynb) usam quatro configurações de transformers: `word`, `word+char`, `word+meta` e `word+char+meta`. O pré-processamento de referência está em [01_Data_Prep.ipynb](../supervised-learning/01_Data_Prep.ipynb): `texto_trunc` com até 200 palavras, TF-IDF palavras (unigrama/bigrama), TF-IDF caracteres (3–5) e metadados escalados.

No teste final presente nos notebooks, Logistic Regression usa `word+char`, LinearSVC usa `word+char+meta`, e Random Forest usa `word+char`. Reproduzir as configurações do código atual e também selecionar qualquer variante futura somente em validação. Não usar dados do teste para escolher a configuração.

**Atenção ao adaptador de score:** Logistic Regression e Random Forest oferecem probabilidades via `predict_proba`; LinearSVC oferece `decision_function`. O código de Random Forest atual tenta chamar `decision_function`, que não é a interface adequada desse estimador. Na comparação, tratar as interfaces explicitamente e não editar o notebook existente sem necessidade separada.

## Um-classificador/anomalia

- [Isolation Forest atual](../unsupervised-learning/anomaly-detection-isolation-forest.ipynb): ajustado somente com notícias True; features recalculadas sobre primeiros 300 caracteres; score maior = mais anômalo; limiar comparativo q95 das notícias True de validação.
- [LOF atual](../unsupervised-learning/anomaly-detection-local-outlier-factor.ipynb): candidatos `n_neighbors` 10/20/40/80 e `novelty=True`; treino em True, seleção assistida pela validação, controles IF e One-Class SVM.
- [One-Class SVM atual](../unsupervised-learning/anomaly-detection-one-class-svm.ipynb): candidatos `nu` 0.01/0.025/0.05/0.10, scaler e imputação; treino em True; IF é controle.

Os notebooks usam seis features de estilo relacionadas, mas não são todos necessariamente o mesmo protocolo em seus outputs atuais. Reexecutar no split canônico para incluí-los no ranking principal.

## PU Learning

[05_PU_Learning.ipynb](../unsupervised-learning/05_PU_Learning.ipynb) trata Fake conhecidos como positivos, inclui notícias True de treino em U como não rotuladas e busca negativos confiáveis com *spies*. Usa TF-IDF de palavras e caracteres e classificador Random Forest. Preservar seu teste isolado e avaliar no split canônico; qualquer regra de construção de P/U deve usar somente o treino.

## Experimentos anteriores

Arquivos em `unsupervised-learning/consulta-modelos-anteriores/` são histórico/sensibilidade. Podem compor um quadro secundário se forem reexecutados com IDs e split comuns; não usar seus scores já salvos como se fossem do novo teste.

