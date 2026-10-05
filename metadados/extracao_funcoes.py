#Extração de metadados dos textos
import spacy
import pandas as pd
import glob, os
from pathlib import Path
from collections import Counter

nlp = spacy.load("pt_core_news_sm")

def carregar_textos(pasta, label): 
    registros = []
    for caminho in sorted(glob.glob(os.path.join(pasta, "*.txt"))):
        repWith = ""
        if (label == 0):
            repWith = "t"
        id_noticia = os.path.basename(caminho).replace(".txt", repWith)
        with open(caminho, encoding="utf-8") as f:
            texto = f.read()
        registros.append({"id": id_noticia, "texto": texto, "label": label})
    return pd.DataFrame(registros)

def metaExtractionFromDataset(texts):
    acumulador = Counter()
    for doc in nlp.pipe(texts, batch_size=50): 
        acumulador['META_quant_tokens'] += len(doc) 
        for token in doc: 
            if token.pos_: 
                acumulador[f"POS_{token.pos_}"] += 1 
            if token.dep_: 
                acumulador[f"DEP_{token.dep_}"] += 1 
    return acumulador

def formatarMetadados(metadado_counter, nome_arquivo_csv):
    df = pd.DataFrame(list(metadado_counter.items()), columns=["Chave_Original", "Quantidade"])
    df[['Tipo', 'Tag']] = df['Chave_Original'].str.split('_', n=1, expand=True)
    df = df[['Tipo', 'Tag', 'Quantidade']]
    total_tokens = df.loc[df['Tag'] == 'quant_tokens', 'Quantidade'].values[0]
    df['Porcentagem (%)'] = ((df['Quantidade'] / total_tokens) * 100).round(2)
    df.to_csv(nome_arquivo_csv, index=False, encoding="utf-8")
    print(f"Sucesso! Arquivo '{nome_arquivo_csv}' salvo com as colunas separadas e porcentagens.")
    return df
