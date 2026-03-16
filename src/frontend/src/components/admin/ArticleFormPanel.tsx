import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Article, OrgSection } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useCreateArticle,
  usePublishArticle,
  useUnpublishArticle,
  useUpdateArticle,
} from "../../hooks/useQueries";
import { uploadFileToBlobStorage } from "../../hooks/useUploadFile";

interface ArticleFormPanelProps {
  article?: Article | null;
  onBack: () => void;
  orgs: OrgSection[];
  /** In contributor mode, only show orgs the contributor is a member of and hide publish toggle */
  isContributorMode?: boolean;
  /** Org IDs the contributor belongs to (used for filtering orgs list) */
  contributorOrgIds?: bigint[];
}

export default function ArticleFormPanel({
  article,
  onBack,
  orgs,
  isContributorMode = false,
  contributorOrgIds = [],
}: ArticleFormPanelProps) {
  const { identity } = useInternetIdentity();
  const { mutateAsync: createArticle, isPending: isCreating } =
    useCreateArticle();
  const { mutateAsync: updateArticle, isPending: isUpdating } =
    useUpdateArticle();
  const { mutateAsync: publishArticle } = usePublishArticle();
  const { mutateAsync: unpublishArticle } = useUnpublishArticle();

  const [title, setTitle] = useState(article?.title ?? "");
  const [author, setAuthor] = useState(article?.author ?? "");
  const [authorPrincipal, setAuthorPrincipal] = useState(
    article?.authorPrincipal?.toString() ?? "",
  );
  const [orgId, setOrgId] = useState<string>(
    article?.organizationId?.toString() ?? "",
  );
  const [pubDate, setPubDate] = useState(
    article?.publicationDate
      ? article.publicationDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [tags, setTags] = useState(article?.tags.join(", ") ?? "");
  const [heroId, setHeroId] = useState<string | null>(
    article?.heroImageBlobId ?? null,
  );
  const heroId2 = article?.heroImageBlobId2 ?? null;
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // In contributor mode, filter orgs to only those the contributor belongs to
  const availableOrgs = isContributorMode
    ? orgs.filter((org) => contributorOrgIds.some((id) => id === org.id))
    : orgs;

  useEffect(() => {
    if (editorRef.current && article?.bodyContent) {
      editorRef.current.innerHTML = article.bodyContent;
    }
  }, [article?.bodyContent]);

  // Auto-set orgId for contributors if there's only one org available
  useEffect(() => {
    if (isContributorMode && availableOrgs.length === 1 && !orgId) {
      setOrgId(availableOrgs[0].id.toString());
    }
  }, [isContributorMode, availableOrgs, orgId]);

  const handleHeroUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingHero(true);
      try {
        const url = await uploadFileToBlobStorage(file);
        setHeroId(url);
        toast.success("Hero image uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploadingHero(false);
      }
    },
    [],
  );

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
    const parsedOrgId = orgId ? BigInt(orgId) : null;
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
          heroImageBlobId: heroId,
          heroImageBlobId2: heroId2,
          bodyContent,
          tags: parsedTags,
        });
        // Only admins can sync publish state directly
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
          heroImageBlobId: heroId,
          heroImageBlobId2: heroId2,
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
                <SelectItem value="" className="font-sans text-white/50">
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

      {/* Hero Image */}
      <div className="space-y-1">
        <Label className="text-white/40 text-[10px] uppercase tracking-widest font-sans">
          Hero Image
        </Label>
        <label
          data-ocid="admin.article_form.upload_button"
          className="flex items-center gap-2 border border-dashed border-white/20 px-3 py-2 text-white/40 text-xs font-sans cursor-pointer hover:border-white/40 transition-colors"
        >
          {uploadingHero ? (
            <Loader2 size={12} className="animate-spin" />
          ) : null}
          {heroId ? "Replace hero image" : "Upload hero image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleHeroUpload}
          />
        </label>
        {heroId && (
          <p className="text-white/30 text-[10px] font-sans truncate">
            {heroId}
          </p>
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
        {/* Toolbar */}
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
