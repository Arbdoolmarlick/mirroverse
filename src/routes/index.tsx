import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Coins,
  Layers3,
  Moon,
  Orbit,
  Radar,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { useWallet } from "@/lib/web3-wallet";
import { farmers, supportedAssetsOverview } from "@/lib/mirro-data";
import { useOnChainLeaderboard } from "@/lib/use-onchain-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mirro — find the best yield. follow the best farmers." },
      {
        name: "description",
        content:
          "mirro aggregates every pool across Arbitrum Sepolia, vets them with AI, and lets you mirror the best farmers. Yield, simplified.",
      },
      { property: "og:title", content: "mirro — find the best yield. follow the best farmers." },
      {
        property: "og:description",
        content: "Aggregate, follow, protect. Yield farming, simplified.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function NetworkDiagram() {
  return (
    <div className="network-diagram" aria-label="A live map of transparent farmers and pools">
      <div className="network-grid" />
      <span className="network-line line-a" />
      <span className="network-line line-b" />
      <span className="network-line line-c" />
      <span className="network-line line-d" />
      <span className="network-node node-origin">
        <span className="node-core" />
        <small>farmer</small>
      </span>
      <span className="network-node node-one">
        <span className="node-core" />
        <small>USDG</small>
      </span>
      <span className="network-node node-two">
        <span className="node-core" />
        <small>ETH</small>
      </span>
      <span className="network-node node-three">
        <span className="node-core" />
        <small>BTC</small>
      </span>
      <span className="network-node node-four">
        <span className="node-core" />
        <small>you</small>
      </span>
      <div className="diagram-readout">
        <span className="status-pulse" />
        network pulse <b>+9.4%</b>
        <small>past 7 days</small>
      </div>
      <div className="diagram-caption">One move, visible everywhere.</div>
    </div>
  );
}

function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { isConnected, address, openWalletModal, openAccountModal } = useWallet();
  const { summary } = useOnChainLeaderboard();
  const topFarmers = farmers.slice(0, 4);

  return (
    <div className="landing">
      {/* Floating pill navigation bar */}
      <header className="top-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>mirro</span>
        </Link>
        <div className="protocol-status">
          <span className="status-pulse" />
          protocol live
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          <a href="#what-it-does" className="nav-link">
            what it does
          </a>
          <a href="#how-it-works" className="nav-link">
            how it works
          </a>
          <a href="#supported-assets" className="nav-link">
            assets
          </a>
          <a href="#for-farmers" className="nav-link">
            for farmers
          </a>
          <Link to="/app/leaderboard" className="nav-link">
            leaderboard
          </Link>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-thumb">
              {theme === "light" ? <Moon size={12} /> : <Sun size={12} />}
            </span>
          </span>
          <span className="theme-toggle-label">{theme === "light" ? "dark" : "light"}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                openAccountModal();
              } else {
                openWalletModal();
              }
            }}
            className="wallet-connect flex items-center gap-1.5 cursor-pointer font-mono text-xs"
          >
            <Wallet size={12} />
            <span>
              {isConnected && address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "connect wallet"}
            </span>
          </button>
          <Link to="/app" className="wallet-connect">
            app <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="landing-hero">
        <div className="hero-side-note">
          <span>01 / 05</span>
          <i />a protocol for considered following
        </div>
        <div className="hero-copy">
          <div className="landing-kicker">
            <span className="kicker-dot" />
            mirro protocol <span className="kicker-rule" /> transparent by design
          </div>
          <h1>
            find the best yield.
            <br />
            <em>follow the best farmers.</em>
          </h1>
          <p className="hero-lede">
            The market is already full of opinions. mirro aggregates every pool across Arbitrum
            Sepolia, vets them with AI, and lets you move with the best.
          </p>
          <div className="hero-actions">
            <Link to="/app" className="landing-button landing-button-dark">
              continue to app <ArrowRight />
            </Link>
            <Link to="/app/leaderboard" className="landing-button landing-button-light">
              explore farmers <ArrowUpRight />
            </Link>
          </div>
          <div className="hero-footnote">
            <ShieldCheck size={14} />
            <span>Non-custodial · on-chain positions · USDG denominated</span>
          </div>
        </div>
        <div className="hero-art">
          <NetworkDiagram />
          <div className="hero-ticker ticker-top">
            <span>LIVE / 09:42:18</span>
            <b>09</b>
            <small>vaults in motion</small>
          </div>
          <div className="hero-ticker ticker-bottom">
            <span>YOUR VIEW</span>
            <b>∞</b>
            <small>no black boxes</small>
          </div>
        </div>
        <a className="scroll-cue" href="#what-it-does">
          <span>scroll to enter</span>
          <ChevronDown />
        </a>
      </section>

      {/* Dark Ticker Strip */}
      <section className="ticker-strip" aria-label="Protocol activity">
        <div>
          <span>indexed tvl</span>
          <strong>{summary.totalIndexedTVLFormatted}</strong>
        </div>
        <div>
          <span>active mirrors</span>
          <strong>{summary.activeMirrors}</strong>
        </div>
        <div>
          <span>vaults live</span>
          <strong>09</strong>
        </div>
        <div>
          <span>on-chain moves</span>
          <strong>{summary.totalMoves}</strong>
        </div>
        <div>
          <span>settled on-chain</span>
          <strong>100%</strong>
        </div>
        <div className="ticker-mark">mirro / 24</div>
      </section>

      {/* 1.1 "What it does" Section — Aggregate / Follow / Protect */}
      <section className="landing-section thesis" id="what-it-does">
        <Reveal className="section-index">
          02 <span>/ what it does</span>
        </Reveal>
        <Reveal className="thesis-layout">
          <div className="section-intro">
            <p className="eyebrow">Three pillars of mirro</p>
            <h2>
              Aggregate. Follow.
              <br />
              <span>Protect.</span>
            </h2>
          </div>
          <div className="thesis-copy">
            <p>
              mirro replaces fragmented tabs with a single non-custodial surface. Whether you want
              to park funds in the highest yielding USDG pool or replicate top alpha generators,
              your capital never leaves your control.
            </p>
            <Link to="/app/leaderboard" className="text-link">
              Explore verified farmer strategies <ArrowUpRight />
            </Link>
          </div>
        </Reveal>
        <Reveal className="thesis-cards">
          <article className="thesis-card card-coral">
            <div className="card-number">01</div>
            <TrendingUp />
            <h3>Aggregate</h3>
            <p>
              <strong>Best APY, always.</strong> We continuously scan every lending, liquidity, and
              fixed-yield pool across Arbitrum Sepolia so you always get top rate.
            </p>
            <span className="card-line" />
          </article>
          <article className="thesis-card card-lilac">
            <div className="card-number">02</div>
            <Orbit />
            <h3>Follow</h3>
            <p>
              <strong>Copy the best farmers.</strong> When master farmers adjust their weights, your
              USDG replicates their moves in lockstep through automated session keys.
            </p>
            <span className="card-line" />
          </article>
          <article className="thesis-card card-mint">
            <div className="card-number">03</div>
            <ShieldCheck />
            <h3>Protect</h3>
            <p>
              <strong>AI-vetted pools only.</strong> Every pool undergoes 5-point automated risk
              audits: bytecode safety, TVL health, revenue authenticity, and contract age.
            </p>
            <span className="card-line" />
          </article>
        </Reveal>
      </section>

      {/* 1.1 "How it works" — 4 numbered steps */}
      <section className="landing-section mechanics" id="how-it-works">
        <Reveal className="section-index">
          03 <span>/ how it works</span>
        </Reveal>
        <Reveal className="mechanics-heading">
          <p className="eyebrow">Four numbered steps</p>
          <h2>
            Four simple steps.
            <br />
            <span>Compounding on auto.</span>
          </h2>
        </Reveal>
        <Reveal className="mechanics-track">
          <div className="mechanic">
            <span className="mechanic-index">01</span>
            <div className="mechanic-icon">
              <Wallet />
            </div>
            <h3>Connect wallet</h3>
            <p>One click to connect. No KYC, non-custodial, and denominated in Paxos USDG.</p>
            <button
              type="button"
              onClick={() => openWalletModal()}
              className="text-link text-xs inline-flex items-center gap-1 cursor-pointer font-mono text-coral bg-transparent border-0 p-0 hover:underline"
            >
              connect <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="mechanic">
            <span className="mechanic-index">02</span>
            <div className="mechanic-icon">
              <Radar />
            </div>
            <h3>See best APY</h3>
            <p>
              Scan real-time APY across 18+ AI-vetted pools or check farmer alpha over baseline.
            </p>
            <Link to="/app">
              view pools <ArrowUpRight />
            </Link>
          </div>

          <div className="mechanic">
            <span className="mechanic-index">03</span>
            <div className="mechanic-icon">
              <Activity />
            </div>
            <h3>Deposit or mirror</h3>
            <p>
              Deposit directly into any pool or mirror a farmer with customizable slippage limits.
            </p>
            <Link to="/app/leaderboard">
              farmers <ArrowUpRight />
            </Link>
          </div>

          <div className="mechanic">
            <span className="mechanic-index">04</span>
            <div className="mechanic-icon">
              <Sparkles />
            </div>
            <h3>Earn and track</h3>
            <p>
              Track your portfolio diversification, earn compounding yield, and withdraw anytime.
            </p>
            <Link to="/app/portfolio">
              portfolio <ArrowUpRight />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 1.1 "Supported assets" — USDG, ETH, BTC, SOL */}
      <section className="landing-section" id="supported-assets">
        <Reveal className="section-index">
          04 <span>/ supported assets</span>
        </Reveal>
        <Reveal className="thesis-layout">
          <div className="section-intro">
            <p className="eyebrow">Cross-ecosystem liquidity</p>
            <h2>
              Four core assets.
              <br />
              <span>18+ integrated pools.</span>
            </h2>
          </div>
          <div className="thesis-copy">
            <p>
              mirro supports the major pillars of digital wealth. Every asset is paired with
              transparent, audited protocols with live APYs, depth analytics, and safety scoring.
            </p>
          </div>
        </Reveal>
        <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {supportedAssetsOverview.map((item) => (
            <div
              key={item.asset}
              className="p-5 border border-line-soft bg-canvas/60 rounded-[18px] space-y-3 hover:border-line transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-ink">{item.asset}</span>
                <span className="font-mono text-[11px] text-profit border border-profit/30 bg-profit/10 px-2 py-0.5 rounded-full">
                  {item.protocols} pools
                </span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">{item.description}</p>
              <div className="pt-2 border-t border-line-soft flex items-center justify-between text-[11px] font-mono text-ink-faint">
                <span>AI vetted: 100%</span>
                <Link
                  to="/app"
                  className="text-coral hover:underline inline-flex items-center gap-0.5"
                >
                  view <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Living Ledger Section / Leaderboard preview */}
      <section className="landing-section ledger-section">
        <Reveal className="section-index">
          05 <span>/ the living ledger</span>
        </Reveal>
        <Reveal className="ledger-layout">
          <div className="ledger-copy">
            <p className="eyebrow">A market in miniature</p>
            <h2>
              Farmers have
              <br />
              <span>a pulse.</span>
            </h2>
            <p className="body-copy">
              Not a leaderboard engineered for vanity. A current, breathing index of conviction —
              where an AI-vetted strategy and a patient human can stand beside each other.
            </p>
            <Link to="/app/leaderboard" className="landing-button landing-button-dark">
              Enter the leaderboard <ArrowRight />
            </Link>
          </div>
          <div className="ledger-panel">
            <div className="ledger-panel-head">
              <span>top farmers / 30d</span>
              <span className="panel-live">
                <i /> updating live
              </span>
            </div>
            {topFarmers.map((f, index) => (
              <Link to="/app/farmer/$id" params={{ id: f.id }} className="ledger-row" key={f.id}>
                <span className="ledger-rank">0{index + 1}</span>
                <span className="ledger-name">
                  <b>{f.name}</b>
                  <small>
                    <i className="ai-dot" />
                    AI-vetted ·{" "}
                    {f.wallet.length > 14
                      ? `${f.wallet.slice(0, 6)}...${f.wallet.slice(-4)}`
                      : f.wallet}
                  </small>
                </span>
                <span className="positive">+{f.apy}% APY</span>
                <ArrowUpRight />
              </Link>
            ))}
            <div className="ledger-panel-foot">
              <span>09 vaults & strategies visible</span>
              <span>all returns net of fees</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 1.1 "On-chain transparency" Section — Zero registration needed */}
      <section className="landing-section" id="for-farmers">
        <Reveal className="section-index">
          06 <span>/ on-chain transparency</span>
        </Reveal>
        <Reveal className="thesis-layout">
          <div className="section-intro">
            <p className="eyebrow">Zero registration needed</p>
            <h2>
              Index any farmer.
              <br />
              <span>Mirror completely on-chain.</span>
            </h2>
          </div>
          <div className="thesis-copy">
            <p>
              Top yield earners don't even need to know mirro exists. Every transaction, rebalance,
              and protocol position is indexed directly from public blockchain data. You mirror
              their verifiable on-chain moves non-custodially via smart contracts. When a strategy
              beats the baseline, alpha performance fees route straight into their wallet
              automatically.
            </p>
          </div>
        </Reveal>
        <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="p-6 border border-line-soft bg-canvas/60 rounded-[18px] space-y-2">
            <div className="font-mono text-2xl font-bold text-coral">100%</div>
            <div className="font-medium text-sm text-ink">Public On-Chain Data</div>
            <p className="text-xs text-ink-soft leading-relaxed">
              No signups, no KYC, no centralized accounts. Every farmer profile is indexed directly
              from verified blockchain deployments.
            </p>
          </div>
          <div className="p-6 border border-line-soft bg-canvas/60 rounded-[18px] space-y-2">
            <div className="font-mono text-2xl font-bold text-profit">Non-Custodial</div>
            <div className="font-medium text-sm text-ink">Smart Contract Execution</div>
            <p className="text-xs text-ink-soft leading-relaxed">
              You retain full control of your capital. Smart contracts mirror verified allocation
              moves with customizable slippage limits.
            </p>
          </div>
          <div className="p-6 border border-line-soft bg-canvas/60 rounded-[18px] space-y-2">
            <div className="font-mono text-2xl font-bold text-ink">Automated</div>
            <div className="font-medium text-sm text-ink">Passive Alpha Settlement</div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Performance fees on excess alpha route directly into the farmer's on-chain wallet.
              They earn without ever needing to visit mirro.
            </p>
          </div>
        </Reveal>
        <Reveal className="mt-6 flex justify-start">
          <Link to="/app/leaderboard" className="landing-button landing-button-dark">
            Explore top earners <ArrowRight />
          </Link>
        </Reveal>
      </section>

      {/* Quote Section */}
      <section className="landing-quote">
        <Reveal>
          <div className="quote-mark">“</div>
          <blockquote>
            Transparency is not a feature of the market.
            <br />
            <em>It is the market.</em>
          </blockquote>
          <div className="quote-attribution">
            <span className="quote-rule" />
            mirro protocol / field note 001
          </div>
        </Reveal>
      </section>

      {/* CTA Card Section */}
      <section className="landing-cta">
        <Reveal className="cta-card">
          <div className="cta-spark" />
          <p className="eyebrow">The door is open</p>
          <h2>
            Make your next
            <br />
            <em>move visible.</em>
          </h2>
          <p>Start with a farmer. Stay for the yield.</p>
          <div className="hero-actions">
            <Link to="/app" className="landing-button landing-button-dark">
              continue to app <ArrowRight />
            </Link>
            <Link to="/app/leaderboard" className="text-link text-link-dark">
              Browse the network <ArrowUpRight />
            </Link>
          </div>
          <div className="cta-meta">
            <span>
              <i />
              protocol live
            </span>
            <span>mirro / built for following</span>
          </div>
        </Reveal>
      </section>

      {/* Landing Footer with Robinhood Chain + USDG attribution */}
      <footer className="landing-footer flex flex-col md:flex-row items-center justify-between gap-4 py-8 border-t border-line-soft">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>mirro</span>
        </Link>
        <span className="text-xs text-ink-soft">
          Built on Arbitrum Sepolia · USDG Yield Protocol
        </span>
        <span className="mono text-xs text-ink-faint">© 2026 mirro · all rights reserved</span>
      </footer>
    </div>
  );
}
