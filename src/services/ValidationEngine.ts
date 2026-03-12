import { PuzzleType, KenKenCage, MathLatinSquareData, MathOp } from '../types';

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  isFull: boolean;
  conflicts: { r: number; c: number }[];
  arithmeticConflicts?: { r: number; c: number }[];
  errors: string[];
}

export class ValidationEngine {
  static validate(type: PuzzleType, size: number, data: any, solution?: any, revealMode: boolean = false, solvedByAI: boolean = false): ValidationResult {
    if (revealMode || solvedByAI) {
      return { isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] };
    }

    // Clear previous errors implicitly by returning a new object
    let result: ValidationResult;
    switch (type) {
      case 'sudoku':
        result = this.validateSudoku(size, data.grid || data, solution);
        break;
      case 'math-latin-square':
        result = this.validateMathLatinSquare(size, data, solution);
        break;
      case 'n-queens':
        result = this.validateNQueens(size, data, solution);
        break;
      case 'kenken':
        result = this.validateKenKen(size, data, solution);
        break;
      case 'maze':
        result = this.validateMaze(size, data, solution);
        break;
      case 'nonogram':
        result = this.validateNonogram(size, data, solution);
        break;
      case 'sliding-puzzle':
        result = this.validateSlidingPuzzle(size, data);
        break;
      default:
        return { isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] };
    }

    return result;
  }

  private static validateSlidingPuzzle(size: number, data: any): ValidationResult {
    const grid = data.grid;
    const total = size * size;
    let isFull = true;
    let isComplete = true;

    for (let i = 0; i < total - 1; i++) {
      if (grid[i] !== i + 1) isComplete = false;
    }
    if (grid[total - 1] !== 0) isComplete = false;

    return {
      isValid: true,
      isComplete,
      isFull: true,
      conflicts: [],
      errors: isComplete ? [] : ["Puzzle is not yet in the solved state."]
    };
  }

  private static validateNonogram(size: number, data: any, solution: any): ValidationResult {
    const userGrid = data.userGrid;
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];
    
    if (!solution) return { isValid: true, isComplete: false, isFull: false, conflicts: [], errors: [] };

    let isFull = true;
    let hasMismatch = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const actual = userGrid[r][c] === 1 ? 1 : 0;
        const expected = solution[r][c];
        if (userGrid[r][c] === 0) isFull = false;
        if (actual !== expected) {
          hasMismatch = true;
          conflicts.push({ r, c });
        }
      }
    }

    if (hasMismatch) {
      errors.push("Some cells do not match the solution.");
    }

    return {
      isValid: !hasMismatch,
      isComplete: isFull && !hasMismatch,
      isFull,
      conflicts,
      errors
    };
  }

  private static validateMathLatinSquare(size: number, data: MathLatinSquareData, solution?: any): ValidationResult {
    const grid = data?.grid || [];
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const conflicts: { r: number; c: number }[] = [];
    const arithmeticConflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Latin Square rules
    const lsResult = this.validateLatinSquare(size, grid);
    conflicts.push(...lsResult.conflicts);
    errors.push(...lsResult.errors);

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

    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r]?.[c] === 0) isFull = false;
      }
    }

    // Row arithmetic
    for (let r = 0; r < size; r++) {
      const rowValues = grid[r];
      if (rowValues.every(v => v !== 0)) {
        const res = calculate(rowValues, data.rowOps[r]);
        if (Math.abs(res - data.rowTargets[r]) > 0.001) {
          for (let c = 0; c < size; c++) arithmeticConflicts.push({ r, c });
          if (!errors.includes("Row arithmetic constraint violated.")) {
            errors.push("Row arithmetic constraint violated.");
          }
        }
      }
    }

    // Column arithmetic
    for (let c = 0; c < size; c++) {
      const colValues = grid.map(row => row[c]);
      if (colValues.every(v => v !== 0)) {
        const res = calculate(colValues, data.colOps[c]);
        if (Math.abs(res - data.colTargets[c]) > 0.001) {
          for (let r = 0; r < size; r++) arithmeticConflicts.push({ r, c });
          if (!errors.includes("Column arithmetic constraint violated.")) {
            errors.push("Column arithmetic constraint violated.");
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0 && arithmeticConflicts.length === 0,
      isComplete: isFull && conflicts.length === 0 && arithmeticConflicts.length === 0,
      isFull,
      conflicts,
      arithmeticConflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateMaze(size: number, data: any, solution?: any): ValidationResult {
    const grid = data.grid;
    const start = data.start;
    const end = data.end;
    
    if (!start || !end) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Start or End node missing."] };

    // BFS to check reachability
    const queue = [start];
    const visited = new Set<string>();
    visited.add(`${start.r},${start.c}`);
    
    let found = false;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.r === end.r && curr.c === end.c) {
        found = true;
        break;
      }
      
      const neighbors = [
        { r: curr.r + 1, c: curr.c },
        { r: curr.r - 1, c: curr.c },
        { r: curr.r, c: curr.c + 1 },
        { r: curr.r, c: curr.c - 1 }
      ];
      
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0 && !visited.has(key)) {
          visited.add(key);
          queue.push(n);
        }
      }
    }
    
    return {
      isValid: found,
      isComplete: found,
      isFull: true, // Maze is always "full" in this context
      conflicts: [],
      errors: found ? [] : ["No path exists between Start and End."]
    };
  }

  private static validateSudoku(size: number, grid: number[][], solution?: any): ValidationResult {
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];
    const n = Math.sqrt(size);

    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r]?.[c] === 0) isFull = false;
      }
    }

    // Rows
    for (let r = 0; r < size; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const val = grid[r]?.[c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
      for (const [val, cols] of seen) {
        if (cols.length > 1) {
          cols.forEach(c => conflicts.push({ r, c }));
          errors.push(`Duplicate number in row`);
        }
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const val = grid[r]?.[c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(r);
      }
      for (const [val, rows] of seen) {
        if (rows.length > 1) {
          rows.forEach(r => conflicts.push({ r, c }));
          errors.push(`Duplicate number in column`);
        }
      }
    }

    // Subgrids
    if (Number.isInteger(n)) {
      for (let br = 0; br < n; br++) {
        for (let bc = 0; bc < n; bc++) {
          const seen = new Map<number, { r: number; c: number }[]>();
          for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
              const row = br * n + r;
              const col = bc * n + c;
              const val = grid[row]?.[col];
              if (val === 0) continue;
              if (!seen.has(val)) seen.set(val, []);
              seen.get(val)!.push({ r: row, c: col });
            }
          }
          for (const [val, cells] of seen) {
            if (cells.length > 1) {
              cells.forEach(cell => conflicts.push(cell));
              errors.push(`Duplicate number in subgrid`);
            }
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateLatinSquare(size: number, grid: number[][]): ValidationResult {
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Rows
    for (let r = 0; r < size; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(c);
      }
      for (const [val, cols] of seen) {
        if (cols.length > 1) {
          cols.forEach(c => conflicts.push({ r, c }));
          errors.push("Row uniqueness violated.");
        }
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < size; r++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (!seen.has(val)) seen.set(val, []);
        seen.get(val)!.push(r);
      }
      for (const [val, rows] of seen) {
        if (rows.length > 1) {
          rows.forEach(r => conflicts.push({ r, c }));
          errors.push("Column uniqueness violated.");
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: false, // Not used directly for Latin Square as it's part of Math Latin Square
      isFull: false,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateNQueens(size: number, queens: number[], solution?: any): ValidationResult {
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    let placedCount = 0;
    for (let i = 0; i < size; i++) {
      if (queens[i] !== -1) placedCount++;
      if (queens[i] === -1) continue;
      for (let j = i + 1; j < size; j++) {
        if (queens[j] === -1) continue;
        
        const r1 = queens[i];
        const c1 = i;
        const r2 = queens[j];
        const c2 = j;

        if (r1 === r2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
          conflicts.push({ r: r1, c: c1 });
          conflicts.push({ r: r2, c: c2 });
          errors.push("Queens are attacking each other.");
        }
      }
    }

    const isFull = placedCount === size;

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }

  private static validateKenKen(size: number, data: any, solution?: any): ValidationResult {
    const grid = data?.grid || [];
    if (!grid || grid.length === 0) return { isValid: false, isComplete: false, isFull: false, conflicts: [], errors: ["Grid data missing."] };
    const cages: KenKenCage[] = data.cages;
    const conflicts: { r: number; c: number }[] = [];
    const errors: string[] = [];

    // Latin Square rules
    const lsResult = this.validateLatinSquare(size, grid);
    conflicts.push(...lsResult.conflicts);
    errors.push(...lsResult.errors);

    let isFull = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r]?.[c] === 0) isFull = false;
      }
    }

    // Cage rules
    for (const cage of cages) {
      const values = cage.cells.map(cell => grid[cell.r]?.[cell.c]).filter(v => v !== undefined && v !== 0);
      if (values.length === cage.cells.length) {
        // Cage is full, validate arithmetic
        let result = 0;
        const op = cage.op;
        const target = cage.target;

        if (op === '+') {
          result = values.reduce((a, b) => a + b, 0);
        } else if (op === '*') {
          result = values.reduce((a, b) => a * b, 1);
        } else if (op === '-') {
          result = Math.abs(values[0] - values[1]);
        } else if (op === '/') {
          result = values[0] > values[1] ? values[0] / values[1] : values[1] / values[0];
        } else {
          result = values[0];
        }

        if (Math.abs(result - target) > 0.001) {
          cage.cells.forEach(cell => conflicts.push(cell));
          if (!errors.includes("Cage arithmetic constraint not satisfied.")) {
            errors.push("Cage arithmetic constraint not satisfied.");
          }
        }
      }
    }

    return {
      isValid: conflicts.length === 0,
      isComplete: isFull && conflicts.length === 0,
      isFull,
      conflicts,
      errors: Array.from(new Set(errors))
    };
  }
}
