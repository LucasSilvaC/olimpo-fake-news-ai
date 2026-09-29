"""Avaliação externa de padrões FP-Growth congelados; não executa mineração."""

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import fisher_exact

from fp_growth import DATA, OUTPUTS, ROOT, read_corpus


def load_discovery(path):
    manifest = json.loads((path / "run_manifest.json").read_text(encoding="utf-8"))
    patterns = pd.read_csv(path / "consolidated_patterns.csv", dtype={"pattern_id": str, "display_id": str})
    criteria = pd.read_csv(path / "discretization.csv").fillna({"criterion": ""})
    membership = pd.read_csv(path / "pattern_membership.csv", dtype=str)
    patterns["features"] = patterns.features.map(json.loads)
    patterns["families"] = patterns.families.map(json.loads)
    if patterns.display_id.duplicated().any() or patterns.pattern_id.duplicated().any():
        raise ValueError("IDs de padrões duplicados")
    if set(membership.pattern_id) - set(patterns.pattern_id):
        raise ValueError("Membership contém padrão ausente da visão consolidada")
    return manifest, patterns, criteria, membership


def apply_criteria(features, criteria):
    """Aplica literalmente os operadores e limites persistidos na descoberta."""
    result = pd.DataFrame(index=features.index)
    for row in criteria.itertuples():
        if bool(row.omitted):
            continue
        if row.criterion == "author_present == 1":
            matched = features.tem_autor.eq(1)
        elif row.criterion == "author_present == 0":
            matched = features.tem_autor.eq(0)
        elif row.criterion == "value <= low_threshold":
            matched = features[row.feature].le(row.low_threshold)
        elif row.criterion == "value >= high_threshold":
            matched = features[row.feature].ge(row.high_threshold)
        else:
            raise ValueError(f"Critério de discretização desconhecido: {row.criterion}")
        result[row.item] = matched.fillna(False).astype(bool)
    return result


def evaluate(discovery, output):
    manifest, patterns, criteria, saved_membership = load_discovery(discovery)
    baseline = json.loads((ROOT / manifest["baseline_manifest"]).read_text(encoding="utf-8"))
    archive = DATA / f"Fake.br-Corpus-{baseline['corpus']['revision']}.zip"
    archive_sha = hashlib.sha256(archive.read_bytes()).hexdigest()
    if archive_sha != manifest["corpus_sha256"]:
        raise ValueError("Corpus difere do SHA-256 da descoberta")
    features = read_corpus(archive)
    items = apply_criteria(features, criteria)
    rows = []
    for pattern in patterns.itertuples():
        if not set(pattern.features).issubset(items.columns):
            raise ValueError(f"Item sem critério persistido: {pattern.display_id}")
        matched = items[pattern.features].all(axis=1)
        rows.extend((record_id, pattern.pattern_id, pattern.display_id)
                    for record_id in items.index[matched])
    computed = pd.DataFrame(rows, columns=["record_id", "pattern_id", "display_id"])
    # A única recomputação é para aplicar thresholds congelados fora do treino.
    train_ids = set(baseline["partitions"][manifest["protocol"]]["train"]["record_ids"])
    expected = set(map(tuple, saved_membership[["record_id", "pattern_id"]].itertuples(index=False, name=None)))
    observed = set(map(tuple, computed.loc[computed.record_id.isin(train_ids),
                                          ["record_id", "pattern_id"]].itertuples(index=False, name=None)))
    if expected != observed:
        raise ValueError(f"Membership do treino diverge da descoberta: {len(expected ^ observed)} pares")
    # Rótulos entram somente depois da validação do membership.
    labels = pd.Series(np.where(features.index.str.startswith("fake/"), "fake", "real"), index=features.index)
    if not features.index.str.match(r"^(fake|true)/").all():
        raise ValueError("record_id com origem desconhecida")
    n_fake, n_real = int(labels.eq("fake").sum()), int(labels.eq("real").sum())
    n_total = len(labels)
    baseline_fake, baseline_real = n_fake / n_total, n_real / n_total
    by_pattern = computed.groupby("pattern_id").record_id.agg(set).to_dict()
    report = []
    for pattern in patterns.itertuples():
        ids = by_pattern.get(pattern.pattern_id, set())
        fake_count = sum(labels.loc[record_id] == "fake" for record_id in ids)
        real_count = len(ids) - fake_count
        fake_pct = fake_count / len(ids) if ids else np.nan
        real_pct = real_count / len(ids) if ids else np.nan
        _, p_value = fisher_exact([[fake_count, real_count], [n_fake - fake_count, n_real - real_count]])
        report.append({"display_id": pattern.display_id, "pattern_id": pattern.pattern_id,
                       "features": pattern.features, "families": pattern.families,
                       "cross_family": pattern.cross_family, "is_primary": pattern.is_primary,
                       "representative_id": pattern.representative_id,
                       "occurrences": len(ids), "support": len(ids) / n_total,
                       "fake_count": fake_count, "real_count": real_count,
                       "fake_pct": fake_pct, "real_pct": real_pct,
                       "baseline_fake_pct": baseline_fake, "baseline_real_pct": baseline_real,
                       "delta_fake": fake_pct - baseline_fake, "delta_real": real_pct - baseline_real,
                       "lift_fake": fake_pct / baseline_fake, "lift_real": real_pct / baseline_real,
                       "discovery_support": pattern.support,
                       "discovery_max_rule_lift": pattern.max_rule_lift,
                       "discovery_max_rule_confidence": pattern.max_rule_confidence,
                       "discovery_max_rule_jaccard": pattern.max_rule_jaccard,
                       "fisher_p": p_value})
    table = pd.DataFrame(report)
    # Benjamini–Hochberg para os padrões avaliados; não altera padrões nem seleção.
    order = np.argsort(table.fisher_p.to_numpy())
    ranked = table.fisher_p.to_numpy()[order] * len(table) / np.arange(1, len(table) + 1)
    adjusted = np.minimum.accumulate(ranked[::-1])[::-1].clip(0, 1)
    table["fisher_q_bh"] = np.nan
    table.loc[table.index[order], "fisher_q_bh"] = adjusted
    table = table.sort_values("display_id")
    per_news = computed.groupby("record_id").display_id.apply(lambda values: sorted(values)).to_dict()
    news = pd.DataFrame({"record_id": features.index,
                         "label": labels.loc[features.index].to_numpy(),
                         "matched_patterns": [per_news.get(record_id, []) for record_id in features.index]})
    news["pattern_count"] = news.matched_patterns.map(len)
    output.mkdir(parents=True, exist_ok=False)
    table.assign(features=table.features.map(json.dumps), families=table.families.map(json.dumps)).to_csv(
        output / "pattern_evaluation.csv", index=False, encoding="utf-8")
    news.assign(matched_patterns=news.matched_patterns.map(json.dumps)).to_csv(
        output / "news_patterns.csv", index=False, encoding="utf-8")
    computed.sort_values(["record_id", "display_id"]).to_csv(output / "pattern_membership.csv", index=False)
    summary = ["# Avaliação externa dos padrões FP-Growth", "",
               f"Descoberta congelada: `{discovery.name}`; notícias: {n_total}; fake: {n_fake}; real: {n_real}.",
               "", "Lift de classe = proporção da classe entre notícias com o padrão / proporção global da classe.",
               "Fisher compara presença/ausência do padrão e classe; q usa Benjamini–Hochberg. Associações são descritivas.", ""]
    for title, subset in (("Maior lift fake", table.sort_values("lift_fake", ascending=False)),
                          ("Maior lift real", table.sort_values("lift_real", ascending=False)),
                          ("Mais próximos da baseline", table.assign(distance=table.delta_fake.abs()).sort_values("distance"))):
        summary += [f"## {title}", "", "| Padrão | Features | Famílias | Ocorrências | Support | Fake % | Real % | Lift fake | Lift real | q BH |",
                    "|---|---|---|---:|---:|---:|---:|---:|---:|---:|"]
        for row in subset.head(10).itertuples():
            summary.append(f"| {row.display_id} | {{{', '.join(row.features)}}} | {' + '.join(row.families)} | "
                           f"{row.occurrences} | {row.support:.4f} | {row.fake_pct:.4f} | {row.real_pct:.4f} | "
                           f"{row.lift_fake:.4f} | {row.lift_real:.4f} | {row.fisher_q_bh:.4g} |")
        summary.append("")
    (output / "summary.md").write_text("\n".join(summary), encoding="utf-8")
    result_manifest = {"created_utc": datetime.now(timezone.utc).isoformat(),
                       "discovery_run": discovery.name, "discovery_manifest_sha256": hashlib.sha256(
                           (discovery / "run_manifest.json").read_bytes()).hexdigest(),
                       "corpus_sha256": archive_sha, "membership_train_verified": True,
                       "records": n_total, "fake": n_fake, "real": n_real, "patterns": len(table),
                       "baseline_fake": baseline_fake, "baseline_real": baseline_real,
                       "labels_used_only_after_membership": True,
                       "statistical_test": "two-sided Fisher exact; Benjamini-Hochberg across all evaluated patterns"}
    (output / "run_manifest.json").write_text(json.dumps(result_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(table), n_total


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--discovery-run", type=Path, default=OUTPUTS / "fp-growth-20260929T212058Z")
    args = parser.parse_args()
    discovery = args.discovery_run.resolve()
    if not discovery.is_dir():
        raise FileNotFoundError(discovery)
    output = OUTPUTS / f"fp-growth-evaluation-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    patterns, records = evaluate(discovery, output)
    print(f"{output}: {patterns} padrões, {records} notícias")


if __name__ == "__main__":
    main()
