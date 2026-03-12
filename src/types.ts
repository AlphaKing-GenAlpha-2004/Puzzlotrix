export type PuzzleType = 
  | 'sudoku' 
  | 'nonogram' 
  | 'minesweeper' 
  | 'maze' 
  | 'nqueens' 
  | 'sliding' 
  | 'math-latin-square' 
  | 'kenken';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface PuzzleState {
  type: PuzzleType;
  size: number;
  difficulty: Difficulty;
  grid: any[][];
  initialGrid: any[][];
  solution: any[][];
  clues?: any;
  startTime: number;
  isSolved: boolean;
  errors: { r: number; c: number }[];
  seed: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  puzzleType: PuzzleType;
  size: number;
  difficulty: Difficulty;
  time: number;
  date: string;
}
