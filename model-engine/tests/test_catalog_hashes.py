"""Catalog provenance must survive Windows/Linux text checkouts."""
import hashlib
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tools.export_unsupervised_catalog import sha256


class CatalogHashTests(unittest.TestCase):
    def test_lf_and_crlf_text_have_the_same_git_content_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            lf = Path(directory) / "lf.csv"
            crlf = Path(directory) / "crlf.csv"
            content = b"feature,value\nPOS_NOUN,0.25\n"
            lf.write_bytes(content)
            crlf.write_bytes(content.replace(b"\n", b"\r\n"))
            self.assertEqual(sha256(lf), hashlib.sha256(content).hexdigest())
            self.assertEqual(sha256(crlf), sha256(lf))


if __name__ == "__main__":
    unittest.main()
