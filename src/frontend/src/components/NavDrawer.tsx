import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Article } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMyMemberships,
  useGetMyOrgs,
  useGetSuperAdmin,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { navigate } from "../lib/navigate";
import ArticleFormPanel from "./admin/ArticleFormPanel";
import ArticleListPanel from "./admin/ArticleListPanel";
import OrgManagementPanel from "./admin/OrgManagementPanel";
import SubmissionsPanel from "./admin/SubmissionsPanel";
import UserRolePanel from "./admin/UserRolePanel";
import MySubmissionsPanel from "./contributor/MySubmissionsPanel";

type AdminPanel = "articles" | "orgs" | "users" | "submissions";
type ContributorPanel = "my-drafts";
type DrawerPanel = AdminPanel | ContributorPanel | null;

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: myOrgs = [] } = useGetMyOrgs();
  const { data: superAdmin } = useGetSuperAdmin();
  const { data: myMemberships = [] } = useGetMyMemberships();

  const callerPrincipal = identity?.getPrincipal().toString();
  const isSuperAdmin =
    !!superAdmin &&
    !!callerPrincipal &&
    superAdmin.toString() === callerPrincipal;

  const isContributor = isAuthenticated && !isAdmin && myMemberships.length > 0;

  const [activePanel, setActivePanel] = useState<DrawerPanel>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formOverlayOpen, setFormOverlayOpen] = useState(false);
  const [isContributorMode, setIsContributorMode] = useState(false);

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleClose = () => {
    setActivePanel(null);
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

  const openEditArticle = (article: Article, contributorMode = false) => {
    setEditingArticle(article);
    setIsContributorMode(contributorMode);
    setFormOverlayOpen(true);
    onClose();
  };

  const openNewArticle = (contributorMode = false) => {
    setEditingArticle(null);
    setIsContributorMode(contributorMode);
    setFormOverlayOpen(true);
    onClose();
  };

  const closeFormOverlay = () => {
    setFormOverlayOpen(false);
    setEditingArticle(null);
  };

  const navLinks = [
    { label: "Home", path: "/", ocid: "nav.home.link" },
    { label: "Privacy", path: "/privacy", ocid: "nav.privacy.link" },
  ];

  const isAdminView = activePanel !== null;
  const drawerWidth = isAdminView ? "w-[480px] max-w-[95vw]" : "w-72";

  const contributorOrgIds = myMemberships.map((m) => m.orgId);

  const overlayVariants = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  };

  return (
    <>
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
              variants={{
                initial: { x: "100%", opacity: 0 },
                animate: { x: 0, opacity: 1 },
                exit: { x: "100%", opacity: 0 },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className={`fixed top-0 right-0 h-[100dvh] ${drawerWidth} bg-black border-l border-white/20 z-50 flex flex-col`}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/20 shrink-0">
                {activePanel !== null ? (
                  <button
                    type="button"
                    data-ocid="nav.admin.back.button"
                    onClick={() => setActivePanel(null)}
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

              <div
                key={activePanel ?? "root"}
                className="flex-1 min-h-0 overflow-y-auto"
              >
                {activePanel === null && (
                  <div className="flex flex-col p-6 gap-1">
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

                    {isContributor && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <p className="section-label mb-3">Contribute</p>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            data-ocid="nav.contributor.drafts.link"
                            onClick={() => setActivePanel("my-drafts")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            My Drafts
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <p className="section-label">Admin</p>
                          {isSuperAdmin && (
                            <span className="text-[9px] font-sans uppercase tracking-widest bg-white/10 text-white/50 px-2 py-0.5">
                              Super
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            data-ocid="nav.admin.articles.link"
                            onClick={() => setActivePanel("articles")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Articles
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                          <button
                            type="button"
                            data-ocid="nav.admin.submissions.link"
                            onClick={() => setActivePanel("submissions")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Submissions
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                          <button
                            type="button"
                            data-ocid="nav.admin.orgs.link"
                            onClick={() => setActivePanel("orgs")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Organisations
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                          <button
                            type="button"
                            data-ocid="nav.admin.users.link"
                            onClick={() => setActivePanel("users")}
                            className="text-left text-white/60 hover:text-white font-sans text-sm py-2.5 border-b border-white/10 transition-colors flex items-center justify-between"
                          >
                            Users
                            <span className="text-white/20 text-xs">→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === "articles" && (
                  <div className="p-6">
                    <ArticleListPanel
                      onEdit={(article) => openEditArticle(article, false)}
                      onNew={() => openNewArticle(false)}
                    />
                  </div>
                )}

                {activePanel === "submissions" && (
                  <div className="p-6">
                    <SubmissionsPanel orgs={myOrgs} />
                  </div>
                )}

                {activePanel === "orgs" && (
                  <div className="p-6">
                    <OrgManagementPanel />
                  </div>
                )}

                {activePanel === "users" && (
                  <div className="p-6">
                    <UserRolePanel />
                  </div>
                )}

                {activePanel === "my-drafts" && (
                  <div className="p-6">
                    <MySubmissionsPanel
                      onEdit={(article) => openEditArticle(article, true)}
                      onNew={() => openNewArticle(true)}
                    />
                  </div>
                )}
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

      {/* Article Form Overlay — rendered outside drawer DOM, fixed full-screen */}
      <AnimatePresence>
        {formOverlayOpen && (
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[60] bg-black overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-black border-b border-white/20">
              <button
                type="button"
                data-ocid="article-form.back.button"
                onClick={closeFormOverlay}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-sans uppercase tracking-wider"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                type="button"
                data-ocid="article-form.close_button"
                onClick={closeFormOverlay}
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Close article form"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-w-2xl mx-auto">
              <ArticleFormPanel
                key={editingArticle?.id?.toString() ?? "new"}
                article={editingArticle}
                onBack={closeFormOverlay}
                orgs={myOrgs}
                contributorOrgIds={
                  isContributorMode ? contributorOrgIds : undefined
                }
                isContributorMode={isContributorMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
