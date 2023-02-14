import { getSettings } from '../Settings';

export function log (...args: unknown[]): void {
  if (!getSettings().debugMode) return;
  console.log(...args);
}
