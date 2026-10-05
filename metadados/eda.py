import pandas as pd
import matplotlib.pyplot as plt

POS_TAGS = { 'ADJ', 'ADP', 'ADV', 'AUX', 'CCONJ', 'DET', 'INTJ', 'NOUN', 'NUM', 'PART', 'PRON', 'PROPN', 'PUNCT', 'SCONJ', 'SYM', 'VERB', 'X' } 
#def collectMetadado(metadados, information):
#    return  {chave: valor for chave, valor in metadados.items() if chave == information}

def collectMetadado(df, tipo='all'): 
    """ Filtra o DataFrame por tipo de metadado do spaCy. 
    Parâmetros: - df: DataFrame lido do CSV (deve conter a coluna 'Metadado')
      - tipo: 'morph', 'pos', 'dep' ou 'all' """ 
    
    df_clean = df[df['Metadado'] != 'quant_tokens'].copy() 
    if tipo == 'pos': # Filtra apenas o que pertence às classes gramaticais (POS) 
        return df_clean[df_clean['Metadado'].isin(POS_TAGS)].reset_index(drop=True) 
    elif tipo == 'dep': # Filtra o que NÃO é morph E NÃO é POS (ou seja, é dependência sintática) 
        is_morph = df_clean['Metadado'].str.contains('=', na=False) 
        is_pos = df_clean['Metadado'].isin(POS_TAGS) 
        return df_clean[~is_morph & ~is_pos].reset_index(drop=True) 
    elif tipo == 'all': 
        return df_clean.reset_index(drop=True) 
    else: raise ValueError("O parâmetro 'tipo' deve ser: 'morph', 'pos', 'dep' ou 'all'.")

def taxa_extracao(df, colunas_alvo=None): 
    df_taxas = df.copy()
    if colunas_alvo is None: 
        colunas_possiveis = ['Fake', 'True'] 
        colunas_alvo = [col for col in colunas_possiveis if col in df_taxas.columns]
        if not colunas_alvo: 
            colunas_alvo = [col for col in df_taxas.columns if col != 'Metadado'] 
    linha_tokens = df_taxas[df_taxas['Metadado'] == 'quant_tokens'] 
    if linha_tokens.empty: 
        raise ValueError("A linha 'quant_tokens' não foi encontrada na coluna 'Metadado'.") 
    for col in colunas_alvo:
        total_tokens = linha_tokens[col].values[0]
        if total_tokens > 0: 
            df_taxas[col] = df_taxas[col] / total_tokens 
    df_taxas = df_taxas[df_taxas['Metadado'] != 'quant_tokens'].reset_index(drop=True) 
    return df_taxas

#def taxa_extracao(df): 
    df_taxas = df.copy() 
    tokens_fake = df_taxas.loc[df_taxas['Metadado'] == 'quant_tokens', 'Fake'].values[0]
    tokens_true = df_taxas.loc[df_taxas['Metadado'] == 'quant_tokens', 'True'].values[0] 
    df_taxas['Fake'] = df_taxas['Fake'] / tokens_fake 
    df_taxas['True'] = df_taxas['True'] / tokens_true  
    df_taxas = df_taxas[df_taxas['Metadado'] != 'quant_tokens'].reset_index(drop=True) 
    return df_taxas


def plotData(titulo, legenda, x_label, y_label, nome_arquivo, df):
    plt.figure(figsize=(14, 7)) 
    ax = df.plot( x=x_label, y=y_label, kind="bar", figsize=(14, 7), width=0.8 ) 

    plt.title(titulo, fontsize=14) 
    plt.xlabel(x_label, fontsize=11) 
    plt.ylabel(y_label, fontsize=11) 
    plt.xticks(rotation=45, ha="right", fontsize=10) 
    plt.legend(legenda) 
    plt.tight_layout() 
    plt.savefig(nome_arquivo, dpi=300, bbox_inches="tight") 
    print("Gráfico gerado em", nome_arquivo)

    
df = pd.read_csv("metadados_fake.csv") 
df_rank = df.sort_values(by='Quantidade', ascending=False)
plotData("Metadados fakenews", ["Notícias Falsas (Fake)"], "Metadado", "Quantidade", "metadados_fakenews.png", df_rank)

df_pos = collectMetadado(df, tipo='pos')
plotData("Metadados fakenews apenas POS", ["Notícias Falsas (Fake)"], "Metadado", "Quantidade", "metadados_fakenews_pos.png", df_pos)

df_dep = collectMetadado(df, tipo='dep')
plotData("Metadados fakenews apenas DEP", ["Notícias Falsas (Fake)"], "Metadado", "Quantidade","metadados_fakenews_dep.png", df_dep)
