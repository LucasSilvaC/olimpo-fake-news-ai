# Dados e caches

- `Fake.br-Corpus-master/`: corpus de referência do treino e da validação interna.
- `dados_preparados.pkl` e `transformers.pkl`: split oficial e configuração de pré-processamento, gerados pelo notebook [`01_Data_Prep.ipynb`](../history/baselines/01_Data_Prep.ipynb).
- `metadados_spacy.parquet` e `metadados_spacy_fakerecogna.parquet`: caches gerados pelo [notebook 10](../history/modelo-final/10_svm_metadados_spacy.ipynb) e lidos pelos experimentos 11 e [12](../12_selectk_svd_svm_spacy.ipynb).
- `FakeRecogna.csv`: conjunto externo baixado pelo notebook quando necessário.

Os notebooks salvam estes artefatos nesta pasta, independentemente de serem abertos pela raiz do repositório ou pela própria pasta do notebook. O exportador do modelo final lê daqui o split preparado e o corpus bruto. Os CSVs atuais ficam na raiz supervisionada e os anteriores em `history/resultados/`.
