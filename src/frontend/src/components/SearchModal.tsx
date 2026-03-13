import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useSearchArticles } from "../hooks/useQueries";
import { useGetOrgs } from "../hooks/useQueries";
import ArticleCard from "./ArticleCard";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { data: orgs = [] } = useGetOrgs();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useSearchArticles(debouncedQuery);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 z-50"
            onClick={onClose}
          />
          <motion.div
            data-ocid="search.modal"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex items-center gap-4 mb-6">
                <Search size={18} className="text-white/40 shrink-0" />
                <Input
                  data-ocid="search.search_input"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search articles, authors, topics..."
                  className="bg-transparent border-none text-white placeholder:text-white/30 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-sans"
                />
                <button
                  type="button"
                  data-ocid="search.close_button"
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {isLoading && debouncedQuery && (
                <div
                  data-ocid="search.loading_state"
                  className="flex items-center gap-2 text-white/40 text-sm py-8"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </div>
              )}

              {!isLoading && debouncedQuery && results.length === 0 && (
                <div
                  data-ocid="search.empty_state"
                  className="py-8 text-white/40 text-sm font-sans"
                >
                  No results for &ldquo;{debouncedQuery}&rdquo;
                </div>
              )}

              {results.length > 0 && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {results.map((article, i) => (
                    <div
                      key={article.id.toString()}
                      onClick={onClose}
                      onKeyDown={(e) => e.key === "Enter" && onClose()}
                      role="presentation"
                    >
                      <ArticleCard article={article} index={i} orgs={orgs} />
                    </div>
                  ))}
                </div>
              )}

              {!debouncedQuery && (
                <p className="text-white/20 text-xs font-sans py-4">
                  Full-text search across all published articles. On-chain.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
