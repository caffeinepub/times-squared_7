import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ExternalBlob } from "../backend";
import ArticleCard from "../components/ArticleCard";
import ArticleCardSkeleton from "../components/ArticleCardSkeleton";
import { useGetArticlesByOrg, useGetOrgs } from "../hooks/useQueries";
import { navigate } from "../lib/navigate";

interface OrgPageProps {
  slug: string;
}

export default function OrgPage({ slug }: OrgPageProps) {
  const { data: orgs = [], isLoading: orgsLoading } = useGetOrgs();
  const org = orgs.find((o) => o.slug === slug) ?? null;
  const { data: articles = [], isLoading: articlesLoading } =
    useGetArticlesByOrg(org?.id ?? null);

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    setBannerUrl(
      org?.bannerBlobId
        ? ExternalBlob.fromURL(org.bannerBlobId).getDirectURL()
        : null,
    );
    setLogoUrl(
      org?.logoBlobId
        ? ExternalBlob.fromURL(org.logoBlobId).getDirectURL()
        : null,
    );
  }, [org]);

  if (orgsLoading) {
    return (
      <div
        data-ocid="org.loading_state"
        className="max-w-3xl mx-auto px-6 py-20"
      >
        <div className="space-y-4">
          <div className="h-8 w-2/3 bg-white/10 animate-pulse" />
          <div className="h-4 w-full bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div
        data-ocid="org.error_state"
        className="max-w-3xl mx-auto px-6 py-20 text-center"
      >
        <p className="text-white/50 font-sans">Organization not found.</p>
      </div>
    );
  }

  return (
    <motion.main
      data-ocid="org.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      {/* Banner */}
      {bannerUrl && (
        <div className="relative">
          <img
            src={bannerUrl}
            alt=""
            className="w-full object-cover"
            style={{ maxHeight: "320px" }}
          />
          {logoUrl && (
            <div className="absolute bottom-4 left-6">
              <img
                src={logoUrl}
                alt={org.name}
                className="w-16 h-16 object-contain bg-black/50 p-1"
              />
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6">
        <div className="pt-8 pb-2">
          <button
            type="button"
            data-ocid="org.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider mb-8"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {!bannerUrl && logoUrl && (
            <img
              src={logoUrl}
              alt={org.name}
              className="w-16 h-16 object-contain mb-6"
            />
          )}

          <h1
            className="font-editorial text-white leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            {org.name}
          </h1>
          <p className="text-white/75 font-sans leading-relaxed mb-8 max-w-2xl">
            {org.description}
          </p>
        </div>

        <div className="divider-white" />

        <section data-ocid="org.articles.section" className="py-8">
          <p className="section-label mb-8">Published by {org.name}</p>

          {articlesLoading ? (
            <div data-ocid="org.articles.loading_state">
              {["o1", "o2", "o3"].map((k) => (
                <ArticleCardSkeleton key={k} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div
              data-ocid="org.articles.empty_state"
              className="py-12 text-center"
            >
              <p className="text-white/40 font-sans text-sm">
                No articles from this organization yet.
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
