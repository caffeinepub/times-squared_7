import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Article } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetOrgs, useIsCallerAdmin } from "../hooks/useQueries";
import { navigate } from "../lib/navigate";
import ArticleFormPanel from "./admin/ArticleFormPanel";
import ArticleListPanel from "./admin/ArticleListPanel";
import OrgManagementPanel from "./admin/OrgManagementPanel";
import UserRolePanel from "./admin/UserRolePanel";

type AdminPanel = "articles" | "article-form" | "orgs" | "users";

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: orgs = [] } = useGetOrgs();

  const [adminPanel, setAdminPanel] = useState<AdminPanel | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleClose = () => {
    setAdminPanel(null);
    setEditingArticle(null);
    onClose();
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      handleClose();
      navigate("/");
    } else {
      onClose();
      navigate("/login");
    }
  };

  const openEditArticle = (article: Article) => {
    setEditingArticle(article);
    setAdminPanel("article-form");
  };

  const openNewArticle = () => {
    setEditingArticle(null);
    setAdminPanel("article-form");
  };

  const navLinks = [
    { label: "Home", path: "/", ocid: "nav.home.link" },
    { label: "Privacy", path: "/privacy", ocid: "nav.privacy.link" },
  ];

  const isAdminView = adminPanel !== null;
  const drawerWidth = isAdminView ? "w-[480px] max-w-[95vw]" : "w-72";

  const panelVariants = {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  };

  const subPanelVariants = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 40, opacity: 0 },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-40"
            onClick={handleClose}
          />
          <motion.nav
            data-ocid="nav.drawer"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className={`fixed top-0 right-0 h-full ${drawerWidth} bg-black border-l border-white/20 z-50 flex flex-col transition-[width] duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 shrink-0">
              {adminPanel !== null ? (
                <button
                  type="button"
                  data-ocid="nav.admin.back.button"
                  onClick={() => {
                    if (adminPanel === "article-form") {
                      setAdminPanel("articles");
                      setEditingArticle(null);
                    } else {
                      setAdminPanel(null);
                    }
                  }}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-sans uppercase tracking-wider"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              ) : (
                <span className="section-label">Navigation</span>
              )}
              <button
                type="button"
                data-ocid="nav.drawer.close_button"
                onClick={handleClose}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {adminPanel === null && (
                  <motion.div
                    key="nav-main"
                    variants={subPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="flex flex-col p-6 gap-1"
                  >
                    {navLinks.map((link) => (
                      <button
                        type="button"
                        key={link.path}
                        data-ocid={link.ocid}
                        onClick={() => handleNav(link.path)}
                        className="text-left text-white/80 hover:text-white font-editorial text-2xl leading-tight py-3 border-b border-white/10 transition-colors"
                      >
                        {link.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      data-ocid="nav.auth.button"
                      onClick={handleAuth}
                      disabled={loginStatus === "logging-in"}
                      className="text-left text-white/80 hover:text-white font-editorial text-2xl leading-tight py-3 border-b border-white/10 transition-colors disabled:opacity-50"
                    >
                      {loginStatus === "logging-in"
                        ? "Signing in..."
                        : isAuthenticated
                          ? "Logout"
                          : "Login"}
                    </button>

                    {isAuthenticated && identity && (
                      <button
                        type="button"
                        data-ocid="nav.profile.link"
                        onClick={() =>
                          handleNav(
                            `/author/${identity.getPrincipal().toString()}`,
                          )
                        }
                        className="text-left text-white/50 hover:text-white/80 font-sans text-sm py-3 border-b border-white/10 transition-colors"
                      >
                        My Profile
                      </button>
                    )}

                    {isAdmin && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <p className="section-label mb-3">Admin</p>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            data-ocid="nav.admin.articles.link"
                            onClick={() => setAdminPanel("articles")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Articles
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                          <button
                            type="button"
                            data-ocid="nav.admin.orgs.link"
                            onClick={() => setAdminPanel("orgs")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Organisations
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                          <button
                            type="button"
                            data-ocid="nav.admin.users.link"
                            onClick={() => setAdminPanel("users")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Users
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {adminPanel === "articles" && (
                  <motion.div
                    key="admin-articles"
                    variants={subPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <ArticleListPanel
                      onEdit={openEditArticle}
                      onNew={openNewArticle}
                    />
                  </motion.div>
                )}

                {adminPanel === "article-form" && (
                  <motion.div
                    key="admin-article-form"
                    variants={subPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <ArticleFormPanel
                      article={editingArticle}
                      onBack={() => {
                        setAdminPanel("articles");
                        setEditingArticle(null);
                      }}
                      orgs={orgs}
                    />
                  </motion.div>
                )}

                {adminPanel === "orgs" && (
                  <motion.div
                    key="admin-orgs"
                    variants={subPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <OrgManagementPanel />
                  </motion.div>
                )}

                {adminPanel === "users" && (
                  <motion.div
                    key="admin-users"
                    variants={subPanelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <UserRolePanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-white/10 shrink-0">
              <p className="text-white/20 text-[10px] font-sans uppercase tracking-widest">
                Times Squared · On-Chain
              </p>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
