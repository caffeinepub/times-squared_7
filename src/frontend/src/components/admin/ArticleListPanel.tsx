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
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { FilePlus, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Article } from "../../backend.d";
import {
  useDeleteArticle,
  useFeatureArticle,
  useGetAllArticles,
  usePublishArticle,
  useUnfeatureArticle,
  useUnpublishArticle,
} from "../../hooks/useQueries";

interface ArticleListPanelProps {
  onEdit: (article: Article) => void;
  onNew: () => void;
}

export default function ArticleListPanel({
  onEdit,
  onNew,
}: ArticleListPanelProps) {
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal().toString();
  const { data: articles = [], isLoading } = useGetAllArticles();
  const { mutateAsync: deleteArticle, isPending: isDeleting } =
    useDeleteArticle();
  const { mutateAsync: publishArticle } = usePublishArticle();
  const { mutateAsync: unpublishArticle } = useUnpublishArticle();
  const { mutateAsync: featureArticle } = useFeatureArticle();
  const { mutateAsync: unfeatureArticle } = useUnfeatureArticle();

  const sorted = [...articles].sort((a, b) => {
    const aTime = Number(a.createdAt);
    const bTime = Number(b.createdAt);
    return bTime - aTime;
  });

  return (
    <div data-ocid="admin.articles.panel" className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">Articles</span>
        <button
          type="button"
          data-ocid="admin.new_article.button"
          onClick={onNew}
          className="flex items-center gap-1.5 bg-white text-black px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans hover:bg-white/90 transition-colors"
        >
          <FilePlus size={12} />
          New
        </button>
      </div>

      {isLoading && (
        <div data-ocid="admin.articles.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div
          data-ocid="admin.articles.empty_state"
          className="py-8 text-center"
        >
          <p className="text-white/30 text-sm font-sans">No articles yet.</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="space-y-px -mx-1 px-1">
          {sorted.map((article, i) => (
            <div
              key={article.id.toString()}
              data-ocid={`admin.article.item.${i + 1}`}
              className="flex items-center gap-2 py-3 border-b border-white/10 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm font-sans truncate leading-tight">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[9px] uppercase tracking-widest font-sans ${
                      article.isPublished
                        ? "text-emerald-400/70"
                        : "text-white/30"
                    }`}
                  >
                    {article.isPublished ? "Published" : "Draft"}
                  </span>
                  {article.isFeatured && (
                    <span className="text-[9px] uppercase tracking-widest font-sans text-amber-400/70">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Feature/Unfeature */}
                <button
                  type="button"
                  data-ocid={`admin.article.publish.toggle.${i + 1}`}
                  title={article.isFeatured ? "Unfeature" : "Feature"}
                  onClick={() =>
                    article.isFeatured
                      ? unfeatureArticle(article.id)
                      : featureArticle(article.id)
                  }
                  className={`p-1.5 transition-colors ${
                    article.isFeatured
                      ? "text-amber-400/70 hover:text-amber-400"
                      : "text-white/20 hover:text-white/50"
                  }`}
                >
                  <Star size={12} />
                </button>

                {/* Publish/Unpublish */}
                {article.isPublished ? (
                  article.authorPrincipal?.toString() === callerPrincipal && (
                    <button
                      type="button"
                      title="Unpublish"
                      onClick={() =>
                        unpublishArticle(article.id).catch(() =>
                          toast.error(
                            "Only the original author can unpublish this article",
                          ),
                        )
                      }
                      className="text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-white/20 text-white/40 hover:text-white/70 transition-colors"
                    >
                      Unpub
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    title="Publish"
                    onClick={() => publishArticle(article.id)}
                    className="text-[9px] uppercase tracking-widest font-sans px-2 py-1 border border-emerald-500/40 text-emerald-400/60 hover:text-emerald-400 transition-colors"
                  >
                    Pub
                  </button>
                )}

                {/* Edit */}
                <button
                  type="button"
                  data-ocid={`admin.article.edit_button.${i + 1}`}
                  title="Edit"
                  onClick={() => onEdit(article)}
                  className="p-1.5 text-white/30 hover:text-white/80 transition-colors"
                >
                  <Pencil size={12} />
                </button>

                {/* Delete */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      data-ocid={`admin.article.delete_button.${i + 1}`}
                      title="Delete"
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-black border border-white/20 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-editorial text-white">
                        Delete Article?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-white/50 font-sans">
                        "{article.title}" will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        data-ocid="admin.article.delete.cancel_button"
                        className="bg-transparent border-white/20 text-white/60 hover:bg-white/5 hover:text-white"
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-ocid="admin.article.delete.confirm_button"
                        onClick={() => deleteArticle(article.id)}
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
      )}
    </div>
  );
}
