---
name: EdBox Design & UI Principles
description: Core styling, branding, and UI guidelines for the EdBox application. Use this skill whenever creating or modifying UI components.
---

# EdBox Design & UI Principles

This document contains the definitive styling and branding principles for EdBox. Always refer to these guidelines when building new UI components or modifying existing ones.

---

## 1. Design Thinking — Before You Write a Single Line

Before coding any component, stop and answer these questions:

| Question | Why it matters |
|---|---|
| **Purpose** — What problem does this surface solve? Who uses it? | Prevents "dashboard-itis": building generic boxes instead of purposeful tools. |
| **Tone** — Where does this component sit on the spectrum? (Clinical data display ↔ Celebratory achievement moment ↔ Calm reading flow) | EdBox spans tutoring, analytics, and gamification — the tone shifts per context. |
| **Memorable detail** — What is the ONE thing a user will remember? | This forces a design anchor: a satisfying animation, a clever empty-state, an unexpected layout. |
| **Constraints** — Framework (React/Next.js), performance budget, accessibility targets. | Ground the ambition in reality. |

> **CRITICAL**: Choose a clear conceptual direction for the component and execute it with precision. Bold maximalism on a celebration screen and refined minimalism on a settings page both work — the key is *intentionality*, not uniform intensity.

---

## 2. Brand Identity & Vibe: Apple-Level Craftsmanship

- **Brand Essence**: "Learning that works"
- **Brand Promise**: "You'll actually understand this"
- **Design Philosophy**: The UI must be breathtakingly premium, ruthlessly minimalist, and hyper-focused on the user. Do not settle for "good enough" or generic layouts. Every padding, border, and shadow must be meticulously chosen. Imagine you are designing the next flagship Apple product: zero clutter, absolute clarity, and an immediate emotional impact of high quality.
- **Personality**: Clear (no fluff), Effective (gets results), Smart (adapts), Honest (no hype).
- **Core Concept**: The UI should facilitate *understanding*, not just consumption. A stunning interface builds immediate trust.

---

## 3. Color System

EdBox uses a precise set of colors configured via OKLCH in `globals.css`.

- **Primary Theme**: Defaults to Dark Mode (`oklch(0.14 0.02 240)` background). It should feel like a premium dark mode (think Xcode or pro Apple software).
- **Primary Colors**:
  - Blue (`#3B82F6` / `oklch(0.6 0.18 250)`): Clarity, learning, trust. Main actions, headers.
  - Purple (`#8B5CF6` / `oklch(0.6 0.18 300)`): Intelligence, AI, depth. AI features.
- **Backgrounds**: Soft contrast `#F8FAFC` (light), dark mode `#0F172A` / `oklch`.
- **Text Layers**:
  - Primary Content: `#0F172A` (light) / `oklch(0.98 0.01 240)` (dark)
  - Secondary (Supporting): `#64748B`
  - Muted (Subtle info): `#94A3B8`
- **Feedback Variables**: Success (`#10B981`), Warning (`#F59E0B`), Error (`#EF4444`).
- **Palette discipline**: Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Lean into the blue/purple primaries and let neutral surfaces recede.
- Use semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-card`, etc.) via `globals.css` variables instead of hardcoding colors.

### STRICT RULE: NO GRADIENTS

- **DO NOT USE GRADIENTS.**
- The brand identity strictly forbids generic gradients. Gradients cheapen the Apple-level aesthetic we aim for.
- Use solid, crisp colors with subtle opacity layers instead (e.g., `bg-primary/10`).
- The ONLY exception is if a specific, pre-existing CSS animation (`animate-gradient-xy`) is explicitly required by the user for a hero element. Otherwise, consider gradients completely banned.

---

## 4. Typography & Spacing

### Font Strategy

EdBox's primary font is **Geist Sans** (`var(--font-geist-sans)` / `var(--font-sans)`), and its monospaced counterpart is **Geist Mono** (`var(--font-geist-mono)` / `var(--font-mono)`).

- **Headings**: Weight 600–700, tight line-heights (`leading-tight`). Use tracking adjustments (`tracking-tight`) on large headings for polish.
- **Body Text**: Weight 400–500, relaxed line-heights (`leading-relaxed`) for readability.
- **Emphasis**: Semantic bolding (600 weight) + primary brand colors.
- **Code/Data**: Use `font-mono` for numerical data, code snippets, and statistics to add precision feel.

### Spacing

- **Base unit**: 4px (`space-1`).
- **Component padding**: Typically `p-6` to `p-8` for cards. Use generous spacing — content needs room to breathe.
- **Layout gaps**: `gap-4` for tight groups, `gap-6` for sections, `gap-8`+ for page-level separation.
- Prefer Tailwind's spacing scale and stay consistent within a component.

### Anti-Patterns (Typography)

- ❌ Never use generic system fonts (Arial, Helvetica, Times New Roman).
- ❌ Never hardcode `font-family` — always use the CSS variable system.
- ❌ Don't mix too many font weights in one component. Pick 2–3 weights max.

---

## 5. Motion & Micro-Animations — "Make It Come Alive"

Motion is not decoration — it communicates state, draws attention, and makes the interface feel physical. But it must be choreographed, not scattered.

### Principles

1. **One hero moment per view**: A well-orchestrated page load with staggered reveals (`animation-delay`) creates more delight than scattered micro-interactions everywhere.
2. **Interaction feedback is mandatory**: Every clickable element must respond to hover and active states. The user should never wonder "is this interactive?"
3. **CSS-first**: Prefer CSS transitions and animations over JS-driven animation libraries for performance and simplicity.

### Required Patterns

| Interaction | Implementation |
|---|---|
| **Card hover** | `hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-out` |
| **Button press** | `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200` |
| **Icon hover** | `hover:scale-110 transition-transform duration-200` with optional color shift |
| **Parent→child reaction** | Use `group` on parent, `group-hover:text-primary group-hover:translate-x-1` on children |
| **Page-load entrance** | Staggered `animate-in fade-in slide-in-from-bottom-4` with increasing `animation-delay` per element |
| **Focus ring** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

### Anti-Patterns (Motion)

- ❌ Animation on every single element — it creates noise, not delight.
- ❌ `duration-500`+ on frequent interactions — feels sluggish. Keep hover/click responses ≤ 300ms.
- ❌ `transition: all` on complex components with many changing properties — causes layout thrashing. Be specific: `transition-transform`, `transition-shadow`, etc.

---

## 6. Spatial Composition & Layout

Great layout is what separates "functional" from "designed". EdBox's layouts should feel intentional.

### Principles

- **Asymmetry over symmetry**: Not every layout needs to be a centered grid. Offset elements, vary column widths, break the grid occasionally for visual interest.
- **Negative space is a feature**: Generous whitespace around key content signals premium quality. Don't fill every pixel.
- **Visual hierarchy through scale**: Important numbers/metrics should be noticeably larger than supporting text. Use a clear size ladder (e.g., `text-4xl` → `text-sm` → `text-xs`).
- **Density is contextual**: Data-heavy views (analytics, tables) can be denser than narrative views (onboarding, empty states).

### Cards (Primary Surface)

- Background: Theme Card (`var(--card)`)
- Border Radius: `rounded-2xl` (16px) or `rounded-xl`.
- Padding: `p-6` to `p-8` (24–32px).
- Borders: Subtle `border border-border/50` or `1px solid rgba(148, 163, 184, 0.1)`. This creates a premium, glass-like edge.
- Hover: Elevation shift with shadow + translate (see Motion section).

### Backgrounds & Depth

Instead of flat solid backgrounds, create subtle atmosphere:

- **Layered opacity**: `bg-primary/5`, `bg-accent/10` for tinted surface areas.
- **Subtle borders**: Use `border-border/30` to `border-border/50` for separation without hard lines.
- **Shadow layers**: Combine `shadow-sm` base with `hover:shadow-lg` for interactive depth.
- **Noise/texture (sparingly)**: For hero sections or special areas only — a barely-visible noise overlay can add tactile depth to dark surfaces.
- ⚠️ Remember: **NO GRADIENTS**. Use opacity layers and multiple solid surfaces instead.

---

## 7. UI Components

### Buttons & CTAs

- Background: Solid primary color. **NO GRADIENTS.**
- Text: White, `font-semibold`, appropriate size.
- Hover: `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200`.
- Destructive buttons use `bg-destructive` with the same interaction patterns.

### Scrollbars

Use utilities like `hide-scrollbar`, `no-scrollbar`, or `custom-scrollbar` to keep the UI clean. Apple products hide ugly scrollbars; so do we.

### Empty States

Empty states are design opportunities, not afterthoughts. Use:
- A relevant icon or illustration (use `generate_image` if needed).
- A short, encouraging message in `text-muted-foreground`.
- A clear CTA to guide the user's next action.

### Data Visualization

Charts and graphs should feel native to the dark theme:
- Use the `--chart-1` through `--chart-5` OKLCH variables.
- Avoid chartjunk: no unnecessary gridlines, legends only when needed, direct labels over legends when possible.
- Animate data on first render for a polished entrance.

---

## 8. Anti-Slop Checklist

Before submitting any UI work, run through this checklist. If any item is true, go back and fix it.

| ❌ Red Flag | ✅ Fix |
|---|---|
| Uses Inter, Roboto, Arial, or system fonts | Use `var(--font-sans)` (Geist Sans) |
| Purple/blue gradient on white background | Solid colors with opacity layers. No gradients. |
| Generic card grid with no hierarchy | Vary card sizes, add featured/hero cards, use asymmetry |
| Every element has the same text size | Establish clear typographic scale within each component |
| No hover/active states on interactive elements | Add motion patterns from Section 5 |
| Flat, lifeless dark mode (just dark gray boxes) | Add subtle border glow, shadow depth, opacity-tinted surfaces |
| Placeholder images or "Lorem ipsum" | Use `generate_image` for real assets; write real copy |
| Cookie-cutter layout identical to every other dashboard | Add one memorable design detail per component |

---

## 9. General Best Practices

- **Apple-Level Polish**: Every screen must look like a landing page. It shouldn't look like a dashboard; it should look like a crafted software experience.
- **Ruthless Minimalism**: If an element doesn't need to be there, remove it. Earn every pixel.
- **Accessibility**:
  - Ensure high contrast for text (WCAG AA minimum).
  - Use `focus-visible:ring` for keyboard navigation.
  - Add `aria-label` on icon-only buttons.
  - Ensure color is never the only indicator of state.
- **Responsive**: Test against mobile (375px) breakpoints. Use the `feed-card` responsive utilities in `globals.css` for small-screen card layouts.
- **Performance**: Prefer CSS animations over JS. Lazy-load heavy components. Keep bundle impact in mind.
