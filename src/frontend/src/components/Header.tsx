import { ArrowLeft, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import type { Article } from "../backend.d";
import { navigate } from "../lib/navigate";
import NavDrawer from "./NavDrawer";
import SearchModal from "./SearchModal";
import ArticleFormPanel from "./admin/ArticleFormPanel";

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Article form overlay state lives here so it is never affected by
  // drawer open/close lifecycle on Android.
  const [formOpen, setFormOpen] = useState(false);
  const [formArticle, setFormArticle] = useState<Article | null>(null);
  const [formContributorMode, setFormContributorMode] = useState(false);

  const openArticleForm = (
    article: Article | null,
    contributorMode: boolean,
  ) => {
    setFormArticle(article);
    setFormContributorMode(contributorMode);
    setFormOpen(true);
  };

  const closeArticleForm = () => {
    setFormOpen(false);
    setFormArticle(null);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <header className="w-full bg-black">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <button
                type="button"
                data-ocid="header.logo.button"
                onClick={() => navigate("/")}
                className="text-left group"
              >
                <h1
                  className="font-editorial text-white tracking-tight leading-none group-hover:text-white/80 transition-colors"
                  style={{ fontSize: "clamp(3.5rem, 10vw, 6rem)" }}
                >
                  TIMES²
                </h1>
              </button>
              <span className="mt-2 text-white/50 font-sans font-light text-[12px] tracking-wide">
                {today}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                data-ocid="header.search.button"
                onClick={() => setSearchOpen(true)}
                className="text-white/50 hover:text-white transition-colors p-1"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              <button
                type="button"
                data-ocid="nav.drawer.open_modal_button"
                onClick={() => setDrawerOpen(true)}
                className="text-white/50 hover:text-white transition-colors p-1"
                aria-label="Open navigation"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white w-full" />
      </header>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenArticleForm={openArticleForm}
      />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Article form overlay — lives outside NavDrawer so drawer lifecycle
          cannot interfere with its visibility on Android. */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {/* Fixed header bar */}
          <div
            className="flex items-center justify-between px-6 py-4 bg-black border-b border-white/20"
            style={{ flexShrink: 0 }}
          >
            <button
              type="button"
              data-ocid="article-form.back.button"
              onClick={closeArticleForm}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-sans uppercase tracking-wider"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              type="button"
              data-ocid="article-form.close_button"
              onClick={closeArticleForm}
              className="text-white/50 hover:text-white transition-colors"
              aria-label="Close article form"
            >
              <X size={20} />
            </button>
          </div>
          {/* Scrollable content area — flex-1 + overflow-y-auto is the
              Android-safe pattern for scrollable fixed overlays. */}
          <div
            style={
              {
                flex: 1,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              } as React.CSSProperties
            }
          >
            <div className="p-6 max-w-2xl mx-auto">
              <ArticleFormPanel
                key={formArticle?.id?.toString() ?? "new"}
                article={formArticle}
                onBack={closeArticleForm}
                isContributorMode={formContributorMode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
