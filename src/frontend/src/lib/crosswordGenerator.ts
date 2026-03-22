import type { CrosswordCell, CrosswordClue } from "../backend.d";
import { ClueDirection } from "../backend.d";

interface PlacedWord {
  word: string;
  row: number;
  col: number;
  direction: ClueDirection;
}

interface GenerateResult {
  cells: CrosswordCell[];
  clues: CrosswordClue[];
  gridWidth: number;
  gridHeight: number;
}

function makeGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array(size).fill(""));
}

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: ClueDirection,
  size: number,
): boolean {
  const len = word.length;
  // Check bounds
  if (dir === ClueDirection.across) {
    if (col + len > size) return false;
  } else {
    if (row + len > size) return false;
  }

  // Check cell conflicts and adjacency
  for (let i = 0; i < len; i++) {
    const r = dir === ClueDirection.down ? row + i : row;
    const c = dir === ClueDirection.across ? col + i : col;
    const cell = grid[r][c];

    // Conflict with existing letter
    if (cell !== "" && cell !== word[i]) return false;

    // If cell is empty, check parallel neighbors don't create unintended continuations
    if (cell === "") {
      if (dir === ClueDirection.across) {
        const above = r > 0 ? grid[r - 1][c] : null;
        const below = r < size - 1 ? grid[r + 1][c] : null;
        if (above !== null && above !== "" && above !== "#") return false;
        if (below !== null && below !== "" && below !== "#") return false;
      } else {
        const left = c > 0 ? grid[r][c - 1] : null;
        const right = c < size - 1 ? grid[r][c + 1] : null;
        if (left !== null && left !== "" && left !== "#") return false;
        if (right !== null && right !== "" && right !== "#") return false;
      }
    }
  }

  // Check cells before and after word don't extend it
  if (dir === ClueDirection.across) {
    if (col > 0 && grid[row][col - 1] !== "" && grid[row][col - 1] !== "#")
      return false;
    if (
      col + len < size &&
      grid[row][col + len] !== "" &&
      grid[row][col + len] !== "#"
    )
      return false;
  } else {
    if (row > 0 && grid[row - 1][col] !== "" && grid[row - 1][col] !== "#")
      return false;
    if (
      row + len < size &&
      grid[row + len][col] !== "" &&
      grid[row + len][col] !== "#"
    )
      return false;
  }

  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: ClueDirection,
): void {
  for (let i = 0; i < word.length; i++) {
    const r = dir === ClueDirection.down ? row + i : row;
    const c = dir === ClueDirection.across ? col + i : col;
    grid[r][c] = word[i];
  }
}

export function generateCrosswordGrid(
  words: string[],
  clues: string[],
  gridSize: number,
): GenerateResult | null {
  const clean = words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, ""));
  const sorted = clean
    .map((w, i) => ({ word: w, clue: clues[i] ?? "" }))
    .filter((x) => x.word.length > 0)
    .sort((a, b) => b.word.length - a.word.length);

  if (sorted.length === 0) return null;

  const size = gridSize;
  const grid = makeGrid(size);
  const placed: PlacedWord[] = [];

  // Place first word horizontally in the center
  const first = sorted[0];
  const startRow = Math.floor(size / 2);
  const startCol = Math.floor((size - first.word.length) / 2);

  if (
    !canPlace(grid, first.word, startRow, startCol, ClueDirection.across, size)
  ) {
    return null;
  }
  placeWord(grid, first.word, startRow, startCol, ClueDirection.across);
  placed.push({
    word: first.word,
    row: startRow,
    col: startCol,
    direction: ClueDirection.across,
  });

  // Try to intersect each subsequent word
  for (let wi = 1; wi < sorted.length; wi++) {
    const { word } = sorted[wi];
    let foundPlacement = false;

    for (const pw of placed) {
      if (foundPlacement) break;
      const newDir =
        pw.direction === ClueDirection.across
          ? ClueDirection.down
          : ClueDirection.across;

      for (let pi = 0; pi < pw.word.length && !foundPlacement; pi++) {
        for (let wi2 = 0; wi2 < word.length && !foundPlacement; wi2++) {
          if (pw.word[pi] !== word[wi2]) continue;

          let r: number;
          let c: number;
          if (newDir === ClueDirection.down) {
            r = pw.row - wi2;
            c = pw.col + pi;
          } else {
            r = pw.row + pi;
            c = pw.col - wi2;
          }

          if (r < 0 || c < 0) continue;
          if (canPlace(grid, word, r, c, newDir, size)) {
            placeWord(grid, word, r, c, newDir);
            placed.push({ word, row: r, col: c, direction: newDir });
            foundPlacement = true;
          }
        }
      }
    }

    // If no intersection, try to place independently
    if (!foundPlacement) {
      outer: for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          for (const dir of [ClueDirection.across, ClueDirection.down]) {
            if (canPlace(grid, word, r, c, dir, size)) {
              placeWord(grid, word, r, c, dir);
              placed.push({ word, row: r, col: c, direction: dir });
              foundPlacement = true;
              break outer;
            }
          }
        }
      }
    }
    // If still not placed, skip (don't fail)
  }

  if (placed.length === 0) return null;

  // Determine bounding box
  let minR = size;
  let maxR = 0;
  let minC = size;
  let maxC = 0;
  for (const pw of placed) {
    const endR =
      pw.direction === ClueDirection.down
        ? pw.row + pw.word.length - 1
        : pw.row;
    const endC =
      pw.direction === ClueDirection.across
        ? pw.col + pw.word.length - 1
        : pw.col;
    minR = Math.min(minR, pw.row);
    maxR = Math.max(maxR, endR);
    minC = Math.min(minC, pw.col);
    maxC = Math.max(maxC, endC);
  }

  // Add 1-cell padding
  minR = Math.max(0, minR - 1);
  maxR = Math.min(size - 1, maxR + 1);
  minC = Math.max(0, minC - 1);
  maxC = Math.min(size - 1, maxC + 1);

  const finalWidth = maxC - minC + 1;
  const finalHeight = maxR - minR + 1;

  // Build flat cells array
  const rawCells: CrosswordCell[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const letter = grid[r][c];
      rawCells.push({
        letter: letter || "",
        isBlack: letter === "",
        number: undefined,
      });
    }
  }

  // Number cells: assign numbers in reading order to cells that start an ACROSS or DOWN entry
  const numberedCells = rawCells.map((cell) => ({ ...cell }));
  let num = 1;
  const clueResult: CrosswordClue[] = [];

  for (let r = 0; r < finalHeight; r++) {
    for (let c = 0; c < finalWidth; c++) {
      const idx = r * finalWidth + c;
      if (numberedCells[idx].isBlack) continue;

      const startsAcross =
        !numberedCells[idx].isBlack &&
        (c === 0 || numberedCells[r * finalWidth + c - 1].isBlack) &&
        c + 1 < finalWidth &&
        !numberedCells[r * finalWidth + c + 1].isBlack;

      const startsDown =
        !numberedCells[idx].isBlack &&
        (r === 0 || numberedCells[(r - 1) * finalWidth + c].isBlack) &&
        r + 1 < finalHeight &&
        !numberedCells[(r + 1) * finalWidth + c].isBlack;

      if (startsAcross || startsDown) {
        numberedCells[idx].number = BigInt(num);

        if (startsAcross) {
          // Find length
          let len = 0;
          let tc = c;
          while (
            tc < finalWidth &&
            !numberedCells[r * finalWidth + tc].isBlack
          ) {
            len++;
            tc++;
          }
          // Find the answer from placed words
          const absR = r + minR;
          const absC = c + minC;
          const matchedPlaced = placed.find(
            (pw) =>
              pw.direction === ClueDirection.across &&
              pw.row === absR &&
              pw.col === absC,
          );
          const wordIdx = matchedPlaced
            ? sorted.findIndex((s) => s.word === matchedPlaced.word)
            : -1;
          clueResult.push({
            number: BigInt(num),
            direction: ClueDirection.across,
            clue: wordIdx >= 0 ? sorted[wordIdx].clue : "",
            answer: matchedPlaced?.word ?? "",
            startRow: BigInt(r),
            startCol: BigInt(c),
            length: BigInt(len),
          });
        }

        if (startsDown) {
          let len = 0;
          let tr = r;
          while (
            tr < finalHeight &&
            !numberedCells[tr * finalWidth + c].isBlack
          ) {
            len++;
            tr++;
          }
          const absR = r + minR;
          const absC = c + minC;
          const matchedPlaced = placed.find(
            (pw) =>
              pw.direction === ClueDirection.down &&
              pw.row === absR &&
              pw.col === absC,
          );
          const wordIdx = matchedPlaced
            ? sorted.findIndex((s) => s.word === matchedPlaced.word)
            : -1;
          clueResult.push({
            number: BigInt(num),
            direction: ClueDirection.down,
            clue: wordIdx >= 0 ? sorted[wordIdx].clue : "",
            answer: matchedPlaced?.word ?? "",
            startRow: BigInt(r),
            startCol: BigInt(c),
            length: BigInt(len),
          });
        }

        num++;
      }
    }
  }

  return {
    cells: numberedCells,
    clues: clueResult,
    gridWidth: finalWidth,
    gridHeight: finalHeight,
  };
}
