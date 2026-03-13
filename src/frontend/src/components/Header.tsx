import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { navigate } from "../lib/navigate";
import NavDrawer from "./NavDrawer";
import SearchModal from "./SearchModal";

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
