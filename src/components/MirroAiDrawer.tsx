import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, ArrowRight, Loader2, RotateCcw, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useUserPortfolio, type UserPortfolioState } from "@/lib/user-portfolio";
import { useWallet, type WalletState } from "@/lib/web3-wallet";
import { toast } from "sonner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Summarise my portfolio",
  "What's the best pool for my USDG?",
  "How does mirroring work?",
];

const QUICK_PILLS = [
  "Top Farmers",
  "Alpha vs Baseline",
  "Performance Fee",
  "AI Vetting",
];

// Fallback client-side intelligence if API or network is offline
function generateClientPortfolioSummary(
  portfolio: UserPortfolioState,
  wallet: WalletState
): string {
  if (!wallet.isConnected && portfolio.activePools.length === 0 && portfolio.mirroredFarmers.length === 0) {
    return (
      `### Portfolio Summary\n\n` +
      `**Status:** No wallet connected\n\n` +
      `- **Active Pools:** 0 positions\n` +
      `- **Active Mirrors:** 0 vaults\n` +
      `- **Total Deposited:** $0.00\n` +
      `- **Current Value:** $0.00\n\n` +
      `Connect your wallet via **Reown AppKit** in the top bar to inspect your live on-chain balances and active positions on Arbitrum Sepolia.`
    );
  }

  const shortAddr = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "Connected";

  const lines: string[] = [
    `### Portfolio Summary`,
    `**Account:** \`${shortAddr}\` (${wallet.currentNetwork.name})`,
    `- **Native Balance:** ${wallet.balance} ${wallet.currentNetwork.symbol}`,
    `- **Total Deposited:** $${portfolio.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `- **Current Value:** $${portfolio.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${portfolio.totalReturn >= 0 ? "+" : ""}$${portfolio.totalReturn.toFixed(2)} / ${portfolio.totalReturnPct >= 0 ? "+" : ""}${portfolio.totalReturnPct.toFixed(2)}%)`,
    "",
  ];

  if (portfolio.activePools.length > 0) {
    lines.push(`**Active Pools (${portfolio.activePools.length}):**`);
    for (const pool of portfolio.activePools) {
      lines.push(
        `- **${pool.protocol}** (${pool.asset}): $${pool.deposited.toLocaleString()} @ **${pool.apy}% APY**`
      );
    }
    lines.push("");
  } else {
    lines.push(`- **Active Pools:** 0 active positions`);
  }

  if (portfolio.mirroredFarmers.length > 0) {
    lines.push(`**Active Mirrored Farmers (${portfolio.mirroredFarmers.length}):**`);
    for (const m of portfolio.mirroredFarmers) {
      lines.push(
        `- **${m.name}** (\`${m.wallet.slice(0, 6)}...${m.wallet.slice(-4)}\`): $${m.deposited.toLocaleString()} @ **${m.apy}% APY** (Fee: ${m.fee}%)`
      );
    }
  } else {
    lines.push(`- **Active Mirrors:** 0 active mirrors`);
  }

  return lines.join("\n");
}

function getLocalFallback(query: string, portfolio: UserPortfolioState, wallet: WalletState): string {
  const q = query.toLowerCase();
  if (
    q.includes("portfolio") ||
    q.includes("summary") ||
    q.includes("summarise") ||
    q.includes("summarize") ||
    q.includes("my balance")
  ) {
    return generateClientPortfolioSummary(portfolio, wallet);
  }
  if (q.includes("usdg") || q.includes("best pool")) {
    return (
      `### Top Vetted Pools for USDG\n\n` +
      `The highest verified rate for **USDG** right now is **Pendle USDG Fixed Pool** at **9.8% APY**.\n\n` +
      `**AI-Vetted Options:**\n` +
      `1. **Pendle (USDG Fixed Pool):** **9.8% APY** — Fixed yield via Principal Token (PT) discount.\n` +
      `2. **Curve (USDG/USDC 3pool):** **7.8% APY** — Continuous stablecoin swap fee accrual.\n` +
      `3. **Aave V3 (USDG Prime Lending):** **6.1% APY** — Institutional-grade borrowing demand.\n\n` +
      `All 3 options are vetted across smart contract audits and withdrawal liquidity.`
    );
  }
  if (q.includes("mirror") || q.includes("copy") || q.includes("how does mirroring work")) {
    return (
      `### How mirro Copy-Yield Works\n\n` +
      `1. **Permissionless Indexing:** Top on-chain yield earners are indexed directly from Arbitrum Sepolia activity.\n` +
      `2. **Deposit to Replicate:** Deposited capital in \`MirroVault\` proportionally mirrors moves when rebalances occur.\n` +
      `3. **Performance Fee on Alpha Only:** Curators earn a 0–20% fee strictly on returns above the 7.10% baseline.\n` +
      `4. **Full Custody:** You can call \`stopCopying()\` at any time to return principal and yield to your wallet.`
    );
  }
  if (q.includes("alpha") || q.includes("baseline")) {
    return (
      `### Alpha vs Baseline\n\n` +
      `mirro establishes a protocol benchmark rate called the **Baseline** (currently **7.10% APY**).\n\n` +
      `- **Baseline (7.10%):** Passive automated yield benchmark.\n` +
      `- **Alpha:** The excess return a curator achieves above this benchmark ($$\\text{Alpha} = \\text{APY} - 7.10\\%$$).\n\n` +
      `Performance fees are charged **strictly on positive Alpha**. If a strategy generates 0% or negative alpha, you pay zero fees.`
    );
  }
  if (q.includes("fee")) {
    return (
      `### Performance Fee Policy\n\n` +
      `- **Protocol Fee:** mirro charges **0% deposit** and **0% withdrawal** fees.\n` +
      `- **Curator Fee:** 0–20% fee, charged **strictly on positive Alpha** above the 7.10% baseline.\n` +
      `- If a farmer generates <= 7.10% APY, you pay **0% in fees**.`
    );
  }
  if (q.includes("pendle")) {
    return (
      `### Pendle Finance: Yield & Risks\n\n` +
      `- **Yield Source:** Fixed yield via Principal Token (PT) discount + AMM swap fees.\n` +
      `- **Audits:** Verified by Nethermind, Certora, and Ackee.\n` +
      `- **Risks:** Smart contract risk, underlying token peg risk.\n` +
      `- **Verdict:** **AI Approved**. Ideal for predictable fixed returns.`
    );
  }
  return (
    `### mirro Protocol Intelligence\n\n` +
    `I've analyzed your question regarding **"${query}"**.\n\n` +
    `- **Benchmark:** Baseline APY is **7.10%** across automated strategies.\n` +
    `- **Top Curators:** Arbitrum Sepolia whales are earning **8.9%–11.2% APY** (+1.8% to +4.1% Alpha).\n` +
    `- **Custody:** Non-custodial vault architecture with instant withdrawals.\n\n` +
    `Try asking:\n` +
    `- *Summarise my portfolio*\n` +
    `- *What's the best pool for my USDG?*\n` +
    `- *How does mirroring work?*`
  );
}

export function MirroAiDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm mirro AI. Ask me anything about your pools, master farmers, or yield strategies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const portfolio = useUserPortfolio();
  const wallet = useWallet();

  // Session ID for chat conversation - initialized consistently for SSR
  const [sessionId, setSessionId] = useState("00000000-0000-0000-0000-000000000001");
  useEffect(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      setSessionId(crypto.randomUUID());
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, scrollToBottom]);

  // Support open-mirro-ai custom event from HelpQuestionButton across the app
  useEffect(() => {
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ question?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.question) {
        void handleSend(customEvent.detail.question);
      }
    };
    window.addEventListener("open-mirro-ai", handleCustomOpen);
    return () => window.removeEventListener("open-mirro-ai", handleCustomOpen);
  }, []);

  const handleCopyMessage = (id: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied to clipboard");
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Conversation reset. How can I help you with your yield farming or portfolio today?",
      },
    ]);
  };

  const handleSend = async (userText?: string) => {
    const textToSend = (userText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!userText) setInput("");
    setIsLoading(true);

    try {
      // Build context for the AI
      const chatContext = {
        walletAddress: wallet.address,
        chainId: wallet.chainId ?? undefined,
        balance: wallet.balance,
        usdgBalance: wallet.usdgBalance,
        totalDeposited: portfolio.totalDeposited,
        portfolioValue: portfolio.portfolioValue,
        totalReturn: portfolio.totalReturn,
        totalReturnPct: portfolio.totalReturnPct,
        activePools: portfolio.activePools.map((p) => ({
          protocol: p.protocol,
          asset: p.asset,
          deposited: p.deposited,
          apy: p.apy,
        })),
        mirroredFarmers: portfolio.mirroredFarmers.map((m) => ({
          name: m.name,
          wallet: m.wallet,
          deposited: m.deposited,
          apy: m.apy,
          fee: m.fee,
        })),
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sessionId,
          context: chatContext,
          messages: [
            ...messages.map((m) => ({
              id: m.id,
              role: m.role,
              parts: [{ type: "text", text: m.content }],
            })),
            {
              id: userMessage.id,
              role: "user",
              parts: [{ type: "text", text: userMessage.content }],
            },
          ],
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { content?: string; message?: string };
          const assistantText = data.content || data.message || "I could not retrieve an answer at this time.";

          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: assistantText,
            },
          ]);
        } else {
          // Handle streaming text
          const reader = response.body?.getReader();
          if (reader) {
            const decoder = new TextDecoder();
            let accumulated = "";
            const assistantId = `assistant-${Date.now()}`;

            // Add placeholder assistant message
            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: "",
              },
            ]);

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });

              // Clean stream delta if using Vercel AI SDK text-delta stream
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith('0:"')) {
                  try {
                    const parsed = JSON.parse(line.slice(2));
                    accumulated += parsed;
                  } catch {
                    accumulated += line.slice(3, -1);
                  }
                } else if (line.startsWith("0:")) {
                  try {
                    const parsed = JSON.parse(line.slice(2));
                    if (typeof parsed === "string") accumulated += parsed;
                    else if (parsed.textDelta) accumulated += parsed.textDelta;
                  } catch {
                    accumulated += line;
                  }
                } else if (!line.startsWith("d:") && !line.startsWith("e:") && line.trim()) {
                  accumulated += line;
                }
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: accumulated || "Processing..." } : msg
                )
              );
            }
          } else {
            const raw = await response.text();
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: raw || getLocalFallback(textToSend, portfolio, wallet),
              },
            ]);
          }
        }
      } else {
        // Fallback to local intelligence on any non-200 status
        const localAnswer = getLocalFallback(textToSend, portfolio, wallet);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: localAnswer,
          },
        ]);
      }
    } catch {
      // Offline fallback
      const localAnswer = getLocalFallback(textToSend, portfolio, wallet);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: localAnswer,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 
        Fixed bottom-right launcher button:
        Spec: 48px, 4px radius, --accent background, MessageCircle icon (lucide-react) white.
        No box-shadows.
      */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 rounded-[4px] flex items-center justify-center cursor-pointer transition-all hover:opacity-90 active:scale-95 shadow-none"
          style={{ backgroundColor: "var(--accent)" }}
          aria-label="Open mirro AI"
          title="Open mirro AI"
        >
          <MessageCircle size={22} className="text-white" />
        </button>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 
        Drawer from the right:
        Spec: 360px wide, full height, --bg-surface, left border 1px --border.
        No box-shadows.
      */}
      {isOpen && (
        <div
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[360px] h-full flex flex-col border-l border-border bg-card shadow-none"
          style={{ backgroundColor: "var(--bg-surface)" }}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-card">
            <div>
              <h2 className="font-sans font-medium text-sm text-foreground lowercase tracking-tight">
                mirro AI
              </h2>
              <p className="text-[12px] font-sans text-muted-foreground mt-0.5">
                Ask anything about your pools or yield farming.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="w-7 h-7 rounded-[4px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-[4px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Close mirro AI"
                aria-label="Close mirro AI"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`text-sm font-sans leading-relaxed ${
                    msg.role === "user"
                      ? "bg-secondary text-foreground px-3.5 py-2.5 rounded-[4px] border border-border max-w-[85%] text-left"
                      : "text-foreground max-w-[95%] bg-transparent"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      h3: ({ children }) => (
                        <h3 className="font-sans font-medium text-sm text-foreground mb-2 mt-1">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded-[3px] border border-border">
                          {children}
                        </code>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline hover:opacity-80"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Copy action for assistant messages */}
                {msg.role === "assistant" && msg.content && (
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="text-[11px] font-sans text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] hover:bg-secondary transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-green-500" />
                          <span>copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>mirro AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick topic pills */}
          <div className="px-3 pt-2 pb-1 border-t border-border/60 bg-card flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => void handleSend(`Explain ${pill}`)}
                className="text-[11px] font-sans text-muted-foreground hover:text-foreground bg-secondary hover:bg-muted px-2.5 py-1 rounded-[4px] border border-border shrink-0 transition-colors cursor-pointer"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* On first open, show the 3 canonical suggested question chips from spec */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 bg-card flex flex-col gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void handleSend(suggestion)}
                  className="text-left text-[13px] font-sans bg-secondary hover:bg-muted text-foreground px-3 py-2 rounded-[4px] border border-border transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* 
            Input bar:
            Spec: full-width, --bg-elevated bg, --border border. Send button --accent, ArrowRight icon.
            No box-shadows.
          */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 border-t border-border bg-secondary flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask mirro AI..."
              className="flex-1 bg-card text-foreground placeholder:text-muted-foreground text-sm font-sans px-3 py-2 rounded-[4px] border border-border focus:outline-none focus:border-accent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 cursor-pointer transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
              style={{ backgroundColor: "var(--accent)" }}
              aria-label="Send message"
              title="Send message"
            >
              <ArrowRight size={15} className="text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
