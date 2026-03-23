import { PuzzleType, KenKenCage, MathOp } from '../types';

export interface ValidationResult {
  isCorrect: boolean;
  errors: string[];
  completionTime?: number;
}

export class SolutionValidator {
  static validate(type: PuzzleType, data: any, size: number): ValidationResult {
    const errors: string[] = [];

    switch (type) {
      case 'sudoku':
        this.validateSudoku(data.grid, size, errors);
        break;
      case 'math-latin-square':
        this.validateMathLatinSquare(data, size, errors);
        break;
      case 'maze':
        this.validateMaze(data, size, errors);
        break;
      case 'n-queens':
        this.validateNQueens(data.queens, size, errors);
        break;
      case 'minesweeper':
        this.validateMinesweeper(data, size, errors);
        break;
      case 'nonogram':
        this.validateNonogram(data, size, errors);
        break;
      case 'kenken':
        this.validateKenKen(data, size, errors);
        break;
      case 'sliding-puzzle':
        this.validateSlidingPuzzle(data.grid, size, errors);
        break;
    }

    return {
      isCorrect: errors.length === 0,
      errors
    };
  }

  private static validateSudoku(grid: number[][], size: number, errors: string[]) {
    this.validateLatinSquare(grid, size, errors);
    const n = Math.sqrt(size);
    if (Number.isInteger(n)) {
      for (let br = 0; br < n; br++) {
        for (let bc = 0; bc < n; bc++) {
          const seen = new Set<number>();
          for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
              const val = grid[br * n + r][bc * n + c];
              if (val === 0) {
                errors.push("Grid is incomplete.");
                return;
              }
              if (seen.has(val)) {
                errors.push(`Duplicate number ${val} in subgrid at (${br}, ${bc}).`);
              }
              seen.add(val);
            }
          }
        }
      }
    }
  }

  private static validateLatinSquare(grid: number[][], size: number, errors: string[]) {
    for (let r = 0; r < size; r++) {
      const seen = new Set<number>();
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val === 0) {
          errors.push("Grid is incomplete.");
          return;
        }
        if (seen.has(val)) errors.push(`Duplicate number ${val} in row ${r + 1}.`);
        seen.add(val);
      }
    }
    for (let c = 0; c < size; c++) {
      const seen = new Set<number>();
      for (let r = 0; r < size; r++) {
        const val = grid[r][c];
        if (seen.has(val)) errors.push(`Duplicate number ${val} in column ${c + 1}.`);
        seen.add(val);
      }
    }
  }

  private static validateMathLatinSquare(data: any, size: number, errors: string[]) {
    this.validateLatinSquare(data.grid, size, errors);
    const calculate = (values: number[], operators: MathOp[]): number => {
      let res = values[0];
      for (let i = 0; i < operators.length; i++) {
        const op = operators[i];
        const next = values[i + 1];
        if (op === '+') res += next;
        else if (op === '-') res -= next;
        else if (op === '*') res *= next;
        else if (op === '/') res /= next;
      }
      return res;
    };

    if (data.rowOps && data.rowTargets) {
      for (let r = 0; r < size; r++) {
        const res = calculate(data.grid[r], data.rowOps[r]);
        if (Math.abs(res - data.rowTargets[r]) > 0.001) {
          errors.push(`Row ${r + 1} arithmetic constraint violated.`);
        }
      }
    }
    if (data.colOps && data.colTargets) {
      for (let c = 0; c < size; c++) {
        const colValues = data.grid.map((row: any) => row[c]);
        const res = calculate(colValues, data.colOps[c]);
        if (Math.abs(res - data.colTargets[c]) > 0.001) {
          errors.push(`Column ${c + 1} arithmetic constraint violated.`);
        }
      }
    }
  }

  private static validateMaze(data: any, size: number, errors: string[]) {
    // This assumes data.userPath exists or we need to check if start is connected to end in data.grid
    // The prompt says "Path must follow maze corridors"
    // If the user is drawing a path, we should have that path.
    // For now, let's assume we are checking if the current grid state allows a path.
    // But usually "Check Solution" for a maze means the user has marked a path.
    // Let's check if there's a userPath in data.
    const path = data.userPath || [];
    if (path.length === 0) {
      errors.push("No path provided.");
      return;
    }
    const start = data.start;
    const end = data.end;
    if (path[0].r !== start.r || path[0].c !== start.c) errors.push("Path does not start at the beginning.");
    if (path[path.length - 1].r !== end.r || path[path.length - 1].c !== end.c) errors.push("Path does not reach the end.");
    
    for (let i = 0; i < path.length; i++) {
      const curr = path[i];
      if (data.grid[curr.r][curr.c] === 1) errors.push(`Path goes through a wall at (${curr.r}, ${curr.c}).`);
      if (i > 0) {
        const prev = path[i - 1];
        const dist = Math.abs(curr.r - prev.r) + Math.abs(curr.c - prev.c);
        if (dist !== 1) errors.push("Path is not continuous.");
      }
    }
  }

  private static validateNQueens(queens: number[], size: number, errors: string[]) {
    const placedCount = queens.filter(q => q !== -1).length;
    if (placedCount !== size) errors.push(`Exactly ${size} queens must be placed.`);
    
    for (let i = 0; i < size; i++) {
      if (queens[i] === -1) continue;
      for (let j = i + 1; j < size; j++) {
        if (queens[j] === -1) continue;
        const r1 = queens[i], c1 = i;
        const r2 = queens[j], c2 = j;
        if (r1 === r2) errors.push(`Queens at columns ${c1} and ${c2} share row ${r1}.`);
        if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) errors.push(`Queens at (${r1}, ${c1}) and (${r2}, ${c2}) are on the same diagonal.`);
      }
    }
  }

  private static validateMinesweeper(data: any, size: number, errors: string[]) {
    const { grid, revealed, flagged } = data;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          if (!flagged[r][c]) errors.push(`Mine at (${r}, ${c}) is not flagged.`);
        } else {
          if (!revealed[r][c]) errors.push(`Safe cell at (${r}, ${c}) is not revealed.`);
          if (flagged[r][c]) errors.push(`Safe cell at (${r}, ${c}) is incorrectly flagged.`);
        }
      }
    }
  }

  private static validateNonogram(data: any, size: number, errors: string[]) {
    const { userGrid, rowClues, colClues } = data;
    const getClues = (line: number[]): number[] => {
      const clues: number[] = [];
      let count = 0;
      for (const cell of line) {
        if (cell === 1) count++;
        else if (count > 0) {
          clues.push(count);
          count = 0;
        }
      }
      if (count > 0) clues.push(count);
      return clues.length > 0 ? clues : [0];
    };

    for (let r = 0; r < size; r++) {
      const clues = getClues(userGrid[r]);
      if (JSON.stringify(clues) !== JSON.stringify(rowClues[r])) {
        errors.push(`Row ${r + 1} does not match clues.`);
      }
    }
    for (let c = 0; c < size; c++) {
      const col = userGrid.map((row: any) => row[c]);
      const clues = getClues(col);
      if (JSON.stringify(clues) !== JSON.stringify(colClues[c])) {
        errors.push(`Column ${c + 1} does not match clues.`);
      }
    }
  }

  private static validateKenKen(data: any, size: number, errors: string[]) {
    this.validateLatinSquare(data.grid, size, errors);
    const cages: KenKenCage[] = data.cages || [];
    for (const cage of cages) {
      const values = cage.cells.map(cell => data.grid[cell.r][cell.c]);
      if (values.some(v => v === 0)) {
        errors.push("Grid is incomplete.");
        continue;
      }
      let res = 0;
      if (cage.op === '+') res = values.reduce((a, b) => a + b, 0);
      else if (cage.op === '*') res = values.reduce((a, b) => a * b, 1);
      else if (cage.op === '-') res = Math.abs(values[0] - values[1]);
      else if (cage.op === '/') res = values[0] > values[1] ? values[0] / values[1] : values[1] / values[0];
      else res = values[0];

      if (Math.abs(res - cage.target) > 0.001) {
        errors.push(`Cage with target ${cage.target} and op ${cage.op} is incorrect.`);
      }
    }
  }

  private static validateSlidingPuzzle(grid: number[], size: number, errors: string[]) {
    const total = grid.length;
    for (let i = 0; i < total - 1; i++) {
      if (grid[i] !== i + 1) {
        errors.push(`Tile ${i + 1} is in the wrong position.`);
      }
    }
    if (grid[total - 1] !== 0) {
      errors.push("Blank tile is not in the final position.");
    }
  }
}
