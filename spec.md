# Times Squared

## Current State
Full editorial platform on ICP with articles, comments, multi-image support, org management, contributor workflow, role-based auth, and support/donation flow. Backend is clean Motoko with all state in `stable var` maps.

## Requested Changes (Diff)

### Add
- `Puzzle` type: id, puzzleType (#mini | #standard), title, gridWidth, gridHeight, cells (flat array of CrosswordCell), clues ([CrosswordClue]), isActive, createdAt, publishedAt, createdBy
- `CrosswordCell` type: letter (Text, empty = black), isBlack, number (?Nat)
- `CrosswordClue` type: number, direction (#across | #down), clue (Text), answer (Text), startRow, startCol, length
- `stable var puzzles = Map.empty<Nat, Puzzle>()`
- `stable var puzzleIdCounter = 0`
- `createPuzzle(puzzleType, title, gridWidth, gridHeight, cells, clues)` - admin only, returns Nat id
- `updatePuzzle(id, title, gridWidth, gridHeight, cells, clues)` - admin only
- `deletePuzzle(id)` - admin only
- `setActivePuzzle(id)` - admin only, deactivates all other puzzles of same type, activates this one
- `getActivePuzzle(puzzleType)` - public query, returns ?Puzzle
- `getAllPuzzles()` - admin query, returns all puzzles sorted newest first
- Admin panel: new "Games" section with puzzle list, create/edit form, preview, publish toggle

### Modify
- Admin drawer: add "Games" section entry point alongside Article List and Org Management

### Remove
- Nothing

## Implementation Plan
1. Add Puzzle types and stable vars to main.mo
2. Implement createPuzzle, updatePuzzle, deletePuzzle, setActivePuzzle, getActivePuzzle, getAllPuzzles
3. Generate updated backend.d.ts bindings
4. Frontend: crossword grid auto-generation algorithm in TypeScript (place words on grid, compute intersections, assign numbers, fill black cells)
5. Admin panel Games section: puzzle list view showing Mini/Standard with active status, create/edit form with word+clue inputs, auto-generate preview, publish button
6. Words are entered as a list (word + clue pairs); frontend runs placement algorithm to produce the grid layout for preview before saving
