import { ArrowLeft, Check, Copy, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { navigate } from "../lib/navigate";

const WALLET_ADDRESS =
  "9243e4dba5135fe82719bdb7e690e10fce1cdf97a470ced1c64927fc4e59e6a8";

const SUGGESTED_AMOUNTS = [
  { amount: "1 ICP", label: "Keeps the canister online" },
  { amount: "5 ICP", label: "Funds a week of coverage" },
  { amount: "10 ICP", label: "A month of independent reporting" },
];

export default function SupportPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.main
      data-ocid="support.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black pb-24"
    >
      <div className="max-w-2xl mx-auto px-6">
        {/* Back button */}
        <div className="pt-8 pb-6">
          <button
            type="button"
            data-ocid="support.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* Headline */}
        <h1
          className="font-editorial text-white leading-tight mb-4 text-balance"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          Support Independent Journalism
        </h1>

        {/* Mission statement */}
        <p className="text-white/50 font-sans text-base leading-relaxed mb-12">
          Times² is a reader-supported, privacy-first publication. No ads. No
          trackers. No corporate backing. Just on-chain journalism.
        </p>

        <div className="divider-white mb-10" />

        {/* Wallet section */}
        <section data-ocid="support.wallet.section" className="mb-12">
          <p className="section-label mb-4">ICP Wallet Address</p>

          <div className="border border-white/10 p-4 mb-3">
            <code className="font-mono text-white/70 text-[12px] tracking-wide break-all leading-relaxed">
              {WALLET_ADDRESS}
            </code>
          </div>

          <button
            type="button"
            data-ocid="support.wallet.copy_button"
            onClick={handleCopy}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-sans uppercase tracking-widest"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy Address"}
          </button>
        </section>

        {/* QR placeholder */}
        <section
          data-ocid="support.qr.section"
          className="mb-12 flex flex-col items-center"
        >
          <p className="section-label mb-4 self-start">Scan to Pay</p>
          <div
            className="border border-white/10 flex flex-col items-center justify-center gap-3 p-10"
            style={{ width: 200, height: 200 }}
          >
            <QrCode size={48} className="text-white/30" />
            <p className="text-white/20 font-sans text-[10px] text-center leading-relaxed">
              Open your ICP wallet and paste the address above
            </p>
          </div>
          <p className="text-white/20 font-sans text-xs mt-3">
            Copy the address above to send ICP
          </p>
        </section>

        <div className="divider-subtle mb-10" />

        {/* Suggested amounts */}
        <section data-ocid="support.amounts.section" className="mb-12">
          <p className="section-label mb-6">Suggested Amounts</p>
          <div className="flex flex-col gap-4">
            {SUGGESTED_AMOUNTS.map(({ amount, label }) => (
              <div
                key={amount}
                className="flex items-center justify-between border border-white/10 p-4"
              >
                <span className="font-editorial text-white text-xl">
                  {amount}
                </span>
                <span className="text-white/40 font-sans text-sm">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <p className="text-white/20 font-sans text-xs leading-relaxed">
          ICP transfers happen natively in your wallet. Copy the address above
          and paste it into your ICP wallet app to send a tip.
        </p>
      </div>
    </motion.main>
  );
}
