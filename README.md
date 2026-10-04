# Mirro Yield Insights

Build a full product called "mirro" (always lowercase). It has two parts: a landing page and the app itself. The landing page has a "Continue to app" button that navigates to the app. The entire product uses one unified design system inspired by zippies.xyz.

---

## DESIGN SYSTEM — ZIPPIES.XYZ INSPIRED

Study zippies.xyz carefully. It uses a warm off-white editorial aesthetic: light background, compact inline data, strong typographic hierarchy, section labels as small eyebrow text, minimal decoration, precise borders, and content that IS the design. Apply this to a financial product.

Install Google Fonts: DM Sans (300, 400, 500) and DM Mono (400, 500).

CSS custom properties on :root:
--bg: #EDECEA;
--bg-surface: #E5E4E0;
--bg-elevated: #DDDBD6;
--border: #C8C6C0;
--border-light: #DDDBD6;
--text-primary: #0E0E0C;
--text-secondary: #5C5B55;
--text-muted: #9E9C95;
--accent: #1A5FFF;
--accent-dim: #E0E8FF;
--profit: #0F7A3C;
--loss: #C0392B;

Typography:

- Body, headings, UI: DM Sans
- All numbers, prices, APY values, addresses, percentages: DM Mono
- Display heading: DM Sans 300, 2.5rem, letter-spacing -0.03em
- Section eyebrow label: DM Sans 400, 0.68rem, letter-spacing 0.08em, --text-muted, always lowercase
- Heading: DM Sans 500, 1.1rem
- Body: DM Sans 400, 0.875rem, line-height 1.65, --text-secondary
- Data: DM Mono 400, 0.875rem

Layout rules:

- No box-shadows ever
- No gradients anywhere
- Borders only (1px solid var(--border)) to define surfaces
- No border-radius above 6px. Buttons: 4px. Modals: 6px. Nothing else rounded.
- Hover: background transitions 100ms ease only. Nothing else animates.
- Numbers always right-aligned in tables
- Positive values: prefix +, color --profit. Negative: prefix -, color --loss.
- Section eyebrow labels sit directly above section content with a border-top line above them
- App name "mirro" always lowercase, no exceptions

---

## PART 1 — LANDING PAGE (route: /)

The landing page is the first thing users see. Inspired by zippies.xyz structure: full-width editorial sections separated by horizontal rules with small eyebrow labels.

### Top bar

Fixed, full-width, --bg background, border-bottom 1px --border.
Left: "mirro" in DM Sans 300, 1.3rem, --text-primary
Right: "Continue to app →" — small button, --accent border + text, transparent bg, 4px radius. Navigates to /app.

### Hero section

Large centered display text, DM Sans 300, 3rem, letter-spacing -0.04em, --text-primary:
"Find the best yield.
Follow the best farmers."

Below it, body text centered, max-width 480px, --text-secondary:
"mirro aggregates yield farming protocols to always surface the best APY for every token you hold — and lets you follow master farmers who consistently beat the baseline."

Below that, two inline buttons:
[Continue to app →] filled --accent background, white text, 4px radius
[How it works ↓] outline --border, --text-secondary, 4px radius, scrolls to the how-it-works section

### Section: "what it does"

Three feature blocks in a row, separated by vertical 1px --border lines. Each block:

- Small eyebrow label above
- Heading in DM Sans 500
- 2-line description in --text-secondary body

Block 1 — eyebrow: "aggregate"
Heading: "Best APY, always."
Description: "mirro scans Aave, Pendle, Curve, Lido, and more — and routes your tokens to the highest yield automatically."

Block 2 — eyebrow: "follow"
Heading: "Copy the best farmers."
Description: "Follow master yield farmers with verified on-chain track records. Mirror their exact strategy and earn what they earn."

Block 3 — eyebrow: "protect"
Heading: "AI-vetted pools only."
Description: "Every yield pool on mirro is analysed by AI before it appears. Unsustainable APYs and risky protocols are filtered out automatically."

### Section: "how it works" (anchor: #how-it-works)

Eyebrow: "how it works"
Four numbered steps in a vertical list, like zippies.xyz ritual section. Each step has:

- Step number in DM Mono, --text-muted, large (2rem)
- Heading in DM Sans 500
- Description in body text

Step 01: "Connect your wallet" — No sign-up. Connect any EVM wallet.
Step 02: "See the best APY for your tokens" — mirro reads your USDG, ETH, BTC, and SOL balances and shows the best available yield across all integrated protocols.
Step 03: "Deposit directly, or mirror a farmer" — Deposit into any pool in one click. Or follow a master farmer and mirror their entire strategy automatically.
Step 04: "Earn — and track everything in one place" — Your dashboard shows every pool balance, yield earned, and portfolio value in real time.

### Section: "supported assets"

Eyebrow: "assets"
Four asset names in a row, large DM Mono 500, --text-primary, separated by --border vertical lines:
USDG · ETH · BTC · SOL
Below each: "Yield farming across [N] protocols"
USDG: 6 protocols. ETH: 5 protocols. BTC: 4 protocols. SOL: 3 protocols.

### Section: "for farmers"

Eyebrow: "farmers"
Heading: "Publish your strategy. Earn from your alpha."
Body: "Register as a master farmer on mirro. Your farming moves are recorded on-chain. Followers mirror your strategy and you earn a performance fee — charged only on the alpha you generate above the mirro baseline."

Two inline stats: "Performance fee: your choice (0–20%)" and "Charged on alpha only"

[Become a farmer →] outline button, --accent

### Footer

Border-top 1px --border. Two columns: left has "mirro" logo text + tagline "yield, simplified." Right has links: App · Leaderboard · How it works. Below: "Built on Robinhood Chain · Powered by Paxos USDG" in DM Mono --text-muted 0.75rem.

---

## PART 2 — THE APP (route: /app and sub-routes)

### App Layout

Fixed sidebar 220px, --bg background, right border 1px --border.
Top of sidebar: "mirro" DM Sans 300, 1.3rem, left-padded 20px, margin-bottom 32px.
Nav items (lucide-react icons, DM Sans 400 0.875rem):

- Dashboard (LayoutDashboard icon) → /app
- Leaderboard (BarChart2 icon) → /app/leaderboard
- Portfolio (Wallet icon) → /app/portfolio
- My Farming (Sprout icon) → /app/my-farming

Active nav item: 2px left border --accent, --text-primary, --bg-surface background.
Bottom of sidebar: mock wallet display "0x4A3b...9f2C" in DM Mono 0.75rem --text-muted + a small green dot (connected state).

Main content area: --bg background, padding 32px, scrollable.

### APP PAGE 1 — Dashboard (/app)

Page heading: "Dashboard" DM Sans 500 1.25rem.

SECTION — "your tokens" (eyebrow label)
Shows user's wallet tokens and best available APY per token. This is the aggregator layer — the core product feature.

For each token, show the token name + balance on the left, then a list of protocols below it with APY and a Deposit button.

Mock data:

USDG $1,200.00
→ Pendle Fixed Pool · 9.4% APY · [AI ✓] · [Deposit]
→ Curve 3pool · 7.8% APY · [AI ✓] · [Deposit]
→ Aave USDG · 6.1% APY · [AI ✓] · [Deposit]

ETH $3,840.00
→ Lido Staking · 4.8% APY · [AI ✓] · [Deposit]
→ Rocketpool · 4.6% APY · [AI ✓] · [Deposit]
→ Aave ETH · 3.9% APY · [AI ✓] · [Deposit]

BTC $9,200.00
→ Pendle BTC Yield · 5.1% APY · [AI ✓] · [Deposit]
→ Aave BTC · 3.2% APY · [AI ✓] · [Deposit]

SOL $2,100.00
→ Marinade Staking · 7.2% APY · [AI ✓] · [Deposit]
→ Aave SOL · 4.1% APY · [AI ✓] · [Deposit]

Layout: each token is a collapsible row group. Token name + balance is the header. Protocol sub-rows are indented. Best APY row has "Best" label in --accent. [AI ✓] is a tiny badge (--profit border, no fill, 4px radius, 10px font). [Deposit] is a small --accent outline button. Clicking Deposit opens a simple modal.

SECTION — "your active pools" (eyebrow label)
Table: Protocol · Asset · Deposited · Current APY · Yield today · Total yield · Withdraw
Mock data:
Pendle Fixed Pool · USDG · $1,200.00 · 9.4% · +$0.31 · +$2.30 · [Withdraw]
Lido Staking · ETH · $1,920.00 · 4.8% · +$0.25 · +$0.84 · [Withdraw]
Aave BTC · BTC · $4,600.00 · 3.2% · +$0.41 · +$1.19 · [Withdraw]

SECTION — "mirroring" (eyebrow label)
Table: Farmer · Asset · Deposited · Farmer APY · Your APY · Alpha · Yield today · Stop
Mock data:
Momentum Stack · USDG · $500 · 11.4% · 10.26% · +4.3% · +$1.40 · [Stop]
DCA Machine · ETH · $200 · 9.8% · 9.31% · +4.4% · +$0.51 · [Stop]

### APP PAGE 2 — Leaderboard (/app/leaderboard)

Page heading: "Leaderboard"
Eyebrow: "top farmers"

Tagline inline: "Trade strategies, not just stocks." — DM Sans 300 italic, --text-secondary

Three inline stat blocks (separated by vertical border lines): Total TVL "$2.16M" · Active Farmers "8" · Total Mirrors "393"

Filter row: Sort dropdown (Alpha vs Baseline default / APY 30D / TVL / Followers / Mirrors) · Asset filter tabs (All / USDG / ETH / BTC / SOL) · Search input

Table columns: Rank · Farmer · Assets · APY 30D · Alpha · TVL · Followers · Mirrors · Fee · Actions

- Rank: DM Mono --text-muted
- Farmer: strategy name DM Sans 500, wallet address below in DM Mono 0.75rem --text-muted
- Assets: small pill badges per asset farmed
- APY 30D: DM Mono --profit
- Alpha: DM Mono, colored --profit or --loss with +/- prefix. This is the KEY metric.
- TVL: DM Mono --text-secondary
- Followers / Mirrors: DM Sans --text-secondary
- Fee: DM Mono --text-muted
- Actions: [Follow] outline + [Mirror] filled --accent, both small 4px radius

Mock data (sorted by Alpha desc):

1. Momentum Stack · USDG/ETH · 11.4% · +4.3% · $284k · 142 followers · 38 mirrors · 10%
2. DCA Machine · ETH/BTC · 9.8% · +4.4% · $723k · 134 followers · 67 mirrors · 3%
3. Steady Carry · USDG · 9.8% · +2.7% · $412k · 89 followers · 29 mirrors · 5%
4. Mag7 Rotator · USDG/SOL · 10.2% · +3.1% · $196k · 31 followers · 12 mirrors · 8%
5. Tech Surge · BTC/ETH · 8.9% · +1.8% · $88k · 22 followers · 9 mirrors · 15%
6. Swing Alpha · SOL · 7.8% · +0.7% · $167k · 43 followers · 15 mirrors · 12%
7. NVDA Focus · USDG · 8.1% · +1.0% · $54k · 18 followers · 4 mirrors · 10%
8. Mean Revert · ETH · 6.2% · -0.9% · $31k · 9 followers · 2 mirrors · 7%

Below the table, section eyebrow "recent moves" — a live feed:
Each row: [Farmer name (link)] · action text · [time ago]
8 rows of mock rebalance activity (e.g. "Momentum Stack moved 40% USDG Aave → Pendle · 2 min ago")
Rows where user is mirroring that farmer: small "mirroring" badge --accent.

### APP PAGE 3 — Farmer Profile (/app/farmer/[id])

Two-column layout: left 62%, right 38% sticky.

LEFT:
Display heading DM Sans 300 2rem: farmer name
Below: wallet address DM Mono --text-muted, copyable (copy icon from lucide)
Below: short bio DM Sans body --text-secondary
Asset badges showing what they farm

Four inline stat blocks (border-separated):
APY 90D Avg · Alpha vs Baseline · TVL Mirrored · Active Since

Performance chart (recharts AreaChart, 180px):
Two lines: farmer APY (--accent, 1.5px solid) and mirro baseline (--border, 1px dashed)
No grid, clean DM Mono axes. Legend: "Farmer APY" and "Baseline"
The gap between lines = alpha. This is the visual story.
Time tabs: 7D / 30D / 90D

Eyebrow "current allocation":
Shows where vault is deployed as a list:
45% · Pendle Fixed Pool · USDG · 9.8% APY
30% · Curve 3pool · USDG · 7.8% APY
25% · Aave lending · USDG · 6.1% APY
Blended APY: 8.20% | Baseline: 7.1% | Alpha: +1.1%
Each row has a thin left border bar representing allocation weight.

Eyebrow "rebalance history":
Table: Date · Move · APY Before · APY After · Reason
5 mock rows of farmer rebalance moves.

Eyebrow "followers":
"142 followers · 38 mirrors"
List of 5 recent follower addresses (truncated, DM Mono)

RIGHT (sticky panel, --bg-surface, 1px --border, 6px radius):
Farmer name heading.
Two full-width buttons stacked:
[Follow] — --border outline, --text-primary, free
[Mirror] — --accent filled, white text, opens mirror modal

Mirror modal:
"Mirror [Farmer Name]"
Asset selector tabs: USDG / ETH / BTC / SOL
Amount input full-width, DM Mono
Balance shown below input
Stats block:
Farmer APY: 11.4%
mirro baseline: 7.1%
Alpha: +4.3%
Perf. fee: 10% of alpha only
Your est. APY: 10.83%
Est. monthly yield: (calculated)
Est. annual yield: (calculated)
[Confirm Mirror] --accent button full-width

If already mirroring: show current position below a divider:
Deposited / Current Value / PnL / PnL%
[Stop Mirroring] --loss outline button

### APP PAGE 4 — Portfolio (/app/portfolio)

Portfolio header:
$14,267.32 — DM Sans 300, 2.2rem
+$143.50 today (+1.13%) — DM Mono --profit below

Time selector tabs: 1D / 7D / 30D / All

Line chart (recharts, 140px): portfolio value over 30 days. --accent line, no area fill, no grid. Clean DM Mono axes. Mock data: starts $14,000, ends $14,267.32, gentle upward curve with small dips.

Eyebrow "your pools":
Table: Protocol · Asset · Deposited · APY · Today · Total Yield · Withdraw
(same mock data as dashboard active pools)

Eyebrow "mirrored farmers":
Table: Farmer · Asset · Deposited · Farmer APY · Your APY · Alpha · Today · Actions
Actions: [Stop Mirroring] (--loss outline) [View] (--accent outline)
(same mock data as dashboard mirroring section)

Eyebrow "history":
Table: Protocol/Farmer · Asset · Type · Entry · Exit · Deposited · Returned · PnL
2 mock closed positions.

### APP PAGE 5 — My Farming (/app/my-farming)

Three tabs: "My Pools" · "Mirroring" · "I'm a Farmer"

My Pools tab: same as portfolio "your pools" table.
Mirroring tab: same as portfolio "mirrored farmers" table.
I'm a Farmer tab:
If not registered: centered text "You haven't registered as a farmer yet." + [Register as Farmer] --accent button.
Register modal: Farmer name input, bio textarea (max 120 chars), performance fee slider 0–20% default 10%, asset checkboxes (USDG/ETH/BTC/SOL), [Register] button.

If registered (mock: show registered state):
Stats row: Total TVL · Total Followers · Total Mirrors · Fees Earned
Current allocation display (editable)
Rebalance history table
[Execute Rebalance] button opens modal with: from protocol, to protocol, percentage, asset selectors.

### AI ASSISTANT (on every app page)

Fixed bottom-right button: 48px, 4px radius, --accent background, MessageCircle icon (lucide-react) white.

Clicking opens a drawer from the right: 360px wide, full height, --bg-surface, left border 1px --border.

Header: "mirro AI" DM Sans 500, subtitle "Ask anything about your pools or yield farming." --text-muted. × close button.

On first open, show 3 suggested question chips (--bg-elevated, 4px radius, DM Sans 0.8rem):
"Summarise my portfolio"
"What's the best pool for my USDG?"
"How does mirroring work?"

Messages: user right-aligned (--bg-elevated bg), AI left-aligned (no bg). Both DM Sans 0.875rem.

Input bar: full-width, --bg-elevated bg, --border border. Send button --accent, ArrowRight icon.

Use Anthropic API (claude-sonnet-4-6, max_tokens 500) with system prompt injected with mock portfolio context. Make real API calls — the API key will be added via environment variable VITE_ANTHROPIC_API_KEY.

---

## DO NOT:

- Use box-shadows anywhere
- Use gradients anywhere
- Use border-radius above 6px
- Use ALL CAPS for any labels
- Use Tailwind's shadcn default components style — keep the custom design system above
- Use placeholder lorem ipsum text
- Make "mirro" uppercase anywhere
- Add entrance animations or decorative motion

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/821bf5a3-38ef-471f-a2be-1d9d01950ec2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
