# ATL-R 0.3: optional reasoning macros

All macros have two proposition identifiers, A and B. A call is a shorthand for a *conditional* rule, not evidence that its premises hold.

| Macro | Required premises | Permitted conclusion |
|---|---|---|
| MP(A,B) | A=>B, A true | B true |
| MT(A,B) | A=>B, B false | A false |
| DS(A,B) | A or B, A false | B true |
| AC(A,B) | A=>B, B true alone | A not determined by these premises |
| DA(A,B) | A=>B, A false alone | B not determined by these premises |

For DS, order the false disjunct first. AC and DA are invalid-inference checks, not deductive proof rules. Additional evidence may establish the otherwise unknown proposition. Do not assume exclusivity for OR. Use regular ATL or ordinary text when the macro preconditions do not hold. Macro labels are experimental and are not proven to save tokens.

Example: given P=>Q and Q false, a visible derivation may be MT(P,Q) followed by FINAL: false when the question asks whether P holds.

The current auditor checks recognized two-identifier calls against the synthetic single-rule cases. It cannot validate arbitrary derivations, malformed macro syntax, multi-step proofs or hidden reasoning.
