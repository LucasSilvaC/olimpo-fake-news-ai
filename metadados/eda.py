
import argparse
import shutil
from pathlib import Path
from typing import Callable, Dict, List, Optional, Sequence, Tuple, Union

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from matplotlib.figure import Figure
from matplotlib.patches import Patch
from scipy.linalg import qr
from scipy.stats import mannwhitneyu

# --------------------------------------------------------------------------- #
# Constantes
# --------------------------------------------------------------------------- #
COLUNA_LABEL = "label"
COLUNA_TEXTO = "texto"
PREFIXOS_FEATURE = ("POS_", "DEP_", "MORPH_")

NOMES_CLASSES = {0: "verdadeira", 1: "falsa"}
PALETA = {"verdadeira": "#2a9d8f", "falsa": "#e76f51"}
ORDEM_CLASSES = list(PALETA)

METODOS_CORRELACAO = ("spearman", "pearson")
FATOR_TUKEY = 1.5
LIMITE_VIF_MODERADO = 5
LIMITE_VIF_ALTO = 10
MAX_CLASSES_HISTOGRAMA = 60
LIMITE_CORRELACAO_PADRAO = 0.8
TOLERANCIA_DEPENDENCIA = 1e-8  # fração da variância não explicada (1 - R²)
COR_MANTIDA = "#2a9d8f"
COR_REMOVIDA = "#b0b0b0"

CANDIDATOS_ENTRADA = ("dataset_features.parquet", "dataset_features.csv")
SUBPASTA_GRAFICOS = "graficos"
SUBPASTA_TABELAS = "tabelas"

DESCRICAO = "EDA e seleção de features linguísticas (POS/DEP/MORPH) por relevância."


# --------------------------------------------------------------------------- #
# Carga e preparação
# --------------------------------------------------------------------------- #
def localizar_entrada(entrada: Optional[Union[str, Path]] = None) -> Path:
    """Resolve o arquivo de entrada (padrão: dataset_features.parquet/.csv na pasta atual)."""
    if entrada is not None:
        caminho = Path(entrada)
        if not caminho.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {caminho.resolve()}")
        return caminho

    for nome in CANDIDATOS_ENTRADA:
        if Path(nome).exists():
            return Path(nome)
    raise FileNotFoundError(
        f"Nenhum dataset encontrado em {Path.cwd()} (procurei por {', '.join(CANDIDATOS_ENTRADA)}). "
        "Rode antes o script de extração ou informe o caminho em `entrada`."
    )


def carregar_dataset(caminho: Union[str, Path]) -> pd.DataFrame:
    """Carrega o dataset sem a coluna de texto (a mais pesada em memória)."""
    caminho = Path(caminho)

    if caminho.suffix == ".parquet":
        import pyarrow.parquet as pq

        colunas = [c for c in pq.read_schema(caminho).names if c != COLUNA_TEXTO]
        df = pd.read_parquet(caminho, columns=colunas)
    elif caminho.suffix == ".csv":
        df = pd.read_csv(caminho, usecols=lambda c: c != COLUNA_TEXTO, encoding="utf-8")
    else:
        raise ValueError(f"Formato não suportado: {caminho.suffix} (use .csv ou .parquet)")

    if COLUNA_LABEL not in df.columns:
        raise KeyError(f"Coluna '{COLUNA_LABEL}' não encontrada em {caminho}")

    df[COLUNA_LABEL] = df[COLUNA_LABEL].astype("int8")
    return df


def identificar_colunas_features(df: pd.DataFrame) -> List[str]:
    """Colunas de features (prefixos POS_, DEP_, MORPH_)."""
    return [c for c in df.columns if c.startswith(PREFIXOS_FEATURE)]


def remover_constantes(features: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Remove features sem variância (correlação indefinida e VIF inválido)."""
    mantidas = features.columns[features.nunique() > 1]
    removidas = features.columns.difference(mantidas).tolist()
    return features[mantidas], removidas


def _padronizar(features: pd.DataFrame) -> np.ndarray:
    """Z-score (ddof=0) como matriz float64."""
    return ((features - features.mean()) / features.std(ddof=0)).to_numpy(dtype=float)


def _correlacao(valores: np.ndarray, metodo: str, postos: Optional[np.ndarray] = None) -> np.ndarray:
    """Matriz de correlação via NumPy. Spearman = Pearson dos postos (reaproveitáveis)."""
    if metodo == "spearman":
        if postos is None:
            postos = pd.DataFrame(valores).rank().to_numpy()
        valores = postos
    elif metodo != "pearson":
        raise ValueError(f"Método de correlação inválido: {metodo}")
    return np.corrcoef(valores, rowvar=False)


def _salvar_csv(tabela: pd.DataFrame, caminho: Path, casas: int = 4, **kwargs) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    tabela.round(casas).to_csv(caminho, **kwargs)


# --------------------------------------------------------------------------- #
# EDA: estatísticas descritivas
# --------------------------------------------------------------------------- #
def resumo_descritivo(features: pd.DataFrame, casas_moda: int = 3) -> pd.DataFrame:
    """Estatísticas descritivas vetorizadas, uma linha por feature."""
    quartis = features.quantile([0.25, 0.5, 0.75])
    q1, mediana, q3 = quartis.loc[0.25], quartis.loc[0.5], quartis.loc[0.75]
    iqr = q3 - q1
    n_outliers = ((features < q1 - FATOR_TUKEY * iqr) | (features > q3 + FATOR_TUKEY * iqr)).sum()

    # mode() devolve várias linhas se multimodal: usa a primeira e conta as modas
    modas = features.round(casas_moda).mode()
    media = features.mean()
    desvio_padrao = features.std(ddof=1)

    return pd.DataFrame(
        {
            "media": media,
            "mediana": mediana,
            "moda": modas.iloc[0],
            "n_modas": modas.notna().sum(),
            "desvio_padrao": desvio_padrao,
            "coef_variacao": desvio_padrao / media.replace(0, np.nan),
            "min": features.min(),
            "q1": q1,
            "q3": q3,
            "max": features.max(),
            "iqr": iqr,
            "assimetria": features.skew(),
            "curtose_excesso": features.kurt(),
            "n_outliers_tukey": n_outliers,
            "pct_zeros": (features == 0).mean() * 100,
        }
    )


def resumo_por_classe(features: pd.DataFrame, label: pd.Series) -> pd.DataFrame:
    """`resumo_descritivo` separado por classe."""
    resumos = {
        NOMES_CLASSES[valor]: resumo_descritivo(features[label == valor])
        for valor in sorted(label.unique())
    }
    return pd.concat(resumos, names=["classe", "feature"])


# --------------------------------------------------------------------------- #
# EDA: gráficos
# --------------------------------------------------------------------------- #
def _finalizar_figura(fig: Figure, caminho: Path, mostrar: bool) -> None:
    """Salva, opcionalmente exibe e SEMPRE fecha a figura (evita vazamento de memória)."""
    caminho.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(caminho, dpi=150, bbox_inches="tight")
    if mostrar:
        plt.show()
    plt.close(fig)


def _dividir_por_classe(features: pd.DataFrame, label: pd.Series) -> Dict[str, np.ndarray]:
    """Matrizes (n_classe x p) por classe, calculadas uma vez e reusadas nos gráficos."""
    valores = features.to_numpy(dtype=float)
    return {
        nome: valores[(label == valor).to_numpy()]
        for valor, nome in NOMES_CLASSES.items()
        if (label == valor).any()
    }


def _limites_histograma(valores: np.ndarray) -> np.ndarray:
    """Limites das classes (regra 'auto'), iguais para as duas classes."""
    limites = np.histogram_bin_edges(valores, bins="auto")
    if len(limites) - 1 > MAX_CLASSES_HISTOGRAMA:
        limites = np.histogram_bin_edges(valores, bins=MAX_CLASSES_HISTOGRAMA)
    return limites


def _plotar_em_paginas(
    nomes: List[str],
    plotar_coluna: Callable[[int, plt.Axes], None],
    pasta: Path,
    prefixo: str,
    titulo: str,
    mostrar: bool,
    linhas: int = 3,
    colunas_grade: int = 4,
) -> None:
    """Distribui um gráfico por feature em várias páginas (grade linhas x colunas)."""
    por_pagina = linhas * colunas_grade
    legenda = [Patch(color=cor, label=nome, alpha=0.7) for nome, cor in PALETA.items()]

    for numero, inicio in enumerate(range(0, len(nomes), por_pagina), start=1):
        lote = range(inicio, min(inicio + por_pagina, len(nomes)))
        fig, eixos = plt.subplots(
            linhas, colunas_grade, figsize=(4 * colunas_grade, 3 * linhas), squeeze=False
        )
        eixos = eixos.ravel()

        for eixo, j in zip(eixos, lote):
            plotar_coluna(j, eixo)
            eixo.set_title(nomes[j], fontsize=9)
        for eixo_vazio in eixos[len(lote):]:
            eixo_vazio.set_visible(False)

        fig.suptitle(f"{titulo} (página {numero})", fontsize=13)
        fig.legend(handles=legenda, loc="lower center", ncol=len(legenda), frameon=False)
        fig.tight_layout(rect=(0, 0.04, 1, 0.96))
        _finalizar_figura(fig, pasta / f"{prefixo}_{numero:02d}.png", mostrar)


def plotar_histogramas(
    features: pd.DataFrame, por_classe: Dict[str, np.ndarray], pasta: Path, mostrar: bool = False
) -> None:
    """Histogramas em densidade por classe (comparáveis mesmo com classes desbalanceadas).

    Usa matplotlib puro: bem mais rápido que `sns.histplot` repetido por feature.
    """
    todos = features.to_numpy(dtype=float)

    def plotar(j: int, eixo: plt.Axes) -> None:
        limites = _limites_histograma(todos[:, j])
        for nome in ORDEM_CLASSES:
            if nome in por_classe:
                eixo.hist(
                    por_classe[nome][:, j], bins=limites, density=True, histtype="stepfilled",
                    color=PALETA[nome], alpha=0.35, edgecolor=PALETA[nome], linewidth=0.8,
                )

    _plotar_em_paginas(
        list(features.columns), plotar, pasta, "histograma", "Histogramas por classe", mostrar
    )


def plotar_boxplots(
    features: pd.DataFrame, por_classe: Dict[str, np.ndarray], pasta: Path, mostrar: bool = False
) -> None:
    """Box plots por feature e classe (bigodes = limites de Tukey, 1,5*IQR)."""
    nomes_classes = [n for n in ORDEM_CLASSES if n in por_classe]

    def plotar(j: int, eixo: plt.Axes) -> None:
        caixas = eixo.boxplot(
            [por_classe[n][:, j] for n in nomes_classes],
            whis=FATOR_TUKEY, patch_artist=True, widths=0.6,
            flierprops={"markersize": 2}, medianprops={"color": "black"},
        )
        for caixa, nome in zip(caixas["boxes"], nomes_classes):
            caixa.set(facecolor=PALETA[nome], alpha=0.8, linewidth=0.8)
        eixo.set_xticks(range(1, len(nomes_classes) + 1))
        eixo.set_xticklabels(nomes_classes)

    _plotar_em_paginas(
        list(features.columns), plotar, pasta, "boxplot", "Box plots por classe", mostrar
    )


def selecionar_features_discriminativas(
    features: pd.DataFrame, label: pd.Series, k: int
) -> List[str]:
    """Top-k features com maior |Spearman| com a label (um pair grid p x p seria ilegível)."""
    return features.corrwith(label, method="spearman").abs().nlargest(k).index.tolist()


def plotar_pairgrid(
    features: pd.DataFrame,
    classe: pd.Series,
    colunas: List[str],
    caminho: Path,
    max_amostra: int = 2000,
    semente: int = 42,
    mostrar: bool = False,
) -> None:
    """Pair grid (triângulo inferior + diagonal) com amostra estratificada."""
    dados = features[colunas].assign(classe=classe.to_numpy())
    if len(dados) > max_amostra:
        dados = dados.groupby("classe", group_keys=False).sample(
            frac=max_amostra / len(dados), random_state=semente
        )

    grade = sns.PairGrid(
        dados, vars=colunas, hue="classe", hue_order=ORDEM_CLASSES, palette=PALETA,
        corner=True, diag_sharey=False, height=2.0,
    )
    grade.map_lower(sns.scatterplot, s=8, alpha=0.35, linewidth=0)
    grade.map_diag(sns.histplot, stat="density", common_norm=False, element="step", alpha=0.3)
    grade.add_legend(title="")
    _finalizar_figura(grade.figure, caminho, mostrar)


# --------------------------------------------------------------------------- #
# EDA: correlação e multicolinearidade
# --------------------------------------------------------------------------- #
def calcular_matriz_correlacao(features: pd.DataFrame, metodo: str = "spearman") -> pd.DataFrame:
    """Matriz de correlação como DataFrame (NumPy: ranqueia uma única vez no Spearman)."""
    matriz = _correlacao(features.to_numpy(dtype=float), metodo)
    return pd.DataFrame(matriz, index=features.columns, columns=features.columns)


def plotar_matriz_correlacao(
    correlacao: pd.DataFrame, caminho: Path, metodo: str, mostrar: bool = False
) -> None:
    """Heatmap do triângulo inferior (a matriz é simétrica)."""
    lado = max(8.0, 0.22 * len(correlacao))
    fig, eixo = plt.subplots(figsize=(lado + 2, lado))
    sns.heatmap(
        correlacao, mask=np.triu(np.ones(correlacao.shape, dtype=bool)),
        cmap="vlag", vmin=-1, vmax=1, center=0, square=True, linewidths=0,
        xticklabels=True, yticklabels=True,
        cbar_kws={"shrink": 0.6, "label": f"Correlação de {metodo.capitalize()}"}, ax=eixo,
    )
    eixo.grid(False)
    eixo.tick_params(labelsize=7)
    eixo.set_title(f"Matriz de correlação ({metodo})")
    _finalizar_figura(fig, caminho, mostrar)


def pares_correlacionados(correlacao: pd.DataFrame, limite: float = 0.8) -> pd.DataFrame:
    """Pares com |correlação| >= limite (sem repetição nem diagonal)."""
    valores = correlacao.to_numpy()
    triangulo = np.triu(np.ones(valores.shape, dtype=bool), k=1)
    linhas, colunas = np.where(triangulo & (np.abs(valores) >= limite))
    pares = pd.DataFrame(
        {
            "feature_a": correlacao.index[linhas],
            "feature_b": correlacao.columns[colunas],
            "correlacao": valores[linhas, colunas],
        }
    )
    return pares.sort_values("correlacao", key=np.abs, ascending=False, ignore_index=True)


def encontrar_colunas_redundantes(features: pd.DataFrame) -> List[str]:
    """Colunas que são combinação linear exata de outras (QR com pivoteamento)."""
    _, r, pivos = qr(_padronizar(features), mode="economic", pivoting=True)
    diagonal = np.abs(np.diag(r))
    tolerancia = diagonal[0] * max(features.shape) * np.finfo(float).eps
    posto = int((diagonal > tolerancia).sum())
    return features.columns[pivos[posto:]].tolist()


def calcular_vif(features: pd.DataFrame) -> pd.DataFrame:
    """VIF_j = [R^-1]_jj com uma única inversão da matriz de correlação."""
    if features.shape[1] < 2:
        raise ValueError("O VIF exige pelo menos duas features.")
    try:
        vif = np.diag(np.linalg.inv(np.corrcoef(features.to_numpy(dtype=float), rowvar=False)))
    except np.linalg.LinAlgError as erro:
        raise ValueError(
            "Matriz de correlação singular: remova antes as colunas de "
            "`encontrar_colunas_redundantes`."
        ) from erro

    resultado = pd.DataFrame({"vif": vif}, index=features.columns)
    resultado["r2_explicado_pelas_demais"] = 1 - 1 / resultado["vif"]
    resultado["nivel"] = pd.cut(
        resultado["vif"],
        bins=[-np.inf, LIMITE_VIF_MODERADO, LIMITE_VIF_ALTO, np.inf],
        labels=["baixo", "moderado", "alto"],
    )
    return resultado.sort_values("vif", ascending=False)


def agrupar_por_prefixo(colunas: Sequence[str]) -> Dict[str, List[str]]:
    """{'POS': [...], 'DEP': [...], 'MORPH': [...]} (grupos vazios omitidos)."""
    grupos = {p.rstrip("_"): [c for c in colunas if c.startswith(p)] for p in PREFIXOS_FEATURE}
    return {g: cs for g, cs in grupos.items() if cs}


def calcular_vif_por_grupo(
    features: pd.DataFrame,
) -> Tuple[pd.DataFrame, Dict[str, List[str]]]:
    """VIF por grupo (POS, DEP, MORPH), removendo antes colunas linearmente redundantes."""
    tabelas, excluidas = [], {}
    for grupo, colunas in agrupar_por_prefixo(features.columns).items():
        bloco = features[colunas]
        redundantes = encontrar_colunas_redundantes(bloco) if len(colunas) > 1 else []
        excluidas[grupo] = redundantes
        bloco = bloco.drop(columns=redundantes)
        if bloco.shape[1] < 2:
            print(f"Grupo {grupo}: menos de 2 features úteis, VIF não calculado.")
            continue
        vif = calcular_vif(bloco)
        vif.insert(0, "grupo", grupo)
        tabelas.append(vif)

    if not tabelas:
        raise ValueError("Nenhum grupo com pelo menos 2 features para calcular o VIF.")
    return pd.concat(tabelas).sort_values(["grupo", "vif"], ascending=[True, False]), excluidas


# --------------------------------------------------------------------------- #
# Seleção: relevância
# --------------------------------------------------------------------------- #
def ajustar_benjamini_hochberg(p_valores: np.ndarray) -> np.ndarray:
    """Ajuste de Benjamini-Hochberg (controla a taxa de falsas descobertas)."""
    p_valores = np.asarray(p_valores, dtype=float)
    n = len(p_valores)
    ordem = np.argsort(p_valores)
    escalonado = p_valores[ordem] * n / (np.arange(n) + 1)
    escalonado = np.minimum.accumulate(escalonado[::-1])[::-1]
    ajustados = np.empty(n)
    ajustados[ordem] = np.minimum(escalonado, 1.0)
    return ajustados


def calcular_relevancia(
    features: pd.DataFrame, label: pd.Series, postos: Optional[np.ndarray] = None
) -> pd.DataFrame:
    """Relevância univariada (AUC, |2*AUC-1|, direção, p e p ajustado BH) vs. label binária.

    `postos` (ranks por coluna) pode ser passado para reaproveitar o cálculo
    já feito para a correlação de Spearman.
    """
    eh_falsa = (label == 1).to_numpy()
    n_falsas = int(eh_falsa.sum())
    n_verdadeiras = len(label) - n_falsas
    if n_falsas == 0 or n_verdadeiras == 0:
        raise ValueError("A label precisa ter as duas classes no conjunto usado.")

    if postos is None:
        postos = features.rank(method="average").to_numpy()
    u_falsas = postos[eh_falsa].sum(axis=0) - n_falsas * (n_falsas + 1) / 2
    auc = u_falsas / (n_falsas * n_verdadeiras)

    # Mann-Whitney vetorizado em todas as colunas (scipy >= 1.7)
    valores = features.to_numpy(dtype=float)
    p_valores = np.asarray(
        mannwhitneyu(valores[eh_falsa], valores[~eh_falsa], axis=0, alternative="two-sided").pvalue
    )

    return pd.DataFrame(
        {
            "auc": auc,
            "relevancia": np.abs(2 * auc - 1),
            "direcao": np.where(
                auc > 0.5, "maior em falsas", np.where(auc < 0.5, "maior em verdadeiras", "igual")
            ),
            "p_valor": p_valores,
            "p_ajustado_bh": ajustar_benjamini_hochberg(p_valores),
        },
        index=features.columns,
    )


# --------------------------------------------------------------------------- #
# Seleção: filtro
# --------------------------------------------------------------------------- #
def _residuo_ortogonal(vetor: np.ndarray, base: np.ndarray) -> np.ndarray:
    """Parte de `vetor` ortogonal ao espaço gerado pelas colunas ortonormais de `base`."""
    if base.shape[1] == 0:
        return vetor
    residuo = vetor - base @ (base.T @ vetor)
    return residuo - base @ (base.T @ residuo)  # 2ª passada: estabilidade numérica


def selecionar_features(
    features: pd.DataFrame,
    label: pd.Series,
    metodo: str = "spearman",
    limite_correlacao: float = LIMITE_CORRELACAO_PADRAO,
    n_maximo: Optional[int] = None,
    alpha: Optional[float] = None,
    relevancia_minima: Optional[float] = None,
) -> pd.DataFrame:
    """Filtro guloso por relevância.

    Percorre as features da mais para a menos relevante e remove a que for:
    não significativa (se `alpha`), pouco relevante (se `relevancia_minima`), excedente (se `n_maximo`), correlacionada
    (|r| >= `limite_correlacao`) com uma já mantida, ou combinação linear exata
    de mantidas.

    Args:
        features: features do conjunto de TREINO (sem constantes).
        label: label do conjunto de treino.

    Returns:
        Relatório (índice = feature) ordenado por relevância, com `status`
        ('mantida'/'removida') e `motivo`.
    """
    valores = features.to_numpy(dtype=float)
    postos = features.rank(method="average").to_numpy()  # reaproveitado abaixo

    relatorio = calcular_relevancia(features, label, postos).sort_values(
        "relevancia", ascending=False, kind="mergesort"
    )

    nomes = list(features.columns)
    posicao = {nome: i for i, nome in enumerate(nomes)}
    correlacao = np.abs(_correlacao(valores, metodo, postos))
    padronizado = _padronizar(features)

    base = np.empty((padronizado.shape[0], 0))
    mantidas: List[int] = []
    status = {}

    for nome in relatorio.index:
        i = posicao[nome]

        if alpha is not None and relatorio.at[nome, "p_ajustado_bh"] > alpha:
            status[nome] = ("removida", "sem diferença significativa entre as classes (p ajustado > alpha)")
            continue
        if relevancia_minima is not None and relatorio.at[nome, "relevancia"] < relevancia_minima:
            status[nome] = (
                "removida",
                f"relevância {relatorio.at[nome, 'relevancia']:.3f} < mínimo {relevancia_minima}",
            )
            continue
        if n_maximo is not None and len(mantidas) >= n_maximo:
            status[nome] = ("removida", "limite de n_maximo features atingido")
            continue

        if mantidas:
            correlacoes = correlacao[i, mantidas]
            mais_correlacionada = int(np.argmax(correlacoes))
            if correlacoes[mais_correlacionada] >= limite_correlacao:
                outra = nomes[mantidas[mais_correlacionada]]
                status[nome] = (
                    "removida",
                    f"|r|={correlacoes[mais_correlacionada]:.2f} com {outra} (mais relevante)",
                )
                continue

        vetor = padronizado[:, i]
        residuo = _residuo_ortogonal(vetor, base)
        if float(residuo @ residuo) / float(vetor @ vetor) < TOLERANCIA_DEPENDENCIA:
            status[nome] = ("removida", "combinação linear exata de features já mantidas")
            continue

        base = np.column_stack([base, residuo / np.linalg.norm(residuo)])
        mantidas.append(i)
        status[nome] = ("mantida", "")

    relatorio["status"] = [status[n][0] for n in relatorio.index]
    relatorio["motivo"] = [status[n][1] for n in relatorio.index]
    relatorio.index.name = "feature"
    return relatorio


def plotar_relevancia(relatorio: pd.DataFrame, caminho: Path) -> None:
    """Barras de relevância por feature, destacando as mantidas."""
    dados = relatorio.dropna(subset=["relevancia"])
    cores = [COR_MANTIDA if s == "mantida" else COR_REMOVIDA for s in dados["status"]]

    fig, eixo = plt.subplots(figsize=(8, max(4.0, 0.24 * len(dados) + 1.5)))
    eixo.barh(dados.index, dados["relevancia"], color=cores)
    eixo.invert_yaxis()
    eixo.set(
        xlabel="Relevância |2·AUC − 1|  (0 = sem diferença, 1 = separa as classes)",
        title="Relevância das features para diferenciar as classes",
    )
    eixo.tick_params(axis="y", labelsize=7)
    eixo.grid(axis="x", alpha=0.3)
    eixo.legend(
        handles=[Patch(color=COR_MANTIDA, label="mantida"), Patch(color=COR_REMOVIDA, label="removida")],
        loc="lower right",
    )
    fig.tight_layout()
    _finalizar_figura(fig, caminho, mostrar=False)


# --------------------------------------------------------------------------- #
# Execução
# --------------------------------------------------------------------------- #
def executar_analise(
    df: pd.DataFrame,
    saida: Path,
    metodos_correlacao: Sequence[str] = METODOS_CORRELACAO,
    limite_correlacao: float = LIMITE_CORRELACAO_PADRAO,
    k_pairgrid: int = 6,
    mostrar: bool = False,
    colunas: Optional[Sequence[str]] = None,
) -> None:
    """EDA sobre todas as linhas, restrita às `colunas` informadas (padrão: todas as features)."""
    pasta_graficos = saida / SUBPASTA_GRAFICOS
    pasta_tabelas = saida / SUBPASTA_TABELAS

    colunas = list(colunas) if colunas is not None else identificar_colunas_features(df)
    features, constantes = remover_constantes(df[colunas])
    label = df[COLUNA_LABEL]
    classe = label.map(NOMES_CLASSES)

    print(f"[EDA] {len(df)} textos, {features.shape[1]} features úteis.")
    print("Proporção das classes:\n", classe.value_counts(normalize=True).round(3).to_string())
    if constantes:
        print(f"Features constantes removidas: {constantes}")

    _salvar_csv(resumo_descritivo(features), pasta_tabelas / "resumo_descritivo.csv")
    _salvar_csv(resumo_por_classe(features, label), pasta_tabelas / "resumo_por_classe.csv")

    por_classe = _dividir_por_classe(features, label)
    plotar_histogramas(features, por_classe, pasta_graficos / "01_histogramas", mostrar)
    plotar_boxplots(features, por_classe, pasta_graficos / "02_boxplots", mostrar)

    top = selecionar_features_discriminativas(features, label, k_pairgrid)
    print(f"Features no pair grid: {top}")
    plotar_pairgrid(features, classe, top, pasta_graficos / "03_pairgrid.png", mostrar=mostrar)

    for metodo in metodos_correlacao:
        correlacao = calcular_matriz_correlacao(features, metodo)
        _salvar_csv(correlacao, pasta_tabelas / f"correlacao_{metodo}.csv")
        plotar_matriz_correlacao(
            correlacao, pasta_graficos / f"04_matriz_correlacao_{metodo}.png", metodo, mostrar
        )
        pares = pares_correlacionados(correlacao, limite_correlacao)
        _salvar_csv(pares, pasta_tabelas / f"pares_correlacionados_{metodo}.csv", index=False)
        print(f"[{metodo}] {len(pares)} pares com |r| >= {limite_correlacao}")

    try:
        vif, excluidas = calcular_vif_por_grupo(features)
    except ValueError as erro:  # ex.: nenhum grupo com 2+ features após o filtro
        print(f"VIF ignorado: {erro}")
    else:
        for grupo, cols in excluidas.items():
            if cols:
                print(f"[{grupo}] colunas redundantes excluídas do VIF: {cols}")
        _salvar_csv(vif, pasta_tabelas / "vif_por_grupo.csv")
        for grupo, tabela in vif.groupby("grupo", sort=False):
            print(f"\nVIF - {grupo} (5 maiores):")
            print(tabela.head(5).drop(columns="grupo").round(2).to_string())

    n_figuras = sum(1 for _ in pasta_graficos.rglob("*.png"))
    print(f"\n{n_figuras} gráficos em {pasta_graficos.resolve()}")
    print(f"Tabelas em {pasta_tabelas.resolve()}")


def filtrar_dataset(
    entrada: Union[str, Path],
    selecionadas: Sequence[str],
    caminho_saida: Union[str, Path],
    conjunto: Optional[pd.Series] = None,
) -> pd.DataFrame:
    """Salva um CSV com `label`, `texto`, [`conjunto`] e as features selecionadas.

    `conjunto` ('treino'/'teste'), se informado, deve estar na mesma ordem das
    linhas do arquivo de entrada.

    Lê do arquivo original somente essas colunas (não carrega as demais features).
    """
    entrada = Path(entrada)
    colunas = [COLUNA_LABEL, COLUNA_TEXTO, *selecionadas]
    if entrada.suffix == ".parquet":
        df = pd.read_parquet(entrada, columns=colunas)
    else:
        df = pd.read_csv(entrada, usecols=colunas, encoding="utf-8")[colunas]
    if conjunto is not None:
        df.insert(2, "conjunto", conjunto.to_numpy())
        colunas = list(df.columns)
    caminho_saida = Path(caminho_saida)
    caminho_saida.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(caminho_saida, index=False, encoding="utf-8")
    print(f"Dataset filtrado: {len(df)} linhas x {len(colunas)} colunas -> {caminho_saida.resolve()}")
    return df


def executar_selecao(
    df: pd.DataFrame,
    saida: Path,
    caminho_entrada: Union[str, Path],
    metodo: str = "spearman",
    limite_correlacao: float = LIMITE_CORRELACAO_PADRAO,
    n_maximo: Optional[int] = None,
    alpha: Optional[float] = 0.05,
    relevancia_minima: Optional[float] = 0.05,
    proporcao_treino: float = 0.8,
    semente: int = 42,
) -> pd.DataFrame:
    """Divide (estratificado), seleciona features só no treino e salva os resultados."""
    saida.mkdir(parents=True, exist_ok=True)

    colunas = identificar_colunas_features(df)
    outras = [c for c in df.columns if c not in colunas and c != COLUNA_LABEL]  # ex.: n_tokens

    treino = df.groupby(COLUNA_LABEL, group_keys=False).sample(
        frac=proporcao_treino, random_state=semente
    )
    conjunto = pd.Series("teste", index=df.index, name="conjunto")
    conjunto.loc[treino.index] = "treino"
    conjunto.index.name = "linha"  # posição da linha no arquivo original (0 = 1ª linha de dados)
    conjunto.to_csv(saida / "divisao_treino_teste.csv")  # fixa a divisão para uso posterior
    contagem = pd.crosstab(conjunto, df[COLUNA_LABEL].map(NOMES_CLASSES))
    print("\nDivisão (linhas por conjunto e classe):\n" + contagem.to_string())

    x_treino, constantes = remover_constantes(treino[colunas])
    relatorio = selecionar_features(
        x_treino, treino[COLUNA_LABEL], metodo, limite_correlacao, n_maximo, alpha, relevancia_minima
    )
    if constantes:
        relatorio = pd.concat(
            [
                relatorio,
                pd.DataFrame(
                    {"status": "removida", "motivo": "constante no conjunto de treino"},
                    index=pd.Index(constantes, name="feature"),
                ),
            ]
        )

    selecionadas = relatorio.index[relatorio["status"] == "mantida"].tolist()

    _salvar_csv(relatorio, saida / "relatorio_features.csv", casas=6)
    pd.DataFrame({"feature": selecionadas}).to_csv(saida / "features_selecionadas.csv", index=False)
    reduzido = pd.concat([df[[COLUNA_LABEL]], conjunto, df[outras + selecionadas]], axis=1)
    reduzido.to_csv(saida / "dataset_selecionado.csv", index=False, encoding="utf-8")
    plotar_relevancia(relatorio, saida / "relevancia_features.png")
    filtrar_dataset(caminho_entrada, selecionadas, saida / "dataset_filtrado.csv", conjunto)

    removidas = relatorio[relatorio["status"] == "removida"]
    print(
        f"[Seleção] Treino: {len(treino)} textos | {len(colunas)} features avaliadas -> "
        f"{len(selecionadas)} mantidas, {len(removidas)} removidas"
    )
    print("\nMais relevantes mantidas:")
    print(
        relatorio[relatorio["status"] == "mantida"]
        .head(10)[["relevancia", "direcao", "p_ajustado_bh"]].round(4).to_string()
    )
    if len(removidas):
        print("\nRemovidas (motivo):")
        print(removidas[["motivo"]].head(15).to_string())
    print(f"\nResultados em {saida.resolve()}")
    return relatorio


def executar_pipeline(
    entrada: Optional[Union[str, Path]] = None,
    saida: Union[str, Path] = "saida_features",
    etapas: Sequence[str] = ("eda", "selecao"),
    metodos_correlacao: Sequence[str] = METODOS_CORRELACAO,
    limite_correlacao: float = LIMITE_CORRELACAO_PADRAO,
    k_pairgrid: int = 6,
    metodo_selecao: str = "spearman",
    n_maximo: Optional[int] = None,
    alpha: Optional[float] = 0.05,
    relevancia_minima: Optional[float] = 0.05,
    proporcao_treino: float = 0.8,
    semente: int = 42,
    mostrar: bool = False,
    compactar: bool = True,
    eda_todas: bool = False,
) -> None:
    """Carrega o dataset uma única vez e executa as etapas pedidas."""
    saida = Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    if not mostrar:
        plt.switch_backend("Agg")  # sem janelas: mais rápido e seguro em servidores
    sns.set_theme(style="whitegrid", context="paper")

    caminho_entrada = localizar_entrada(entrada)
    df = carregar_dataset(caminho_entrada)

    selecionadas: Optional[List[str]] = None
    if "selecao" in etapas:
        relatorio = executar_selecao(
            df, saida / "selecao", caminho_entrada, metodo=metodo_selecao,
            limite_correlacao=limite_correlacao, n_maximo=n_maximo, alpha=alpha,
            relevancia_minima=relevancia_minima, proporcao_treino=proporcao_treino, semente=semente,
        )
        selecionadas = relatorio.index[relatorio["status"] == "mantida"].tolist()

    if "eda" in etapas:
        arquivo_lista = saida / "selecao" / "features_selecionadas.csv"
        if not eda_todas and selecionadas is None and arquivo_lista.exists():
            selecionadas = pd.read_csv(arquivo_lista)["feature"].tolist()
        if eda_todas or selecionadas is None:
            selecionadas = None
            print("[EDA] usando TODAS as features (rode a etapa 'selecao' antes para filtrar).")
        else:
            print(f"[EDA] restrita às {len(selecionadas)} features selecionadas.")
        executar_analise(
            df, saida / "eda", metodos_correlacao, limite_correlacao, k_pairgrid, mostrar,
            colunas=selecionadas,
        )

    if "filtrar" in etapas and "selecao" not in etapas:  # reaproveita uma seleção já feita
        lista = pd.read_csv(saida / "selecao" / "features_selecionadas.csv")["feature"].tolist()
        divisao = saida / "selecao" / "divisao_treino_teste.csv"
        conjunto = pd.read_csv(divisao, index_col="linha")["conjunto"] if divisao.exists() else None
        filtrar_dataset(caminho_entrada, lista, saida / "selecao" / "dataset_filtrado.csv", conjunto)

    if compactar:
        arquivo_zip = shutil.make_archive(str(saida), "zip", root_dir=str(saida))
        print(f"Tudo compactado em: {Path(arquivo_zip).resolve()}")


def _ler_argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=DESCRICAO)
    parser.add_argument("--entrada", type=Path, default=None,
                        help="padrão: dataset_features.parquet ou .csv na pasta atual")
    parser.add_argument("--saida", type=Path, default=Path("saida_features"))
    parser.add_argument("--etapas", nargs="+", choices=["eda", "selecao", "filtrar"],
                        default=["eda", "selecao"],
                        help="'filtrar' regera só o CSV filtrado a partir de selecao/features_selecionadas.csv")
    parser.add_argument("--metodos-correlacao", nargs="+", choices=list(METODOS_CORRELACAO),
                        default=list(METODOS_CORRELACAO), help="métodos usados na EDA")
    parser.add_argument("--limite-correlacao", type=float, default=LIMITE_CORRELACAO_PADRAO,
                        help="|r| para listar pares (EDA) e remover redundantes (seleção)")
    parser.add_argument("--k-pairgrid", type=int, default=6)
    parser.add_argument("--metodo-selecao", choices=list(METODOS_CORRELACAO), default="spearman")
    parser.add_argument("--n-maximo", type=int, default=None, help="máximo de features a manter")
    parser.add_argument("--alpha", type=float, default=0.05,
                        help="remove features não significativas (p ajustado > alpha); 1 desativa")
    parser.add_argument("--relevancia-minima", type=float, default=0.05,
                        help="remove features com relevância |2*AUC-1| abaixo disto; 0 desativa")
    parser.add_argument("--eda-todas", action="store_true",
                        help="a EDA usa todas as features em vez das selecionadas")
    parser.add_argument("--proporcao-treino", type=float, default=0.8)
    parser.add_argument("--semente", type=int, default=42)
    parser.add_argument("--mostrar", action="store_true", help="exibe as figuras além de salvar")
    parser.add_argument("--sem-zip", action="store_true", help="não cria o arquivo .zip final")
    # parse_known_args ignora argumentos extras (ex.: `-f kernel.json` do Jupyter)
    argumentos, _ = parser.parse_known_args()
    return argumentos


if __name__ == "__main__":
    args = _ler_argumentos()
    executar_pipeline(
        entrada=args.entrada,
        saida=args.saida,
        etapas=args.etapas,
        metodos_correlacao=args.metodos_correlacao,
        limite_correlacao=args.limite_correlacao,
        k_pairgrid=args.k_pairgrid,
        metodo_selecao=args.metodo_selecao,
        n_maximo=args.n_maximo,
        alpha=args.alpha,
        relevancia_minima=args.relevancia_minima,
        eda_todas=args.eda_todas,
        proporcao_treino=args.proporcao_treino,
        semente=args.semente,
        mostrar=args.mostrar,
        compactar=not args.sem_zip,
    )