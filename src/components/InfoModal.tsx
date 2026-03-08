import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Github, ExternalLink, Brain, Gamepad2, Info as InfoIcon } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'about' | 'how-to-play' | 'algorithms'>('about');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-bottom border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
                  <InfoIcon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Puzzlotrix Info</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">System Documentation v1.1.0</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-bottom border-white/5 bg-white/2">
              {[
                { id: 'about', label: 'About', icon: InfoIcon },
                { id: 'how-to-play', label: 'How to Play', icon: Gamepad2 },
                { id: 'algorithms', label: 'Algorithms', icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white/5 text-orange-500 border-b-2 border-orange-500' 
                      : 'text-white/40 hover:text-white/70 hover:bg-white/2'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 text-sm leading-relaxed text-white/70">
              {activeTab === 'about' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Project Overview</h3>
                  <p className="mb-4">
                    Puzzlotrix is a high-performance, interactive puzzle engine designed to showcase advanced search algorithms and real-time state space exploration. 
                    Built with a focus on "crafted" UI/UX, it provides a playground for both human solving and AI-assisted optimization.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-orange-500 font-black text-lg mb-1 italic">100%</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Deterministic</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-orange-500 font-black text-lg mb-1 italic">Full Stack</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">SQLite + Express</div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-4">Core Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {['React 18', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'Tailwind CSS', 'Motion', 'Web Workers', 'A* Pathfinding'].map(tech => (
                        <span key={tech} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-white/5">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <a 
                      href="https://github.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <Github size={14} />
                      View Source on GitHub
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </motion.div>
              )}

              {activeTab === 'how-to-play' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Math Latin Square
                      </h4>
                      <p className="text-xs opacity-80">Fill the grid so each number appears once per row/column. Rows and columns must also satisfy the arithmetic operations and target results shown on the edges.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Sudoku
                      </h4>
                      <p className="text-xs opacity-80">Classic placement puzzle. Fill the grid so every row, column, and sub-grid (box) contains all digits from 1 to N without repetition.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Maze
                      </h4>
                      <p className="text-xs opacity-80">Navigate from Start (S) to End (E). You can move Start/End by clicking them and then clicking a new empty cell. Walls (black) are impassable.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        N-Queens
                      </h4>
                      <p className="text-xs opacity-80">Place N queens on an N×N chessboard such that no two queens threaten each other. They cannot share the same row, column, or diagonal.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Minesweeper
                      </h4>
                      <p className="text-xs opacity-80">Reveal all non-mine cells. Numbers indicate adjacent mines. Click to reveal, use logic to deduce mine locations. Hitting a mine ends the game.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Nonogram
                      </h4>
                      <p className="text-xs opacity-80">Picture logic puzzle. Use the number clues on the edges to fill cells and reveal a hidden image. Numbers represent lengths of consecutive filled cells.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        KenKen
                      </h4>
                      <p className="text-xs opacity-80">A mix of Sudoku and Math. Fill the grid while satisfying the "cages" — groups of cells that must produce a target number using a specific operator.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-orange-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        Sliding Puzzle
                      </h4>
                      <p className="text-xs opacity-80">Slide tiles into the empty space to arrange them in numerical order. The goal is to reach the target state with the empty space at the bottom-right.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'algorithms' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-[10px] border-b border-white/10 pb-2">Pathfinding & Search</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">A* (Manhattan & Hamming)</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          Uses <code className="text-orange-400">f(n) = g(n) + h(n)</code>. <strong>Manhattan</strong> distance is the sum of absolute differences of coordinates. <strong>Hamming</strong> distance is the count of misplaced tiles.
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">IDA* & Greedy Search</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>IDA*</strong> is memory-efficient iterative deepening. <strong>Greedy Search</strong> expands the node that appears closest to the goal, ignoring the cost to reach it.
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">BFS, DFS & Dijkstra</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>BFS</strong> finds the shortest path in unweighted grids. <strong>DFS</strong> explores deep first. <strong>Dijkstra</strong> handles weighted edges without heuristics.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-[10px] border-b border-white/10 pb-2">Constraint Satisfaction (CSP)</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Backtracking (MRV & Forward Checking)</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>MRV</strong> (Minimum Remaining Values) chooses the most constrained variable. <strong>Forward Checking</strong> keeps track of remaining legal values for unassigned variables.
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">AC-3 & Constraint Propagation</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>AC-3</strong> enforces arc consistency. <strong>Constraint Propagation</strong> reduces the search space by identifying values that cannot be part of any solution.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-[10px] border-b border-white/10 pb-2">Specialized Solvers</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Logical Deduction & Probabilistic</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>Logical Deduction</strong> uses rules (like Minesweeper patterns). <strong>Probabilistic</strong> solvers estimate likelihoods when certain information is missing.
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Hybrid & Constructive</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>Hybrid</strong> combines multiple techniques (e.g., Dead-End Filling + BFS). <strong>Constructive</strong> algorithms build the solution step-by-step using local heuristics.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-white font-bold uppercase tracking-widest text-[10px] border-b border-white/10 pb-2">Maze Generation</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Prim's, Kruskal's & Eller's</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>Prim's</strong> and <strong>Kruskal's</strong> are Minimum Spanning Tree algorithms. <strong>Eller's</strong> generates mazes row-by-row with minimal memory.
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">Binary Tree & Recursive DFS</h4>
                        <p className="text-[11px] leading-relaxed opacity-80">
                          <strong>Binary Tree</strong> is fast but creates biased mazes. <strong>Recursive DFS</strong> creates long, winding paths with many dead ends.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-30">
                Puzzlotrix // Neural Grid Engine // abhinavsingh11d
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
