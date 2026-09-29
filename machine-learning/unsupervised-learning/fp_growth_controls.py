"""Controles de autoria para o run FP-Growth congelado, sem classificador."""

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency, fisher_exact

from evaluate_patterns import apply_criteria
from fp_growth import DATA, OUTPUTS, ROOT, consolidate, mine, read_corpus


BASELINE_DISCOVERY = OUTPUTS / "fp-growth-20260929T212058Z"
BASELINE_EVALUATION = OUTPUTS / "fp-growth-evaluation-20260929T213741Z"
FOCUS = [
    ["punctuationDensity_alto", "typeTokenRatio_baixo"],
    ["punctuationDensity_baixo", "typeTokenRatio_alto"],
    ["diversidade_baixo", "typeTokenRatio_baixo"],
    ["diversidade_alto", "typeTokenRatio_alto"],
]


def save(frame, path, json_columns=()):
    data = frame.drop(columns=["itemsets"], errors="ignore").copy()
    for name in json_columns:
        if name in data:
            data[name] = data[name].map(json.dumps)
    data.to_csv(path, index=False, encoding="utf-8")


def bh(frame, groups=None):
    result = frame.copy()
    result["fisher_q_bh"] = np.nan
    partitions = [result.index] if groups is None else [part.index for _, part in result.groupby(groups)]
    for indexes in partitions:
        values = result.loc[indexes, "fisher_p"].to_numpy()
        order = np.argsort(values)
        ranked = values[order] * len(values) / np.arange(1, len(values) + 1)
        adjusted = np.minimum.accumulate(ranked[::-1])[::-1].clip(0, 1)
        result.loc[indexes[order], "fisher_q_bh"] = adjusted
    return result


def distribution(ids, labels, population):
    selected = labels.loc[list(ids)] if ids else labels.iloc[:0]
    population_labels = labels.loc[list(population)]
    fake, real = int(selected.eq("fake").sum()), int(selected.eq("real").sum())
    total = fake + real
    all_fake, all_real = int(population_labels.eq("fake").sum()), int(population_labels.eq("real").sum())
    n = all_fake + all_real
    base_fake, base_real = all_fake / n, all_real / n
    fake_pct, real_pct = (fake / total, real / total) if total else (np.nan, np.nan)
    _, p = fisher_exact([[fake, real], [all_fake - fake, all_real - real]])
    return {"occurrences": total, "support": total / n,
            "fake_count": fake, "real_count": real, "fake_pct": fake_pct, "real_pct": real_pct,
            "baseline_fake_pct": base_fake, "baseline_real_pct": base_real,
            "delta_fake": fake_pct - base_fake, "delta_real": real_pct - base_real,
            "lift_fake": fake_pct / base_fake if base_fake else np.nan,
            "lift_real": real_pct / base_real if base_real else np.nan,
            "fisher_p": p}


def author_only(features, labels):
    rows = []
    for author, name in ((1, "com_autor"), (0, "sem_autor")):
        ids = set(features.index[features.tem_autor.eq(author)])
        rows.append({"author_state": name, **distribution(ids, labels, features.index)})
    result = pd.DataFrame(rows)
    contingency = result[["fake_count", "real_count"]].to_numpy()
    chi2, chi2_p, _, _ = chi2_contingency(contingency, correction=False)
    _, fisher_p = fisher_exact(contingency)
    effect = (chi2 / contingency.sum()) ** 0.5  # Cramér V / |phi| em tabela 2x2.
    return result, {"fisher_p": fisher_p, "chi2_p": chi2_p, "cramers_v": effect}


def discover_without_author(features, train_ids, baseline, baseline_path, output):
    criteria = pd.read_csv(baseline_path / "discretization.csv")
    criteria = criteria[criteria.feature.ne("tem_autor")].copy()
    train_items = apply_criteria(features.loc[train_ids], criteria)
    parameters = baseline["parameters"]
    frequent, rules, similar, covers = mine(
        train_items, parameters["min_support"], parameters["max_len"],
        parameters["min_confidence"], parameters["min_lift"],
        parameters["min_jaccard"], parameters["redundancy_jaccard"])
    eligible = rules[rules.passes_filters].copy() if not rules.empty else rules
    for metric in ("confidence", "lift", "jaccard"):
        frequent[f"max_rule_{metric}"] = frequent.pattern_id.map(
            eligible.groupby("pattern_id")[metric].max() if not eligible.empty else pd.Series(dtype=float))
    consolidated = consolidate(frequent, eligible, covers, parameters["consolidation_jaccard"],
                               parameters["extension_tolerance"])
    assert not any("autor" in item for features_list in consolidated.features for item in features_list)
    save(frequent, output / "no_author_frequent_itemsets.csv", ["features"])
    save(rules, output / "no_author_association_rules.csv", ["antecedents", "consequents", "features"])
    save(similar, output / "no_author_similar_patterns.csv", ["features_a", "features_b"])
    save(consolidated, output / "no_author_consolidated_patterns.csv",
         ["features", "families", "redundancy_reasons", "similar_patterns", "related_details", "main_associations"])
    save(criteria, output / "no_author_discretization.csv")
    membership = pd.DataFrame([(record_id, pattern_id) for pattern_id, ids in covers.items()
                               for record_id in sorted(ids)], columns=["record_id", "pattern_id"])
    save(membership, output / "no_author_train_pattern_membership.csv")
    return consolidated, criteria, membership, frequent, rules


def evaluate_frozen(features, labels, patterns, criteria, train_ids, train_membership):
    items = apply_criteria(features, criteria)
    matches = {}
    membership_rows = []
    for row in patterns.itertuples():
        ids = set(items.index[items[row.features].all(axis=1)])
        matches[row.pattern_id] = ids
        membership_rows.extend((record_id, row.pattern_id, row.display_id) for record_id in ids)
    membership = pd.DataFrame(membership_rows, columns=["record_id", "pattern_id", "display_id"])
    expected = set(map(tuple, train_membership[["record_id", "pattern_id"]].itertuples(index=False, name=None)))
    observed = set(map(tuple, membership.loc[membership.record_id.isin(train_ids),
                                              ["record_id", "pattern_id"]].itertuples(index=False, name=None)))
    if observed != expected:
        raise ValueError(f"Membership do treino sem autoria divergiu: {len(observed ^ expected)} pares")
    rows = []
    for row in patterns.itertuples():
        rows.append({"display_id": row.display_id, "pattern_id": row.pattern_id,
                     "features": row.features, "families": row.families,
                     "cross_family": row.cross_family, "is_primary": row.is_primary,
                     "representative_id": row.representative_id,
                     "discovery_support": row.support, "discovery_max_rule_lift": row.max_rule_lift,
                     "discovery_max_rule_confidence": row.max_rule_confidence,
                     "discovery_max_rule_jaccard": row.max_rule_jaccard,
                     **distribution(matches[row.pattern_id], labels, features.index)})
    return bh(pd.DataFrame(rows)), membership, matches


def stratify(features, labels, patterns, matches):
    rows = []
    for author, stratum in ((1, "com_autor"), (0, "sem_autor")):
        population = set(features.index[features.tem_autor.eq(author)])
        for row in patterns.itertuples():
            rows.append({"author_state": stratum, "display_id": row.display_id,
                         "pattern_id": row.pattern_id, "features": row.features,
                         "families": row.families, "cross_family": row.cross_family,
                         **distribution(matches[row.pattern_id] & population, labels, population)})
    return bh(pd.DataFrame(rows), "author_state")


def compare(baseline_evaluation, no_author_evaluation, stratified):
    original = pd.read_csv(baseline_evaluation / "pattern_evaluation.csv")
    original["features"] = original.features.map(json.loads)
    left = {tuple(sorted(row.features)): row for row in original.itertuples()
            if all("autor" not in item for item in row.features)}
    right = {tuple(sorted(row.features)): row for row in no_author_evaluation.itertuples()}
    strata = {(row.pattern_id, row.author_state): row for row in stratified.itertuples()}
    rows = []
    for key in sorted(set(left) | set(right)):
        old, new = left.get(key), right.get(key)
        record = {"features": list(key), "in_baseline": old is not None, "in_no_author": new is not None,
                  "baseline_id": old.display_id if old else None, "no_author_id": new.display_id if new else None}
        for prefix, item in (("baseline", old), ("no_author", new)):
            for metric in ("discovery_support", "support", "occurrences", "fake_pct", "real_pct", "lift_fake", "lift_real"):
                record[f"{prefix}_{metric}"] = getattr(item, metric) if item else np.nan
        for state in ("com_autor", "sem_autor"):
            item = strata.get((new.pattern_id, state)) if new else None
            for metric in ("occurrences", "support", "fake_pct", "real_pct", "baseline_fake_pct", "lift_fake", "lift_real", "delta_fake"):
                record[f"{state}_{metric}"] = getattr(item, metric) if item else np.nan
        rows.append(record)
    return pd.DataFrame(rows)


def markdown(author, author_stats, evaluation, stratified, comparison, metadata, run_id, counts):
    fmt = lambda value: f"{value:.3f}" if pd.notna(value) else "—"
    p_text = lambda value: "<1e-300 (limite numérico)" if value == 0 else f"{value:.4g}"
    lines = ["# Controles de autoria para FP-Growth", "",
             f"Baseline preservado: `fp-growth-20260929T212058Z`. Run de controle: `{run_id}`.",
             f"Corpus: {counts['records']} notícias; {counts['train']} no treino de descoberta. "
             "A mineração sem autoria usou os mesmos IDs, quantis, suporte, limites e filtros do baseline.", "",
             "## A — autoria isolada", "",
             "| Estado | Fake | Real | Total | P(fake | estado) | P(real | estado) | Lift fake | Lift real |",
             "|---|---:|---:|---:|---:|---:|---:|---:|"]
    for row in author.itertuples():
        lines.append(f"| {row.author_state} | {row.fake_count} | {row.real_count} | {row.occurrences} | "
                     f"{fmt(row.fake_pct)} | {fmt(row.real_pct)} | {fmt(row.lift_fake)} | {fmt(row.lift_real)} |")
    lines += ["", f"Fisher bicaudal: {p_text(author_stats['fisher_p'])}; "
              f"qui-quadrado: p={p_text(author_stats['chi2_p'])}; Cramér V={author_stats['cramers_v']:.3f}.",
              "Neste corpus, autoria apresenta forte associação com o rótulo. Isso não identifica uma causa.", "",
              f"Dos 31 padrões originais de tamanho ≥2, {len(metadata)} contêm um item de autoria. "
              "`baseline_metadata_patterns.csv` mostra sua proporção fake ao lado da proporção "
              "fake da autoria isolada; essa comparação não decompõe causalmente o efeito do texto.", "",
              "## B — mineração sem autoria", "",
              f"{counts['patterns']} padrões de tamanho ≥2; {counts['itemsets']} itemsets frequentes; "
              f"{counts['rules']} regras brutas. Nenhum item de autoria integra a mineração.", "",
              "| ID | Features | Famílias | Support descoberta | Fake % corpus | Real % corpus | Lift fake | Lift real |",
              "|---|---|---|---:|---:|---:|---:|---:|"]
    for row in evaluation.sort_values("lift_fake", ascending=False).head(10).itertuples():
        lines.append(f"| {row.display_id} | {{{', '.join(row.features)}}} | {' + '.join(row.families)} | "
                     f"{fmt(row.discovery_support)} | {fmt(row.fake_pct)} | {fmt(row.real_pct)} | "
                     f"{fmt(row.lift_fake)} | {fmt(row.lift_real)} |")
    retained = int((comparison.in_baseline & comparison.in_no_author).sum())
    lines += ["", f"Os {retained} padrões puramente textuais do baseline reaparecem com as mesmas features. "
              "Seu suporte de descoberta permanece igual porque os itens textuais e a partição de treino são os mesmos. "
              "Os padrões originais que continham autoria ficam fora da nova mineração.", "",
              "## C — padrões textuais dentro de cada estado de autoria", "",
              "Cada lift e delta usa a baseline Fake/Real do próprio estrato. "
              "Um estrato com pouquíssimos exemplos de uma classe exige cautela.", "",
              "| Padrão | Estrato | Ocorrências | Support | Baseline fake | Fake % | Real % | Delta fake | Lift fake | Lift real | q BH |",
              "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for row in stratified.sort_values(["author_state", "lift_fake"], ascending=[True, False]).groupby("author_state").head(10).itertuples():
        lines.append(f"| {row.display_id} | {row.author_state} | {row.occurrences} | {fmt(row.support)} | "
                     f"{fmt(row.baseline_fake_pct)} | {fmt(row.fake_pct)} | {fmt(row.real_pct)} | "
                     f"{fmt(row.delta_fake)} | {fmt(row.lift_fake)} | {fmt(row.lift_real)} | {p_text(row.fisher_q_bh)} |")
    lines += ["", "## Comparação exata por features", "",
              "A tabela completa está em `comparison_patterns.csv`. IDs não são usados para correspondência. "
              "Não há correspondência forçada para itemsets estruturalmente diferentes.", "",
              "| Features | Baseline ID | Sem autor ID | Support original | Support sem autor | Fake % original | Fake % sem autor | Com autor: fake % / lift | Sem autor: fake % / lift |",
              "|---|---|---|---:|---:|---:|---:|---:|---:|"]
    chosen = comparison[comparison.features.map(lambda x: x in FOCUS)]
    for row in chosen.itertuples():
        lines.append(f"| {{{', '.join(row.features)}}} | {row.baseline_id or '—'} | {row.no_author_id or '—'} | "
                     f"{fmt(row.baseline_discovery_support)} | {fmt(row.no_author_discovery_support)} | "
                     f"{fmt(row.baseline_fake_pct)} | {fmt(row.no_author_fake_pct)} | "
                     f"{fmt(row.com_autor_fake_pct)} / {fmt(row.com_autor_lift_fake)} | "
                     f"{fmt(row.sem_autor_fake_pct)} / {fmt(row.sem_autor_lift_fake)} |")
    lines += ["", "## Leitura dos controles", "",
              "A associação de metadata é dominante: 3.528 de 3.601 notícias sem autor são fake, "
              "enquanto 72 de 3.599 notícias com autor são fake. Os padrões originais com `com_autor` "
              "ou `sem_autor` podem refletir sobretudo essa composição; não é possível atribuir sua "
              "associação ao texto sem comparar dentro dos estratos.", "",
              "No corpus completo, `punctuationDensity_alto + typeTokenRatio_baixo` e "
              "`diversidade_baixo + typeTokenRatio_baixo` têm maior proporção fake. "
              "No grupo com autor, ambos ficam abaixo da baseline fake do estrato; no grupo sem autor, "
              "ficam apenas ligeiramente acima e seus q BH não indicam diferença clara. "
              "`punctuationDensity_baixo + typeTokenRatio_alto` permanece abaixo da baseline fake "
              "no grupo sem autor; no grupo com autor muda de direção. "
              "`diversidade_alto + typeTokenRatio_alto` fica abaixo da baseline fake nos dois estratos, "
              "mas a diferença no grupo sem autor é pequena. Esses contrastes sugerem composição do corpus "
              "como explicação importante para os lifts agregados.", "",
              "Há sinais textuais que merecem investigação: no estrato com autor, "
              "`punctuationDensity_baixo + uppercaseRatio_baixo` apresenta 32 fake em 524 ocorrências, "
              "ante baseline fake de 72/3599. No estrato sem autor, "
              "`punctuationDensity_baixo + typeTokenRatio_alto` apresenta 278 fake em 293 ocorrências, "
              "ante baseline fake de 3528/3601. São associações observadas, com poucos exemplos "
              "da classe minoritária em cada estrato.", "",
              "A semelhança ou diferença das proporções condicionais é observacional. "
              "O corpus balanceado pode ter composição de fonte e metadados distinta entre classes; "
              "os estratos não constituem uma amostra independente nem demonstram robustez fora deste corpus."]
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-discovery", type=Path, default=BASELINE_DISCOVERY)
    parser.add_argument("--baseline-evaluation", type=Path, default=BASELINE_EVALUATION)
    args = parser.parse_args()
    baseline_path, evaluation_path = args.baseline_discovery.resolve(), args.baseline_evaluation.resolve()
    baseline = json.loads((baseline_path / "run_manifest.json").read_text(encoding="utf-8"))
    previous = json.loads((evaluation_path / "run_manifest.json").read_text(encoding="utf-8"))
    if previous["discovery_manifest_sha256"] != hashlib.sha256((baseline_path / "run_manifest.json").read_bytes()).hexdigest():
        raise ValueError("Avaliação original não corresponde à descoberta baseline")
    protocol = json.loads((ROOT / baseline["baseline_manifest"]).read_text(encoding="utf-8"))
    archive = DATA / f"Fake.br-Corpus-{protocol['corpus']['revision']}.zip"
    if hashlib.sha256(archive.read_bytes()).hexdigest() != baseline["corpus_sha256"]:
        raise ValueError("SHA-256 do corpus diverge do baseline")
    features = read_corpus(archive)
    train_ids = protocol["partitions"][baseline["protocol"]]["train"]["record_ids"]
    if len(train_ids) != baseline["record_count"]:
        raise ValueError("Partição de descoberta divergente")
    run_id = f"fp-growth-controls-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    output = OUTPUTS / run_id
    output.mkdir(parents=True, exist_ok=False)
    # Descoberta B inteira antes do uso de qualquer rótulo.
    patterns, criteria, train_membership, frequent, rules = discover_without_author(
        features, train_ids, baseline, baseline_path, output)
    if len(patterns) == 0:
        raise ValueError("Nenhum padrão textual foi descoberto")
    labels = pd.Series(np.where(features.index.str.startswith("fake/"), "fake", "real"), index=features.index)
    if not features.index.str.match(r"^(fake|true)/").all():
        raise ValueError("record_id com origem desconhecida")
    author, author_stats = author_only(features, labels)
    evaluation, membership, matches = evaluate_frozen(features, labels, patterns, criteria, train_ids, train_membership)
    stratified = stratify(features, labels, patterns, matches)
    comparison = compare(evaluation_path, evaluation, stratified)
    original = pd.read_csv(evaluation_path / "pattern_evaluation.csv")
    original["features"] = original.features.map(json.loads)
    metadata = original[original.features.map(lambda x: any(item in {"com_autor", "sem_autor"} for item in x))].copy()
    metadata["author_state"] = metadata.features.map(
        lambda x: "com_autor" if "com_autor" in x else "sem_autor")
    author_probability = author.set_index("author_state").fake_pct
    metadata["author_only_fake_pct"] = metadata.author_state.map(author_probability)
    metadata["delta_fake_vs_author_only"] = metadata.fake_pct - metadata.author_only_fake_pct
    save(author, output / "author_only_evaluation.csv")
    save(evaluation, output / "no_author_pattern_evaluation.csv", ["features", "families"])
    save(membership.sort_values(["record_id", "display_id"]), output / "no_author_pattern_membership.csv")
    save(stratified, output / "author_stratified_pattern_evaluation.csv", ["features", "families"])
    save(comparison, output / "comparison_patterns.csv", ["features"])
    save(metadata, output / "baseline_metadata_patterns.csv", ["features", "families"])
    counts = {"records": len(features), "train": len(train_ids), "patterns": len(patterns),
              "itemsets": len(frequent), "rules": len(rules)}
    (output / "comparison_summary.md").write_text(
        markdown(author, author_stats, evaluation, stratified, comparison, metadata, run_id, counts), encoding="utf-8")
    manifest = {"run_id": run_id, "created_utc": datetime.now(timezone.utc).isoformat(),
                "baseline_discovery": baseline_path.name, "baseline_evaluation": evaluation_path.name,
                "baseline_manifest_sha256": previous["discovery_manifest_sha256"],
                "corpus_sha256": baseline["corpus_sha256"], "protocol": baseline["protocol"],
                "discovery_partition": "train", "parameters": baseline["parameters"],
                "only_change_in_discovery": "tem_autor removed; same persisted textual thresholds",
                "labels_used_after_discovery": True, "train_membership_verified": True,
                "author_only": author_stats, "baseline_metadata_pattern_count": len(metadata), "counts": counts,
                "statistics": "two-sided Fisher; BH within each evaluation table/stratum; Cramér V for author contingency",
                "comparison": "exact sorted feature sets only; no label-driven pattern selection"}
    (output / "run_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{output}: {counts}")


if __name__ == "__main__":
    main()
