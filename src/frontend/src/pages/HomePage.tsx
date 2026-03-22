import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ExternalBlob } from "../backend";
import ArticleCard from "../components/ArticleCard";
import ArticleCardSkeleton from "../components/ArticleCardSkeleton";
import {
  useGetFeaturedArticle,
  useGetOrgs,
  useGetPublishedArticles,
} from "../hooks/useQueries";
import { getExcerpt } from "../lib/excerpt";
import { formatDate, navigate } from "../lib/navigate";

function HeroImage({ blobId }: { blobId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useState(() => {
    try {
      const blob = ExternalBlob.fromURL(blobId);
      setUrl(blob.getDirectURL());
    } catch {
      // ignore
    }
  });

  if (!url) {
    return (
      <div
        className="w-full bg-black"
        style={{ height: "clamp(280px, 50vw, 520px)" }}
      >
        <img
          src="/assets/generated/times-squared-hero-fallback.dim_1600x900.jpg"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-full object-cover"
      style={{ height: "clamp(280px, 50vw, 520px)" }}
    />
  );
}

export default function HomePage() {
  const { data: published = [], isLoading } = useGetPublishedArticles();
  const { data: featured } = useGetFeaturedArticle();
  const { data: orgs = [] } = useGetOrgs();
  const [copied, setCopied] = useState(false);

  const featuredArticle =
    featured ?? (published.length > 0 ? published[0] : null);
  const otherArticles = published.filter((a) => a.id !== featuredArticle?.id);

  const coverImageBlobId = featuredArticle?.imageBlobIds[0] ?? null;

  const handleCopyFeatured = async () => {
    if (!featuredArticle) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/article/${featuredArticle.id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.main
      data-ocid="home.page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black"
    >
      {/* Hero */}
      <div className="relative overflow-hidden">
        {coverImageBlobId ? (
          <HeroImage blobId={coverImageBlobId} />
        ) : (
          <div
            className="w-full relative"
            style={{ height: "clamp(280px, 50vw, 520px)" }}
          >
            <img
              src="/assets/generated/times-squared-hero-fallback.dim_1600x900.jpg"
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          </div>
        )}
        <div className="absolute bottom-4 right-6 text-white/50 font-editorial text-2xl pointer-events-none">
          T²
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Featured article */}
        {featuredArticle && (
          <motion.section
            data-ocid="home.featured.section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="py-12"
          >
            <p className="section-label mb-6">Headline of the Day</p>
            <button
              type="button"
              className="font-editorial text-white leading-none mb-6 cursor-pointer hover:text-white/80 transition-colors text-left"
              style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
              onClick={() => navigate(`/article/${featuredArticle.id}`)}
            >
              {featuredArticle.title}
            </button>
            <div className="flex items-center gap-3 text-white/40 text-sm font-sans font-light mb-5">
              <span>{featuredArticle.author}</span>
              <span className="text-white/20">·</span>
              <span>{formatDate(featuredArticle.publicationDate)}</span>
            </div>
            <p className="text-white/60 font-sans leading-relaxed mb-6 line-clamp-3 max-w-2xl">
              {getExcerpt(featuredArticle)}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                data-ocid="featured.article.button"
                className="text-white border border-white/30 px-5 py-2 text-sm font-sans uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                onClick={() => navigate(`/article/${featuredArticle.id}`)}
              >
                Read Article
              </button>
              <button
                type="button"
                data-ocid="featured.copy_link.button"
                className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-xs font-sans uppercase tracking-wider"
                onClick={handleCopyFeatured}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          </motion.section>
        )}

        <div className="divider-white" />

        {/* On-chain headlines */}
        <section data-ocid="home.headlines.section" className="py-10">
          <p className="section-label mb-8">On-Chain Headlines</p>

          {isLoading ? (
            <div data-ocid="home.loading_state">
              {["h1", "h2", "h3", "h4"].map((k) => (
                <ArticleCardSkeleton key={k} />
              ))}
            </div>
          ) : otherArticles.length === 0 && !featuredArticle ? (
            <div data-ocid="home.empty_state" className="py-16 text-center">
              <p className="text-white/40 font-sans text-sm leading-relaxed">
                No articles published yet.
                <br />
                Check back soon for on-chain journalism.
              </p>
            </div>
          ) : (
            <div>
              {otherArticles.map((article, i) => (
                <ArticleCard
                  key={article.id.toString()}
                  article={article}
                  index={i}
                  orgs={orgs}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section navigation - org badges */}
        {orgs.length > 0 && (
          <>
            <div className="divider-subtle" />
            <section data-ocid="home.orgs.section" className="py-8">
              <p className="section-label mb-5">Sections</p>
              <div className="flex flex-wrap gap-3">
                {orgs.map((org) => (
                  <button
                    type="button"
                    key={org.id.toString()}
                    data-ocid="home.org.button"
                    onClick={() => navigate(`/org/${org.slug}`)}
                    className="tag-badge hover:text-white/80 transition-colors py-1.5 px-4"
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </motion.main>
  );
}
