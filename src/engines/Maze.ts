import { RNG } from '../utils/rng';

export class MazeEngine {
  static generate(size: number, rng: RNG) {
    // Recursive Backtracking
    const grid = Array.from({ length: size }, () => Array(size).fill(1)); // 1 is wall, 0 is path
    
    const walk = (r: number, c: number) => {
      grid[r][c] = 0;
      const dirs = rng.shuffle([[0, 2], [0, -2], [2, 0], [-2, 0]]);
      
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
          grid[r + dr / 2][c + dc / 2] = 0;
          walk(nr, nc);
        }
      }
    };

    walk(0, 0);
    grid[size - 1][size - 1] = 0; // End point
    if (grid[size - 2][size - 1] === 1 && grid[size - 1][size - 2] === 1) {
      grid[size - 2][size - 1] = 0; // Ensure exit is reachable
    }

    return { grid, solution: grid };
  }
}
