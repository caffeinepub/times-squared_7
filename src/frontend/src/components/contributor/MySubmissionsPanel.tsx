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
import { Skeleton } from "@/components/ui/skeleton";
import { FilePlus, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Article, SubmissionWithArticle } from "../../backend.d";
import { SubmissionStatus } from "../../backend.d";
import {
  useDeleteArticle,
  useGetMySubmissions,
  useSubmitArticleForReview,
} from "../../hooks/useQueries";

interface MySubmissionsPanelProps {
  onEdit: (article: Article) => void;
  onNew: () => void;
}

// "Published" state is derived from article.isPublished rather than a
// separate submission status, avoiding stable variable migration issues.
function StatusBadge({ item }: { item: SubmissionWithArticle }) {
  if (item.article.isPublished) {
    return (
      <span className="text-[9px] uppercase tracking-widest font-sans text-emerald-400/80">
        Published
      </span>
    );
  }
  if (item.submission.submissionStatus === SubmissionStatus.pending_review) {
    return (
      <span className="text-[9px] uppercase tracking-widest font-sans text-amber-400/70">
        Pending Review
      </span>
    );
  }
  if (item.submission.submissionStatus === SubmissionStatus.rejected) {
    return (
      <span className="text-[9px] uppercase tracking-widest font-sans text-red-400/70">
        Rejected
      </span>
    );
  }
  return (
    <span className="text-[9px] uppercase tracking-widest font-sans text-white/30">
      Draft
    </span>
  );
}

export default function MySubmissionsPanel({
  onEdit,
  onNew,
}: MySubmissionsPanelProps) {
  const { data: submissions = [], isLoading } = useGetMySubmissions();
  const { mutateAsync: submitForReview, isPending: isSubmitting } =
    useSubmitArticleForReview();
  const { mutateAsync: deleteArticle, isPending: isDeleting } =
    useDeleteArticle();

  const sorted = [...submissions].sort((a, b) => {
    return Number(b.article.createdAt) - Number(a.article.createdAt);
  });

  const handleSubmit = async (item: SubmissionWithArticle) => {
    try {
      await submitForReview(item.article.id);
      toast.success("Submitted for review");
    } catch {
      toast.error("Failed to submit");
    }
  };

  return (
    <div
      data-ocid="contributor.submissions.panel"
      className="flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">My Drafts</span>
        <button
          type="button"
          data-ocid="contributor.new_article.button"
          onClick={onNew}
          className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans hover:bg-white/90 transition-colors"
        >
          <FilePlus size={12} />
          New
        </button>
      </div>

      {isLoading && (
        <div
          data-ocid="contributor.submissions.loading_state"
          className="space-y-3"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div
          data-ocid="contributor.submissions.empty_state"
          className="py-8 text-center"
        >
          <p className="text-white/30 text-sm font-sans">
            No drafts yet. Create your first article.
          </p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="space-y-px overflow-y-auto flex-1 -mx-1 px-1">
          {sorted.map((item, i) => (
            <div
              key={item.article.id.toString()}
              data-ocid={`contributor.submission.item.${i + 1}`}
              className="py-3 border-b border-white/10"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm font-sans truncate leading-tight">
                    {item.article.title || "Untitled"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge item={item} />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit (not shown for published articles) */}
                  {!item.article.isPublished && (
                    <button
                      type="button"
                      data-ocid={`contributor.submission.edit_button.${i + 1}`}
                      title="Edit"
                      onClick={() => onEdit(item.article)}
                      className="p-1.5 text-white/30 hover:text-white/80 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                  )}

                  {/* Submit for review (only for draft status, not published) */}
                  {!item.article.isPublished &&
                    item.submission.submissionStatus ===
                      SubmissionStatus.draft && (
                      <button
                        type="button"
                        data-ocid={`contributor.submission.submit_button.${i + 1}`}
                        title="Submit for review"
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(item)}
                        className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-emerald-500/40 text-emerald-400/60 hover:text-emerald-400 transition-colors disabled:opacity-40"
                      >
                        <Send size={9} />
                        Submit
                      </button>
                    )}

                  {/* Delete (not shown for published articles) */}
                  {!item.article.isPublished && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          data-ocid={`contributor.submission.delete_button.${i + 1}`}
                          title="Delete"
                          className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-black border border-white/20 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-editorial text-white">
                            Delete Draft?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/50 font-sans">
                            "{item.article.title}" will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            data-ocid="contributor.submission.delete.cancel_button"
                            className="bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="contributor.submission.delete.confirm_button"
                            onClick={() => deleteArticle(item.article.id)}
                            disabled={isDeleting}
                            className="bg-red-500/80 hover:bg-red-500 text-white border-0"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Rejection note */}
              {item.submission.submissionStatus === SubmissionStatus.rejected &&
                item.submission.rejectionNote && (
                  <div className="mt-2 p-2 bg-red-950/30 border border-red-500/20">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-sans mb-0.5">
                      Editor note
                    </p>
                    <p className="text-xs text-white/60 font-sans leading-relaxed">
                      {item.submission.rejectionNote}
                    </p>
                    <p className="text-[9px] text-white/30 font-sans mt-1.5 uppercase tracking-widest">
                      Edit your draft to resubmit
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
