import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { navigate } from "../lib/navigate";

export default function PrivacyPage() {
  return (
    <motion.main
      data-ocid="privacy.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="pt-8 pb-2">
          <button
            type="button"
            data-ocid="privacy.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider mb-10"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <p className="section-label mb-4">Privacy Manifesto</p>
          <h1
            className="font-editorial text-white leading-tight mb-12"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Your reading is your own.
          </h1>
        </div>

        <div className="divider-white mb-12" />

        <div className="prose-editorial space-y-0">
          <p>
            Times Squared is hosted on a decentralized substrate — the Internet
            Computer — and operates beyond the reach of centralized control. No
            single entity can take it down, modify its content, or restrict
            access to what is published here.
          </p>
          <p>
            We collect no data about our readers. There are no tracking cookies,
            no fingerprinting, no advertising networks, and no analytics scripts
            of any kind. Your reading habits are entirely your own. We have no
            interest in them.
          </p>
          <p>
            No record of who reads what is ever kept. The platform has no
            concept of a reader session, user identifier, or behavioral profile.
            Reading here is anonymous by design. This is not a feature we added
            — it is an absence of infrastructure we chose never to build.
          </p>
          <p>
            All fonts are self-hosted. There are no external requests made when
            you load this publication. Nothing is phoned home. Nothing is
            logged. The platform does not know you visited, and that is by
            intention.
          </p>
        </div>
      </div>
    </motion.main>
  );
}
