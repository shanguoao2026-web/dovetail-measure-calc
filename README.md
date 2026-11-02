# dovetail-measure-calc

A TypeScript CLI for measuring machined dovetails over two precision rollers.
Requires Node.js 18 or newer. No runtime dependencies.

```sh
npm install
npm test
node dist/cli.js --type male --width 50 --angle 60 --roller 10
```

After building, `npm link` makes `dovetail-measure-calc` available as a command.
`npm run build` compiles TypeScript; `npm test` builds and runs the Node test suite.

All dimensions are in millimetres. Width means the narrow top of a male dovetail
or the narrow opening of a female slot. Angle is measured between flank and base.

```text
Dovetail type: male
Width: 50.000 mm
Angle: 60.000 degrees
Roller diameter: 10.000 mm
k: 2.732
Nominal measurement: 77.321 mm
```

Examples:

```sh
# Female slot: nominal measurement 32.679 mm
node dist/cli.js --type female --width 60 --roller 10

# Actual measurement: width 50.079 mm, deviation +0.079 mm
node dist/cli.js --type male --width 50 --roller 10 --measured 77.400

# 45-degree flanks: k 3.4142, nominal measurement 77.3137 mm
node dist/cli.js --type male --width 50 --angle 45 --roller 8 --decimals 4 --json

node dist/cli.js --help
```

Required options: `--type male|female`, `--width W`, and `--roller d`.
Optional options: `--angle deg` (default 60), `--measured M`, `--decimals n`
(integer 0–6, default 3), `--json`, and `--help`.

The calculation uses `k = 1 + cot(angle / 2)` (angle in degrees).
Male nominal measurement is `W + d*k`; female nominal measurement is `W - d*k`.
Back-calculated width is `M - d*k` for male and `M + d*k` for female.
Deviation is the actual measurement minus the nominal measurement.
Calculations use full precision; rounding happens only for display.

JSON output is one object with numeric fields `width`, `angle`, `roller`, `k`,
`nominalMeasurement`, and string `type`. When `--measured` is supplied it also
includes `measured`, `backCalculatedWidth`, and `deviation`. Numeric fields are
rounded to `--decimals`; JSON does not preserve trailing zeros.

Inputs must be finite numbers. Width and roller diameter must be positive;
angle must be strictly between 0 and 90 degrees. A female nominal measurement
must be positive. Invalid or unknown options, missing values, duplicate options,
and numeric overflow report an error to stderr and exit with status 1.
The coefficient `k` is printed without roller-size warnings.

Licensed under MIT. Copyright (c) 2026 shanguoao2026-web.
