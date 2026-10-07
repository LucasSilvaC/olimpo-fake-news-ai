from contextlib import contextmanager
from pathlib import Path
from typing import Dict, Iterator, List, Sequence, Tuple, Union

import pandas as pd
import spacy
from spacy.attrs import DEP, MORPH, POS
from spacy.language import Language
from spacy.tokens import Doc

MODELO_SPACY = "pt_core_news_sm"
TIPOS_FEATURE = ("POS", "DEP", "MORPH")

# Componentes do pipeline que nunca são usados nas features
COMPONENTES_SEMPRE_DESNECESSARIOS = ("ner", "lemmatizer")


PASTA_VERDADEIRAS ="Fake.br-Corpus-master/full_texts/true"
PASTA_FALSAS = "Fake.br-Corpus-master/full_texts/fake"  
ARQUIVO_SAIDA = "dataset_features.csv"
NORMALIZAR = True                 


def carregar_modelo(nome_modelo: str = MODELO_SPACY) -> Language:
    """Carrega o modelo spaCy uma única vez."""
    return spacy.load(nome_modelo)


def carregar_textos(pasta: Union[str, Path], label: int) -> pd.DataFrame:
    """Lê todos os arquivos .txt de uma pasta.

    Retorna um DataFrame com as colunas: id, texto, label.
    """
    caminhos = sorted(Path(pasta).glob("*.txt"))
    registros = [
        {
            "id": caminho.stem,
            "texto": caminho.read_text(encoding="utf-8"),
            "label": label,
        }
        for caminho in caminhos
    ]
    return pd.DataFrame(registros, columns=["id", "texto", "label"])


def contar_features_doc(
    doc: Doc,
    usar_pos: bool = True,
    usar_dep: bool = True,
    usar_morph: bool = False,
) -> Dict[str, int]:
    """Conta as features de um único documento (contagem feita em C pelo spaCy)."""
    strings = doc.vocab.strings
    contagem: Dict[str, int] = {}

    if usar_pos:
        for id_etiqueta, quantidade in doc.count_by(POS).items():
            nome = strings[id_etiqueta]
            if nome:
                contagem["POS_" + nome] = quantidade
    if usar_dep:
        for id_etiqueta, quantidade in doc.count_by(DEP).items():
            nome = strings[id_etiqueta]
            if nome:
                contagem["DEP_" + nome] = quantidade
    if usar_morph:
        # Cada análise morfológica distinta é contada uma vez e depois separada
        # em traços (ex.: "Gender=Fem|Number=Sing" -> dois traços).
        for id_etiqueta, quantidade in doc.count_by(MORPH).items():
            for traco in strings[id_etiqueta].split("|"):
                if traco and traco != "_":  # "_" = token sem análise morfológica
                    chave = "MORPH_" + traco
                    contagem[chave] = contagem.get(chave, 0) + quantidade
    return contagem


def _componentes_a_desativar(nlp: Language, usar_dep: bool) -> List[str]:
    """Componentes não usados (só os que existem no pipeline, senão o spaCy dá erro)."""
    candidatos = list(COMPONENTES_SEMPRE_DESNECESSARIOS)
    if not usar_dep:
        candidatos.append("parser")
    return [nome for nome in candidatos if nome in nlp.pipe_names]


@contextmanager
def _zona_de_memoria(nlp: Language, ativa: bool) -> Iterator[None]:
    """Usa `nlp.memory_zone()` (spaCy >= 3.8) para liberar memória entre blocos."""
    if ativa and hasattr(nlp, "memory_zone"):
        with nlp.memory_zone():
            yield
    else:
        yield


def _ordenar_colunas(colunas: Sequence[str]) -> List[str]:
    """Ordena por tipo (POS, DEP, MORPH) e depois alfabeticamente."""
    ordem_tipo = {tipo: i for i, tipo in enumerate(TIPOS_FEATURE)}
    return sorted(colunas, key=lambda col: (ordem_tipo[col.split("_", 1)[0]], col))


def extrair_features(
    textos: Sequence[str],
    nlp: Language,
    usar_pos: bool = True,
    usar_dep: bool = True,
    usar_morph: bool = False,
    normalizar: bool = False,
    tamanho_lote: int = 16,
    tamanho_bloco: int = 100,
    n_processos: int = 1,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Extrai as features de cada texto (uma linha por texto).

    Args:
        textos: textos a processar.
        nlp: modelo spaCy já carregado.
        normalizar: se True, divide cada contagem pelo nº de tokens do texto.
        tamanho_lote: textos por lote enviado ao pipeline (menor = menos memória).
        tamanho_bloco: textos por bloco; entre blocos a memória é liberada.
        n_processos: mantenha 1 em máquinas com pouca RAM (cada processo carrega
            o modelo e devolve os Docs inteiros, o que consome muita memória).

    Returns:
        (features, n_tokens): DataFrame de features e Series com o nº de tokens.
    """
    textos = list(textos)
    total = len(textos)
    desativar = _componentes_a_desativar(nlp, usar_dep)

    linhas: List[Dict[str, int]] = []
    n_tokens: List[int] = []

    for inicio in range(0, total, tamanho_bloco):
        bloco = textos[inicio : inicio + tamanho_bloco]
        with _zona_de_memoria(nlp, ativa=n_processos == 1):
            docs = nlp.pipe(
                bloco, batch_size=tamanho_lote, n_process=n_processos, disable=desativar
            )
            for doc in docs:
                linhas.append(contar_features_doc(doc, usar_pos, usar_dep, usar_morph))
                n_tokens.append(len(doc))
        print("Processados {}/{} textos".format(min(inicio + tamanho_bloco, total), total))

    contagens = pd.DataFrame.from_records(linhas).fillna(0).astype("int32")
    contagens = contagens[_ordenar_colunas(contagens.columns)]
    tokens = pd.Series(n_tokens, dtype="int32", name="n_tokens")

    if normalizar:
        # Divisão vetorizada única (evita criar um dicionário novo por texto)
        return contagens.div(tokens.clip(lower=1), axis=0), tokens
    return contagens, tokens


def construir_dataset(df: pd.DataFrame, nlp: Language, **kwargs) -> pd.DataFrame:
    """Monta o dataset final: label | texto | n_tokens | features.

    `kwargs` são repassados a `extrair_features`.
    """
    features, n_tokens = extrair_features(df["texto"], nlp, **kwargs)
    features.index = df.index
    n_tokens.index = df.index
    return pd.concat([df[["label", "texto"]], n_tokens, features], axis=1)


def main() -> None:
    nlp = carregar_modelo()

    df = pd.concat(
        [
            carregar_textos(PASTA_VERDADEIRAS, label=0),  # verdadeiras = 0
            carregar_textos(PASTA_FALSAS, label=1),       # falsas = 1
        ],
        ignore_index=True,
    )

    dataset = construir_dataset(
        df,
        nlp,
        usar_pos=True,
        usar_dep=True,
        usar_morph=False,
        normalizar=NORMALIZAR,
    )

    dataset.to_csv(ARQUIVO_SAIDA, index=False, encoding="utf-8")
    print(dataset.shape)
    print(dataset.head())


if __name__ == "__main__":
    main()