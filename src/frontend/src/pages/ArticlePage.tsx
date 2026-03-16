import { ArrowLeft, Check, Copy, Volume2, VolumeX } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import { useGetArticleById, useGetOrgById } from "../hooks/useQueries";
import { formatDate, navigate } from "../lib/navigate";

interface ArticlePageProps {
  id: string;
}

function BlobImage({
  blobId,
  className,
  style,
}: { blobId: string; className?: string; style?: React.CSSProperties }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = ExternalBlob.fromURL(blobId);
    setUrl(blob.getDirectURL());
  }, [blobId]);

  if (!url) return null;
  return <img src={url} alt="" className={className} style={style} />;
}

export default function ArticlePage({ id }: ArticlePageProps) {
  let articleId: bigint | null = null;
  try {
    articleId = BigInt(id);
  } catch {
    // invalid id in URL
  }
  const { data: article, isLoading } = useGetArticleById(articleId);
  const orgId = article?.organizationId ?? null;
  const { data: org } = useGetOrgById(orgId);
  const [copied, setCopied] = useState(false);
  const [tipCopied, setTipCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const ICP_WALLET =
    "9243e4dba5135fe82719bdb7e690e10fce1cdf97a470ced1c64927fc4e59e6a8";

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleReadAloud = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    if (!article) return;
    const text = `${article.title}. By ${article.author}. ${article.bodyContent}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsReading(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/article/${id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTip = async () => {
    await navigator.clipboard.writeText(ICP_WALLET);
    setTipCopied(true);
    setTimeout(() => setTipCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div
        data-ocid="article.loading_state"
        className="max-w-3xl mx-auto px-6 py-20"
      >
        <div className="space-y-6">
          <div className="h-10 w-1/2 bg-white/10 animate-pulse" />
          <div className="h-4 w-1/4 bg-white/10 animate-pulse" />
          <div className="h-64 w-full bg-white/10 animate-pulse" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <div key={i} className="h-4 w-full bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div
        data-ocid="article.error_state"
        className="max-w-3xl mx-auto px-6 py-20 text-center"
      >
        <p className="text-white/50 font-sans">Article not found.</p>
      </div>
    );
  }

  const paragraphs = article.bodyContent.split("\n\n");

  return (
    <motion.main
      data-ocid="article.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black pb-24"
    >
      <div className="max-w-3xl mx-auto px-6">
        {/* Back button */}
        <div className="pt-8 pb-6">
          <button
            type="button"
            data-ocid="article.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* Headline */}
        <h1
          className="font-editorial text-white leading-tight mb-6 text-balance"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
        >
          {article.title}
        </h1>

        {/* Byline */}
        <div className="flex flex-wrap items-center gap-2 text-white/40 text-sm font-sans font-light mb-3">
          <span>
            {article.authorPrincipal ? (
              <button
                type="button"
                data-ocid="article.author.link"
                onClick={() =>
                  navigate(`/author/${article.authorPrincipal!.toString()}`)
                }
                className="hover:text-white/70 transition-colors"
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
                data-ocid="article.org.link"
                onClick={() => navigate(`/org/${org.slug}`)}
                className="hover:text-white/70 transition-colors"
              >
                {org.name}
              </button>
            </>
          )}
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <button
                type="button"
                key={tag}
                data-ocid="article.tag"
                onClick={() => navigate(`/section/${encodeURIComponent(tag)}`)}
                className="tag-badge hover:text-white/70 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Copy link */}
        <div className="mb-8">
          <button
            type="button"
            data-ocid="article.copy_link.button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-xs font-sans uppercase tracking-wider"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Link Copied" : "Copy Link"}
          </button>
        </div>

        <div className="divider-white mb-10" />

        {/* Hero Image 1 */}
        {article.heroImageBlobId && (
          <div className="mb-10 -mx-6">
            <BlobImage
              blobId={article.heroImageBlobId}
              className="w-full object-cover"
              style={{ maxHeight: "520px" }}
            />
          </div>
        )}

        {/* Body */}
        <div className="prose-editorial mb-10">
          {paragraphs.map((para, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <p key={i} /* index stable for static content */>
              {para.split("\n").map((line, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static content
                <span key={j}>
                  {j > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          ))}
        </div>

        {/* Hero Image 2 */}
        {article.heroImageBlobId2 && (
          <div className="mb-10 -mx-6">
            <BlobImage
              blobId={article.heroImageBlobId2}
              className="w-full object-cover"
              style={{ maxHeight: "520px" }}
            />
          </div>
        )}

        <div className="divider-subtle mb-10" />

        {/* Tip section */}
        <section data-ocid="article.tip.section" className="mb-16">
          <p className="italic text-white/40 font-sans text-sm leading-relaxed mb-4">
            This isn&apos;t a coffee shop. Nobody&apos;s watching. Only tip if
            you want to.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-white/30 font-mono text-[11px] tracking-wide break-all">
              {ICP_WALLET}
            </code>
            <button
              type="button"
              data-ocid="article.tip.button"
              onClick={handleCopyTip}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-xs font-sans uppercase tracking-wider shrink-0"
            >
              {tipCopied ? <Check size={12} /> : <Copy size={12} />}
              {tipCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      </div>

      {/* Read Aloud button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <button
          type="button"
          data-ocid="article.read_aloud.toggle"
          onClick={toggleReadAloud}
          className="flex items-center gap-2 bg-white text-black px-5 py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-white/90 transition-colors shadow-lg"
        >
          {isReading ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {isReading ? "Stop Reading" : "Read Aloud"}
        </button>
      </div>
    </motion.main>
  );
}
