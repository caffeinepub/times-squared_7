import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Article, OrgSection } from "../backend.d";
import { formatDate, navigate } from "../lib/navigate";

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

  return (
    <motion.article
      data-ocid={`article.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border-t border-white/20 pt-6 pb-6 cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-3">
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
          <span>{formatDate(article.publicationDate)}</span>
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
        </div>
        <p className="text-white/60 text-sm leading-relaxed line-clamp-2 font-sans">
          {article.excerpt}
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
