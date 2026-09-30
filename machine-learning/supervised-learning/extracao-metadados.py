#Extração de metadados dos textos
import spacy
from pathlib import Path

npl = spacy.load("pt_core_news_sm")

def metaExtraction(text, dependency = True):
    types_counter = {}
    doc = npl(text)
    for sentenca in doc.sents:
        for token in sentenca:
            if token.morph in types_counter:
                types_counter[token.morph] += 1
            else:
                types_counter[token.pos_] = 1
            if dependency:
                if token.dep_ in types_counter:
                    types_counter[token.dep_] +=1
                else:
                    types_counter[token.dep_] =1
    return types_counter

