import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Comment } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useDeleteComment,
  useGetCommentsByArticle,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { navigate } from "../lib/navigate";

function relativeTime(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
  isDeleting,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
}) {
  return (
    <motion.article
      data-ocid="comments.item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="group border-b border-white/8 py-5 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-white/80 text-sm font-sans font-medium tracking-wide">
              {comment.authorName || "Anonymous"}
            </span>
            <span className="text-white/25 text-xs font-sans">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-white/65 font-sans text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.body}
          </p>
        </div>
        {canDelete && (
          <button
            type="button"
            data-ocid="comments.delete_button"
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
            aria-label="Delete comment"
            className="shrink-0 mt-0.5 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function CommentsSection({
  articleId,
}: {
  articleId: bigint;
}) {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const callerPrincipal = identity?.getPrincipal().toString() ?? null;

  const { data: comments = [], isLoading } = useGetCommentsByArticle(articleId);
  const { data: isAdmin } = useIsCallerAdmin();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const [body, setBody] = useState("");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const sorted = [...comments].sort((a, b) =>
    Number(a.createdAt - b.createdAt),
  );

  const handleSubmit = async () => {
    const text = body.trim();
    if (!text) return;
    await addComment.mutateAsync({ articleId, body: text });
    setBody("");
  };

  const handleDelete = async (commentId: bigint) => {
    setDeletingId(commentId);
    try {
      await deleteComment.mutateAsync(commentId);
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (comment: Comment) => {
    if (isAdmin) return true;
    if (!callerPrincipal) return false;
    return comment.authorPrincipal.toString() === callerPrincipal;
  };

  return (
    <section data-ocid="comments.section" className="mt-16 mb-10">
      {/* Section header */}
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="font-editorial text-white text-2xl leading-tight">
          Comments
        </h2>
        {!isLoading && (
          <span className="text-white/30 font-sans text-sm">
            {sorted.length === 1 ? "1 comment" : `${sorted.length} comments`}
          </span>
        )}
      </div>

      <div className="divider-subtle mb-6" />

      {/* Loading skeleton */}
      {isLoading && (
        <div data-ocid="comments.loading_state" className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-white/8">
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-3 w-20 bg-white/10" />
                <Skeleton className="h-3 w-12 bg-white/6" />
              </div>
              <Skeleton className="h-4 w-full bg-white/6" />
              <Skeleton className="h-4 w-2/3 bg-white/6 mt-1" />
            </div>
          ))}
        </div>
      )}

      {/* Comment list */}
      {!isLoading && (
        <AnimatePresence initial={false}>
          {sorted.length === 0 ? (
            <motion.div
              data-ocid="comments.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <p className="text-white/25 font-sans text-sm italic">
                No comments yet. Be the first.
              </p>
            </motion.div>
          ) : (
            sorted.map((comment) => (
              <CommentItem
                key={comment.id.toString()}
                comment={comment}
                canDelete={canDelete(comment)}
                onDelete={handleDelete}
                isDeleting={deletingId === comment.id}
              />
            ))
          )}
        </AnimatePresence>
      )}

      {/* Post form or login prompt */}
      <div className="mt-8">
        {isLoggedIn ? (
          <div data-ocid="comments.panel" className="space-y-3">
            <Textarea
              data-ocid="comments.textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              rows={3}
              className="w-full bg-white/4 border border-white/10 text-white/80 placeholder:text-white/25 font-sans text-sm resize-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/30 rounded-none"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                data-ocid="comments.submit_button"
                onClick={handleSubmit}
                disabled={!body.trim() || addComment.isPending}
                className="bg-white text-black hover:bg-white/90 font-sans text-xs uppercase tracking-widest px-6 py-2 h-auto rounded-none disabled:opacity-30"
              >
                {addComment.isPending ? "Posting…" : "Post Comment"}
              </Button>
            </div>
            {addComment.isError && (
              <p
                data-ocid="comments.error_state"
                className="text-red-400 text-xs font-sans"
              >
                Failed to post comment. Please try again.
              </p>
            )}
          </div>
        ) : (
          <div
            data-ocid="comments.login_prompt"
            className="py-5 text-center border border-white/8"
          >
            <p className="text-white/30 font-sans text-sm">
              <button
                type="button"
                data-ocid="comments.login.button"
                onClick={() => navigate("/login")}
                className="text-white/55 hover:text-white underline underline-offset-2 transition-colors"
              >
                Log in
              </button>{" "}
              to join the conversation
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
