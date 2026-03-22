import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Grid3x3,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CrosswordCell, CrosswordClue, Puzzle } from "../../backend.d";
import { ClueDirection, PuzzleType } from "../../backend.d";
import {
  useCreatePuzzle,
  useDeletePuzzle,
  useGetAllPuzzles,
  useSetActivePuzzle,
  useUpdatePuzzle,
} from "../../hooks/useQueries";
import { generateCrosswordGrid } from "../../lib/crosswordGenerator";

interface WordEntry {
  answer: string;
  clue: string;
}

const defaultEntries = (): WordEntry[] => [
  { answer: "", clue: "" },
  { answer: "", clue: "" },
  { answer: "", clue: "" },
];

function GridPreview({
  cells,
  width,
  height,
}: {
  cells: CrosswordCell[];
  width: number;
  height: number;
}) {
  if (cells.length === 0) return null;
  const cellSize = Math.min(32, Math.floor(280 / Math.max(width, height)));

  return (
    <div
      className="inline-grid border border-white/20"
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
    >
      {cells.map((cell, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: crossword cells are positional and stable
          key={i}
          className={`relative border border-white/10 flex items-center justify-center ${
            cell.isBlack ? "bg-white/5" : "bg-transparent"
          }`}
          style={{ width: cellSize, height: cellSize }}
        >
          {!cell.isBlack && (
            <>
              {cell.number !== undefined && (
                <span
                  className="absolute top-0.5 left-0.5 text-white/40 leading-none"
                  style={{ fontSize: Math.max(6, cellSize * 0.22) }}
                >
                  {cell.number.toString()}
                </span>
              )}
              <span
                className="text-white font-sans font-bold uppercase leading-none"
                style={{ fontSize: Math.max(8, cellSize * 0.42) }}
              >
                {cell.letter}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function ClueList({ clues }: { clues: CrosswordClue[] }) {
  const across = clues
    .filter((c) => c.direction === ClueDirection.across)
    .sort((a, b) => Number(a.number) - Number(b.number));
  const down = clues
    .filter((c) => c.direction === ClueDirection.down)
    .sort((a, b) => Number(a.number) - Number(b.number));

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <p className="section-label mb-2">Across</p>
        {across.length === 0 && (
          <p className="text-white/20 text-xs font-sans">None</p>
        )}
        {across.map((c) => (
          <p
            key={`a-${c.number}`}
            className="text-white/60 text-xs font-sans mb-1"
          >
            <span className="text-white/30 mr-1">{c.number.toString()}.</span>
            {c.clue || <span className="text-white/20 italic">No clue</span>}
          </p>
        ))}
      </div>
      <div>
        <p className="section-label mb-2">Down</p>
        {down.length === 0 && (
          <p className="text-white/20 text-xs font-sans">None</p>
        )}
        {down.map((c) => (
          <p
            key={`d-${c.number}`}
            className="text-white/60 text-xs font-sans mb-1"
          >
            <span className="text-white/30 mr-1">{c.number.toString()}.</span>
            {c.clue || <span className="text-white/20 italic">No clue</span>}
          </p>
        ))}
      </div>
    </div>
  );
}

interface PuzzleFormProps {
  initial?: Puzzle | null;
  onBack: () => void;
}

function PuzzleForm({ initial, onBack }: PuzzleFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [puzzleType, setPuzzleType] = useState<PuzzleType>(
    initial?.puzzleType ?? PuzzleType.mini,
  );
  const [entries, setEntries] = useState<WordEntry[]>(() => {
    if (initial && initial.clues.length > 0) {
      const seen = new Map<string, WordEntry>();
      for (const clue of initial.clues) {
        if (!seen.has(clue.answer)) {
          seen.set(clue.answer, { answer: clue.answer, clue: clue.clue });
        }
      }
      return Array.from(seen.values());
    }
    return defaultEntries();
  });
  const [previewCells, setPreviewCells] = useState<CrosswordCell[]>(
    initial?.cells ?? [],
  );
  const [previewClues, setPreviewClues] = useState<CrosswordClue[]>(
    initial?.clues ?? [],
  );
  const [previewWidth, setPreviewWidth] = useState<number>(
    initial ? Number(initial.gridWidth) : 0,
  );
  const [previewHeight, setPreviewHeight] = useState<number>(
    initial ? Number(initial.gridHeight) : 0,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const { mutateAsync: createPuzzle, isPending: isCreating } =
    useCreatePuzzle();
  const { mutateAsync: updatePuzzle, isPending: isUpdating } =
    useUpdatePuzzle();

  const gridSize = puzzleType === PuzzleType.mini ? 7 : 15;

  const addEntry = () => {
    if (entries.length >= 15) return;
    setEntries((prev) => [...prev, { answer: "", clue: "" }]);
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: keyof WordEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    );
  };

  const handleGenerate = () => {
    const words = entries.map((e) => e.answer).filter(Boolean);
    const clueTexts = entries.map((e) => e.clue);
    if (words.length === 0) {
      toast.error("Add at least one word before generating.");
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateCrosswordGrid(words, clueTexts, gridSize);
      setIsGenerating(false);
      if (!result) {
        toast.error("Could not generate grid. Try different words.");
        return;
      }
      setPreviewCells(result.cells);
      setPreviewClues(result.clues);
      setPreviewWidth(result.gridWidth);
      setPreviewHeight(result.gridHeight);
    }, 10);
  };

  const handleSave = async (activate: boolean) => {
    if (!title.trim()) {
      toast.error("Enter a puzzle title.");
      return;
    }
    if (previewCells.length === 0) {
      toast.error("Generate the grid first.");
      return;
    }
    try {
      if (initial) {
        await updatePuzzle({
          id: initial.id,
          title,
          gridWidth: BigInt(previewWidth),
          gridHeight: BigInt(previewHeight),
          cells: previewCells,
          clues: previewClues,
        });
      } else {
        await createPuzzle({
          puzzleType,
          title,
          gridWidth: BigInt(previewWidth),
          gridHeight: BigInt(previewHeight),
          cells: previewCells,
          clues: previewClues,
        });
      }
      if (activate) {
        toast.success("Puzzle saved. Activate it from the list.");
      } else {
        toast.success("Draft saved.");
      }
      onBack();
    } catch {
      toast.error("Failed to save puzzle.");
    }
  };

  return (
    <div data-ocid="puzzle.form.panel" className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          data-ocid="puzzle.form.back.button"
          onClick={onBack}
          className="text-white/40 hover:text-white text-xs font-sans uppercase tracking-wider transition-colors"
        >
          ← Back
        </button>
        <span className="text-white/20 text-xs">/</span>
        <span className="section-label">
          {initial ? "Edit Puzzle" : "New Puzzle"}
        </span>
      </div>

      {/* Title */}
      <div>
        <p className="section-label mb-1.5">Title</p>
        <Input
          data-ocid="puzzle.title.input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Privacy Mini"
          className="bg-transparent border-white/20 text-white placeholder:text-white/20 font-sans text-sm"
        />
      </div>

      {/* Type selector (only when creating) */}
      {!initial && (
        <div>
          <p className="section-label mb-1.5">Puzzle Type</p>
          <div className="flex gap-2">
            {[PuzzleType.mini, PuzzleType.standard].map((type) => (
              <button
                key={type}
                type="button"
                data-ocid={`puzzle.type.${type}.toggle`}
                onClick={() => setPuzzleType(type)}
                className={`px-4 py-2 text-xs font-sans uppercase tracking-wider border transition-colors ${
                  puzzleType === type
                    ? "border-white text-white bg-white/10"
                    : "border-white/20 text-white/40 hover:text-white/70"
                }`}
              >
                {type === PuzzleType.mini ? "Mini (5×5)" : "Standard (11×11)"}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-[10px] font-sans mt-1">
            Mini uses a 7-cell grid, Standard uses a 15-cell grid.
          </p>
        </div>
      )}

      {/* Word/Clue entries */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="section-label">Words &amp; Clues</p>
          <button
            type="button"
            data-ocid="puzzle.add_word.button"
            onClick={addEntry}
            disabled={entries.length >= 15}
            className="flex items-center gap-1 text-white/40 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Plus size={12} />
            <span className="text-[10px] font-sans uppercase tracking-wider">
              Add
            </span>
          </button>
        </div>

        <div className="space-y-2">
          {entries.map((entry, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: entries are positional
            <div key={i} className="flex gap-2 items-center">
              <Input
                data-ocid={`puzzle.word.input.${i + 1}`}
                value={entry.answer}
                onChange={(e) => updateEntry(i, "answer", e.target.value)}
                placeholder="WORD"
                className="bg-transparent border-white/20 text-white placeholder:text-white/15 font-mono text-sm uppercase w-32 shrink-0"
                maxLength={15}
              />
              <Input
                data-ocid={`puzzle.clue.input.${i + 1}`}
                value={entry.clue}
                onChange={(e) => updateEntry(i, "clue", e.target.value)}
                placeholder="Clue text"
                className="bg-transparent border-white/20 text-white placeholder:text-white/15 font-sans text-sm flex-1"
              />
              <button
                type="button"
                data-ocid={`puzzle.remove_word.button.${i + 1}`}
                onClick={() => removeEntry(i)}
                disabled={entries.length <= 1}
                className="text-white/20 hover:text-red-400 disabled:opacity-20 transition-colors shrink-0"
              >
                <Minus size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        data-ocid="puzzle.generate.button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center justify-center gap-2 border border-white/30 text-white/70 hover:text-white hover:border-white/60 py-2.5 text-xs font-sans uppercase tracking-wider transition-colors disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Zap size={12} />
        )}
        Generate Grid
      </button>

      {/* Grid preview */}
      {previewCells.length > 0 && (
        <div>
          <p className="section-label mb-3">Preview</p>
          <div className="flex justify-center">
            <GridPreview
              cells={previewCells}
              width={previewWidth}
              height={previewHeight}
            />
          </div>
          <ClueList clues={previewClues} />
        </div>
      )}

      {/* Save actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <Button
          data-ocid="puzzle.save_draft.button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={isCreating || isUpdating}
          className="flex-1 bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white text-xs uppercase tracking-wider"
        >
          {isCreating || isUpdating ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : null}
          Save Draft
        </Button>
        <Button
          data-ocid="puzzle.save_publish.button"
          onClick={() => handleSave(true)}
          disabled={isCreating || isUpdating}
          className="flex-1 bg-white text-black hover:bg-white/90 text-xs uppercase tracking-wider"
        >
          {isCreating || isUpdating ? (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          ) : null}
          Save &amp; Publish
        </Button>
      </div>
    </div>
  );
}

export default function PuzzlePanel() {
  const { data: puzzles = [], isLoading } = useGetAllPuzzles();
  const { mutateAsync: deletePuzzle, isPending: isDeleting } =
    useDeletePuzzle();
  const { mutateAsync: setActivePuzzle } = useSetActivePuzzle();
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Puzzle | null>(null);

  const minis = puzzles.filter((p) => p.puzzleType === PuzzleType.mini);
  const standards = puzzles.filter((p) => p.puzzleType === PuzzleType.standard);

  const handleNew = (type: PuzzleType) => {
    // type is passed via PuzzleForm's own state initializer when formMode = "create"
    // We still need to signal which type to default to — done via editTarget = null
    void type;
    setEditTarget(null);
    setFormMode("create");
  };

  const handleEdit = (puzzle: Puzzle) => {
    setEditTarget(puzzle);
    setFormMode("edit");
  };

  const handleBack = () => {
    setFormMode(null);
    setEditTarget(null);
  };

  if (formMode !== null) {
    return (
      <PuzzleForm
        initial={formMode === "edit" ? editTarget : null}
        onBack={handleBack}
      />
    );
  }

  const renderGroup = (
    label: string,
    type: PuzzleType,
    group: Puzzle[],
    startIdx: number,
  ) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Grid3x3 size={12} className="text-white/30" />
          <span className="section-label">{label}</span>
        </div>
        <button
          type="button"
          data-ocid={`puzzle.${type}.new.button`}
          onClick={() => handleNew(type)}
          className="flex items-center gap-1 bg-white text-black px-2.5 py-1 text-[9px] uppercase tracking-wider font-sans hover:bg-white/90 transition-colors"
        >
          <Plus size={10} />
          New
        </button>
      </div>

      {group.length === 0 && (
        <div
          data-ocid={`puzzle.${type}.empty_state`}
          className="py-4 text-center"
        >
          <p className="text-white/20 text-xs font-sans">
            No {label} puzzles yet.
          </p>
        </div>
      )}

      {group.map((puzzle, i) => (
        <div
          key={puzzle.id.toString()}
          data-ocid={`puzzle.${type}.item.${startIdx + i + 1}`}
          className="flex items-center gap-2 py-3 border-b border-white/10 group"
        >
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-sans truncate">
              {puzzle.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {puzzle.isActive ? (
                <span className="text-[9px] uppercase tracking-widest font-sans text-amber-400/80">
                  Active
                </span>
              ) : (
                <span className="text-[9px] uppercase tracking-widest font-sans text-white/25">
                  Draft
                </span>
              )}
              <span className="text-[9px] font-sans text-white/20">
                {Number(puzzle.gridWidth)}×{Number(puzzle.gridHeight)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!puzzle.isActive && (
              <button
                type="button"
                data-ocid={`puzzle.${type}.activate.button.${startIdx + i + 1}`}
                title="Set Active"
                onClick={() =>
                  setActivePuzzle(puzzle.id)
                    .then(() => toast.success("Puzzle set as active."))
                    .catch(() => toast.error("Failed to activate puzzle."))
                }
                className="text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-amber-500/40 text-amber-400/60 hover:text-amber-400 transition-colors"
              >
                Activate
              </button>
            )}

            <button
              type="button"
              data-ocid={`puzzle.${type}.edit_button.${startIdx + i + 1}`}
              title="Edit"
              onClick={() => handleEdit(puzzle)}
              className="p-1.5 text-white/30 hover:text-white/80 transition-colors"
            >
              <Pencil size={12} />
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  data-ocid={`puzzle.${type}.delete_button.${startIdx + i + 1}`}
                  title="Delete"
                  className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black border border-white/20 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-editorial text-white">
                    Delete Puzzle?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-white/50 font-sans">
                    "{puzzle.title}" will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="puzzle.delete.cancel_button"
                    className="bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="puzzle.delete.confirm_button"
                    onClick={() =>
                      deletePuzzle(puzzle.id).catch(() =>
                        toast.error("Failed to delete puzzle."),
                      )
                    }
                    disabled={isDeleting}
                    className="bg-red-500/80 hover:bg-red-500 text-white border-0"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div data-ocid="puzzle.panel" className="flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <span className="section-label">Games</span>
      </div>

      {isLoading && (
        <div data-ocid="puzzle.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {renderGroup("Mini", PuzzleType.mini, minis, 0)}
          {renderGroup(
            "Standard",
            PuzzleType.standard,
            standards,
            minis.length,
          )}
        </>
      )}
    </div>
  );
}
