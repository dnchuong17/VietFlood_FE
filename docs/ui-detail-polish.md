# FE detail polish — verification

## Scope

Applied the approved expressive blue/teal detail system to `VietFlood_FE` only. Mobile and backend repositories were not edited. Existing API payloads, roles, self-edit restrictions, authentication/navigation handlers and native delete confirmation remain in place.

Reference: `nextlevelbuilder/ui-ux-pro-max-skill`, revision `b7d5353e0130feb8c5574ef1251f8a1db1873ccb` (also confirmed against upstream HEAD during completion). Consulted the skill and relevant accessibility, dropdown focus, motion, icon and Next.js searches. See `DESIGN.md` for the design contract and provenance.

## Delivered details

- Shared surface, border, elevation, radius, motion and 16/20/24px outline-icon tokens.
- Consistent 44px controls and 48px map controls; hover/pressed/disabled and visible keyboard-focus states.
- Responsive navigation with actual reserved header space and active-route treatment.
- Six-layer weather menu with selection indication, Arrow/Home/End navigation, Escape/Tab/outside dismissal and focus restoration; separate weather statistics toggle retained.
- Portalled column filter/sort popovers positioned inside the visual viewport and outside table clipping.
- User summary cards, table, role badges, pagination and profile fields. Detail dialog has internal scrolling, focus containment/restoration, background inertness and safe long-Vietnamese text wrapping. Native province select preserves unknown stored values.
- Login card elevation, fields, password visibility, autocomplete, loading and error feedback.
- Purposeful entrance/press motion and reduced-motion overrides; light color scheme remains explicit rather than introducing an untested dark theme.

## Commands and results

Executed locally on November 7, 2026:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed; `/`, `/dang-nhap`, `/tong-quan`, `/trang-chu` generated |
| `npm run qa:ui -- --base-url http://localhost:3100` | 22 cases passed, 0 failed |

Final browser output:

```json
{"cases":22,"passed":22,"failed":0,"unexpectedRequests":0,"pageErrors":0,"hydrationErrors":0}
```

The browser suite covers all three screens at 375, 768, 1024 and 1440px; document overflow and header clearance; all weather layers and weather-table toggle; keyboard menu navigation/dismissal; filter/sort/pagination and filtered-empty behavior; explicit popover-close focus restoration; profile editing and province selection; denied editing of another account; cancellation of native delete confirmation without issuing DELETE; modal focus containment; mobile dialog scrolling and long Vietnamese/legacy province values; password visibility; login loading/error, successful login/logout and denied-role handling; loading/error/empty user lists; reduced motion and landscape under a dark OS preference.

## Evidence

Final run: `docs/qa-results/2026-11-07T15-14-30-770Z/`.

- `results.json`: complete machine-readable results and fixture request inventory.
- `tong-quan-1440.png`: populated desktop users screen.
- `dang-nhap-375.png`: mobile login.
- `map-dropdown-mobile.png`: keyboard-focused weather-layer menu.
- `table-dropdown-mobile.png`: portalled column filter on a horizontally scrolled table.
- `user-dialog-desktop.png`, `user-dialog-mobile.png`: profile detail.
- `user-dialog-long-vietnamese-mobile.png`: long text with internal scrolling and visible action footer.
- Additional viewport, loading, empty, error and reduced-motion screenshots are in the same directory.

Screenshots were visually inspected for hierarchy, control/icon alignment, borders, radii, popup placement, text wrapping and action visibility. The long-name dialog initially split ordinary Vietnamese words; this was corrected to natural wrapping with a shrinkable heading container and the suite rerun. Dropdown close focus restoration also passes React lint after moving DOM focus into an effect. The Windy fixture explicitly declares UTF-8 and screenshots wait for its labelled content.

## Fixture/live boundaries

Browser evidence is **fixture-backed**, not proof of live backend or live Windy availability. The suite intercepts `/auth/*`, supplies synthetic `.test` accounts and a visibly labelled Windy placeholder, blocks undeclared external requests and never submits account writes to a real API. Production backend connectivity, real credentials, real weather data, Safari/Firefox and production deployment were not verified. This is not a full WCAG certification.

## Repeat

```sh
npm run dev -- --port 3100
# In another terminal:
npm run qa:ui -- --base-url http://localhost:3100
```

The runner only accepts loopback origins. Optional `QA_OUTPUT` chooses the evidence folder.

## Repository preservation

No commits, staging, reset or cleanup performed. The pre-existing staged deletions of `.gitignore` and `README.md`, and the already-untracked application tree, were left as found. Generated QA evidence remains available for review.
