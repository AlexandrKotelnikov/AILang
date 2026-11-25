import unittest
from score import score,REF
class ScoreTests(unittest.TestCase):
    def setUp(self):
        self.raw="\n".join(x["id"]+"="+x["answer"] for x in REF)
    def test_reference(self):
        self.assertEqual(score(self.raw)["correct"],100)
    def test_missing(self):
        self.assertFalse(score(self.raw.split("\n",1)[1])["strict"])
    def test_duplicate(self):
        a=self.raw.splitlines();a[1]=a[0]
        self.assertFalse(score("\n".join(a))["strict"])
    def test_wrong(self):
        a=self.raw.splitlines();a[0]=a[0].split("=")[0]+"=99999999999999999999"
        self.assertEqual(score("\n".join(a))["correct"],99)
    def test_invalid(self):
        a=self.raw.splitlines();a[0]=a[0].split("=")[0]+"=NaN"
        self.assertFalse(score("\n".join(a))["strict"])
if __name__=="__main__": unittest.main()
