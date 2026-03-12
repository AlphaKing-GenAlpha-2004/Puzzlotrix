import { RNG } from '../utils/rng';

export class NonogramEngine {
  static generate(size: number, difficulty: 'easy' | 'medium' | 'hard' | 'expert', rng: RNG) {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    
    // Adjust density based on difficulty
    const densities: Record<string, number> = {
      easy: 0.4,
      medium: 0.55,
      hard: 0.7,
      expert: 0.8
    };
    const density = densities[difficulty] || 0.5;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (rng.next() < density) {
          grid[r][c] = 1;
        }
      }
    }

    const rowClues = this.getClues(grid);
    const colClues = this.getClues(this.transpose(grid));

    return { 
      solution: grid, 
      grid: Array.from({ length: size }, () => Array(size).fill(0)),
      clues: { rowClues, colClues } 
    };
  }

  private static getClues(grid: number[][]): number[][] {
    return grid.map(row => {
      const clues: number[] = [];
      let count = 0;
      for (const cell of row) {
        if (cell === 1) {
          count++;
        } else if (count > 0) {
          clues.push(count);
          count = 0;
        }
      }
      if (count > 0) clues.push(count);
      return clues.length > 0 ? clues : [0];
    });
  }

  private static transpose(grid: number[][]): number[][] {
    return grid[0].map((_, c) => grid.map(row => row[c]));
  }
}
