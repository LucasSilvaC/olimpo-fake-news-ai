"""Regression coverage for notebook and exporter paths after consolidation."""
import ast
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
PRINCIPAL = ROOT / "12_selectk_svd_svm_spacy.ipynb"


def notebook_code(path):
    notebook = json.loads(path.read_text(encoding="utf-8"))
    return ["".join(cell["source"]) for cell in notebook["cells"] if cell["cell_type"] == "code"]


class NotebookPathsTests(unittest.TestCase):
    def test_notebooks_resolve_shared_data_from_all_supported_working_directories(self):
        for notebook in ROOT.rglob("*.ipynb"):
            bootstrap = notebook_code(notebook)[0].split("# Original experiment starts here.")[0]
            for cwd in [REPO, ROOT, notebook.parent]:
                with self.subTest(notebook=notebook.name, cwd=cwd), patch.object(Path, "cwd", return_value=cwd), patch.object(sys, "path", sys.path.copy()):
                    namespace = {}
                    exec(compile(bootstrap, str(notebook), "exec"), namespace)
                    self.assertEqual(namespace["ROOT"], ROOT)
                    self.assertEqual(namespace["DATA"], ROOT / "data")
                    self.assertEqual(namespace["HISTORY_RESULTS"], ROOT / "history/resultados")
                    self.assertIn(str(ROOT), sys.path)

    def test_principal_uses_shared_inputs_and_writes_only_current_results_at_root(self):
        source = "\n".join(notebook_code(PRINCIPAL))
        paths = set()
        namespace = {"ROOT": ROOT, "DATA": ROOT / "data", "HISTORY_RESULTS": ROOT / "history/resultados"}
        for node in ast.walk(ast.parse(source)):
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div) and isinstance(node.left, ast.Name) and node.left.id in namespace:
                paths.add(eval(compile(ast.Expression(node), "<notebook-path>", "eval"), namespace))
        self.assertIn(ROOT / "data/dados_preparados.pkl", paths)
        self.assertIn(ROOT / "data/metadados_spacy.parquet", paths)
        self.assertIn(ROOT / "history/resultados/resultados_svm_meta_cv.csv", paths)
        self.assertIn(ROOT / "resultados_selectk_svd500_cv.csv", paths)
        self.assertIn(ROOT / "resultados_selectk_svd500_teste.csv", paths)
        self.assertNotIn(ROOT / "history/resultados/resultados_selectk_svd500_cv.csv", paths)

    def test_outside_repository_fails_before_any_data_load(self):
        bootstrap = notebook_code(PRINCIPAL)[0].split("# Original experiment starts here.")[0]
        with tempfile.TemporaryDirectory() as directory, patch.object(Path, "cwd", return_value=Path(directory)):
            with self.assertRaises(FileNotFoundError):
                exec(compile(bootstrap, "<bootstrap>", "exec"), {})


class ExporterPathsTests(unittest.TestCase):
    def test_loads_the_configured_data_directory_instead_of_the_current_directory(self):
        import joblib
        import pandas as pd

        with patch.object(sys, "path", [str(ROOT), *sys.path]):
            spec = importlib.util.spec_from_file_location("research_exporter", ROOT / "exportar_modelo.py")
            exporter = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(exporter)
        self.assertEqual(exporter.DATA, ROOT / "data")
        self.assertEqual(exporter.SAIDA, ROOT / "modelos")
        with tempfile.TemporaryDirectory() as directory:
            data = Path(directory)
            for label, text in [("fake", "Uma mensagem 123."), ("true", "Um relato 456.")]:
                folder = data / "Fake.br-Corpus-master/full_texts" / label
                folder.mkdir(parents=True)
                (folder / "1.txt").write_text(text, encoding="utf-8")
            texts = ["Uma mensagem 123.", "Um relato 456."]
            frame = pd.DataFrame({"texto_trunc": [exporter.mo.truncar(exporter.mo.normalizar(text)) for text in texts]})
            joblib.dump((frame.iloc[:1], frame.iloc[1:], pd.Series([1], index=[0]), pd.Series([0], index=[1])), data / "dados_preparados.pkl")
            with patch.object(exporter, "DATA", data):
                train, test, y_train, y_test = exporter.carregar_dados()
            self.assertEqual(train.tolist(), texts[:1])
            self.assertEqual(test.tolist(), texts[1:])
            self.assertEqual(y_train.tolist(), [1])
            self.assertEqual(y_test.tolist(), [0])


if __name__ == "__main__":
    unittest.main()
