import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import ArticleCard from "../components/ArticleCard";
import ArticleCardSkeleton from "../components/ArticleCardSkeleton";
import { useGetArticlesByTag, useGetOrgs } from "../hooks/useQueries";
import { navigate } from "../lib/navigate";

interface SectionPageProps {
  tag: string;
}

export default function SectionPage({ tag }: SectionPageProps) {
  const decodedTag = decodeURIComponent(tag);
  const { data: articles = [], isLoading } = useGetArticlesByTag(decodedTag);
  const { data: orgs = [] } = useGetOrgs();

  return (
    <motion.main
      data-ocid="section.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      <div className="max-w-3xl mx-auto px-6">
        <div className="pt-8 pb-2">
          <button
            type="button"
            data-ocid="section.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider mb-8"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <p className="section-label mb-3">{decodedTag}</p>
          <h1
            className="font-editorial text-white leading-tight mb-8"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Tagged: {decodedTag}
          </h1>
        </div>

        <div className="divider-white" />

        <section data-ocid="section.articles.section" className="py-8">
          {isLoading ? (
            <div data-ocid="section.loading_state">
              {["s1", "s2", "s3"].map((k) => (
                <ArticleCardSkeleton key={k} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div data-ocid="section.empty_state" className="py-12 text-center">
              <p className="text-white/40 font-sans text-sm">
                No articles tagged &ldquo;{decodedTag}&rdquo; yet.
              </p>
            </div>
          ) : (
            articles.map((article, i) => (
              <ArticleCard
                key={article.id.toString()}
                article={article}
                index={i}
                orgs={orgs}
              />
            ))
          )}
        </section>
      </div>
    </motion.main>
  );
}
