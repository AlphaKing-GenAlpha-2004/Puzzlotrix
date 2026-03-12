import React, { useState, useEffect, useCallback } from 'react';
import { PuzzleType, ThemeType, PuzzleState, SolverConfig } from './types';
import { Background } from './components/Backgrounds';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { GridRenderer } from './components/GridRenderer';
import { MIN_GRID_SIZE, MAX_GRID_SIZE, THEME_COLORS } from './constants';
import { MathLatinSquareEngine } from './engines/MathLatinSquare';
import { SudokuEngine } from './engines/Sudoku';
import { MazeEngine } from './engines/Maze';
import { NQueensEngine } from './engines/NQueens';
import { MinesweeperEngine } from './engines/Minesweeper';
import { NonogramEngine } from './engines/Nonogram';
import { KenKenEngine } from './engines/KenKen';
import { SlidingPuzzleEngine } from './engines/SlidingPuzzle';
import { SolverEngine } from './solvers/SolverEngine';
import { calculateStateSpace } from './utils/math';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Info, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { ValidationEngine, ValidationResult } from './services/ValidationEngine';
import { InfoModal } from './components/InfoModal';
import { Leaderboard } from './components/Leaderboard';
import { Trophy } from 'lucide-react';

export default function App() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('math-latin-square');
  const [gridSize, setGridSize] = useState<number>(5);
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(4);
  const [seed, setSeed] = useState<number | null>(123456);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [solverConfig, setSolverConfig] = useState<SolverConfig>({
    algorithm: 'backtracking',
    speed: 50,
    instant: true
  });
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [genTime, setGenTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, conflicts: [], errors: [] });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [username, setUsername] = useState<string>(localStorage.getItem('puzzlotrix_user') || '');

  useEffect(() => {
    let interval: any;
    if (puzzle && !puzzle.isSolved && !isSolving && !isPaused) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [puzzle?.isSolved, isSolving, puzzle?.generationId, isPaused]);

  useEffect(() => {
    // Reset puzzle state when grid size changes
    setPuzzle(null);
    setValidation({ isValid: true, conflicts: [], errors: [] });
    setTimer(0);
    setIsPaused(false);
    setError(null);
    setSuccess(null);
    setSelectedCell(null);
    SolverEngine.terminate();
  }, [gridSize, rows, cols, puzzleType]);

  const generatePuzzle = useCallback(() => {
    const startTime = performance.now();
    let data: any;
    let solution: any;
    
    // Clamp grid size
    const clampedSize = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, gridSize));
    const currentSeed = seed === null ? Math.floor(Math.random() * 1e12) : seed;
    
    let finalSize = clampedSize;
    
    try {
      switch (puzzleType) {
        case 'math-latin-square': {
          const mathData = MathLatinSquareEngine.generate(clampedSize, currentSeed);
          data = mathData;
          solution = mathData.solution;
          break;
        }
        case 'sudoku': {
          const root = Math.sqrt(clampedSize);
          if (!Number.isInteger(root)) {
            const nearestRoot = Math.round(root);
            finalSize = Math.max(4, nearestRoot * nearestRoot);
          }
          const sudokuData = SudokuEngine.generate(finalSize, currentSeed);
          data = sudokuData.grid;
          solution = sudokuData.solution;
          break;
        }
        case 'maze':
          data = MazeEngine.generate(clampedSize, currentSeed, solverConfig.genAlgorithm);
          solution = null; // Maze solution is found by solver
          break;
        case 'n-queens':
          data = NQueensEngine.generate(clampedSize, currentSeed);
          solution = null; // Found by solver
          break;
        case 'minesweeper':
          data = MinesweeperEngine.generate(clampedSize, currentSeed);
          solution = data.grid; // In minesweeper, the grid is the solution
          break;
        case 'nonogram':
          data = NonogramEngine.generate(clampedSize, currentSeed);
          solution = data.solution;
          break;
        case 'kenken':
          data = KenKenEngine.generate(clampedSize, currentSeed);
          solution = data.solution;
          break;
        case 'sliding-puzzle': {
          const clampedRows = Math.max(3, Math.min(10, rows));
          const clampedCols = Math.max(3, Math.min(10, cols));
          const slidingData = SlidingPuzzleEngine.generate(clampedRows, clampedCols, currentSeed);
          data = slidingData;
          // Target state is [1, 2, 3, ..., 0]
          solution = Array.from({ length: clampedRows * clampedCols }, (_, i) => (i === clampedRows * clampedCols - 1 ? 0 : i + 1));
          break;
        }
      }

      let finalRows = puzzleType === 'sliding-puzzle' ? Math.max(3, Math.min(10, rows)) : clampedSize;
      let finalCols = puzzleType === 'sliding-puzzle' ? Math.max(3, Math.min(10, cols)) : clampedSize;

      if (puzzleType === 'maze' && data?.grid && Array.isArray(data.grid) && data.grid.length > 0 && data.grid[0]) {
        finalRows = data.grid.length;
        finalCols = data.grid[0].length;
      }

      setPuzzle({
        type: puzzleType,
        size: finalSize,
        rows: finalRows,
        cols: finalCols,
        seed: seed,
        actualSeed: currentSeed,
        generationId: generationCount,
        data: data,
        initialData: JSON.parse(JSON.stringify(data)),
        solution: solution,
        isSolved: false
      });
      setGenTime(performance.now() - startTime);
      setTimer(0);
      setIsPaused(false);
      setError(null);
      setSuccess(null);
      setValidation({ isValid: true, conflicts: [], errors: [] });
      setSelectedCell(null);
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Generation failed for this size/type combination.");
    }
  }, [puzzleType, gridSize, seed, solverConfig.genAlgorithm, generationCount]);

  useEffect(() => {
    generatePuzzle();
  }, [puzzleType, gridSize, rows, cols, seed, solverConfig.genAlgorithm, generationCount]);

  useEffect(() => {
    if (puzzle && !isSolving) {
      const result = ValidationEngine.validate(puzzle.type, puzzle.size, puzzle.data, puzzle.solution, false, puzzle.isSolved);
      setValidation(result);
    }
  }, [puzzle?.data, puzzle?.type, puzzle?.size, puzzle?.solution, isSolving, puzzle?.isSolved]);

  const handleGenerate = () => {
    setGenerationCount(prev => prev + 1);
  };

  const handleSolve = async () => {
    if (!puzzle || isSolving) return;
    
    setIsSolving(true);
    setError(null);
    setSuccess(null);
    const solveStartTime = performance.now();
    
    try {
      const result = await SolverEngine.solve(puzzle.type, solverConfig.algorithm, puzzle.data, puzzle.size, puzzle.rows, puzzle.cols);
      
      const isSliding = puzzle.type === 'sliding-puzzle';
      const isMaze = puzzle.type === 'maze';
      const shouldAnimate = (isSliding || (isMaze && puzzle.size <= 500)) && (!solverConfig.instant || isMaze);
      
      if (shouldAnimate) {
        let speed = Math.max(1, 101 - solverConfig.speed);
        if (isMaze && solverConfig.instant) speed = 1; // Fast animation if instant is on for maze
        
        if (isSliding && result.solution) {
          const path = result.solution;
          for (let i = 1; i < path.length; i++) {
            if (!isSolving) break;
            const currentGrid = path[i];
            setPuzzle(prev => prev ? {
              ...prev,
              data: {
                ...prev.data,
                grid: currentGrid,
                emptyIdx: currentGrid.indexOf(0)
              },
              moves: i
            } : null);
            setTimer(Math.floor((performance.now() - solveStartTime) / 1000));
            await new Promise(r => setTimeout(r, speed * 2)); // Sliding moves need more time to be visible
          }
        } else if (isMaze && result.visited) {
          const visited = result.visited!;
          const frontier = result.frontier || [];
          // Adjust step size based on maze size and speed
          const baseStep = Math.max(1, Math.floor(visited.length / (isMaze && solverConfig.instant ? 20 : 50)));
          const stepSize = puzzle.size > 50 ? baseStep : 1;
          
          for (let i = 0; i < visited.length; i += stepSize) {
            if (!isSolving) break;
            const currentVisited = visited.slice(0, i + stepSize);
            const currentFrontier = frontier.slice(0, Math.min(frontier.length, i + stepSize));
            
            setPuzzle(prev => prev ? {
              ...prev,
              data: {
                ...prev.data,
                currentVisited,
                currentFrontier
              }
            } : null);
            
            // Update timer occasionally
            if (i % (stepSize * 10) === 0) {
              setTimer(Math.floor((performance.now() - solveStartTime) / 1000));
            }
            
            await new Promise(r => setTimeout(r, speed));
          }
        }
      }

      const solveEndTime = performance.now();
      const finalStats = {
        ...result.stats,
        timeMs: solveEndTime - solveStartTime
      };

      setPuzzle(prev => {
        if (!prev) return null;
        
        if (!result.solution) {
          setError("Unsolvable puzzle or search space exceeded.");
          return prev;
        }

        let newData = JSON.parse(JSON.stringify(prev.data));
        if (['sudoku', 'math-latin-square', 'kenken', 'nonogram', 'sliding-puzzle'].includes(prev.type)) {
          if (prev.type === 'nonogram') {
            newData.userGrid = JSON.parse(JSON.stringify(result.solution));
          } else if (prev.type === 'math-latin-square' || prev.type === 'kenken') {
            newData.grid = JSON.parse(JSON.stringify(result.solution));
          } else if (prev.type === 'sliding-puzzle') {
            const path = result.solution;
            const lastGrid = path[path.length - 1];
            newData.grid = JSON.parse(JSON.stringify(lastGrid));
            newData.emptyIdx = lastGrid.indexOf(0);
          } else {
            newData = JSON.parse(JSON.stringify(result.solution));
          }
        }

        return {
          ...prev,
          data: newData,
          solution: result.solution,
          isSolved: true,
          solveStats: finalStats,
          moves: isSliding ? (result.solution.length - 1) : prev.moves
        };
      });
      
      setTimer(Math.floor((solveEndTime - solveStartTime) / 1000));
      setSuccess("Solved Correctly");
      setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });

      // Auto-submit score if it was a manual solve (not AI solve)
      // Actually, let's only submit if it's a manual solve. 
      // But handleSolve is the AI solver. 
      // Manual solve happens in handleCellClick/handleKeyDown.
    } catch (err: any) {
      console.error("Solve failed:", err);
      setError(err.message || "Solving failed.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleCancel = () => {
    SolverEngine.terminate();
    setIsSolving(false);
  };

  const handleCellClick = (r: number, c: number, e?: React.MouseEvent) => {
    if (!puzzle || isSolving || puzzle.isSolved || isPaused) return;
    setError(null);
    setSuccess(null);

    // Handle Right Click (Flagging)
    if (e && (e.button === 2 || e.type === 'contextmenu')) {
      if (puzzle.type === 'minesweeper') {
        if (puzzle.data.revealed[r][c]) return;
        const newFlagged = puzzle.data.flagged.map((row: any) => [...row]);
        newFlagged[r][c] = !newFlagged[r][c];
        setPuzzle({
          ...puzzle,
          data: { ...puzzle.data, flagged: newFlagged }
        });
      }
      return;
    }

    if (puzzle.type === 'sudoku' || puzzle.type === 'kenken' || puzzle.type === 'math-latin-square') {
      setSelectedCell({ r, c });
      return;
    }

    if (puzzle.type === 'sliding-puzzle') {
      const { grid, emptyIdx, rows, cols } = puzzle.data;
      const targetIdx = r * cols + c;
      const emptyR = Math.floor(emptyIdx / cols);
      const emptyC = emptyIdx % cols;

      // Check if in same row or column
      if (r === emptyR || c === emptyC) {
        const newGrid = [...grid];
        let newEmptyIdx = emptyIdx;

        if (r === emptyR) {
          // Horizontal shift
          const step = c < emptyC ? -1 : 1;
          for (let currC = emptyC; currC !== c; currC += step) {
            const fromIdx = emptyR * cols + (currC + step);
            const toIdx = emptyR * cols + currC;
            newGrid[toIdx] = newGrid[fromIdx];
          }
          newGrid[targetIdx] = 0;
          newEmptyIdx = targetIdx;
        } else {
          // Vertical shift
          const step = r < emptyR ? -1 : 1;
          for (let currR = emptyR; currR !== r; currR += step) {
            const fromIdx = (currR + step) * cols + c;
            const toIdx = currR * cols + c;
            newGrid[toIdx] = newGrid[fromIdx];
          }
          newGrid[targetIdx] = 0;
          newEmptyIdx = targetIdx;
        }

        const newPuzzle = {
          ...puzzle,
          data: { ...puzzle.data, grid: newGrid, emptyIdx: newEmptyIdx },
          moves: (puzzle.moves || 0) + 1,
          undoStack: [...(puzzle.undoStack || []), JSON.parse(JSON.stringify(puzzle.data))]
        };

        // Check win
        const isWin = SlidingPuzzleEngine.isSolved(newGrid);
        if (isWin) {
          setSuccess("Solved Correctly");
          newPuzzle.isSolved = true;
          setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
          submitScore(newPuzzle, timer);
        }
        setPuzzle(newPuzzle);
      }
    } else if (puzzle.type === 'minesweeper') {
      if (puzzle.data.revealed[r][c] || puzzle.data.flagged[r][c]) return;
      
      const newRevealed = puzzle.data.revealed.map((row: any) => [...row]);
      const newGrid = puzzle.data.grid.map((row: any) => [...row]);
      
      // Safe First Click Logic
      const isFirstClick = puzzle.data.revealed.every((row: any) => row.every((cell: any) => !cell));
      if (isFirstClick && newGrid[r][c] === -1) {
        // Move the mine to the first available safe spot
        let moved = false;
        for (let ri = 0; ri < puzzle.size && !moved; ri++) {
          for (let ci = 0; ci < puzzle.size && !moved; ci++) {
            if (newGrid[ri][ci] !== -1) {
              newGrid[ri][ci] = -1;
              newGrid[r][c] = 0; // Temporarily safe
              moved = true;
            }
          }
        }
        // Recalculate numbers
        MinesweeperEngine.calculateNumbers(newGrid, puzzle.size);
      }

      newRevealed[r][c] = true;
      
      if (newGrid[r][c] === -1) {
        setError("Game Over! You hit a mine.");
        const revealedAll = puzzle.data.revealed.map((row: any, ri: number) => 
          row.map((col: any, ci: number) => newGrid[ri][ci] === -1 ? true : col)
        );
        setPuzzle({ ...puzzle, isSolved: true, data: { ...puzzle.data, grid: newGrid, revealed: revealedAll } });
      } else {
        // Flood fill for 0s
        if (newGrid[r][c] === 0) {
          const queue = [{ r, c }];
          while (queue.length > 0) {
            const curr = queue.shift()!;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = curr.r + dr;
                const nc = curr.c + dc;
                if (nr >= 0 && nr < puzzle.size && nc >= 0 && nc < puzzle.size && !newRevealed[nr][nc]) {
                  newRevealed[nr][nc] = true;
                  if (newGrid[nr][nc] === 0) {
                    queue.push({ r: nr, c: nc });
                  }
                }
              }
            }
          }
        }

        const newPuzzle = {
          ...puzzle,
          data: { ...puzzle.data, grid: newGrid, revealed: newRevealed }
        };

        // Check win condition: all non-mine cells revealed
        let unrevealedSafeCells = 0;
        for (let ri = 0; ri < puzzle.size; ri++) {
          for (let ci = 0; ci < puzzle.size; ci++) {
            if (newGrid[ri][ci] !== -1 && !newRevealed[ri][ci]) {
              unrevealedSafeCells++;
            }
          }
        }

        if (unrevealedSafeCells === 0) {
          setSuccess("Solved Correctly! All mines cleared.");
          newPuzzle.isSolved = true;
          setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
          submitScore(newPuzzle, timer);
        }

        setPuzzle(newPuzzle);
      }
    } else if (puzzle.type === 'maze') {
      if (puzzle.data.grid[r][c] === 1) {
        setError("Cannot place Start/End on a wall.");
        return;
      }
      
      const isStart = r === puzzle.data.start.r && c === puzzle.data.start.c;
      const isEnd = r === puzzle.data.end.r && c === puzzle.data.end.c;
      
      if (isStart) {
        setIsDragging(isDragging === 'start' ? null : 'start');
        setSuccess(isDragging === 'start' ? null : "Start node selected. Click an empty cell to move it.");
        setError(null);
        return;
      }
      if (isEnd) {
        setIsDragging(isDragging === 'end' ? null : 'end');
        setSuccess(isDragging === 'end' ? null : "End node selected. Click an empty cell to move it.");
        setError(null);
        return;
      }

      if (isDragging) {
        const newData = { ...puzzle.data };
        if (isDragging === 'start') {
          if (r === newData.end.r && c === newData.end.c) {
            setError("Start and End cannot be on the same cell.");
            return;
          }
          newData.start = { r, c };
        } else {
          if (r === newData.start.r && c === newData.start.c) {
            setError("Start and End cannot be on the same cell.");
            return;
          }
          newData.end = { r, c };
        }
        
        setPuzzle({
          ...puzzle,
          data: newData,
          isSolved: false,
          solution: undefined
        });
        setIsDragging(null);
        setSuccess(null);
        setError(null);
      } else {
        setSuccess("Click the Start (S) or End (E) node to move it.");
      }
    }
 else if (puzzle.type === 'n-queens') {
      const newQueens = [...puzzle.data];
      if (newQueens[c] === r) {
        newQueens[c] = -1; // Remove
      } else {
        newQueens[c] = r; // Place
      }
      setPuzzle({
        ...puzzle,
        data: newQueens
      });
    } else if (puzzle.type === 'nonogram') {
      const newGrid = puzzle.data.userGrid.map((row: any) => [...row]);
      // Cycle: 0 -> 1 -> -1 -> 0
      if (newGrid[r][c] === 0) newGrid[r][c] = 1;
      else if (newGrid[r][c] === 1) newGrid[r][c] = -1;
      else newGrid[r][c] = 0;
      
      setPuzzle({
        ...puzzle,
        data: { ...puzzle.data, userGrid: newGrid }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!puzzle || !selectedCell || isSolving || puzzle.isSolved || isPaused) return;

    if (['sudoku', 'kenken', 'math-latin-square'].includes(puzzle.type)) {
      const key = e.key;
      const isSimpleGrid = puzzle.type === 'sudoku';
      const currentGrid = isSimpleGrid ? puzzle.data : puzzle.data.grid;
      
      if (key === 'Backspace' || key === 'Delete') {
        const newGrid = currentGrid.map((row: any) => [...row]);
        newGrid[selectedCell.r][selectedCell.c] = 0;
        setPuzzle({
          ...puzzle,
          data: isSimpleGrid ? newGrid : { ...puzzle.data, grid: newGrid }
        });
      } else if (/^[0-9]$/.test(key)) {
        const num = parseInt(key);
        const currentVal = currentGrid[selectedCell.r][selectedCell.c];
        
        // Allow up to 6 digits (999,999) as requested
        const combinedStr = currentVal === 0 ? `${num}` : `${currentVal}${num}`;
        if (combinedStr.length <= 6) {
          const newVal = parseInt(combinedStr);
          const newGrid = currentGrid.map((row: any) => [...row]);
          newGrid[selectedCell.r][selectedCell.c] = newVal;
          setPuzzle({
            ...puzzle,
            data: isSimpleGrid ? newGrid : { ...puzzle.data, grid: newGrid }
          });
        }
      }
    }
  };

  const handleReset = () => {
    if (!puzzle) return;
    setPuzzle({
      ...puzzle,
      data: JSON.parse(JSON.stringify(puzzle.initialData)),
      isSolved: false,
      solution: undefined,
      solveStats: undefined,
      moves: 0,
      undoStack: []
    });
    setTimer(0);
    setError(null);
    setSuccess(null);
    setSelectedCell(null);
  };

  const handleUndo = () => {
    if (!puzzle || !puzzle.undoStack || puzzle.undoStack.length === 0 || puzzle.isSolved) return;
    const newStack = [...puzzle.undoStack];
    const lastData = newStack.pop();
    setPuzzle({
      ...puzzle,
      data: lastData,
      undoStack: newStack,
      moves: Math.max(0, (puzzle.moves || 0) - 1)
    });
  };

  const handleShuffle = () => {
    setSeed(null);
    setGenerationCount(prev => prev + 1);
  };

  const handleCheckSolution = () => {
    if (!puzzle) return;
    setError(null);
    setSuccess(null);

    const result = ValidationEngine.validate(puzzle.type, puzzle.size, puzzle.data, puzzle.solution, false, puzzle.isSolved);
    setValidation(result);

    if (result.isComplete) {
      setSuccess("Solved Correctly");
      setPuzzle({ ...puzzle, isSolved: true });
      
      // Submit score to backend
      submitScore(puzzle, timer);
    } else if (!result.isFull) {
      setError("Incomplete: Some cells are empty.");
    } else if (!result.isValid) {
      setError("Incorrect: Constraints violated.");
    } else {
      setError("Incomplete: Keep trying!");
    }
  };

  const handleRevealSolution = () => {
    if (!puzzle) return;
    
    const revealedPuzzle = {
      ...puzzle,
      isSolved: true,
      data: JSON.parse(JSON.stringify(puzzle.data))
    };

    // Overwrite userGrid with solutionGrid
    if (['sudoku', 'math-latin-square', 'kenken', 'nonogram', 'n-queens', 'minesweeper'].includes(puzzle.type)) {
      if (puzzle.type === 'nonogram') {
        revealedPuzzle.data.userGrid = JSON.parse(JSON.stringify(puzzle.solution));
      } else if (puzzle.type === 'math-latin-square' || puzzle.type === 'kenken') {
        revealedPuzzle.data.grid = JSON.parse(JSON.stringify(puzzle.solution));
      } else if (puzzle.type === 'n-queens') {
        if (puzzle.solution) {
          revealedPuzzle.data = JSON.parse(JSON.stringify(puzzle.solution));
        } else {
          // If no solution, we can't reveal easily without AI solve
          setError("Use AI Solve to find the solution for N-Queens.");
          return;
        }
      } else if (puzzle.type === 'minesweeper') {
        revealedPuzzle.data.revealed = revealedPuzzle.data.revealed.map((row: any) => row.map(() => true));
      } else {
        revealedPuzzle.data = JSON.parse(JSON.stringify(puzzle.solution));
      }
    } else if (puzzle.type === 'sliding-puzzle') {
      revealedPuzzle.data.grid = JSON.parse(JSON.stringify(puzzle.solution));
      revealedPuzzle.data.emptyIdx = puzzle.solution.length - 1;
    }

    setPuzzle(revealedPuzzle);
    setSuccess("Solved Correctly");
    setValidation({ isValid: true, isComplete: true, isFull: true, conflicts: [], errors: [] });
    setError(null);
  };

  const submitScore = async (p: PuzzleState, time: number) => {
    let name = username;
    if (!name) {
      name = prompt("Enter your name for the leaderboard:") || "Anonymous";
      setUsername(name);
      localStorage.setItem('puzzlotrix_user', name);
    }

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name,
          puzzle_type: p.type,
          grid_size: p.size,
          time_ms: time * 1000,
          moves: p.moves || 0,
          seed: p.actualSeed
        })
      });
      setSuccess("Score submitted to leaderboard!");
    } catch (err) {
      console.error("Failed to submit score:", err);
    }
  };

  const stateSpace = calculateStateSpace(puzzleType, gridSize, puzzle?.rows, puzzle?.cols);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans transition-colors duration-500">
      <Background theme={theme} />
      
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">
            Puzzlotrix
          </h1>
          <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-50">
            Interactive AI Puzzle Solver
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Player</span>
            <span className="text-xs font-black italic text-orange-500">{username || 'Anonymous'}</span>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="View Source"
            >
              <Github size={20} />
            </a>
            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Information"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              title="Leaderboard"
            >
              <Trophy size={20} />
            </button>
          </div>
        </div>
      </header>

      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <Leaderboard 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        puzzleType={puzzleType}
        gridSize={gridSize}
        username={username}
        setUsername={setUsername}
      />

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Controls 
            puzzleType={puzzleType}
            setPuzzleType={setPuzzleType}
            gridSize={gridSize}
            setGridSize={setGridSize}
            rows={rows}
            setRows={setRows}
            cols={cols}
            setCols={setCols}
            seed={seed}
            setSeed={setSeed}
            theme={theme}
            setTheme={setTheme}
            solverConfig={solverConfig}
            setSolverConfig={setSolverConfig}
            onGenerate={handleGenerate}
            onSolve={handleSolve}
            onCancel={handleCancel}
            onCheck={handleCheckSolution}
            onReveal={handleRevealSolution}
            onReset={handleReset}
            isSolving={isSolving}
          />
        </motion.div>

        <motion.div 
          className="flex flex-col gap-6 items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatsPanel 
            gridSize={gridSize}
            rows={puzzle?.rows}
            cols={puzzle?.cols}
            seed={seed}
            actualSeed={puzzle?.actualSeed}
            stateSpace={stateSpace}
            genTime={genTime}
            solveStats={puzzle?.solveStats}
            moves={puzzle?.moves}
            timer={timer}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            canPause={!!puzzle && !puzzle.isSolved && !isSolving}
            stateSpaceLabel={puzzleType === 'maze' ? "Number of Perfect Mazes (Spanning Trees)" : "State Space"}
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm"
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${puzzleType}-${gridSize}-${seed}-${puzzle?.generationId}-${puzzle?.isSolved}`}
              initial={{ opacity: 0, rotateY: 10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -10 }}
              className="w-full flex justify-center relative"
            >
              {puzzle && puzzle.type === 'sliding-puzzle' && (puzzle.rows || 0) * (puzzle.cols || 0) > 16 && puzzle.isSolved && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center rounded-xl">
                  <div className="max-w-xs">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Complexity Limit</h3>
                    <p className="text-sm opacity-80">
                      For grids larger than 4×4, the state space (10^{calculateStateSpace('sliding-puzzle', puzzle.size, puzzle.rows, puzzle.cols).toFixed(2)}) 
                      leads to exponential explosion in A* search. Full pathfinding is disabled to prevent UI freeze.
                    </p>
                  </div>
                </div>
              )}
              
              <div className={`w-full flex justify-center transition-all duration-300 ${isPaused ? 'blur-xl grayscale pointer-events-none opacity-50' : ''}`}>
                {puzzle && (
                  <GridRenderer 
                    type={puzzle.type}
                    size={puzzle.size}
                    rows={puzzle.rows}
                    cols={puzzle.cols}
                    data={puzzle.data}
                    solution={puzzle.solution}
                    isSolved={puzzle.isSolved}
                    onCellClick={handleCellClick}
                    selectedCell={selectedCell}
                    validation={validation}
                    onKeyDown={handleKeyDown}
                  />
                )}
              </div>

              <AnimatePresence>
                {isPaused && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPaused(false)}
                      className="px-8 py-4 bg-[#FF7A00] text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center gap-3"
                    >
                      <Play size={24} fill="currentColor" />
                      Resume Game
                    </motion.button>
                    <p className="mt-4 text-white font-bold uppercase tracking-[0.3em] text-[10px] opacity-70">Game Paused</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="mt-auto pt-12 pb-4 text-[10px] uppercase tracking-widest opacity-30 font-bold">
        Deterministic Neural Grid Engine v1.1.0 // Stateless Architecture
      </footer>
    </div>
  );
}
