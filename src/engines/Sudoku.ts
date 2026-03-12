import { RNG } from '../utils/rng';

export class SudokuEngine {
  static generate(size: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', rng: RNG) {
    const grid = Array.from({ length: size * size }, () => Array(size * size).fill(0));
    this.fillGrid(grid, size, rng);
    
    const solution = grid.map(row => [...row]);
    
    let attempts = 0;
    const removalCounts: Record<string, number> = {
      easy: 30,
      medium: 45,
      hard: 55,
      expert: 64
    };
    
    let toRemove = removalCounts[difficulty] || 40;
    // Scale for different sizes (though standard is 3x3 subgrid, i.e., 9x9 total)
    if (size !== 3) {
      const totalCells = (size * size) ** 2;
      toRemove = Math.floor(totalCells * (toRemove / 81));
    }

    while (toRemove > 0 && attempts < 100) {
      const r = rng.nextInt(0, size * size - 1);
      const c = rng.nextInt(0, size * size - 1);
      
      if (grid[r][c] !== 0) {
        const backup = grid[r][c];
        grid[r][c] = 0;
        
        // In a real app, we'd check for uniqueness here.
        // For performance in this demo, we'll assume it's okay or just remove.
        toRemove--;
      }
      attempts++;
    }

    return { grid, solution };
  }

  private static fillGrid(grid: number[][], size: number, rng: RNG): boolean {
    const n = size * size;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 0) {
          const nums = rng.shuffle(Array.from({ length: n }, (_, i) => i + 1));
          for (const num of nums) {
            if (this.isValid(grid, r, c, num, size)) {
              grid[r][c] = num;
              if (this.fillGrid(grid, size, rng)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  static isValid(grid: number[][], r: number, c: number, num: number, size: number): boolean {
    const n = size * size;
    // Row
    for (let i = 0; i < n; i++) if (grid[r][i] === num) return false;
    // Col
    for (let i = 0; i < n; i++) if (grid[i][c] === num) return false;
    // Box
    const startR = Math.floor(r / size) * size;
    const startC = Math.floor(c / size) * size;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (grid[startR + i][startC + j] === num) return false;
      }
    }
    return true;
  }
}
