#Extração de metadados dos textos
import spacy
import pandas as pd
import glob, os
from pathlib import Path
from collections import Counter

npl = spacy.load("pt_core_news_sm")

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

def metaExtractionFromText(text, dependency = True):
    types_counter  = Counter()
    types_counter['META_quant_tokens'] = len(text)
    
    for sentenca in text.sents:
        for token in sentenca:
            if token.pos_:
                types_counter[f"POS_{token.pos_}"] += 1
            if dependency:
                if token.dep_:
                    types_counter[f"DEP_{token.dep_}"] +=1
    return types_counter

def metaExtractionFromDataset(dataframe):
    docs = list(npl.pipe(dataframe, batch_size=20, disable=["ner"]))
    acumulador = Counter()
    for doc in docs:
        acumulador.update(metaExtractionFromText(doc))
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
