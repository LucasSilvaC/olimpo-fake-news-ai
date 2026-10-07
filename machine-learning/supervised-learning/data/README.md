# Dados e caches

- `Fake.br-Corpus-master/`: corpus de referência do treino e da validação interna.
- `dados_preparados.pkl` e `transformers.pkl`: split oficial e configuração de pré-processamento, gerados pelo notebook [`01_Data_Prep.ipynb`](../history/baselines/01_Data_Prep.ipynb).
- `metadados_spacy.parquet` e `metadados_spacy_fakerecogna.parquet`: caches das features linguísticas dos experimentos 10–12.
- `FakeRecogna.csv`: conjunto externo baixado pelo notebook quando necessário.

Os notebooks salvam estes artefatos nesta pasta. O exportador do modelo final lê daqui o split preparado e o corpus bruto.
