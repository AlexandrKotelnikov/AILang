import pathlib, json, tiktoken
root=pathlib.Path(__file__).resolve().parent
enc=tiktoken.get_encoding("o200k_base")
counts={p.stem:len(enc.encode(p.read_bytes().decode("utf-8"))) for p in sorted((root/"prompts").glob("*.txt"))}
print(json.dumps({"encoding":"o200k_base","input_tokens":counts},indent=2))
