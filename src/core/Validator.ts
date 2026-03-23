import { PuzzleType } from '../types';

export class Validator {
  static canGenerate(puzzleType: PuzzleType, gridSize: number, seed?: number): { valid: boolean; message?: string } {
    if (gridSize < 3 || gridSize > 500) {
      return { valid: false, message: "Grid size must be between 3 and 500." };
    }
    if (seed !== undefined && (seed < 0 || seed > 1e12)) {
      return { valid: false, message: "Seed must be between 0 and 10^12." };
    }
    if (puzzleType === 'n-queens' && gridSize < 4) {
      return { valid: false, message: "N-Queens has no valid solutions for N < 4" };
    }
    return { valid: true };
  }

  static canSolve(puzzleType: PuzzleType, size: number, rows?: number, cols?: number): { valid: boolean; message?: string } {
    if (puzzleType === 'sliding-puzzle') {
      const r = rows || size;
      const c = cols || size;
      if (r * c > 36) {
        return { valid: false, message: "Full solve disabled due to extreme search complexity for grids larger than 6x6." };
      }
    }
    return { valid: true };
  }
}
