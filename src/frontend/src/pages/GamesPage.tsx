import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CrosswordCell, CrosswordClue, Puzzle } from "../backend.d";
import { ClueDirection } from "../backend.d";
import { useGetActivePuzzles } from "../hooks/useQueries";
import { navigate } from "../lib/navigate";

// Static crossword pattern for decorative elements — precomputed with stable ids
const DECO_PATTERN = [
  { id: "p00", b: false },
  { id: "p01", b: false },
  { id: "p02", b: true },
  { id: "p03", b: false },
  { id: "p04", b: false },
  { id: "p10", b: false },
  { id: "p11", b: true },
  { id: "p12", b: false },
  { id: "p13", b: true },
  { id: "p14", b: false },
  { id: "p20", b: false },
  { id: "p21", b: false },
  { id: "p22", b: false },
  { id: "p23", b: false },
  { id: "p24", b: false },
  { id: "p30", b: false },
  { id: "p31", b: true },
  { id: "p32", b: false },
  { id: "p33", b: true },
  { id: "p34", b: false },
  { id: "p40", b: false },
  { id: "p41", b: false },
  { id: "p42", b: true },
  { id: "p43", b: false },
  { id: "p44", b: false },
];

// ─── Crossword Grid Component ─────────────────────────────────────────────────

interface FlatCell {
  row: number;
  col: number;
  cellData: CrosswordCell;
}

interface CrosswordGridProps {
  puzzle: Puzzle;
}

function CrosswordGrid({ puzzle }: CrosswordGridProps) {
  const gridWidth = Number(puzzle.gridWidth);
  const gridHeight = Number(puzzle.gridHeight);

  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array.from({ length: gridHeight }, () => Array(gridWidth).fill("")),
  );
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [direction, setDirection] = useState<"across" | "down">("across");
  const [checkedGrid, setCheckedGrid] = useState<
    ("correct" | "incorrect" | null)[][]
  >(() =>
    Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null)),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const focusForInput = () => {
    hiddenInputRef.current?.focus();
    containerRef.current?.focus();
  };

  // Flat cells with precomputed row/col for stable keying
  const flatCells: FlatCell[] = puzzle.cells.map((cellData, flatIdx) => ({
    row: Math.floor(flatIdx / gridWidth),
    col: flatIdx % gridWidth,
    cellData,
  }));

  useEffect(() => {
    containerRef.current?.focus();
    // Focus on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCell = (row: number, col: number): CrosswordCell | null => {
    if (row < 0 || row >= gridHeight || col < 0 || col >= gridWidth)
      return null;
    return puzzle.cells[row * gridWidth + col] ?? null;
  };

  const findClueForCell = (
    row: number,
    col: number,
    dir: "across" | "down",
  ): CrosswordClue | undefined => {
    const motokDir =
      dir === "across" ? ClueDirection.across : ClueDirection.down;
    return puzzle.clues.find((c) => {
      if (c.direction !== motokDir) return false;
      const sRow = Number(c.startRow);
      const sCol = Number(c.startCol);
      const len = Number(c.length);
      if (dir === "across")
        return row === sRow && col >= sCol && col < sCol + len;
      return col === sCol && row >= sRow && row < sRow + len;
    });
  };

  const advanceCell = (
    row: number,
    col: number,
    dir: "across" | "down",
  ): { row: number; col: number } | null => {
    let r = row;
    let c = col;
    if (dir === "across") c++;
    else r++;
    while (r < gridHeight && c < gridWidth) {
      const cell = getCell(r, c);
      if (cell && !cell.isBlack) return { row: r, col: c };
      if (dir === "across") c++;
      else r++;
    }
    return null;
  };

  const retreatCell = (
    row: number,
    col: number,
    dir: "across" | "down",
  ): { row: number; col: number } | null => {
    let r = row;
    let c = col;
    if (dir === "across") c--;
    else r--;
    while (r >= 0 && c >= 0) {
      const cell = getCell(r, c);
      if (cell && !cell.isBlack) return { row: r, col: c };
      if (dir === "across") c--;
      else r--;
    }
    return null;
  };

  const handleCellClick = (row: number, col: number) => {
    // Focus MUST be first — before any setState — so iOS honors the gesture
    hiddenInputRef.current?.focus();
    const cell = getCell(row, col);
    if (!cell || cell.isBlack) return;
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection((d) => (d === "across" ? "down" : "across"));
    } else {
      setSelectedCell({ row, col });
    }
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setDirection("across");
      const next = advanceCell(row, col, "across");
      if (next) setSelectedCell(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setDirection("across");
      const prev = retreatCell(row, col, "across");
      if (prev) setSelectedCell(prev);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDirection("down");
      const next = advanceCell(row, col, "down");
      if (next) setSelectedCell(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDirection("down");
      const prev = retreatCell(row, col, "down");
      if (prev) setSelectedCell(prev);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const newGrid = userGrid.map((r) => [...r]);
      if (newGrid[row]?.[col]) {
        newGrid[row][col] = "";
        setUserGrid(newGrid);
      } else {
        const prev = retreatCell(row, col, direction);
        if (prev) {
          newGrid[prev.row][prev.col] = "";
          setSelectedCell(prev);
          setUserGrid(newGrid);
        }
      }
      const newChecked = checkedGrid.map((r) => [...r]);
      if (newChecked[row]) newChecked[row][col] = null;
      setCheckedGrid(newChecked);
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      const newGrid = userGrid.map((r) => [...r]);
      if (newGrid[row]) newGrid[row][col] = letter;
      setUserGrid(newGrid);
      const newChecked = checkedGrid.map((r) => [...r]);
      if (newChecked[row]) newChecked[row][col] = null;
      setCheckedGrid(newChecked);
      const next = advanceCell(row, col, direction);
      if (next) setSelectedCell(next);
    }
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent.inputType === "insertText" && selectedCell) {
      const inserted = nativeEvent.data ?? "";
      if (/[a-zA-Z]/.test(inserted)) {
        const letter = inserted.toUpperCase();
        const { row, col } = selectedCell;
        const newGrid = userGrid.map((r) => [...r]);
        if (newGrid[row]) newGrid[row][col] = letter;
        setUserGrid(newGrid);
        const newChecked = checkedGrid.map((r) => [...r]);
        if (newChecked[row]) newChecked[row][col] = null;
        setCheckedGrid(newChecked);
        const next = advanceCell(row, col, direction);
        if (next) setSelectedCell(next);
      }
    } else if (
      (nativeEvent.inputType === "deleteContentBackward" ||
        nativeEvent.inputType === "deleteContentForward") &&
      selectedCell
    ) {
      const { row, col } = selectedCell;
      const newGrid = userGrid.map((r) => [...r]);
      if (newGrid[row]?.[col]) {
        newGrid[row][col] = "";
        setUserGrid(newGrid);
      } else {
        const prev = retreatCell(row, col, direction);
        if (prev) {
          newGrid[prev.row][prev.col] = "";
          setSelectedCell(prev);
          setUserGrid(newGrid);
        }
      }
      const newChecked = checkedGrid.map((r) => [...r]);
      if (newChecked[row]) newChecked[row][col] = null;
      setCheckedGrid(newChecked);
    }
    e.target.value = "";
  };

  const handleCheck = () => {
    const answerGrid: string[][] = Array.from({ length: gridHeight }, () =>
      Array(gridWidth).fill(""),
    );
    for (const clue of puzzle.clues) {
      const sRow = Number(clue.startRow);
      const sCol = Number(clue.startCol);
      const len = Number(clue.length);
      const answer = clue.answer.toUpperCase();
      for (let i = 0; i < len; i++) {
        if (clue.direction === ClueDirection.across) {
          if (sRow < gridHeight && sCol + i < gridWidth)
            if (answerGrid[sRow]) answerGrid[sRow][sCol + i] = answer[i] ?? "";
        } else {
          if (sRow + i < gridHeight && sCol < gridWidth)
            if (answerGrid[sRow + i])
              answerGrid[sRow + i][sCol] = answer[i] ?? "";
        }
      }
    }
    const newChecked = userGrid.map((rowArr, ri) =>
      rowArr.map((cell, ci) => {
        if (!cell) return null;
        const gridCell = getCell(ri, ci);
        if (!gridCell || gridCell.isBlack) return null;
        return cell === (answerGrid[ri]?.[ci] ?? "")
          ? ("correct" as const)
          : ("incorrect" as const);
      }),
    );
    setCheckedGrid(newChecked);
  };

  const handleClear = () => {
    setUserGrid(
      Array.from({ length: gridHeight }, () => Array(gridWidth).fill("")),
    );
    setCheckedGrid(
      Array.from({ length: gridHeight }, () => Array(gridWidth).fill(null)),
    );
    setSelectedCell(null);
  };

  const activeClue = selectedCell
    ? findClueForCell(selectedCell.row, selectedCell.col, direction)
    : undefined;

  const isInActiveClue = (row: number, col: number): boolean => {
    if (!activeClue) return false;
    const sRow = Number(activeClue.startRow);
    const sCol = Number(activeClue.startCol);
    const len = Number(activeClue.length);
    if (activeClue.direction === ClueDirection.across) {
      return row === sRow && col >= sCol && col < sCol + len;
    }
    return col === sCol && row >= sRow && row < sRow + len;
  };

  const maxCellForType = puzzle.puzzleType === "mini" ? 52 : 36;
  const cellSize = Math.min(
    maxCellForType,
    Math.floor(Math.min(window.innerWidth - 48, 480) / gridWidth),
  );
  const numberFontSize = Math.max(7, Math.floor(cellSize * 0.22));
  const letterFontSize = Math.max(12, Math.floor(cellSize * 0.5));

  const acrossClues = [...puzzle.clues]
    .filter((c) => c.direction === ClueDirection.across)
    .sort((a, b) => Number(a.number) - Number(b.number));
  const downClues = [...puzzle.clues]
    .filter((c) => c.direction === ClueDirection.down)
    .sort((a, b) => Number(a.number) - Number(b.number));

  return (
    <div>
      {/* Grid wrapper — role=application makes tabIndex valid for a11y */}
      <div
        ref={containerRef}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: crossword grid is an interactive application
        tabIndex={0}
        role="application"
        aria-label="Crossword puzzle grid"
        onKeyDown={handleContainerKeyDown}
        className="outline-none inline-block focus:ring-1 focus:ring-white/20 relative"
        data-ocid="games.canvas_target"
      >
        {/* Hidden input — focused on cell tap to open mobile keyboard */}
        <input
          ref={hiddenInputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          tabIndex={0}
          onKeyDown={handleContainerKeyDown}
          onChange={handleHiddenInputChange}
          style={{
            position: "fixed",
            top: "-999px",
            left: "-999px",
            opacity: 0,
            width: "1px",
            height: "1px",
          }}
        />
        <div
          className="inline-grid border border-white/20"
          style={{
            gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
          }}
        >
          {flatCells.map(({ row, col, cellData: cell }) => {
            const cellKey = `cell-r${row}c${col}`;

            if (cell.isBlack) {
              return (
                <div
                  key={cellKey}
                  className="bg-white/85"
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            }

            const isSelected =
              selectedCell?.row === row && selectedCell?.col === col;
            const inActive = isInActiveClue(row, col);
            const userLetter = userGrid[row]?.[col] ?? "";
            const checked = checkedGrid[row]?.[col] ?? null;

            let bgClass = "bg-black";
            if (isSelected) bgClass = "bg-amber-400";
            else if (checked === "correct") bgClass = "bg-green-900/70";
            else if (checked === "incorrect") bgClass = "bg-red-900/70";
            else if (inActive) bgClass = "bg-white/10";

            let letterColor = "text-white";
            if (isSelected) letterColor = "text-black";
            else if (checked === "correct") letterColor = "text-green-300";
            else if (checked === "incorrect") letterColor = "text-red-300";

            return (
              <button
                key={cellKey}
                type="button"
                aria-label={`Cell row ${row + 1} column ${col + 1}${
                  cell.number != null ? `, number ${Number(cell.number)}` : ""
                }${userLetter ? `, letter ${userLetter}` : ""}`}
                className={`relative border border-white/20 flex items-center justify-center select-none ${bgClass}`}
                style={{ width: cellSize, height: cellSize }}
                onTouchStart={() => {
                  hiddenInputRef.current?.focus();
                }}
                onClick={() => handleCellClick(row, col)}
              >
                {cell.number != null && (
                  <span
                    className={`absolute top-0 left-0.5 leading-none font-sans ${
                      isSelected ? "text-black/60" : "text-white/50"
                    }`}
                    style={{ fontSize: numberFontSize, lineHeight: 1.2 }}
                  >
                    {Number(cell.number)}
                  </span>
                )}
                <span
                  className={`font-sans font-bold uppercase leading-none ${letterColor}`}
                  style={{ fontSize: letterFontSize }}
                >
                  {userLetter}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active clue hint */}
      {activeClue ? (
        <div className="mt-4 p-3 border-l-2 border-amber-400/60 bg-amber-400/5 max-w-sm">
          <span className="text-amber-400 text-xs font-sans uppercase tracking-wider">
            {Number(activeClue.number)}&nbsp;
            {activeClue.direction === ClueDirection.across ? "Across" : "Down"}
          </span>
          <p className="text-white/80 text-sm font-sans mt-0.5 leading-snug">
            {activeClue.clue}
          </p>
        </div>
      ) : (
        <div className="mt-4 h-[52px]" />
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-5">
        <button
          type="button"
          data-ocid="games.check.button"
          onClick={handleCheck}
          className="text-white border border-white/30 px-5 py-2 text-xs font-sans uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          Check
        </button>
        <button
          type="button"
          data-ocid="games.clear.button"
          onClick={handleClear}
          className="text-white/50 border border-white/20 px-5 py-2 text-xs font-sans uppercase tracking-widest hover:border-white/40 hover:text-white/80 transition-all"
        >
          Clear
        </button>
      </div>

      {/* Clue lists */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <p className="section-label mb-4">Across</p>
          <div className="space-y-1.5">
            {acrossClues.map((clue) => {
              const isActive =
                activeClue?.number === clue.number &&
                activeClue?.direction === clue.direction;
              return (
                <button
                  type="button"
                  key={`across-${Number(clue.number)}`}
                  onClick={() => {
                    setSelectedCell({
                      row: Number(clue.startRow),
                      col: Number(clue.startCol),
                    });
                    setDirection("across");
                    focusForInput();
                  }}
                  className={`text-left w-full flex gap-2 text-sm font-sans py-1 transition-colors ${
                    isActive
                      ? "text-amber-400"
                      : "text-white/55 hover:text-white/80"
                  }`}
                >
                  <span className="font-bold shrink-0 w-7">
                    {Number(clue.number)}.
                  </span>
                  <span className="leading-snug">{clue.clue}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="section-label mb-4">Down</p>
          <div className="space-y-1.5">
            {downClues.map((clue) => {
              const isActive =
                activeClue?.number === clue.number &&
                activeClue?.direction === clue.direction;
              return (
                <button
                  type="button"
                  key={`down-${Number(clue.number)}`}
                  onClick={() => {
                    setSelectedCell({
                      row: Number(clue.startRow),
                      col: Number(clue.startCol),
                    });
                    setDirection("down");
                    focusForInput();
                  }}
                  className={`text-left w-full flex gap-2 text-sm font-sans py-1 transition-colors ${
                    isActive
                      ? "text-amber-400"
                      : "text-white/55 hover:text-white/80"
                  }`}
                >
                  <span className="font-bold shrink-0 w-7">
                    {Number(clue.number)}.
                  </span>
                  <span className="leading-snug">{clue.clue}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coming Soon Placeholder ──────────────────────────────────────────────────

function ComingSoon() {
  return (
    <div
      data-ocid="games.empty_state"
      className="border border-white/10 py-12 px-8 flex flex-col items-center gap-3"
    >
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: "repeat(5, 10px)" }}
      >
        {DECO_PATTERN.map(({ id, b }) => (
          <div
            key={id}
            className={b ? "bg-white/30" : "border border-white/20 bg-black"}
            style={{ width: 10, height: 10 }}
          />
        ))}
      </div>
      <p className="text-white/30 text-xs font-sans uppercase tracking-widest mt-2">
        Coming Soon
      </p>
      <p className="text-white/20 text-xs font-sans text-center max-w-xs leading-relaxed">
        A new puzzle is being crafted. Check back soon.
      </p>
    </div>
  );
}

// ─── Games Page ───────────────────────────────────────────────────────────────

export default function GamesPage() {
  const { data, isLoading } = useGetActivePuzzles();

  return (
    <motion.main
      data-ocid="games.page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <button
            type="button"
            data-ocid="games.home.link"
            onClick={() => navigate("/")}
            className="text-white/30 hover:text-white/60 text-xs font-sans uppercase tracking-wider mb-6 block transition-colors"
          >
            ← Times²
          </button>
          <p className="section-label mb-3">Times² Games</p>
          <h1
            className="font-editorial text-white leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            The Crossword
          </h1>
          <p className="text-white/35 font-sans text-sm mt-3 uppercase tracking-widest">
            On-Chain · Themed · Privacy &amp; ICP
          </p>
        </motion.header>

        <div className="divider-white mt-8" />

        {/* Mini Crossword */}
        <motion.section
          data-ocid="games.mini.section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-12"
        >
          <div className="mb-6">
            <h2 className="font-editorial text-white text-2xl leading-tight">
              The Mini
            </h2>
            <p className="text-white/40 text-sm font-sans mt-1">
              A quick puzzle. Clues themed around ICP, privacy, and web3.
            </p>
          </div>

          {isLoading ? (
            <div
              data-ocid="games.mini.loading_state"
              className="flex flex-col gap-3"
            >
              <div className="h-48 w-48 bg-white/5 animate-pulse" />
              <div className="h-3 w-32 bg-white/5 animate-pulse" />
            </div>
          ) : data?.mini ? (
            <CrosswordGrid puzzle={data.mini} />
          ) : (
            <ComingSoon />
          )}
        </motion.section>

        <div className="divider-subtle mt-14" />

        {/* Standard Crossword */}
        <motion.section
          data-ocid="games.standard.section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-12"
        >
          <div className="mb-6">
            <h2 className="font-editorial text-white text-2xl leading-tight">
              The Standard
            </h2>
            <p className="text-white/40 text-sm font-sans mt-1">
              A full crossword challenge. For the informed, privacy-native
              reader.
            </p>
          </div>

          {isLoading ? (
            <div
              data-ocid="games.standard.loading_state"
              className="flex flex-col gap-3"
            >
              <div className="h-64 w-80 bg-white/5 animate-pulse" />
              <div className="h-3 w-40 bg-white/5 animate-pulse" />
            </div>
          ) : data?.standard ? (
            <CrosswordGrid puzzle={data.standard} />
          ) : (
            <ComingSoon />
          )}
        </motion.section>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-white/20 text-xs font-sans leading-relaxed">
            Puzzles are stored on-chain. No progress is saved — NSP compliant.
          </p>
        </div>
      </div>
    </motion.main>
  );
}
