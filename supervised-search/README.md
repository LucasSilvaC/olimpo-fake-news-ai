# Buscas supervisionadas em Python

Estes scripts executam fora do Jupyter o mesmo fluxo dos notebooks `06_Grid_Search.ipynb` e `07_Random_Search.ipynb`. As tabelas aparecem no terminal e os gráficos, quando habilitados, são gravados junto aos resultados. Cada execução cria uma pasta própria em `machine-learning/outputs/model-comparison/`.

## Preparar o ambiente

Na raiz do repositório, instale as dependências de machine learning:

```powershell
python -m pip install -r machine-learning/requirements.txt
```

Os scripts precisam dos artefatos `dados_preparados.pkl` e `transformers.pkl` criados pelo fluxo `01_Data_Prep.ipynb`.

## Executar

Na raiz do repositório:

```powershell
python .\supervised-search\06_Grid_Search.py
python .\supervised-search\07_Random_Search.py
```

O comportamento padrão mantém as configurações dos notebooks: validação cruzada em 3 folds, até 2 trabalhos paralelos e, no Random Search, 16 candidatos por modelo.

Para usar mais núcleos e pular análises opcionais que fazem ajustes adicionais:

```powershell
python .\supervised-search\06_Grid_Search.py --n-jobs 4 --skip-sensitivity --skip-plots
python .\supervised-search\07_Random_Search.py --n-jobs 4 --iterations 8 --skip-sensitivity --skip-plots
```

`--n-jobs` aumenta o paralelismo e pode exigir mais memória. `--skip-sensitivity` pula a avaliação extra dos hiperparâmetros ao redor do melhor candidato. `--iterations` reduz ou aumenta o número de candidatos do Random Search; valores menores executam menos ajustes e podem produzir resultados diferentes. `--skip-plots` evita gerar imagens. Use `--help` para ver as opções.
