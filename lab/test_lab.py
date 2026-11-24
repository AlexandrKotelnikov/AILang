"""Dependency-free plumbing tests; character counts are NOT token metrics."""
import unittest
import lab

class LabTests(unittest.TestCase):
    def test_data(self):
        rows = lab.load_cases()
        self.assertEqual(sum(r["split"]=="dev" for r in rows), 600)
        self.assertEqual(sum(r["split"]=="test" for r in rows), 400)
        for split in ("dev","test"):
            self.assertEqual({r["answer"] for r in rows
                              if r["family"]=="interval" and r["split"]==split}, {"yes","no"})

    def test_render(self):
        fields = [["goal","goal: keep payload exactly"],["result","3"]]
        self.assertEqual(lab.render(fields, dict(lab.BASE,goal="g"), ":"),
                         "g:goal: keep payload exactly\nresult:3")

    def test_search_and_accounting(self):
        rows = lab.load_cases()
        aliases, sep, before, after = lab.optimize([r for r in rows if r["split"]=="dev"],
                                                   len, "per_case")
        self.assertLessEqual(after, before)
        self.assertEqual(len(set(aliases.values())),len(aliases))
        detail, summary = lab.evaluate(rows,len,aliases,sep)
        self.assertEqual(len(detail),5000)
        self.assertEqual(len(summary),10)
        for row in summary:
            self.assertGreaterEqual(row["total_per_case"],row["total_shared_context"])
            self.assertGreaterEqual(row["total_shared_context"],row["raw"])

if __name__ == "__main__":
    unittest.main()
