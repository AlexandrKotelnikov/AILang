"""Optional exact text-token counts using the named encoding, not API telemetry."""
import json,sys
from pathlib import Path
import tiktoken
root=Path(__file__).resolve().parent
enc=tiktoken.get_encoding("o200k_base")
assert len(enc._mergeable_ranks)==199998
assert enc.encode("2 + 2 = 4")==[17,659,220,17,314,220,19]
files=sorted((root/"prompts").glob("*.txt"))+[Path(x) for x in sys.argv[1:]]
print(json.dumps({str(p):len(enc.encode(p.read_text(encoding="utf8"),disallowed_special=())) for p in files},indent=2))
