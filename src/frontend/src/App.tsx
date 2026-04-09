import { Toaster } from "@/components/ui/sonner";
import { loadConfig } from "@caffeineai/core-infrastructure";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import InviteBanner from "./components/InviteBanner";
import { useSuperAdminClaim } from "./hooks/useSuperAdminClaim";
import ArticlePage from "./pages/ArticlePage";
import AuthorPage from "./pages/AuthorPage";
import GamesPage from "./pages/GamesPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OrgPage from "./pages/OrgPage";
import PrivacyPage from "./pages/PrivacyPage";
import SectionPage from "./pages/SectionPage";
import SupportPage from "./pages/SupportPage";
import TeamPage from "./pages/TeamPage";
import WhitepaperPage from "./pages/WhitepaperPage";

function parseRoute(pathname: string) {
  if (pathname === "/" || pathname === "") return { page: "home" };
  if (pathname === "/privacy") return { page: "privacy" };
  if (pathname === "/login") return { page: "login" };
  if (pathname === "/team") return { page: "team" };
  if (pathname === "/whitepaper") return { page: "whitepaper" };
  if (pathname === "/support") return { page: "support" };
  if (pathname === "/games") return { page: "games" };

  const articleMatch = pathname.match(/^\/article\/(.+)$/);
  if (articleMatch) return { page: "article", param: articleMatch[1] };

  const authorMatch = pathname.match(/^\/author\/(.+)$/);
  if (authorMatch) return { page: "author", param: authorMatch[1] };

  const orgMatch = pathname.match(/^\/org\/(.+)$/);
  if (orgMatch) return { page: "org", param: orgMatch[1] };

  const sectionMatch = pathname.match(/^\/section\/(.+)$/);
  if (sectionMatch) return { page: "section", param: sectionMatch[1] };

  return { page: "home" };
}

function SuperAdminClaimEffect() {
  useSuperAdminClaim();
  return null;
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [canisterId, setCanisterId] = useState("");

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    loadConfig().then((config) => setCanisterId(config.backend_canister_id));
  }, []);

  const route = parseRoute(pathname);

  const showHeader = route.page !== "login";

  const renderPage = () => {
    switch (route.page) {
      case "home":
        return <HomePage />;
      case "article":
        return <ArticlePage id={route.param!} />;
      case "author":
        return <AuthorPage principal={route.param!} />;
      case "org":
        return <OrgPage slug={route.param!} />;
      case "section":
        return <SectionPage tag={route.param!} />;
      case "privacy":
        return <PrivacyPage />;
      case "team":
        return <TeamPage />;
      case "whitepaper":
        return <WhitepaperPage />;
      case "support":
        return <SupportPage />;
      case "games":
        return <GamesPage />;
      case "login":
        return <LoginPage />;
      default:
        return <HomePage />;
    }
  };

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SuperAdminClaimEffect />
      {showHeader && (
        <>
          <Header />
          <InviteBanner />
        </>
      )}
      <div className="flex-1">{renderPage()}</div>

      {showHeader && (
        <footer className="border-t border-white/10 py-8 mt-16">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs font-sans">© {year}.</p>
            {canisterId && (
              <code
                className="font-mono text-white/20"
                style={{ fontSize: "10px", letterSpacing: "0.04em" }}
              >
                {canisterId}
              </code>
            )}
          </div>
        </footer>
      )}
      <Toaster />
    </div>
  );
}
