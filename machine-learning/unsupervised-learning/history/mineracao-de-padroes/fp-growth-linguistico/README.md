# FP-Growth linguístico — referência anterior

Referência histórica preservada. O [modelo principal atual](../../../fp_growth_principal_sem_autoria.ipynb) acrescenta ADP, AUX, NUM e quatro relações DEP. Esta referência corrigida produziu 152 regras direcionais elegíveis, que foram reproduzidas pelo novo experimento.

O [notebook executado](fp_growth_linguistico_sem_autoria.ipynb) usa os módulos desta pasta:

- `linguistic_features.py`: extração por notícia e auditoria.
- `linguistic_fp_growth.py`: mineração e comparação das variantes.
- `linguistic_stability.py`: redescoberta por reamostragem dos grupos do treino.
- `linguistic_posthoc.py`: descrição posterior por classe e autoria.
- `annotation_preview.py`: prévia das anotações linguísticas.
- `compare_linguistic_rules.py`: ranking posterior por classe, porcentagens, controle descritivo de autoria e gráficos.
- `tests/`: verificações semânticas.

Consulte o [protocolo](../../../docs/modelos/fp-growth-linguistico.md) e o [relatório das regras](RESULTADOS.md). As dependências estão em [`machine-learning/requirements-linguistic.txt`](../../../../requirements-linguistic.txt).

A partir da raiz do repositório, execute os testes com:

```powershell
python -m unittest discover -s machine-learning/unsupervised-learning/history/mineracao-de-padroes/fp-growth-linguistico/tests -p "test_linguistic*.py" -v
```

A comparação por classe está em [COMPARACAO_TOP_REGRAS.md](COMPARACAO_TOP_REGRAS.md): **25 padrões**, com 20 do ranking global e 5 candidatos Fake para contraste. As 152 regras do experimento original permanecem preservadas; este recorte reúne direções com a mesma combinação de atributos.

Para reproduzir a comparação a partir da raiz do repositório, em ambiente com as dependências linguísticas instaladas:

```powershell
python machine-learning/unsupervised-learning/history/mineracao-de-padroes/fp-growth-linguistico/compare_linguistic_rules.py --max-rules 20 --fake-contrast 5 --bootstrap 1000 --permutations 4999
python -m unittest discover -s machine-learning/unsupervised-learning/history/mineracao-de-padroes/fp-growth-linguistico/tests -p "test_rule_ranking.py" -v
```

O script usa por padrão a execução congelada `fp-growth-linguistic-20261006T230752Z` e cria uma nova pasta de saída. `--output` permite definir uma pasta nova ou vazia. A mineração continua sem rótulos; este ranking posterior usa os rótulos da validação.
