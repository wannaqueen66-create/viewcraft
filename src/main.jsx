import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Box,
  CheckCircle,
  HelpCircle,
  Map,
  Maximize,
  MousePointer2,
  RotateCcw,
  RotateCw,
  RotateCcwSquare,
  Trophy,
  Trash2,
  Undo,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'viewcraft:v1';
const GRID_SIZE = 3;
const MAX_HEIGHT = 3;
const CUBE_SIZE = 60;

const levels = [
  { id: 1, name: 'First Step', solution: [[1, 0, 0], [0, 0, 0], [0, 0, 0]] },
  { id: 2, name: 'Corner', solution: [[2, 0, 0], [1, 0, 0], [0, 0, 0]] },
  { id: 3, name: 'Stairs', solution: [[3, 2, 1], [0, 0, 0], [0, 0, 0]] },
  { id: 4, name: 'Gateway', solution: [[2, 2, 2], [2, 0, 2], [0, 0, 0]] },
  { id: 5, name: 'Pyramid', solution: [[0, 1, 0], [1, 2, 1], [0, 1, 0]] },
  { id: 6, name: 'Diagonal', solution: [[1, 0, 0], [0, 2, 0], [0, 0, 3]] },
  { id: 7, name: 'Illusion', solution: [[0, 3, 0], [1, 0, 1], [0, 0, 2]] },
  { id: 8, name: 'Castle', solution: [[3, 1, 3], [1, 0, 1], [3, 1, 3]] },
];

const emptyGrid = () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
const cloneGrid = (grid) => grid.map((row) => [...row]);
const isEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const getTopData = (grid) => grid.map((row) => row.map((height) => height > 0));

const getLeftData = (grid) => {
  const heights = [0, 1, 2].map((x) => Math.max(grid[0][x], grid[1][x], grid[2][x]));
  return [0, 1, 2].map((row) => [0, 1, 2].map((col) => MAX_HEIGHT - row <= heights[col]));
};

const getRightData = (grid) => {
  const heights = [2, 1, 0].map((y) => Math.max(grid[y][0], grid[y][1], grid[y][2]));
  return [0, 1, 2].map((row) => [0, 1, 2].map((col) => MAX_HEIGHT - row <= heights[col]));
};

const textColorMap = {
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
};

const colorMaps = {
  cyan: {
    match: 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] border-cyan-300',
    missing: 'border-2 border-dashed border-cyan-500/50 bg-transparent',
  },
  emerald: {
    match: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] border-emerald-300',
    missing: 'border-2 border-dashed border-emerald-500/50 bg-transparent',
  },
  rose: {
    match: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] border-rose-300',
    missing: 'border-2 border-dashed border-rose-500/50 bg-transparent',
  },
};

const errorClass = 'bg-red-500/50 border-2 border-red-500 animate-pulse';
const emptyClass = 'bg-slate-800/60 border border-slate-700/80';

function Face({ cls, style }) {
  return <div className={`absolute top-0 left-0 w-full h-full ${cls}`} style={{ backfaceVisibility: 'hidden', ...style }} />;
}

function Cube({ x, y, height, onClick }) {
  const px = (x - 1) * CUBE_SIZE;
  const py = (y - 1) * CUBE_SIZE;

  return (
    <div
      className="absolute transition-transform duration-300"
      style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `translate3d(${px}px, ${py}px, 0px)`, transformStyle: 'preserve-3d' }}
    >
      <button
        aria-label={`Set block ${x + 1}, ${y + 1}`}
        className="absolute inset-0 cursor-pointer border border-slate-600/50 transition-colors hover:bg-slate-700/80"
        style={{ backgroundColor: height === 0 ? '#1e293b' : 'transparent', transform: 'translateZ(0px)', backfaceVisibility: 'hidden' }}
        onClick={(event) => {
          event.stopPropagation();
          onClick(x, y);
        }}
      />

      {Array.from({ length: height }).map((_, z) => (
        <button
          key={z}
          aria-label={`Increase block ${x + 1}, ${y + 1}`}
          className="group absolute inset-0 cursor-pointer transition-all hover:brightness-125"
          style={{ transform: `translateZ(${z * CUBE_SIZE}px)`, transformStyle: 'preserve-3d' }}
          onClick={(event) => {
            event.stopPropagation();
            onClick(x, y);
          }}
        >
          <Face cls="bg-indigo-500 border border-indigo-400" style={{ transform: `translateZ(${CUBE_SIZE}px)` }} />
          <Face cls="bg-indigo-950 border border-slate-800" style={{ transform: 'translateZ(0px) rotateX(180deg)' }} />
          <Face cls="bg-indigo-700 border border-indigo-600" style={{ transform: `translateY(${CUBE_SIZE / 2}px) translateZ(${CUBE_SIZE / 2}px) rotateX(-90deg)` }} />
          <Face cls="bg-indigo-800 border border-indigo-700" style={{ transform: `translateY(-${CUBE_SIZE / 2}px) translateZ(${CUBE_SIZE / 2}px) rotateX(90deg)` }} />
          <Face cls="bg-indigo-600 border border-indigo-500" style={{ transform: `translateX(${CUBE_SIZE / 2}px) translateZ(${CUBE_SIZE / 2}px) rotateY(90deg)` }} />
          <Face cls="bg-indigo-800 border border-indigo-700" style={{ transform: `translateX(-${CUBE_SIZE / 2}px) translateZ(${CUBE_SIZE / 2}px) rotateY(-90deg)` }} />
        </button>
      ))}
    </div>
  );
}

function MiniGrid({ title, desc, icon: Icon, colorClass, targetData, currentData }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner backdrop-blur-md transition-all hover:bg-slate-800/60">
      <div className={`mb-3 flex flex-col items-center space-y-1 ${textColorMap[colorClass]}`}>
        <div className="flex items-center space-x-2 font-bold tracking-wider">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        <span className="text-center text-[10px] text-slate-500">{desc}</span>
      </div>
      <div className="grid grid-cols-3 gap-[3px]">
        {[0, 1, 2].flatMap((row) =>
          [0, 1, 2].map((col) => {
            const isTarget = targetData[row][col];
            const isCurrent = currentData[row][col];
            let cellStyle = emptyClass;
            if (isTarget && isCurrent) cellStyle = colorMaps[colorClass].match;
            else if (isTarget && !isCurrent) cellStyle = colorMaps[colorClass].missing;
            else if (!isTarget && isCurrent) cellStyle = errorClass;
            return <div key={`${row}-${col}`} className={`h-6 w-6 rounded-sm transition-all duration-300 md:h-8 md:w-8 ${cellStyle}`} />;
          }),
        )}
      </div>
    </div>
  );
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      levelIdx: Number.isInteger(saved.levelIdx) ? Math.min(Math.max(saved.levelIdx, 0), levels.length - 1) : 0,
      completed: Array.isArray(saved.completed) ? saved.completed : [],
    };
  } catch {
    return { levelIdx: 0, completed: [] };
  }
}

function App() {
  const [{ levelIdx: initialLevelIdx, completed: initialCompleted }] = useState(loadProgress);
  const [levelIdx, setLevelIdx] = useState(initialLevelIdx);
  const [completed, setCompleted] = useState(initialCompleted);
  const [grid, setGrid] = useState(emptyGrid);
  const [history, setHistory] = useState([]);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [camRot, setCamRot] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const [dragButton, setDragButton] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const solution = levels[levelIdx].solution;
  const projections = useMemo(() => ({
    cTop: getTopData(grid),
    sTop: getTopData(solution),
    cLeft: getLeftData(grid),
    sLeft: getLeftData(solution),
    cRight: getRightData(grid),
    sRight: getRightData(solution),
  }), [grid, solution]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ levelIdx, completed }));
  }, [levelIdx, completed]);

  useEffect(() => {
    setGrid(emptyGrid());
    setHistory([]);
    setWon(false);
    setMoves(0);
    setCamRot(45);
  }, [levelIdx]);

  useEffect(() => {
    const solved = isEq(projections.cTop, projections.sTop) && isEq(projections.cLeft, projections.sLeft) && isEq(projections.cRight, projections.sRight);
    setWon(solved);
    if (solved) {
      setCompleted((prev) => (prev.includes(levels[levelIdx].id) ? prev : [...prev, levels[levelIdx].id]));
    }
  }, [projections, levelIdx]);

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    setCamRot((prev) => prev - event.movementX * 0.6);
  };

  const handlePointerUp = (event) => {
    if (dragButton === 'touch' || event.button === dragButton) {
      setIsDragging(false);
      setDragButton(null);
    }
  };

  const handlePointerDown = (event) => {
    const canDrag = event.pointerType === 'touch' || event.button === 1 || event.button === 2;
    if (!canDrag) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
    setDragButton(event.pointerType === 'touch' ? 'touch' : event.button);
  };

  const pushHistory = () => setHistory((prev) => [...prev, { grid: cloneGrid(grid), moves }]);

  const handleCellClick = (x, y) => {
    if (won || isDragging) return;
    pushHistory();
    const newGrid = cloneGrid(grid);
    newGrid[y][x] = (newGrid[y][x] + 1) % (MAX_HEIGHT + 1);
    setGrid(newGrid);
    setMoves((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previous = newHistory.pop();
    setHistory(newHistory);
    setGrid(previous.grid);
    setMoves(previous.moves);
  };

  const handleClear = () => {
    pushHistory();
    setGrid(emptyGrid());
    setMoves(0);
  };

  const handleNextLevel = () => {
    setLevelIdx((idx) => Math.min(idx + 1, levels.length - 1));
  };

  return (
    <main
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 md:flex-row"
      style={{ backgroundImage: 'radial-gradient(circle at center, rgba(30,41,59,0.7) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
    >
      <aside className="z-20 flex w-full flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 shadow-[10px_0_30px_rgba(0,0,0,0.5)] md:w-96">
        <div className="border-b border-slate-800/80 bg-slate-900/40 p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="flex items-center bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 bg-clip-text text-2xl font-bold text-transparent">
              <Box className="mr-3 text-indigo-400" /> ViewCraft
            </h1>
            <button onClick={() => setShowHelp(true)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-indigo-500 hover:text-white" title="How to play">
              <HelpCircle size={18} />
            </button>
          </div>
          <p className="mb-4 text-sm leading-6 text-slate-400">
            Build a 3D block model so its top, left, and right projections match the target views.
          </p>
          <div className="flex items-center gap-2">
            <select
              value={levelIdx}
              onChange={(event) => setLevelIdx(Number(event.target.value))}
              className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 outline-none transition-colors hover:border-indigo-500"
            >
              {levels.map((level, idx) => <option key={level.id} value={idx}>{completed.includes(level.id) ? '✓ ' : ''}Level {level.id}: {level.name}</option>)}
            </select>
            <button onClick={handleUndo} disabled={history.length === 0} title="Undo" className={`flex-shrink-0 rounded-lg border p-2.5 transition-all ${history.length === 0 ? 'cursor-not-allowed border-slate-700/50 bg-slate-800/50 text-slate-600' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'}`}>
              <Undo size={18} />
            </button>
            <button onClick={handleClear} title="Clear" className="flex-shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400 transition-all hover:bg-rose-500/20">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Moves: {moves}</span>
            <span>{completed.length}/{levels.length} completed</span>
          </div>
        </div>

        <div className="flex flex-grow flex-col gap-5 overflow-y-auto p-5 md:p-6">
          <MiniGrid title="Top View" desc="Occupancy only; height does not matter" icon={Map} colorClass="cyan" targetData={projections.sTop} currentData={projections.cTop} />
          <MiniGrid title="Left View" desc="Silhouette height from the Y direction" icon={Maximize} colorClass="emerald" targetData={projections.sLeft} currentData={projections.cLeft} />
          <MiniGrid title="Right View" desc="Silhouette height from the X direction" icon={Maximize} colorClass="rose" targetData={projections.sRight} currentData={projections.cRight} />
        </div>
      </aside>

      <section
        className={`relative flex min-h-[520px] flex-grow flex-col items-center justify-center overflow-hidden touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-3 md:right-6 md:top-6">
          <div className="flex rounded-2xl border border-slate-700/60 bg-slate-900/80 p-2 shadow-xl backdrop-blur-md">
            <button onClick={() => setCamRot((prev) => prev - 90)} className="group rounded-xl p-3 text-slate-300 transition-all hover:bg-slate-800 hover:text-white" title="Rotate left">
              <RotateCcw size={20} className="transition-transform group-hover:-rotate-45" />
            </button>
            <div className="mx-1 w-px bg-slate-700/50" />
            <button onClick={() => setCamRot(45)} className="group rounded-xl p-3 text-slate-300 transition-all hover:bg-slate-800 hover:text-white" title="Reset view">
              <RotateCcwSquare size={20} />
            </button>
            <div className="mx-1 w-px bg-slate-700/50" />
            <button onClick={() => setCamRot((prev) => prev + 90)} className="group rounded-xl p-3 text-slate-300 transition-all hover:bg-slate-800 hover:text-white" title="Rotate right">
              <RotateCw size={20} className="transition-transform group-hover:rotate-45" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 shadow-lg">
            <MousePointer2 size={12} /> Touch drag, or right/middle mouse drag to rotate
          </div>
        </div>

        <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: '2000px' }}>
          <div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(60deg) rotateZ(${camRot}deg)`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {grid.flatMap((row, y) => row.map((height, x) => <Cube key={`${x}-${y}`} x={x} y={y} height={height} onClick={handleCellClick} />))}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-12 left-8 z-20 h-24 w-24 md:bottom-16 md:left-10" style={{ perspective: '800px' }}>
          <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d', transform: `rotateX(60deg) rotateZ(${camRot}deg)`, transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" style={{ transform: 'translateZ(1px)' }} />
            <div className="absolute left-1/2 top-1/2 h-1.5 origin-left bg-rose-500" style={{ width: '50px', transform: 'translateY(-50%) translateZ(1px)' }}>
              <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-400" style={{ transform: `rotateZ(${-camRot}deg) rotateX(-60deg)` }}>X</span>
            </div>
            <div className="absolute left-1/2 top-1/2 w-1.5 origin-top bg-emerald-500" style={{ height: '50px', transform: 'translateX(-50%) translateZ(1px)' }}>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm font-bold text-emerald-400" style={{ transform: `rotateZ(${-camRot}deg) rotateX(-60deg)` }}>Y</span>
            </div>
            <div className="absolute left-1/2 top-1/2 w-1.5 origin-bottom bg-cyan-400" style={{ height: '50px', transform: 'translateX(-50%) translateY(-100%) rotateX(-90deg)' }}>
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-sm font-bold text-cyan-400" style={{ transform: `rotateX(90deg) rotateZ(${-camRot}deg) rotateX(-60deg)` }}>Z</span>
            </div>
          </div>
        </div>

        {won && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="flex w-[90%] max-w-sm flex-col items-center rounded-[2rem] border border-slate-700 bg-slate-900 p-10 text-center shadow-[0_0_80px_rgba(79,70,229,0.3)]">
              <Trophy size={72} className="mb-6 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
              <h2 className="mb-2 text-3xl font-black tracking-widest text-white">Perfect Build</h2>
              <p className="mb-3 font-medium text-slate-400">All projections match in {moves} moves.</p>
              <button onClick={() => navigator.clipboard?.writeText(`I solved ViewCraft Level ${levels[levelIdx].id} in ${moves} moves!`)} className="mb-4 text-sm text-indigo-300 hover:text-indigo-200">Copy share text</button>
              {levelIdx < levels.length - 1 ? (
                <button onClick={handleNextLevel} className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95">
                  Next Level <ArrowRight className="ml-2" size={22} />
                </button>
              ) : (
                <div className="flex w-full items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/20 py-4 text-lg font-bold text-emerald-400">
                  <CheckCircle className="mr-2" /> You cleared every level!
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {showHelp && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-3 text-2xl font-bold text-white">How to play</h2>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              <li>• Click a tile to cycle its height from 0 to 3 blocks.</li>
              <li>• Match the target top, left, and right projection grids.</li>
              <li>• Solid colored cells are correct, dashed cells are missing, red cells are extra.</li>
              <li>• Drag with touch, right mouse, or middle mouse to rotate the model.</li>
              <li>• Some puzzles may have more than one valid 3D structure. Any matching projection wins.</li>
            </ul>
            <button className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500" onClick={() => setShowHelp(false)}>Start building</button>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
