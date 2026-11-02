import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { calculate } from '../dist/calculate.js';

// File-backed stdio also works in environments that restrict child-process pipes.
const run = (...args) => {
  const dir = mkdtempSync(join(tmpdir(), 'dovetail-test-'));
  const out = join(dir, 'stdout');
  const err = join(dir, 'stderr');
  const stdoutFd = openSync(out, 'w');
  const stderrFd = openSync(err, 'w');
  try {
    const result = spawnSync(process.execPath, ['dist/cli.js', ...args], {
      stdio: ['ignore', stdoutFd, stderrFd]
    });
    if (result.error) throw result.error;
    return { status: result.status, stdout: readFileSync(out, 'utf8'), stderr: readFileSync(err, 'utf8') };
  } finally {
    closeSync(stdoutFd);
    closeSync(stderrFd);
    rmSync(dir, { recursive: true, force: true });
  }
};
const base = ['--type', 'male', '--width', '50', '--roller', '10'];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00005, `${actual} ≈ ${expected}`);

test('required reference calculations', () => {
  const male = calculate({ type: 'male', width: 50, roller: 10 });
  close(male.k, 2.7321);
  assert.equal(male.nominalMeasurement.toFixed(3), '77.321');
  assert.equal(calculate({ type: 'female', width: 60, roller: 10 }).nominalMeasurement.toFixed(3), '32.679');
  const angled = calculate({ type: 'male', width: 50, roller: 8, angle: 45 });
  close(angled.k, 3.4142);
  assert.equal(angled.nominalMeasurement.toFixed(3), '77.314');
});

test('measurement back-calculation and signed deviation', () => {
  const output = run(...base, '--measured', '77.400');
  assert.equal(output.status, 0);
  assert.match(output.stdout, /Deviation: \+0\.079 mm/);
  assert.match(output.stdout, /Back-calculated width: 50\.079 mm/);
  const female = calculate({ type: 'female', width: 60, roller: 10, measured: 32 });
  close(female.backCalculatedWidth, 59.3205);
  assert.ok(female.deviation < 0);
});

test('JSON and decimal formatting', () => {
  const result = run(...base, '--json', '--decimals', '4');
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const data = JSON.parse(result.stdout);
  assert.equal(data.k, 2.7321);
  assert.equal(data.nominalMeasurement, 77.3205);
  assert.equal(run(...base, '--decimals', '0').stdout.includes('Nominal measurement: 77 mm'), true);
  assert.match(run(...base, '--decimals', '6').stdout, /77\.320508 mm/);
});

const invalid = [
  ['--type', 'female', '--width', '20', '--roller', '10'],
  [...base, '--angle', '90'], [...base, '--angle', '0'], [...base, '--angle', '-1'],
  ['--type', 'male', '--width', '50', '--roller', '0'],
  ['--type', 'x', '--width', '50', '--roller', '10'],
  ['--type', 'male', '--width', '0', '--roller', '10'],
  ['--type', 'male', '--width', '-2', '--roller', '10'],
  [...base, '--angle', 'Infinity'], [...base, '--measured', 'NaN'],
  [...base, '--decimals', '-1'], [...base, '--decimals', '7'], [...base, '--decimals', '1.5'],
  [...base, '--wat'], [...base, '--measured'], [...base, '--angle', ''],
  [...base, '--width', '10'], [], ['--type', 'male'],
  ['--type', 'male', '--width', 'abc', '--roller', '10'],
  ['--type', 'male', '--width', '1e308', '--roller', '1e308'],
  ['--type', 'female', '--width', '1', '--roller', String(1 / (1 + 1 / Math.tan(Math.PI / 6)))]
];
for (const args of invalid) {
  test(`rejects invalid arguments ${JSON.stringify(args)}`, () => {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Error: /);
  });
}

test('help works without required inputs', () => {
  const result = run('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.equal(result.stderr, '');
});
