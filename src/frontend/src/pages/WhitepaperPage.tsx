import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { navigate } from "../lib/navigate";

interface SectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-4">
        <span className="text-white/20 font-sans text-xs uppercase tracking-widest shrink-0">
          {number}
        </span>
        <h2 className="font-editorial text-white text-2xl leading-tight">
          {title}
        </h2>
      </div>
      <div className="pl-8 space-y-3">{children}</div>
      <div className="divider-white" />
    </section>
  );
}

export default function WhitepaperPage() {
  return (
    <motion.main
      data-ocid="whitepaper.page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black"
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="pt-8 pb-2">
          <button
            type="button"
            data-ocid="whitepaper.back.button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans uppercase tracking-wider mb-10"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <p className="section-label mb-4">Technical Document · March 2026</p>
          <h1
            className="font-editorial text-white leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            TIMES² — WHITEPAPER
          </h1>
          <p className="text-white/50 font-sans text-sm leading-relaxed mb-12">
            A Privacy-First, On-Chain Editorial Publication on the Internet
            Computer
          </p>
        </div>

        <div className="divider-white mb-12" />

        <div className="space-y-10 pb-24">
          <Section number="01" title="Overview">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              Times² is a fully on-chain editorial news publication built on the
              Internet Computer Protocol (ICP). All content, author profiles,
              organizational data, and access control state are stored directly
              on the blockchain using Motoko smart contracts. There are no
              servers, no databases, no cloud infrastructure, and no external
              service dependencies.
            </p>
          </Section>

          <Section number="02" title="Technology Stack">
            <div className="space-y-2">
              {[
                ["Blockchain", "Internet Computer Protocol (ICP)"],
                ["Smart Contract Language", "Motoko"],
                ["Frontend", "React + TypeScript + Tailwind CSS"],
                [
                  "Authentication",
                  "Internet Identity (decentralized, non-custodial)",
                ],
                ["Hosting", "ICP canister (fully on-chain)"],
                ["Fonts", "Self-hosted (no external font providers)"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex gap-4 items-baseline border-b border-white/5 pb-2"
                >
                  <span className="text-white/30 font-sans text-xs w-40 shrink-0">
                    {label}
                  </span>
                  <span className="text-white/70 font-sans text-sm">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section number="03" title="On-Chain Data Model">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              All application state is stored in{" "}
              <code className="font-mono text-white/60 text-xs bg-white/5 px-1.5 py-0.5">
                stable var
              </code>{" "}
              hash maps in the Motoko backend, ensuring full persistence across
              canister upgrades:
            </p>
            <div className="space-y-2 mt-2">
              {[
                [
                  "articles",
                  "Full article content, metadata, status, tags, featured/pinned flags",
                ],
                [
                  "userProfiles",
                  "Author bios, avatars, display names keyed by principal",
                ],
                [
                  "organizations",
                  "Editorial org sections with slugs, banners, descriptions",
                ],
                ["orgMemberships", "Contributor membership records per org"],
                ["orgInvites", "Pending invitations keyed by principal"],
                [
                  "articleSubmissions",
                  "Draft submission and approval workflow state",
                ],
              ].map(([key, desc]) => (
                <div
                  key={key}
                  className="flex gap-4 items-baseline border-b border-white/5 pb-2"
                >
                  <code className="font-mono text-white/60 text-xs w-40 shrink-0">
                    {key}
                  </code>
                  <span className="text-white/60 font-sans text-xs leading-relaxed">
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section number="04" title="Editorial Role Hierarchy">
            <div className="space-y-4">
              {[
                [
                  "Super Admin",
                  "First authenticated user; global control; cannot be demoted; only role that can promote others to Admin",
                ],
                [
                  "Admin",
                  "Owns and manages orgs they create; can invite contributors, approve/reject submissions, publish articles",
                ],
                [
                  "Contributor (User)",
                  "Invited into orgs; can create drafts and submit for editorial review; only the original author can unpublish their own article",
                ],
                ["Guest", "Read-only access to all published content"],
              ].map(([role, desc]) => (
                <div key={role} className="space-y-1">
                  <p className="text-white font-sans text-sm font-medium">
                    {role}
                  </p>
                  <p className="text-white/50 font-sans text-xs leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section number="05" title="Contributor Workflow">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              Admins invite contributors by ICP principal. Invited users accept
              or decline. Accepted contributors can create article drafts and
              submit them for review. Admins approve or reject with an optional
              note. Rejection is not final — contributors can revise and
              resubmit. Only the original author can unpublish a published
              article.
            </p>
          </Section>

          <Section number="06" title="Native Stack Privacy (NSP) Compliance">
            <p className="text-white/70 font-sans text-sm leading-relaxed mb-4">
              Times² achieves a perfect score on all six NSP principles:
            </p>
            <div className="space-y-3">
              {[
                [
                  "NSP 1 — No Tracking",
                  "No analytics, tracking pixels, telemetry, or behavioral data collection",
                ],
                [
                  "NSP 2 — No External Dependencies",
                  "All fonts, scripts, and assets are self-hosted. No requests to third-party servers on page load",
                ],
                [
                  "NSP 3 — On-Chain Storage",
                  "All data stored in ICP stable memory, not on centralized servers",
                ],
                [
                  "NSP 4 — Identity Sovereignty",
                  "Internet Identity only. No email, no passwords, no third-party auth. Users own their credentials",
                ],
                [
                  "NSP 5 — No Behavioral Data",
                  "No session tracking, read history, or reader-side logging in any backend function",
                ],
                [
                  "NSP 6 — Censorship Resistance",
                  "Fully deployed on ICP. No centralized points of failure or takedown vectors",
                ],
              ].map(([principle, desc]) => (
                <div
                  key={principle}
                  className="border border-white/10 px-4 py-3 space-y-1"
                >
                  <p className="text-white font-sans text-xs uppercase tracking-widest">
                    {principle}
                  </p>
                  <p className="text-white/50 font-sans text-xs leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section number="07" title="Privacy Architecture">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              The backend exposes no caller-tracking in public query functions.{" "}
              <code className="font-mono text-white/60 text-xs bg-white/5 px-1.5 py-0.5">
                getPublishedArticles
              </code>{" "}
              is a pure public query with no identity logging. No cookies, no
              localStorage tracking, no fingerprinting. The Privacy Policy at{" "}
              <code className="font-mono text-white/60 text-xs bg-white/5 px-1.5 py-0.5">
                /privacy
              </code>{" "}
              accurately reflects the technical implementation.
            </p>
          </Section>

          <Section number="08" title="Governance &amp; Upgradeability">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              The canister is currently controlled by the founding team. Upgrade
              governance follows ICP's standard controller model. Future
              compatibility with SNS (Service Nervous System) decentralized
              governance is planned, which would route canister upgrades through
              token-holder votes.
            </p>
          </Section>

          <Section number="09" title="Funding &amp; Independence">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              Times² is self-funded and independently operated. No venture
              capital, no institutional backing, no cloud provider dependencies.
              The publication is designed to be censorship-resistant,
              financially independent, and architecturally sovereign.
            </p>
          </Section>

          <Section number="10" title="Source Code">
            <p className="text-white/70 font-sans text-sm leading-relaxed">
              The full source code is publicly available at:
            </p>
            <code className="block font-mono text-white/60 text-xs bg-white/5 border border-white/10 px-4 py-3 break-all">
              https://github.com/reversegasmodel-oss/times-squared
            </code>
          </Section>

          <Section number="11" title="Live Publication">
            <code className="block font-mono text-white/60 text-xs bg-white/5 border border-white/10 px-4 py-3 break-all">
              https://times-squared-51a.caffeine.xyz/
            </code>
          </Section>
        </div>
      </div>
    </motion.main>
  );
}
