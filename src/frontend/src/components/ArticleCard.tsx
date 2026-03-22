import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Article, OrgSection } from "../backend.d";
import { getExcerpt } from "../lib/excerpt";
import { formatDate, navigate } from "../lib/navigate";
import { getReadTime } from "../lib/readTime";
import ImageCarousel from "./ImageCarousel";

interface ArticleCardProps {
  article: Article;
  index?: number;
  orgs?: OrgSection[];
}

export default function ArticleCard({
  article,
  index = 0,
  orgs = [],
}: ArticleCardProps) {
  const [copied, setCopied] = useState(false);

  const org = article.organizationId
    ? orgs.find((o) => o.id === article.organizationId)
    : null;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(
      `${window.location.origin}/article/${article.id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    navigate(`/article/${article.id}`);
  };

  const hasImages = article.imageBlobIds.length > 0;
  const readTime = getReadTime(article.bodyContent ?? "");

  return (
    <motion.article
      data-ocid={`article.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border-t border-white/20 pt-6 pb-6 cursor-pointer group transition-all duration-200"
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-3">
        {/* Image / Carousel */}
        {hasImages && (
          <div
            className="relative -mx-0 overflow-hidden"
            style={{ height: "200px" }}
          >
            <ImageCarousel
              blobIds={article.imageBlobIds}
              className="w-full h-full object-cover"
              style={{ height: "200px" }}
              onClick={handleCardClick}
            />
            {/* ICP domain overlay — Guardian style */}
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <span
                className="text-white/70 font-sans"
                style={{
                  fontSize: "10px",
                  background: "rgba(0,0,0,0.55)",
                  padding: "2px 6px",
                  letterSpacing: "0.04em",
                }}
              >
                {window.location.hostname}
              </span>
            </div>
          </div>
        )}

        <h3 className="font-editorial text-xl leading-tight text-white group-hover:text-white/80 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-white/40 font-sans font-light">
          <span>
            {article.authorPrincipal ? (
              <button
                type="button"
                className="hover:text-white/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/author/${article.authorPrincipal!.toString()}`);
                }}
              >
                {article.author}
              </button>
            ) : (
              article.author
            )}
          </span>
          <span className="text-white/20">·</span>
          <span>{formatDate(article.publicationDate, article.createdAt)}</span>
          {org && (
            <>
              <span className="text-white/20">·</span>
              <button
                type="button"
                className="hover:text-white/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/org/${org.slug}`);
                }}
              >
                {org.name}
              </button>
            </>
          )}
          <span className="text-white/20">·</span>
          <span>{readTime}</span>
        </div>
        <p className="text-white/60 text-sm leading-relaxed line-clamp-2 font-sans">
          {getExcerpt(article)}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <button
                type="button"
                key={tag}
                data-ocid="article.tag"
                className="tag-badge hover:text-white/70 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/section/${encodeURIComponent(tag)}`);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-ocid="article.copy_link.button"
            className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors font-sans uppercase tracking-wider shrink-0"
            onClick={handleCopyLink}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
