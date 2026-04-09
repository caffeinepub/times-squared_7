import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { ArrowDown, ArrowUp, Loader2, X } from "lucide-react";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { Article } from "../../backend.d";
import {
  useCreateArticle,
  useGetMyMemberships,
  useGetMyOrgs,
  usePublishArticle,
  useUnpublishArticle,
  useUpdateArticle,
} from "../../hooks/useQueries";
import { uploadFileToBlobStorage } from "../../hooks/useUploadFile";

const NO_ORG = "__none__";
const MAX_IMAGES = 10;

class FormErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: unknown) {
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-400 font-sans text-sm mb-2">
            Failed to load form
          </p>
          <p className="text-white/30 font-sans text-xs">{this.state.error}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 text-white/50 hover:text-white text-xs font-sans uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ArticleFormPanelProps {
  article?: Article | null;
  onBack: () => void;
  isContributorMode?: boolean;
}

function BlobThumb({ blobId }: { blobId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      const blob = ExternalBlob.fromURL(blobId);
      setUrl(blob.getDirectURL());
    } catch {
      // ignore
    }
  }, [blobId]);
  if (!url) return <div className="w-full h-full bg-white/10" />;
  return <img src={url} alt="" className="w-full h-full object-cover" />;
}

function ArticleFormInner({
  article,
  onBack,
  isContributorMode = false,
}: ArticleFormPanelProps) {
  const { identity } = useInternetIdentity();
  const { mutateAsync: createArticle, isPending: isCreating } =
    useCreateArticle();
  const { mutateAsync: updateArticle, isPending: isUpdating } =
    useUpdateArticle();
  const { mutateAsync: publishArticle } = usePublishArticle();
  const { mutateAsync: unpublishArticle } = useUnpublishArticle();

  const { data: allOrgs = [] } = useGetMyOrgs();
  const { data: myMemberships = [] } = useGetMyMemberships();
  const contributorOrgIds = myMemberships.map((m) => m.orgId);

  const [title, setTitle] = useState(article?.title ?? "");
  const [author, setAuthor] = useState(article?.author ?? "");
  const [authorPrincipal, setAuthorPrincipal] = useState(
    article?.authorPrincipal?.toString() ?? "",
  );
  const [orgId, setOrgId] = useState<string>(
    article?.organizationId?.toString() ?? NO_ORG,
  );
  const [pubDate, setPubDate] = useState(
    article?.publicationDate
      ? article.publicationDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [imageBlobIds, setImageBlobIds] = useState<string[]>(
    article?.imageBlobIds ?? [],
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? false);

  const editorRef = useRef<HTMLDivElement>(null);

  const availableOrgs = isContributorMode
    ? allOrgs.filter((org) => contributorOrgIds.some((id) => id === org.id))
    : allOrgs;

  useEffect(() => {
    if (editorRef.current && article?.bodyContent) {
      editorRef.current.innerHTML = article.bodyContent;
    }
  }, [article?.bodyContent]);

  useEffect(() => {
    if (isContributorMode && availableOrgs.length === 1 && orgId === NO_ORG) {
      setOrgId(availableOrgs[0].id.toString());
    }
  }, [isContributorMode, availableOrgs, orgId]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      const remaining = MAX_IMAGES - imageBlobIds.length;
      const toUpload = files.slice(0, remaining);
      setUploadingIndex(imageBlobIds.length);
      try {
        const ids = await Promise.all(
          toUpload.map((f) => uploadFileToBlobStorage(f)),
        );
        setImageBlobIds((prev) => [...prev, ...ids]);
        toast.success(
          ids.length === 1 ? "Image uploaded" : `${ids.length} images uploaded`,
        );
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingIndex(null);
        // reset input so same file can be re-uploaded
        e.target.value = "";
      }
    },
    [imageBlobIds.length],
  );

  const removeImage = (i: number) => {
    setImageBlobIds((prev) => prev.filter((_, idx) => idx !== i));
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    const next = i + dir;
    if (next < 0 || next >= imageBlobIds.length) return;
    setImageBlobIds((prev) => {
      const arr = [...prev];
      [arr[i], arr[next]] = [arr[next], arr[i]];
      return arr;
    });
  };

  const execCmd = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const handleSave = async () => {
    const bodyContent = editorRef.current?.innerHTML ?? "";
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedOrgId = orgId && orgId !== NO_ORG ? BigInt(orgId) : null;
    const parsedPubDate = pubDate
      ? `${pubDate}T00:00:00Z`
      : new Date().toISOString();

    let principalArg: Principal | null = null;
    if (!isContributorMode && authorPrincipal.trim()) {
      try {
        const { Principal } = await import("@icp-sdk/core/principal");
        principalArg = Principal.fromText(authorPrincipal.trim());
      } catch {
        toast.error("Invalid author principal");
        return;
      }
    } else if (identity) {
      principalArg = identity.getPrincipal() as Principal;
    }

    try {
      if (article) {
        await updateArticle({
          articleId: article.id,
          title,
          author,
          organizationId: parsedOrgId,
          publicationDate: parsedPubDate,
          imageBlobIds,
          bodyContent,
          tags: parsedTags,
        });
        if (!isContributorMode) {
          if (isPublished && !article.isPublished) {
            await publishArticle(article.id);
          } else if (!isPublished && article.isPublished) {
            await unpublishArticle(article.id);
          }
        }
      } else {
        const newId = await createArticle({
          title,
          author,
          authorPrincipal: principalArg,
          organizationId: parsedOrgId,
          publicationDate: parsedPubDate,
          imageBlobIds,
          bodyContent,
          tags: parsedTags,
        });
        if (!isContributorMode && isPublished) {
          await publishArticle(newId);
        }
      }
      toast.success(article ? "Draft saved" : "Draft created");
      onBack();
    } catch {
      toast.error("Save failed");
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <div
      data-ocid="admin.article_form.panel"
      className="flex flex-col gap-4 pb-4"
    >
      <div className="flex items-center justify-between">
        <span className="section-label">
          {article
            ? isContributorMode
              ? "Edit Draft"
              : "Edit Article"
            : isContributorMode
              ? "New Draft"
              : "New Article"}
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Title
        </Label>
        <input
          data-ocid="admin.article_form.input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          className="w-full bg-transparent border border-white/20 text-white font-editorial text-lg px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
        />
      </div>

      {/* Author */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Author Name
        </Label>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author display name"
          className="w-full bg-transparent border border-white/20 text-white font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
        />
      </div>

      {/* Author Principal - admin only */}
      {!isContributorMode && (
        <div className="space-y-1">
          <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
            Author Principal (optional)
          </Label>
          <input
            value={authorPrincipal}
            onChange={(e) => setAuthorPrincipal(e.target.value)}
            placeholder="e.g. aaaaa-aa"
            className="w-full bg-transparent border border-white/20 text-white/60 font-sans text-xs px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
          />
        </div>
      )}

      {/* Org */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Organisation
        </Label>
        {isContributorMode && availableOrgs.length === 1 ? (
          <p className="text-white/60 font-sans text-sm px-3 py-2 border border-white/10">
            {availableOrgs[0].name}
          </p>
        ) : (
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger
              data-ocid="admin.article_form.select"
              className="bg-transparent border-white/20 text-white/70 font-sans text-sm focus:ring-0"
            >
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20 text-white">
              {!isContributorMode && (
                <SelectItem value={NO_ORG} className="font-sans text-white/50">
                  None
                </SelectItem>
              )}
              {availableOrgs.map((org) => (
                <SelectItem
                  key={org.id.toString()}
                  value={org.id.toString()}
                  className="font-sans"
                >
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Publication Date */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Publication Date
        </Label>
        <input
          type="date"
          value={pubDate}
          onChange={(e) => setPubDate(e.target.value)}
          className="w-full bg-transparent border border-white/20 text-white font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 [color-scheme:dark]"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Tags (comma-separated)
        </Label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="politics, economy, tech"
          className="w-full bg-transparent border border-white/20 text-white/70 font-sans text-sm px-3 py-2 focus:outline-none focus:border-white/40 placeholder:text-white/20"
        />
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Images ({imageBlobIds.length}/{MAX_IMAGES})
        </Label>

        {/* Thumbnail grid */}
        {imageBlobIds.length > 0 && (
          <div className="flex flex-col gap-2">
            {imageBlobIds.map((id, i) => (
              <div
                key={id}
                className="flex items-center gap-2 border border-white/10 p-1.5"
              >
                <div className="w-14 h-10 flex-shrink-0 overflow-hidden">
                  <BlobThumb blobId={id} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[10px] font-sans uppercase tracking-wider truncate">
                    {i === 0 ? "Cover Image" : `Image ${i + 1}`}
                  </p>
                  <p className="text-white/20 text-[9px] font-mono truncate">
                    {id}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1 text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === imageBlobIds.length - 1}
                    aria-label="Move down"
                    className="p-1 text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    type="button"
                    data-ocid="admin.article_form.delete_button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {imageBlobIds.length < MAX_IMAGES && (
          <label
            data-ocid="admin.article_form.upload_button"
            className="flex items-center gap-2 border border-dashed border-white/20 px-3 py-2 text-white/40 text-xs font-sans cursor-pointer hover:border-white/40 transition-colors"
          >
            {uploadingIndex !== null ? (
              <Loader2 size={12} className="animate-spin" />
            ) : null}
            {uploadingIndex !== null
              ? "Uploading..."
              : imageBlobIds.length === 0
                ? "Upload images (first = cover)"
                : "Add more images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingIndex !== null}
            />
          </label>
        )}
      </div>

      {/* Publish Toggle - admin only */}
      {!isContributorMode && (
        <div className="flex items-center justify-between py-2 border-t border-white/10">
          <Label className="text-white/60 text-xs font-sans uppercase tracking-wider">
            {isPublished ? "Published" : "Draft"}
          </Label>
          <Switch
            checked={isPublished}
            onCheckedChange={setIsPublished}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      )}

      {/* Contributor mode note */}
      {isContributorMode && (
        <p className="text-white/30 text-[10px] font-sans uppercase tracking-widest py-2 border-t border-white/10">
          Save draft, then submit for review from My Drafts
        </p>
      )}

      {/* Body Editor */}
      <div className="space-y-2">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Body
        </Label>
        <div className="flex flex-wrap gap-1 border border-white/10 border-b-0 px-2 py-1.5 bg-white/5">
          {[
            { label: "B", cmd: "bold", style: "font-bold" },
            { label: "I", cmd: "italic", style: "italic" },
          ].map(({ label, cmd, style }) => (
            <button
              key={cmd}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd(cmd);
              }}
              className={`w-6 h-6 text-white/60 hover:text-white hover:bg-white/10 text-xs transition-colors ${style}`}
            >
              {label}
            </button>
          ))}
          {[
            { label: "H2", cmd: "formatBlock", val: "H2" },
            { label: "H3", cmd: "formatBlock", val: "H3" },
          ].map(({ label, cmd, val }) => (
            <button
              key={val}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCmd(cmd, val);
              }}
              className="px-1.5 h-6 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-sans uppercase tracking-wider transition-colors"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("insertUnorderedList");
            }}
            className="px-1.5 h-6 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-sans transition-colors"
          >
            UL
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd("insertOrderedList");
            }}
            className="px-1.5 h-6 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-sans transition-colors"
          >
            OL
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const url = prompt("URL:");
              if (url) execCmd("createLink", url);
            }}
            className="px-1.5 h-6 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-sans transition-colors"
          >
            Link
          </button>
        </div>
        <div
          data-ocid="admin.article_form.editor"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[200px] border border-white/20 px-3 py-2 text-white/80 font-sans text-sm leading-relaxed focus:outline-none focus:border-white/40 [&_h2]:font-editorial [&_h2]:text-xl [&_h2]:mb-2 [&_h3]:font-editorial [&_h3]:text-base [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:underline [&_a]:text-white/60"
          data-placeholder="Write the article body here..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          data-ocid="admin.article_form.save_button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-sans uppercase tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {isPending ? "Saving..." : article ? "Save" : "Create"}
        </button>
        <button
          type="button"
          data-ocid="admin.article_form.cancel_button"
          onClick={onBack}
          className="text-white/40 hover:text-white text-xs font-sans uppercase tracking-wider transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ArticleFormPanel(props: ArticleFormPanelProps) {
  return (
    <FormErrorBoundary>
      <ArticleFormInner {...props} />
    </FormErrorBoundary>
  );
}
