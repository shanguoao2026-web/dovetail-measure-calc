# dovetail-measure-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) for measuring machined dovetails over two precision rollers (pins).

Inputs (mm / degrees): --type <male|female> (required); --width <W> (required; for male = width across the narrow top of the male dovetail, for female = width across the narrow opening of the female slot); --angle <deg> dovetail angle between flank and base (default 60, must be 0 < angle < 90); --roller <d> roller diameter (required, > 0); optional --measured <M> actual measurement to back-calculate width; --decimals <n> 0..6 (default 3); --json; --help.
Formulas: k = 1 + cot(angle/2). Male: M = W + d·k. Female: M = W - d·k (must be > 0, else error). Back-calc from --measured: male W = M - d·k; female W = M + d·k; also print deviation = measured - nominal M.
Also print the recommended roller size range note: roller must touch the flank, i.e. print a warning (not an error) when d·k > W for male? Skip that — just print k.
- Validate finite numbers; width <= 0, roller <= 0, angle <= 0 or >= 90, unknown type, female result M <= 0, decimals out of range → error to stderr, exit 1.
- Readable text output by default, README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- package.json "bin" must point to the built CLI. npm test must build and pass. No secrets, no personal info.

Check values (must be in tests):
- male W50 angle60 d10 → k 2.7321, M 77.321.
- female W60 angle60 d10 → M 32.679.
- male W50 angle45 d8 → k 3.4142, M 77.314.
- male W50 angle60 d10 measured 77.400 → deviation +0.079, back-calc W 50.079.
- female W20 angle60 d10 (M negative), angle 90, roller 0, type x → exit 1.
