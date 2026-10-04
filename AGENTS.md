<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture decisions

- Keep mirro’s supplied mock financial domain data centralized in `src/lib/mirro-data.ts` so every route renders consistent figures.
- Use a pathless `/app` layout route for the fixed navigation and global AI drawer so all app pages share one responsive shell.
- Persist one AI conversation per authenticated wallet identity in Lovable Cloud; keep model credentials and portfolio context server-side.
