import extracao_funcoes
import requests, zipfile, io
import os
import pandas as pd

url = "https://github.com/roneysco/Fake.br-Corpus/archive/refs/heads/master.zip"
r = requests.get(url)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall(".")  # cria a pasta Fake.br-Corpus-master/
os.listdir(".")
df_true = extracao_funcoes.carregar_textos("Fake.br-Corpus-master/full_texts/true", label=0)
print("Carregamento de textos true realizado com sucesso.")
metadado_true = extracao_funcoes.metaExtractionFromDataset(df_true['texto'])

df_metadados_true = extracao_funcoes.formatarMetadados(metadado_true, "metadados_true.csv")