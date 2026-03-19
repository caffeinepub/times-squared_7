import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { navigate } from "../lib/navigate";

export default function TeamPage() {
  return (
    <motion.main
      data-ocid="team.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="pt-8 pb-2">
          <button
            type="button"
            data-ocid="team.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider mb-10"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <p className="section-label mb-4">The People</p>
          <h1
            className="font-editorial text-white leading-tight mb-12"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            TIMES² — TEAM
          </h1>
        </div>

        <div className="divider-white mb-12" />

        <div className="space-y-12 pb-24">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-editorial text-white text-3xl leading-tight">
                ReverseGasModel
              </h2>
              <p className="text-white/50 font-sans text-sm uppercase tracking-widest">
                Founder &amp; Editor-in-Chief
              </p>
            </div>

            <div className="divider-white" />

            <div className="space-y-2">
              <p className="text-white/40 font-sans text-xs uppercase tracking-widest">
                On X
              </p>
              <p className="text-white/70 font-sans text-sm">
                @ReverseGasModel · @TimesSquared
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-white/40 font-sans text-xs uppercase tracking-widest">
                ICP Principal
              </p>
              <code className="block font-mono text-white/60 text-xs bg-white/5 border border-white/10 px-4 py-3 break-all">
                nvjwr-ru5jj-szayf-tdyeh-4aeph-cfp5n-upac4-7sx3f-osptw-jk3rq-yqe
              </code>
            </div>

            <div className="prose-editorial space-y-0">
              <p>
                Pseudonymous solo founder. Built Times² with no VC funding, no
                cloud infrastructure. Writer, architect, and operator of the
                only news publication that scores a perfect six on the Native
                Stack Privacy framework.
              </p>
              <p>
                Background: Crypto journalist and ICP ecosystem builder.
                Coverage focus: infrastructure failures, false on-chain claims,
                press freedom, privacy architecture, and ICP ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
