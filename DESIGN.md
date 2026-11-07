# VietFlood Insight — expressive detail system

## Scope and provenance

UI polish for the existing Next.js 16.1.6 / React 19 / Tailwind 4 frontend only. No new data models, backend/mobile edits, routes, authorization policies or dark-mode feature. The user chose a **more expressive** treatment: stronger shadows, larger rounding and noticeable, purposeful motion.

Reference: nextlevelbuilder/ui-ux-pro-max-skill, revision `b7d5353e0130feb8c5574ef1251f8a1db1873ccb`. Consulted `.claude/skills/ui-ux-pro-max/SKILL.md`, `references/quick-reference.md` and `references/pro-rules.md` (native-only recommendations not treated as web requirements). Reviewed search entrypoint/core before executing local queries.

Verified targeted searches:
- `keyboard focus dropdown --domain ux`: visible focus and focus-not-obscured guidance. Apply offsets, dismissal and focus restoration.
- `reduced motion animation --domain ux`: reduced-motion preference, avoid excessive motion, context-specific timing.
- `layers weather icon --domain icons`: no match. Retried `icon button accessible label --domain icons`: contextual semantics/outline-family guidance. Weather glyphs are local consistent outline SVGs, not falsely attributed library assets.
- `client interactive components --stack nextjs`: keep client boundaries at interactive components. Guidance references 16.2; only already-compatible App Router conventions applied to installed 16.1.6.

## Visual contract

- **Identity:** sky blue primary `#0369a1` with teal `#0f766e`; white surfaces, slate canvas and dark slate text. Semantic danger/warning/success retain meaning and text labels.
- **Radii:** controls 12px, floating panels 18px, cards/dialogs 24px. Pills reserved for small status markers, not every button.
- **Elevation:** resting surface, floating control/popover, modal. Layered shadows use blue-slate tint; borders remain visible independent of shadows.
- **Icons:** one local outline vocabulary, viewBox 24, stroke 1.8; rendered at 16/20/24px. Decorative SVGs hidden, icon controls named. Touch-friendly 44px hit targets, map controls 48px.
- **Motion:** feedback 180ms, overlay entrance 260ms, page/card entrance 420ms; decelerating curve. Only opacity/transform entrance; no layout animation, perpetual decorative animation, blocking choreography or GSAP dependency. Reduced-motion disables movement.
- **Layout:** reserve real header height (80px, 76px narrow). Dynamic viewport shell and local scrollers; tables may scroll horizontally without scrolling the document. Popovers escape table clipping and fit the viewport.
- **Typography:** retain Be Vietnam Pro and Merriweather. Minimum 16px form text, 14px control/data text, 12px metadata. Preserve Vietnamese diacritics, long content and numerical alignment.

## Interaction contract

- Existing API/state/permissions remain authoritative. Empty, loading, error and filtered-empty states must reflect actual collection state.
- Overlay menu: all six existing weather layers; selection check, arrow/Home/End navigation, Escape/outside dismissal and focus restoration. Weather-table visibility stays a separate toggle.
- Column filters/sorting: reusable accessible portalled control, no scroll-container clipping, preserving immediate filter semantics.
- User detail: safe height and internal scrolling, focus containment/restoration, labeled fields, busy-state dismissal guards. Province select remains native and preserves unknown values.
- Login: retain autocomplete/paste and submission handler; consistent labels, focus, password toggle and loading/error feedback.

## Repository preservation

Baseline: source and package/config files were already untracked; `.gitignore` and `README.md` had staged deletions, with an untracked README present. Leave those states untouched. Baseline `npm run lint` passed. No commit or reset authorized.

## Acceptance

See `docs/ui-detail-polish.md` for fresh commands, fixture/live boundaries and screenshot evidence. Visual polish is not a claim of new AI/business capability or production/native verification.
