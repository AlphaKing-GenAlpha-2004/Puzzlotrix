import React, { useState } from 'react';
import { PuzzleType, ThemeType, AlgorithmType, SolverConfig } from '../types';
import { RefreshCw, Play, Shuffle, X, Settings2, CheckCircle2 } from 'lucide-react';
import { getAlgorithmsForPuzzle, MAZE_GEN_ALGORITHMS } from '../core/AlgorithmRegistry';
import { MIN_GRID_SIZE, MAX_GRID_SIZE, THEME_COLORS } from '../constants';

interface ControlsProps {
  puzzleType: PuzzleType;
  setPuzzleType: (t: PuzzleType) => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  rows?: number;
  setRows?: (r: number) => void;
  cols?: number;
  setCols?: (c: number) => void;
  seed: number | null;
  setSeed: (s: number | null) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  solverConfig: SolverConfig;
  setSolverConfig: (c: SolverConfig) => void;
  onGenerate: () => void;
  onSolve: () => void;
  onCancel: () => void;
  onCheck: () => void;
  onReveal: () => void;
  onReset: () => void;
  isSolving: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  puzzleType, setPuzzleType,
  gridSize, setGridSize,
  rows = 4, setRows,
  cols = 4, setCols,
  seed, setSeed,
  theme, setTheme,
  solverConfig, setSolverConfig,
  onGenerate, onSolve, onCancel, onCheck, onReveal, onReset,
  isSolving
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const puzzleTypes: { value: PuzzleType; label: string }[] = [
    { value: 'math-latin-square', label: 'Math Latin Square' },
    { value: 'sudoku', label: 'Sudoku' },
    { value: 'maze', label: 'Maze' },
    { value: 'n-queens', label: 'N-Queens' },
    { value: 'minesweeper', label: 'Minesweeper' },
    { value: 'nonogram', label: 'Nonogram' },
    { value: 'kenken', label: 'KenKen' },
    { value: 'sliding-puzzle', label: 'Sliding Puzzle' },
  ];

  const algorithms = getAlgorithmsForPuzzle(puzzleType, gridSize);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1e12));
  };

  const toggleRandomMode = () => {
    if (seed === null) {
      setSeed(123456);
    } else {
      setSeed(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#2A2A2A] backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl w-full max-w-md text-[#EAEAEA]">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tighter italic text-[#FF7A00]">Engine Config</h2>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg transition-colors ${showAdvanced ? 'bg-[#FF7A00]/20 text-[#FF7A00]' : 'hover:bg-white/10'}`}
        >
          <Settings2 size={20} />
        </button>
      </div>

        <div className="space-y-4">
          {puzzleType === 'maze' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Maze Generation Algorithm</label>
              <select
                value={solverConfig.genAlgorithm || 'dfs'}
                disabled={isSolving}
                onChange={(e) => setSolverConfig({ ...solverConfig, genAlgorithm: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MAZE_GEN_ALGORITHMS.map(a => (
                  <option key={a.value} value={a.value} className="bg-[#1E1E1E]">{a.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Puzzle Type</label>
            <select
              value={puzzleType}
              disabled={isSolving}
              onChange={(e) => {
                const newType = e.target.value as PuzzleType;
                setPuzzleType(newType);
                
                // Auto-adjust grid size for Sudoku
                if (newType === 'sudoku') {
                  const root = Math.sqrt(gridSize);
                  if (!Number.isInteger(root)) {
                    const nearestRoot = Math.round(root);
                    const nearestSquare = Math.max(4, nearestRoot * nearestRoot);
                    setGridSize(nearestSquare);
                  }
                }

                // Reset algorithm if not valid for new type
                const newAlgos = getAlgorithmsForPuzzle(newType, gridSize);
                if (!newAlgos.find(a => a.value === solverConfig.algorithm)) {
                  setSolverConfig({ ...solverConfig, algorithm: newAlgos[0].value });
                }
              }}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA] disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {puzzleTypes.map(t => (
              <option key={t.value} value={t.value} className="bg-[#1E1E1E]">{t.label}</option>
            ))}
          </select>
        </div>

        {puzzleType === 'sliding-puzzle' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Rows: {rows}</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={rows}
                  disabled={isSolving}
                  onChange={(e) => setRows?.(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
                />
                <input 
                  type="number"
                  min={3}
                  max={10}
                  value={rows}
                  disabled={isSolving}
                  onChange={(e) => setRows?.(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Columns: {cols}</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={cols}
                  disabled={isSolving}
                  onChange={(e) => setCols?.(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
                />
                <input 
                  type="number"
                  min={3}
                  max={10}
                  value={cols}
                  disabled={isSolving}
                  onChange={(e) => setCols?.(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Grid Size: {gridSize}</label>
              {puzzleType === 'sudoku' && (
                <span className="text-[8px] font-bold text-[#FF7A00] uppercase tracking-tighter">Perfect Square Required</span>
              )}
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={MIN_GRID_SIZE}
                max={puzzleType === 'sudoku' ? 49 : MAX_GRID_SIZE}
                value={gridSize}
                disabled={isSolving}
                onChange={(e) => {
                  let val = parseInt(e.target.value);
                  if (puzzleType === 'sudoku') {
                    val = Math.min(49, val);
                    const root = Math.sqrt(val);
                    if (!Number.isInteger(root)) {
                      const nearestRoot = Math.round(root);
                      val = Math.max(4, nearestRoot * nearestRoot);
                    }
                  }
                  setGridSize(val);
                }}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00] disabled:opacity-50"
              />
              <input 
                type="number"
                min={MIN_GRID_SIZE}
                max={puzzleType === 'sudoku' ? 49 : MAX_GRID_SIZE}
                value={gridSize}
                disabled={isSolving}
                onChange={(e) => {
                  const maxLimit = puzzleType === 'sudoku' ? 49 : MAX_GRID_SIZE;
                  let val = parseInt(e.target.value) || MIN_GRID_SIZE;
                  val = Math.max(MIN_GRID_SIZE, Math.min(maxLimit, val));
                  
                  if (puzzleType === 'sudoku') {
                    const root = Math.sqrt(val);
                    if (!Number.isInteger(root)) {
                      const nearestRoot = Math.round(root);
                      val = Math.max(4, nearestRoot * nearestRoot);
                    }
                  }
                  
                  setGridSize(val);
                }}
                className="w-16 bg-black/40 border border-white/10 rounded-lg p-1 text-center text-xs outline-none focus:border-[#FF7A00] disabled:opacity-50"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Generation Mode</label>
            <button 
              onClick={toggleRandomMode}
              disabled={isSolving}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${seed === null ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#FF7A00]/20 text-[#FF7A00]'} disabled:opacity-50`}
            >
              {seed === null ? 'RANDOM' : 'SEED'}
            </button>
          </div>
          {seed !== null && (
            <div className="flex gap-2">
              <input
                type="number"
                value={seed}
                disabled={isSolving}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all font-mono text-sm text-[#EAEAEA] disabled:opacity-50"
              />
              <button
                onClick={handleRandomSeed}
                disabled={isSolving}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                title="Random Seed"
              >
                <Shuffle size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Solving Algorithm</label>
            <select
              value={solverConfig.algorithm}
              onChange={(e) => setSolverConfig({ ...solverConfig, algorithm: e.target.value as AlgorithmType })}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-[#FF7A00] transition-all appearance-none cursor-pointer text-[#EAEAEA]"
            >
              {algorithms.map(a => (
                <option key={a.value} value={a.value} className="bg-[#1E1E1E]">{a.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Animation Speed</label>
              <span className="text-[10px] font-mono opacity-60">{solverConfig.speed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={solverConfig.speed}
              onChange={(e) => setSolverConfig({ ...solverConfig, speed: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF7A00]"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Instant Solve</label>
            <button 
              onClick={() => setSolverConfig({ ...solverConfig, instant: !solverConfig.instant })}
              className={`w-10 h-5 rounded-full transition-colors relative ${solverConfig.instant ? 'bg-[#FF7A00]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${solverConfig.instant ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={onGenerate}
          disabled={isSolving}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8C1A] disabled:bg-neutral-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-900/20 text-sm"
        >
          <RefreshCw size={16} className={isSolving ? 'animate-spin' : ''} />
          New
        </button>

        <button
          onClick={onReset}
          disabled={isSolving}
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
        >
          <RefreshCw size={16} className="rotate-180" />
          Reset
        </button>
        
        {isSolving ? (
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-[#FF4C4C] hover:bg-[#FF6666] text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 text-sm"
          >
            <X size={16} />
            Cancel
          </button>
        ) : (
          <button
            onClick={onSolve}
            className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#2DD4BF] text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20 text-sm"
          >
            <Play size={16} />
            AI Solve
          </button>
        )}
      </div>

      {['nonogram', 'kenken', 'sudoku', 'math-latin-square', 'n-queens', 'maze', 'minesweeper', 'sliding-puzzle'].includes(puzzleType) && !isSolving && (
        <div className="flex gap-2">
          <button
            onClick={onCheck}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl transition-all active:scale-95 text-xs"
          >
            Check Solution
          </button>
          <button
            onClick={onReveal}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition-all active:scale-95 text-xs"
          >
            Reveal Solution
          </button>
        </div>
      )}
    </div>
  );
};
