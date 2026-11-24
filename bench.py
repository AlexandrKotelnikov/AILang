#!/usr/bin/env python3
"""Count static ATL reference prompts/traces with a selected real tokenizer."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODES = ('ordinary', 'compact', 'atl')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    group = p.add_mutually_exclusive_group()
    group.add_argument('--encoding', default='o200k_base', help='tiktoken encoding')
    group.add_argument('--hf', help='Hugging Face tokenizer path or model ID')
    p.add_argument('--cases', type=Path, default=ROOT / 'cases.json')
    args = p.parse_args()
    try:
        if args.hf:
            from transformers import AutoTokenizer
            tokenizer = AutoTokenizer.from_pretrained(args.hf)
            count = lambda s: len(tokenizer.encode(s, add_special_tokens=False))
        else:
            import tiktoken
            tokenizer = tiktoken.get_encoding(args.encoding)
            count = lambda s: len(tokenizer.encode(s, disallowed_special=()))
    except ImportError as exc:
        p.error(f'{exc}. Install tiktoken or transformers as appropriate.')
    cases = json.loads(args.cases.read_text(encoding='utf-8'))
    if not cases:
        p.error('No cases provided.')
    instruction = (ROOT / 'system-prompt.txt').read_text(encoding='utf-8')
    overhead = count(instruction)
    totals = {mode: [0, 0] for mode in MODES}
    print('Static reference counts only; not model output or accuracy. Excludes chat framing.')
    print(f'ATL instruction: {overhead} tokens (add each call if included in context).')
    print(f'{"case":20} {"mode":10} {"prompt":>8} {"trace":>8}')
    for case in cases:
        for mode in MODES:
            n, r = count(case[mode]), count(case[mode + '_trace'])
            totals[mode][0] += n
            totals[mode][1] += r
            print(f'{case["id"]:20} {mode:10} {n:8} {r:8}')
    print('\nTotals (prompt + trace, excluding framing):')
    for mode, (n, r) in totals.items():
        print(f'{mode:10} {n:8} + {r:8} = {n+r:8}')
    a = sum(totals['atl'])
    print(f'ATL incl. instruction every case: {a + overhead * len(cases)}')
    print(f'ATL incl. instruction once (idealized shared context): {a + overhead}')
    for mode in ('ordinary', 'compact'):
        b = sum(totals[mode])
        if b:
            print(f'ATL raw reduction vs {mode}: {(1-a/b)*100:.1f}%')
            print(f'ATL reduction incl. instruction every case vs {mode}: {(1-(a+overhead*len(cases))/b)*100:.1f}%')


if __name__ == '__main__':
    main()
