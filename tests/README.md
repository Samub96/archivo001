# Tests

Two layers, no test framework: a small assertion helper per layer keeps the
dependency count low, which is a hard constraint of the project.

```
npm run test:unit        # logic, data and persistence contracts (Node)
npm run test:e2e         # build + preview + browser playthrough
npm run test:e2e:fast    # same, reusing the current dist/
npm test                 # unit + e2e
```

## `tests/unit` — what it proves

`index.ts` is bundled with esbuild and executed by Node. A `localStorage`
shim is installed by `run.mjs` so the Zustand persist middleware runs exactly
as it does in the browser.

| Area | Checks |
|------|--------|
| Validation | trim, case, accents, inner spaces, empty input |
| Catalogue | 8 protocols, unique ids, three hints each, fragments rebuild the message |
| **Answers derived from the published content** | Caesar shift, binary/ASCII, logic-gate evaluation, square pattern, Morse table, Polybius coordinates, Vigenère with key `RED` |
| Routing | published edges match the code graph, Dijkstra minimum is 13, brute force confirms the minimum is unique, invalid/suboptimal routes are rejected |
| Persistence | `sanitize` truncates to a contiguous prefix, re-derives the RED key, clamps hints, revokes a forged final reveal, rejects corrupt payloads |
| Store actions | sequential unlock, route protocol refuses typed answers, hints capped at three, canonical order required to reveal |
| Spoiler guard | the final message never appears in a protocol body, hint, or README |

The point of the "answers derived from content" block is that the test does not
trust the `answer` field: it recomputes the solution from the puzzle text.

## `tests/e2e` — what it proves

`run.mjs` builds the app, serves `dist/` with `vite preview` on port 5199 and
runs both suites with `playwright-core` against `/usr/bin/google-chrome`
(override with `CHROME_PATH`). The server is torn down afterwards.

`playthrough.mjs` — 63 checks over the whole game: boot, access, briefing,
dashboard, the eight protocols, hints, wrong answers, the topology walk, the
reconstruction animation, the final reveal, persistence across reloads and the
reset dialog. It also asserts that the final message is **not** in the DOM
before the eighth fragment is ordered.

`responsive.mjs` — 29 checks at 390/768/1024/1280 px: no page-level horizontal
overflow on any screen, the routing topology scrolls inside its own panel, the
response field is 16px on phones (prevents iOS focus zoom), and the final
screen fits at 390px.

## Adding a check

Append to `check(name, condition)` in the relevant file. Keep the name in
English, describe the behaviour (not the implementation) and keep the
assertion on observable output — text, ARIA roles, computed style, persisted
state.
