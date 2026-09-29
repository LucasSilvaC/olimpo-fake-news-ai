"""Mineração exploratória de padrões de estilo, sem usar rótulos de classe."""

import argparse
import hashlib
import json
import re
import unicodedata
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path
from zipfile import ZipFile

import numpy as np
import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "unsupervised-learning" / "data"
OUTPUTS = ROOT / "outputs" / "model-comparison"
BASELINE = OUTPUTS / "dbscan-20260924T141332Z" / "run_manifest.json"
WORDS = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)
TOKENS = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*|\d+(?:[.,]\d+)*|[^\w\s]", re.UNICODE)
FEATURES = ["typeTokenRatio", "linkDensity", "punctuationDensity", "uppercaseRatio", "diversidade"]
FAMILIES = {"tem_autor": "metadata", "typeTokenRatio": "lexical", "diversidade": "lexical",
            "linkDensity": "estrutura", "punctuationDensity": "estilo", "uppercaseRatio": "estilo"}


def family(item):
    if item in {"com_autor", "sem_autor"}:
        return "metadata"
    return FAMILIES[item.rsplit("_", 1)[0]]


def style(text, author):
    """Mesmas seis definições de estilo do notebook HDBSCAN, primeiros 300 caracteres."""
    text = unicodedata.normalize("NFKC", text).lstrip("\ufeff")[:300]
    words, tokens = WORDS.findall(text), TOKENS.findall(text)
    nw, nt = len(words), len(tokens)
    distinct = len({word.casefold() for word in words})
    links = len(re.findall(r"https?://\S+", text, flags=re.IGNORECASE))
    uppercase = sum(word.isupper() and len(word) > 1 for word in words)
    ratio = lambda a, b: a / b if b else np.nan
    return {
        "tem_autor": int(str(author).strip().casefold() not in {"", "none", "null", "nan"}),
        "typeTokenRatio": ratio(distinct, nt),
        "linkDensity": ratio(links, nw),
        "punctuationDensity": ratio(nt - nw, nt),
        "uppercaseRatio": ratio(uppercase, nw),
        "diversidade": ratio(distinct, nw),
    }


def read_corpus(archive_path):
    rows = []
    with ZipFile(archive_path) as archive:
        names = archive.namelist()
        for folder in ("fake", "true"):
            marker = f"/full_texts/{folder}/"
            texts = {Path(name).stem: name for name in names if marker in name and name.endswith(".txt")}
            meta_marker = f"/full_texts/{folder}-meta-information/"
            meta = {Path(name).name.removesuffix("-meta.txt"): name for name in names
                    if meta_marker in name and name.endswith("-meta.txt")}
            if set(texts) != set(meta):
                raise ValueError("Textos e metadados não correspondem")
            for stem in sorted(texts):
                author = archive.read(meta[stem]).decode("utf-8").splitlines()[0]
                values = style(archive.read(texts[stem]).decode("utf-8"), author)
                rows.append({"record_id": f"{folder}/{stem}", **values})
    return pd.DataFrame(rows).set_index("record_id")


def transactions(frame, low_q, high_q):
    if not 0 < low_q < high_q < 1:
        raise ValueError("Quantis devem satisfazer 0 < baixo < alto < 1")
    result = pd.DataFrame(index=frame.index)
    thresholds = {}
    result["com_autor"] = frame["tem_autor"].eq(1)
    result["sem_autor"] = frame["tem_autor"].eq(0)
    for feature in FEATURES:
        series = frame[feature].replace([np.inf, -np.inf], np.nan)
        lo, hi = float(series.quantile(low_q)), float(series.quantile(high_q))
        thresholds[feature] = {"low": lo, "high": hi, "missing": int(series.isna().sum())}
        if lo >= hi:  # distribuição degenerada; não fabricar faixas indistinguíveis
            thresholds[feature]["omitted"] = True
            continue
        result[f"{feature}_baixo"] = series.le(lo) & series.notna()
        result[f"{feature}_alto"] = series.ge(hi) & series.notna()
    return result.astype(bool), thresholds


def mine(matrix, min_support, max_len, min_confidence, min_lift, min_jaccard, redundancy_jaccard):
    if not 0 < min_support <= 1 or not 0 <= min_confidence <= 1 or min_lift < 0:
        raise ValueError("Filtros de métricas inválidos")
    if not 0 <= min_jaccard <= 1 or not 0 <= redundancy_jaccard <= 1 or max_len < 2:
        raise ValueError("Limites de Jaccard/tamanho inválidos")
    frequent = fpgrowth(matrix, min_support=min_support, use_colnames=True, max_len=max_len)
    frequent["features"] = frequent.itemsets.map(lambda x: sorted(x))
    frequent["itemset_size"] = frequent.features.map(len)
    frequent["pattern_id"] = frequent.features.map(lambda x: hashlib.sha256(json.dumps(x).encode()).hexdigest()[:12])
    frequent = frequent.sort_values(["support", "itemset_size", "pattern_id"], ascending=[False, False, True])
    if frequent.empty or frequent.itemset_size.max() < 2:
        rules = pd.DataFrame()
    else:
        rules = association_rules(frequent[["support", "itemsets"]], metric="confidence", min_threshold=0)
        rules["jaccard"] = rules["support"] / (rules["antecedent support"] + rules["consequent support"] - rules["support"])
        rules["passes_filters"] = ((rules["lift"] >= min_lift) & (rules["confidence"] >= min_confidence)
                                   & (rules["jaccard"] >= min_jaccard))
        rules["antecedents"] = rules.antecedents.map(lambda x: sorted(x))
        rules["consequents"] = rules.consequents.map(lambda x: sorted(x))
        rules["features"] = rules.apply(lambda row: sorted(row.antecedents + row.consequents), axis=1)
        rules["itemset_size"] = rules.features.map(len)
        rules["rule_size"] = rules.itemset_size
        rules["pattern_id"] = rules.features.map(lambda x: hashlib.sha256(json.dumps(x).encode()).hexdigest()[:12])
        rules = rules.sort_values(["lift", "confidence", "support"], ascending=False)
    # Semelhança de cobertura entre padrões: |A∩B| / |A∪B| nas notícias.
    patterns = frequent[frequent.itemset_size >= 2]
    covers = {row.pattern_id: set(matrix.index[matrix[row.features].all(axis=1)]) for row in patterns.itertuples()}
    redundant = []
    for left, right in combinations(patterns.itertuples(), 2):
        union = covers[left.pattern_id] | covers[right.pattern_id]
        similarity = len(covers[left.pattern_id] & covers[right.pattern_id]) / len(union) if union else 0
        if similarity >= redundancy_jaccard:
            redundant.append({"pattern_id_a": left.pattern_id, "pattern_id_b": right.pattern_id,
                              "features_a": left.features, "features_b": right.features,
                              "coverage_jaccard": similarity})
    similar = pd.DataFrame(redundant, columns=["pattern_id_a", "pattern_id_b", "features_a", "features_b", "coverage_jaccard"])
    return frequent, rules, similar, covers


def consolidate(frequent, rules, covers, similarity_limit=0.75, extension_tolerance=0.03):
    """Agrupa permutações por itemset e marca extensões/coberturas redundantes."""
    patterns = frequent[frequent.itemset_size >= 2].copy().reset_index(drop=True)
    patterns["display_id"] = [f"P{i:02d}" for i in range(1, len(patterns) + 1)]
    rule_groups = {key: group for key, group in rules.groupby("pattern_id")} if not rules.empty else {}
    output = []
    primary_covers = []
    for row in patterns.itertuples():
        current = set(row.features)
        coverage = covers[row.pattern_id]
        related = []
        reasons = []
        closed = True
        for other in patterns.itertuples():
            if other.pattern_id == row.pattern_id:
                continue
            alternative = set(other.features)
            other_cover = covers[other.pattern_id]
            union = coverage | other_cover
            jaccard = len(coverage & other_cover) / len(union) if union else 0.0
            if current < alternative and abs(row.support - other.support) < 1e-12:
                closed = False
            if jaccard >= similarity_limit:
                related.append((other.display_id, jaccard, "cobertura_semelhante"))
            if alternative < current and row.support >= other.support - extension_tolerance:
                related.append((other.display_id, jaccard, "extensao_pouco_informativa"))
        if not closed:
            reasons.append("itemset_nao_fechado")
        if any(kind == "cobertura_semelhante" for _, _, kind in related):
            reasons.append("cobertura_semelhante")
        if any(kind == "extensao_pouco_informativa" for _, _, kind in related):
            reasons.append("extensao_pouco_informativa")
        families = sorted({family(item) for item in row.features})
        if len(families) == 1:
            reasons.append("mesma_familia")
        group = rule_groups.get(row.pattern_id)
        if group is not None:
            associations = [{"antecedents": rule.antecedents, "consequents": rule.consequents,
                             "support": rule.support, "confidence": rule.confidence,
                             "lift": rule.lift, "jaccard": rule.jaccard}
                            for rule in group.head(2).itertuples()]
            inverse = len(group) > 1 and any(
                set(a.antecedents) == set(b.consequents) and set(a.consequents) == set(b.antecedents)
                for a, b in combinations(group.itertuples(), 2))
        else:
            associations, inverse = [], False
        if inverse:
            reasons.append("regras_inversas_agrupadas")
        similarity = max((score for _, score, kind in related if kind == "cobertura_semelhante"), default=0.0)
        level = "alta" if not closed or similarity >= 0.9 else "media" if reasons else "baixa"
        representative = next((display for display, previous_cover in primary_covers
                               if len(coverage & previous_cover) / len(coverage | previous_cover) >= similarity_limit), None)
        if representative is None:
            representative = row.display_id
            primary_covers.append((row.display_id, coverage))
        output.append({"display_id": row.display_id, "pattern_id": row.pattern_id,
                       "representative_id": representative, "is_primary": representative == row.display_id,
                       "features": row.features, "itemset_size": row.itemset_size, "support": row.support,
                       "max_rule_lift": row.max_rule_lift, "max_rule_confidence": row.max_rule_confidence,
                       "max_rule_jaccard": row.max_rule_jaccard, "families": families,
                       "cross_family": len(families) > 1, "closed": closed,
                       "redundancy": level, "redundancy_reasons": reasons,
                       "similar_patterns": sorted(set(display for display, _, _ in related)),
                       "related_details": [{"display_id": display, "coverage_jaccard": score, "reason": kind}
                                           for display, score, kind in related],
                       "rule_count": 0 if group is None else len(group), "main_associations": associations})
    return pd.DataFrame(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--min-support", type=float, default=0.08)
    parser.add_argument("--max-len", type=int, default=3)
    parser.add_argument("--min-confidence", type=float, default=0.5)
    parser.add_argument("--min-lift", type=float, default=1.05)
    parser.add_argument("--min-jaccard", type=float, default=0.1)
    parser.add_argument("--redundancy-jaccard", type=float, default=0.9)
    parser.add_argument("--consolidation-jaccard", type=float, default=0.75)
    parser.add_argument("--extension-tolerance", type=float, default=0.03)
    parser.add_argument("--low-quantile", type=float, default=0.25)
    parser.add_argument("--high-quantile", type=float, default=0.75)
    parser.add_argument("--protocol", choices=["canonical", "temporal"], default="canonical")
    args = parser.parse_args()
    baseline = json.loads(BASELINE.read_text(encoding="utf-8"))
    archive = DATA / f"Fake.br-Corpus-{baseline['corpus']['revision']}.zip"
    if hashlib.sha256(archive.read_bytes()).hexdigest() != baseline["corpus"]["archive_sha256"]:
        raise ValueError("SHA-256 do corpus difere do manifesto DBSCAN")
    all_features = read_corpus(archive)
    partitions = baseline["partitions"]
    protocol = next((key for key in partitions if args.protocol in key), None)
    if protocol is None:
        raise ValueError(f"Protocolo {args.protocol} ausente: {list(partitions)}")
    ids = partitions[protocol]["train"]["record_ids"]
    frame = all_features.loc[ids]
    matrix, thresholds = transactions(frame, args.low_quantile, args.high_quantile)
    frequent, rules, redundant, covers = mine(matrix, args.min_support, args.max_len,
                                               args.min_confidence, args.min_lift,
                                               args.min_jaccard, args.redundancy_jaccard)
    # Para itemsets, confiança/lift/Jaccard dependem de uma divisão em regra.
    # Guardar o melhor valor de regra associada facilita ordenar a tabela de padrões.
    eligible_rules = rules[rules.passes_filters].copy() if not rules.empty else rules
    for metric in ("confidence", "lift", "jaccard"):
        frequent[f"max_rule_{metric}"] = frequent.pattern_id.map(
            eligible_rules.groupby("pattern_id")[metric].max() if not eligible_rules.empty else pd.Series(dtype=float)
        )
    if not 0 <= args.consolidation_jaccard <= 1 or not 0 <= args.extension_tolerance <= 1:
        raise ValueError("Parâmetros de consolidação inválidos")
    consolidated = consolidate(frequent, eligible_rules, covers, args.consolidation_jaccard, args.extension_tolerance)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output = OUTPUTS / f"fp-growth-{stamp}"
    output.mkdir(parents=True, exist_ok=False)
    def save(table, name, json_columns=()):
        table = table.drop(columns=["itemsets"], errors="ignore").copy()
        for column in json_columns:
            if column in table:
                table[column] = table[column].map(json.dumps)
        table.to_csv(output / name, index=False, encoding="utf-8")
    save(frequent, "frequent_itemsets.csv", ["features"])
    save(rules, "association_rules.csv", ["antecedents", "consequents", "features"])
    save(redundant, "similar_patterns.csv", ["features_a", "features_b"])
    save(consolidated, "consolidated_patterns.csv",
         ["features", "families", "redundancy_reasons", "similar_patterns", "related_details", "main_associations"])
    criteria = [{"feature": "tem_autor", "item": "com_autor", "criterion": "author_present == 1",
                 "low_quantile": None, "high_quantile": None, "low_threshold": None, "high_threshold": None,
                 "missing": 0, "omitted": False},
                {"feature": "tem_autor", "item": "sem_autor", "criterion": "author_present == 0",
                 "low_quantile": None, "high_quantile": None, "low_threshold": None, "high_threshold": None,
                 "missing": 0, "omitted": False}]
    for feature, values in thresholds.items():
        for direction, criterion in (("baixo", "value <= low_threshold"), ("alto", "value >= high_threshold")):
            criteria.append({"feature": feature, "item": f"{feature}_{direction}", "criterion": criterion,
                             "low_quantile": args.low_quantile, "high_quantile": args.high_quantile,
                             "low_threshold": values["low"], "high_threshold": values["high"],
                             "missing": values["missing"], "omitted": values.get("omitted", False)})
    save(pd.DataFrame(criteria), "discretization.csv")
    memberships = pd.DataFrame([{"record_id": record_id, "pattern_id": pattern_id}
                                for pattern_id, record_ids in covers.items() for record_id in sorted(record_ids)],
                               columns=["record_id", "pattern_id"])
    save(memberships, "pattern_membership.csv")
    lines = ["# FP-Growth — padrões consolidados", "",
             f"Protocolo: `{protocol}`; notícias: {len(frame)}; sem uso de rótulos.", "",
             "Tabela completa em `consolidated_patterns.csv`; regras e itemsets brutos nos CSVs próprios.", "",
             "| ID | Features | Famílias | Support | Lift máx. | Confidence máx. | Jaccard máx. | Redundância | Semelhantes |",
             "|---|---|---|---:|---:|---:|---:|---|---|"]
    for row in consolidated[consolidated.is_primary].head(30).itertuples():
        fmt = lambda value: f"{value:.4f}" if pd.notna(value) else "—"
        lines.append(f"| {row.display_id} | {{{', '.join(row.features)}}} | {' + '.join(row.families)} | "
                     f"{row.support:.4f} | {fmt(row.max_rule_lift)} | {fmt(row.max_rule_confidence)} | "
                     f"{fmt(row.max_rule_jaccard)} | {row.redundancy} | {', '.join(row.similar_patterns) or '—'} |")
    lines += ["", "## Associações principais", ""]
    for row in consolidated[consolidated.is_primary].head(15).itertuples():
        if row.main_associations:
            lines.append(f"### {row.display_id} — {{{', '.join(row.features)}}}")
            lines.append("")
            for association in row.main_associations:
                lines.append(f"- {{{', '.join(association['antecedents'])}}} → "
                             f"{{{', '.join(association['consequents'])}}}: "
                             f"confidence {association['confidence']:.4f}, lift {association['lift']:.4f}, "
                             f"Jaccard {association['jaccard']:.4f}")
            lines.append("")
    (output / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    manifest = {"method": "mlxtend.frequent_patterns.fpgrowth", "created_utc": datetime.now(timezone.utc).isoformat(),
                "corpus_sha256": baseline["corpus"]["archive_sha256"], "baseline_manifest": str(BASELINE.relative_to(ROOT)),
                "protocol": protocol, "partition": "train", "record_count": len(frame), "parameters": vars(args),
                "features": ["tem_autor", *FEATURES], "character_limit": 300, "thresholds": thresholds,
                "item_count": len(frequent), "rule_count": len(rules), "eligible_rule_count": len(eligible_rules),
                "similar_pair_count": len(redundant),
                "consolidated_pattern_count": len(consolidated), "primary_pattern_count": int(consolidated.is_primary.sum()),
                "feature_families": FAMILIES,
                "discretization_file": "discretization.csv",
                "notes": ["Rótulos não são lidos ou usados no ajuste.", "diversidade baixa expressa maior repetição lexical; não duplicada.",
                          "Subjetividade e exclamações não integram as seis features de estilo existentes.",
                          "Jaccard das regras é interseção/união dos eventos antecedente e consequente; similar_patterns usa cobertura por record_id."]}
    (output / "run_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(output)
    print(f"{len(frequent)} itemsets; {len(rules)} regras; {len(redundant)} pares semelhantes")


if __name__ == "__main__":
    main()
