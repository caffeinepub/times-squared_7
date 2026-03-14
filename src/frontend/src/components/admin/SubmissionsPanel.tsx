import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrgSection, SubmissionWithArticle } from "../../backend.d";
import {
  useApproveArticleSubmission,
  useGetPendingSubmissions,
  useRejectArticleSubmission,
} from "../../hooks/useQueries";

interface SubmissionsPanelProps {
  orgs: OrgSection[];
}

function PendingList({
  orgId,
  orgName,
}: {
  orgId: bigint;
  orgName: string;
}) {
  const { data: submissions = [], isLoading } = useGetPendingSubmissions(orgId);
  const { mutateAsync: approve, isPending: isApproving } =
    useApproveArticleSubmission();
  const { mutateAsync: reject, isPending: isRejecting } =
    useRejectArticleSubmission();

  const [rejectTarget, setRejectTarget] =
    useState<SubmissionWithArticle | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const handleApprove = async (item: SubmissionWithArticle) => {
    try {
      await approve(item.article.id);
      toast.success("Article published");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await reject({
        articleId: rejectTarget.article.id,
        note: rejectionNote.trim() || null,
      });
      toast.success("Submission rejected");
      setRejectTarget(null);
      setRejectionNote("");
    } catch {
      toast.error("Failed to reject");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-widest text-white/30 font-sans mb-2">
        {orgName}
      </p>

      {submissions.length === 0 ? (
        <p
          data-ocid={`admin.submissions.${orgId}.empty_state`}
          className="text-white/20 text-xs font-sans py-2"
        >
          No pending submissions
        </p>
      ) : (
        <div className="space-y-px">
          {submissions.map((item, i) => (
            <div
              key={item.article.id.toString()}
              data-ocid={`admin.submission.item.${i + 1}`}
              className="flex items-center gap-2 py-3 border-b border-white/10 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-sans truncate">
                  {item.article.title || "Untitled"}
                </p>
                <p className="text-[10px] text-white/30 font-sans mt-0.5">
                  by {item.article.author}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  data-ocid={`admin.submission.approve_button.${i + 1}`}
                  title="Approve & publish"
                  disabled={isApproving}
                  onClick={() => handleApprove(item)}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-emerald-500/40 text-emerald-400/60 hover:text-emerald-400 transition-colors disabled:opacity-40"
                >
                  <CheckCircle size={10} />
                  Publish
                </button>
                <button
                  type="button"
                  data-ocid={`admin.submission.reject_button.${i + 1}`}
                  title="Reject"
                  disabled={isRejecting}
                  onClick={() => {
                    setRejectTarget(item);
                    setRejectionNote("");
                  }}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-red-500/30 text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <XCircle size={10} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <AlertDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectionNote("");
          }
        }}
      >
        <AlertDialogContent className="bg-black border border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-editorial text-white">
              Reject Submission?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50 font-sans">
              Optionally add a note for the contributor explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            data-ocid="admin.submission.reject.textarea"
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            placeholder="Optional note to the contributor..."
            rows={3}
            className="w-full bg-transparent border border-white/20 text-white/70 font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20 resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="admin.submission.reject.cancel_button"
              className="bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="admin.submission.reject.confirm_button"
              onClick={handleReject}
              disabled={isRejecting}
              className="bg-red-500/80 hover:bg-red-500 text-white border-0"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SubmissionsPanel({ orgs }: SubmissionsPanelProps) {
  if (orgs.length === 0) {
    return (
      <div data-ocid="admin.submissions.panel" className="py-8 text-center">
        <p className="text-white/30 text-sm font-sans">
          No organisations found.
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="admin.submissions.panel">
      <div className="mb-4">
        <span className="section-label">Submissions</span>
      </div>
      {orgs.map((org) => (
        <PendingList
          key={org.id.toString()}
          orgId={org.id}
          orgName={org.name}
        />
      ))}
    </div>
  );
}
