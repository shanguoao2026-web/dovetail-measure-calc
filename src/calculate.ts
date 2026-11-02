export interface Inputs {
  type: 'male' | 'female';
  width: number;
  angle?: number;
  roller: number;
  measured?: number;
}

export interface Result {
  type: 'male' | 'female';
  width: number;
  angle: number;
  roller: number;
  k: number;
  nominalMeasurement: number;
  measured?: number;
  backCalculatedWidth?: number;
  deviation?: number;
}

export function calculate(input: Inputs): Result {
  const { type, width, roller, measured, angle = 60 } = input;
  if (type !== 'male' && type !== 'female') throw new Error('type must be male or female');
  for (const [name, value] of Object.entries({ width, angle, roller, ...(measured === undefined ? {} : { measured }) })) {
    if (!Number.isFinite(value)) throw new Error(`${name} must be a finite number`);
  }
  if (width <= 0) throw new Error('width must be greater than 0');
  if (roller <= 0) throw new Error('roller must be greater than 0');
  if (angle <= 0 || angle >= 90) throw new Error('angle must be greater than 0 and less than 90');
  const k = 1 + 1 / Math.tan(angle * Math.PI / 360);
  const offset = roller * k;
  const nominalMeasurement = type === 'male' ? width + offset : width - offset;
  if (type === 'female' && nominalMeasurement <= 0) {
    throw new Error('female nominal measurement must be greater than 0');
  }
  const result: Result = { type, width, angle, roller, k, nominalMeasurement };
  if (measured !== undefined) {
    result.measured = measured;
    result.backCalculatedWidth = type === 'male' ? measured - offset : measured + offset;
    result.deviation = measured - nominalMeasurement;
  }
  for (const value of Object.values(result)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('calculation exceeds the finite numeric range');
  }
  return result;
}
