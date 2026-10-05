import extracao_funcoes
import requests, zipfile, io
import os
import pandas as pd

url = "https://github.com/roneysco/Fake.br-Corpus/archive/refs/heads/master.zip"
r = requests.get(url)
z = zipfile.ZipFile(io.BytesIO(r.content))
z.extractall(".")  # cria a pasta Fake.br-Corpus-master/
os.listdir(".")
df_fake = extracao_funcoes.carregar_textos("Fake.br-Corpus-master/full_texts/fake", label=1)
print("Carregamento de textos fake realizado com sucesso.")
metadado_fake = extracao_funcoes.metaExtractionFromDataset(df_fake['texto'])
df_metadados_fake = extracao_funcoes.formatarMetadados(metadado_fake, "metadados_fake.csv")