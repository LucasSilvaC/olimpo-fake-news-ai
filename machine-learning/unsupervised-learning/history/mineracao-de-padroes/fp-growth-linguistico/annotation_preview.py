"""Reproducible small previews of predicted linguistic annotations, not gold labels."""

from pathlib import Path
import re
import unicodedata

import pandas as pd


TOKEN_COLUMNS = ["record_id", "start", "end", "text", "pos", "dep", "head", "lexicaleligible"]


def _markdown(value):
    return str(value).replace("\\", "\\\\").replace("|", "\\|").replace("\n", "\\n").replace("\r", "\\r").replace("`", "\\`")


def write_annotation_preview(records, nlp, output_dir, record_ids=None):
    """Write token CSV and readable snippets for up to 12 supplied training IDs.

    The caller supplies a training-only frame or an explicit list of training
    IDs; this helper does not infer partitions or class from identifiers. If no
    IDs are supplied, it uses the first 12 lexically sorted IDs in ``records``.
    Explicit IDs retain their supplied order and must contain at most 12 unique
    values. The same NFKC/BOM/300-character convention as the experiment applies.
    CSV ``start``/``end`` are character offsets in that normalized snippet;
    ``head`` is the zero-based index of the predicted syntactic head token.
    """
    if not records.index.is_unique:
        raise ValueError("record_id must be unique")
    if not {"text", "author"}.issubset(records.columns):
        raise ValueError("records must contain text and author columns")
    ids = sorted(records.index.tolist())[:12] if record_ids is None else list(record_ids)
    if len(ids) > 12 or len(ids) != len(set(ids)):
        raise ValueError("Supply at most 12 unique training record IDs")
    missing = [rid for rid in ids if rid not in records.index]
    if missing:
        raise ValueError(f"Preview IDs absent from records: {missing}")
    texts = [unicodedata.normalize("NFKC", records.at[rid, "text"]).lstrip("\ufeff")[:300] for rid in ids]
    docs = list(nlp.pipe(texts, batch_size=12))
    if len(docs) != len(ids):
        raise ValueError("nlp.pipe returned a different number of documents")
    rows = []
    markdown = [
        "# Prévia das anotações linguísticas",
        "",
        "**Estas anotações são previsões do spaCy, não uma referência humana validada (gold truth).**",
        "A prévia permite conferir exemplos e identificar erros; sua geração não constitui revisão manual.",
        "",
        "Os IDs de treino são fornecidos pelo experimento. Não houve seleção pela classe. "
        "Textos: normalização NFKC, remoção de BOM inicial e primeiros 300 caracteres.",
        "",
        f"Modelo: `{_markdown(nlp.meta.get('lang', ''))}_{_markdown(nlp.meta.get('name', ''))}`; "
        f"versão `{_markdown(nlp.meta.get('version', ''))}`. Documentos: {len(ids)}.",
        "",
        "No CSV, `start` e `end` indicam offsets de caracteres na janela normalizada; "
        "`head` é o índice do token que funciona como núcleo sintático previsto. "
        "`lexicaleligible` exclui espaços e pontuação, mantendo números. "
        "O CSV contém todos os tokens; as tabelas abaixo mostram os primeiros 12 de cada janela.",
    ]
    for rid, text, doc in zip(ids, texts, docs):
        if doc.text != text:
            raise ValueError(f"Annotation alignment changed at {rid}")
        if len(doc) and not all(doc.has_annotation(key) for key in ("POS", "DEP", "SENT_START")):
            raise ValueError("Pipeline must supply POS, DEP, and sentence annotations")
        token_rows = [{
            "record_id": rid, "start": token.idx, "end": token.idx + len(token.text),
            "text": token.text, "pos": token.pos_, "dep": token.dep_,
            "head": token.head.i,
            "lexicaleligible": not token.is_space and not token.is_punct,
        } for token in doc]
        rows.extend(token_rows)
        fence = "`" * max(3, max([len(match.group()) + 1 for match in re.finditer(r"`+", text)] or [3]))
        markdown.extend([
            "", f"## {_markdown(rid)}", "", fence + "text", text, fence, "",
            "| Token | Início | Fim | POS | DEP | Head | Elegível |",
            "|---|---:|---:|---|---|---:|---|",
        ])
        for token in token_rows[:12]:
            markdown.append(
                f"| {_markdown(token['text'])} | {token['start']} | {token['end']} | "
                f"{_markdown(token['pos'])} | {_markdown(token['dep'])} | {token['head']} | "
                f"{'sim' if token['lexicaleligible'] else 'não'} |"
            )
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    csv_path, md_path = output / "annotation_preview.csv", output / "annotation_preview.md"
    pd.DataFrame(rows, columns=TOKEN_COLUMNS).to_csv(csv_path, index=False, encoding="utf-8")
    md_path.write_text("\n".join(markdown) + "\n", encoding="utf-8")
    return {"csv": str(csv_path), "markdown": str(md_path), "record_ids": ids}
