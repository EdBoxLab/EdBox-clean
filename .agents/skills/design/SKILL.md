---
name: EdBox Design & UI Principles
description: Core styling, branding, and UI guidelines for the EdBox application. Use this skill whenever creating or modifying UI components.
---

# EdBox Design & UI Principles

This document contains the definitive styling and branding principles for EdBox. Always refer to these guidelines when building new UI components or modifying existing ones.

## 1. Brand Identity & Vibe: Apple-Level Craftsmanship
- **Brand Essence**: "Learning that works"
- **Brand Promise**: "You'll actually understand this"
- **Design Philosophy (Steve Jobs / Apple Level)**: The UI must be breathtakingly premium, ruthlessly minimalist, and hyper-focused on the user. Do not settle for "good enough" or generic layouts. Every padding, border, and shadow must be meticulously chosen. Imagine you are designing the next flagship Apple product: zero clutter, absolute clarity, and an immediate emotional impact of high quality.
- **Personality**: Clear (no fluff), Effective (gets results), Smart (adapts), Honest (no hype).
- **Core Concept**: The UI should facilitate understanding, not just consumption. A stunning interface builds immediate trust.

## 2. Color System
EdBox uses a precise set of colors configured via OKLCH in `globals.css` and standard hexes where applicable.
- **Primary Theme**: Defaults to Dark Mode (`oklch(0.14 0.02 240)` background). It should feel like a premium dark mode (think Xcode or pro Apple software).
- **Primary Colors**: 
  - Blue (`#3B82F6` / `oklch(0.6 0.18 250)`): Clarity, learning, trust. Main actions, headers.
  - Purple (`#8B5CF6` / `oklch(0.6 0.18 300)`): Intelligence, AI, depth. AI features.
- **Backgrounds**: Pure white `bg-white`, soft contrast `#F8FAFC`, dark mode `#0F172A` / `oklch`.
- **Text Layers**:
  - Primary Content: `#0F172A`
  - Secondary (Supporting): `#64748B`
  - Muted (Subtle info): `#94A3B8`
- **Feedback Variables**: Success (`#10B981`), Warning (`#F59E0B`), Error (`#EF4444`).

## 3. STRICT RULE: NO GRADIENTS
- **DO NOT USE GRADIENTS.** 
- The brand identity strictly forbids generic gradients. Gradients cheapen the Apple-level aesthetic we are aiming for. 
- Use solid, crisp colors with subtle opacity layers instead (e.g., `bg-primary/10`).
- The ONLY exception is if a specific, pre-existing CSS animation (`animate-gradient-xy`) is explicitly required by the user for a hero element. Otherwise, consider gradients completely banned.

## 3. Typography & Spacing
- **Font**: Inter (`var(--font-sans)`) as the primary sans-serif.
- **Headings**: Use 600-700 weight with tight line-heights.
- **Body Text**: Use 400-500 weight with relaxed line-heights for readability.
- **Emphasis**: Semantic bolding (600 weight) + primary brand colors.
- **Spacing Units**: Base unit is 4px (`space-1`), moving up to 16px (`space-4`), 24px (`space-6`), 32px (`space-8`), etc.

## 5. UI Components & Shapes (Tailwind / CSS)
- **Cards**:
  - Background: White (or Theme Card `var(--card)`)
  - Border Radius: `rounded-2xl` (16px) or `rounded-xl`.
  - Padding: Typically `p-8` (32px).
  - Borders: Subtle `1px solid rgba(148, 163, 184, 0.1)`. This creates a premium, glass-like edge.
  - Hover States: Hover state must elevate the card (`box-shadow: 0 12px 24px rgba(0,0,0,0.1)`) with a fluid transition (`transition-all duration-300 ease-out`).
- **CTAs & Buttons**:
  - Background: Solid primary color. **NO GRADIENTS**.
  - Text: White, font-weight 600 (semibold), 18px text.
  - Hover Effect: Buttons must feel alive. `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200`.
- **Scrollbars**: Use utilities like `hide-scrollbar`, `no-scrollbar`, or `custom-scrollbar` to keep the UI clean. Apple products hide ugly scrollbars; so do we.

## 6. Global CSS Variables (`globals.css`)
- Heavily utilizes CSS variables (`--background`, `--foreground`, `--primary`, etc.) mapped to Tailwind via OKLCH. 
- Use semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-card`, etc.) instead of hardcoding colors.

## 7. General Best Practices: "Make it come alive"
- **Apple-Level Polish**: Every screen must look like a landing page. It shouldn't look like a dashboard; it should look like a crafted software experience.
- **Micro-Animations (Crucial)**: Elements MUST come to life when interacted with. Use `transition-all duration-300 ease-out`. 
  - Add `group-hover` effects so children elements react when a parent card is hovered.
  - Make icons scale up slightly (`hover:scale-110`) or shift colors.
  - Use `active:scale-95` on click targets so they feel physical and tactile.
- **Ruthless Minimalism**: Do not add bloat or jargon. If an element doesn't absolutely need to be there, remove it. Give content room to breathe with large padding and margins (`p-8`, `gap-6`).
- **Accessibility & Focus**: Ensure high contrast for text. Outline interactive elements properly using `focus-visible:ring`.
