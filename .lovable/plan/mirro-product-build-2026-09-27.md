# mirro product build

## Goal

Build the complete lowercase **mirro** product: a warm editorial landing page at `/`, a five-page yield-farming app under `/app`, farmer detail pages, working mock interactions, charts, and a real streaming AI assistant.

## Product structure

- **Landing page:** fixed top bar, centered editorial introduction, feature grid, four-step workflow, supported assets, farmer invitation, and footer. All links and scroll actions will work.
- **Shared app shell:** fixed desktop sidebar, compact mobile navigation, connected-wallet indicator, scrollable content area, and the AI assistant available on every app page.
- **Dashboard:** collapsible token opportunities, deposit dialog, active-pool table, and mirrored-farmer table.
- **Leaderboard:** sorting, asset filtering, search, farmer links, follow/mirror actions, totals, and recent-move feed.
- **Farmer profile:** strategy details, responsive performance chart, allocation, history, followers, sticky action panel, copyable wallet address, and a calculating mirror dialog.
- **Portfolio:** total-value history chart, time selectors, active positions, mirrored farmers, and closed-position history.
- **My Farming:** three working tabs, registered-farmer view, allocation/history, registration dialog, and rebalance dialog.

## Unified visual system

- Replace template styling with the supplied warm off-white palette and semantic tokens.
- Load DM Sans and DM Mono in the document head.
- Use strict editorial spacing, compact data typography, 1px borders, maximum 6px corners, no shadows, no gradients, no entrance motion, and lowercase section labels.
- Keep numeric values monospaced and right-aligned; consistently distinguish profit, loss, muted, and accent states.
- Preserve the reference’s content-led density while making wide tables usable on small screens through deliberate horizontal scrolling and condensed navigation.

## Interaction and data

- Centralize the supplied mock pools, farmers, activity, allocation, and chart series so every page stays consistent.
- Implement local UI behavior for collapse, filters, tabs, follow states, deposit/withdraw/stop actions, wallet copying, dialogs, sliders, and calculated mirror estimates.
- Use URL-backed farmer profiles and real navigation between the leaderboard, profile, portfolio, and farming views.

## AI assistant

- Use one session-only conversation with no saved history, since persistence and threads were not requested.
- Build the transcript and composer from AI Elements, render assistant output as markdown, and stream responses in the drawer.
- Keep the system prompt, portfolio context, and credential server-side through Lovable Cloud and Lovable AI Gateway.
- Verify the requested Claude model against the live model catalog before the call. Preserve that model if supported; if the exact requested identifier is unavailable, surface the gateway’s safe error rather than silently substituting another model.
- Handle loading, stop, rate-limit, credit, access-denial, and configuration errors explicitly.

## Technical details

- Add route files for `/app`, `/app/leaderboard`, `/app/portfolio`, `/app/my-farming`, and `/app/farmer/$id`, plus a streaming `/api/chat` endpoint.
- Add focused shared files for the app shell, common financial tables/dialogs, chart data, and AI drawer rather than duplicating full pages.
- Use existing TanStack Router, Recharts, Lucide, and Radix primitives; install AI SDK, the model provider, markdown support, and required AI Elements source components.
- Give every content route unique title, description, Open Graph title/description/type, and Twitter card metadata.
- Record the new route/data/component boundaries in the project architecture notes.

## Validation

- Verify the preview at desktop and mobile widths, including navigation, modals, table overflow, chart rendering, chat opening, a real streamed response, and the landing-to-app flow.
- Check the generated build diagnostics, full typecheck/build, and lint; resolve any existing or introduced errors before completion.
