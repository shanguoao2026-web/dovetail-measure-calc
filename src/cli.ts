#!/usr/bin/env node
import { calculate, type Inputs } from './calculate.js';

const help = `Usage: dovetail-measure-calc --type <male|female> --width <W> --roller <d> [options]

Measure dovetails over two precision rollers. Dimensions are in mm.
  --type <male|female>  Required dovetail type
  --width <W>           Required narrow top (male) or opening (female) width
  --roller <d>          Required roller diameter, greater than 0
  --angle <deg>         Flank-to-base angle, 0 < angle < 90 (default: 60)
  --measured <M>        Actual measurement; also calculate width and deviation
  --decimals <n>        Output precision, integer 0..6 (default: 3)
  --json                Print numeric results as JSON
  --help                Show this help

k = 1 + cot(angle/2); male M = W + d*k; female M = W - d*k.
`;

function main(args: string[]): void {
  if (args.includes('--help')) { process.stdout.write(help); return; }
  const values = new Map<string, string>();
  const flags = new Set<string>();
  const numeric = new Set(['width', 'roller', 'angle', 'measured', 'decimals']);
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--json') {
      if (flags.has(token)) throw new Error('duplicate option --json');
      flags.add(token);
      continue;
    }
    const key = token.startsWith('--') ? token.slice(2) : '';
    if (key !== 'type' && !numeric.has(key)) throw new Error(`unknown argument: ${token}`);
    if (values.has(key)) throw new Error(`duplicate option --${key}`);
    const value = args[++i];
    if (value === undefined || value.startsWith('--') || value.trim() === '') throw new Error(`--${key} requires a value`);
    values.set(key, value);
  }
  for (const key of ['type', 'width', 'roller']) {
    if (!values.has(key)) throw new Error(`--${key} is required`);
  }
  const number = (key: string, fallback?: number): number => {
    const raw = values.get(key);
    if (raw === undefined && fallback !== undefined) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`--${key} must be a finite number`);
    return value;
  };
  const decimals = number('decimals', 3);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) throw new Error('--decimals must be an integer from 0 to 6');
  const result = calculate({
    type: values.get('type') as Inputs['type'],
    width: number('width'), roller: number('roller'), angle: number('angle', 60),
    ...(values.has('measured') ? { measured: number('measured') } : {})
  });
  if (flags.has('--json')) {
    const rounded = Object.fromEntries(Object.entries(result).map(([key, value]) => [key,
      typeof value === 'number' ? Number(value.toFixed(decimals)) : value
    ]));
    process.stdout.write(JSON.stringify(rounded) + '\n');
    return;
  }
  const format = (value: number): string => value.toFixed(decimals);
  const lines = [
    `Dovetail type: ${result.type}`,
    `Width: ${format(result.width)} mm`,
    `Angle: ${format(result.angle)} degrees`,
    `Roller diameter: ${format(result.roller)} mm`,
    `k: ${format(result.k)}`,
    `Nominal measurement: ${format(result.nominalMeasurement)} mm`
  ];
  if (result.measured !== undefined) {
    const deviation = result.deviation!;
    lines.push(`Measured: ${format(result.measured)} mm`,
      `Back-calculated width: ${format(result.backCalculatedWidth!)} mm`,
      `Deviation: ${deviation >= 0 ? '+' : ''}${format(deviation)} mm`);
  }
  process.stdout.write(lines.join('\n') + '\n');
}

try { main(process.argv.slice(2)); }
catch (error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
