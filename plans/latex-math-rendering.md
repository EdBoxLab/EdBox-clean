# LaTeX/Math Rendering for Study Kit Notes

## Problem

Currently, mathematical symbols and Greek letters in study kit notes render as plain text (e.g., `x^2`, `sqrt(16)`, `pi`, `infinity`). This is not professional for educational content involving mathematics, physics, chemistry, or engineering.

## Best Options for Professional Math Typesetting

### Option 1: KaTeX (Recommended) ⭐

**Pros:**
- Fast and lightweight (~70KB gzipped)
- No external dependencies
- Excellent React integration via `react-katex`
- Supports most LaTeX syntax
- Server-side rendering possible

**Cons:**
- Slightly less comprehensive than MathJax (rare edge cases)

**Installation:**
```bash
npm install katex react-katex
npm install -D @types/katex
```

### Option 2: MathJax

**Pros:**
- Most comprehensive LaTeX support
- Handles complex edge cases
- Industry standard

**Cons:**
- Heavy (~500KB+)
- Slower rendering
- More complex React integration

### Option 3: remark-math + rehype-katex

**Pros:**
- Works directly with ReactMarkdown pipeline
- Clean integration with existing markdown setup

**Cons:**
- Additional build step complexity

## Recommended Solution: KaTeX with ReactMarkdown

### Architecture

```
Markdown Input
    ↓
ReactMarkdown (with remark-math plugin)
    ↓
Inline Math ($...$) → <InlineMath>
Block Math ($$...$$) → <BlockMath>
    ↓
KaTeX renders to HTML
    ↓
Professional typeset math in notes
```

### Implementation Plan

#### Phase 1: Install Dependencies

```bash
npm install katex react-katex remark-math rehype-katex
npm install -D @types/katex
```

#### Phase 2: Update page.tsx Imports

```typescript
// Add to existing imports
import 'katex/dist/katex.min.css';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
```

#### Phase 3: Update ReactMarkdown Configuration

**Current (line 1670-1787):**
```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{...}}
>
  {generatedContent.notes?.[activeNoteType] || 'No content...'}
</ReactMarkdown>
```

**Updated:**
```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
  components={{...}}
>
  {generatedContent.notes?.[activeNoteType] || 'No content...'}
</ReactMarkdown>
```

#### Phase 4: Configure KaTeX Options (Optional)

For better rendering, add configuration:

```typescript
const katexOptions = {
  throwOnError: false,
  strict: false,
  trust: true,
  displayMode: false,
  output: 'html',
  macros: {
    "\\R": "\\mathbb{R}",
    "\\N": "\\mathbb{N}",
    "\\Z": "\\mathbb{Z}",
  }
};
```

#### Phase 5: Update AI Templates (Optional Enhancement)

Update note templates in [`route.ts`](src/app/api/study-kit/generate/route.ts:13) to encourage LaTeX usage:

```typescript
// Add to each NOTE_TEMPLATES
**FORMATTING RULES:**
- Use LaTeX for mathematical expressions: $x^2 + 2x + 1$
- Use block LaTeX for equations: $$\int_0^1 x^2 dx$$
- Greek letters: $\alpha$, $\beta$, $\pi$, $\theta$
- Fractions: $\frac{a}{b}$
- Square roots: $\sqrt{x}$
- Summations: $\sum_{i=1}^n$
- Integrals: $\int_a^b$
```

## LaTeX Syntax Examples for AI Prompts

| Concept | Plain Text | LaTeX |
|----------|-------------|---------|
| Superscript | x^2 | $x^2$ |
| Subscript | x_1 | $x_1$ |
| Fraction | 3/4 | $\frac{3}{4}$ |
| Square root | sqrt(16) | $\sqrt{16}$ |
| Pi | pi | $\pi$ |
| Infinity | infinity | $\infty$ |
| Less than or equal | <= | $\leq$ |
| Greater than or equal | >= | $\geq$ |
| Not equal | != | $\neq$ |
| Summation | sum | $\sum$ |
| Integral | integral | $\int$ |
| Greek alpha | alpha | $\alpha$ |
| Greek beta | beta | $\beta$ |
| Greek theta | theta | $\theta$ |
| Greek sigma | sigma | $\sigma$ |

## File Changes Summary

| File | Change | Lines |
|------|--------|--------|
| `package.json` | Add dependencies | - |
| `src/app/(main)/tools/study-kit/page.tsx` | Add imports, update ReactMarkdown | ~1670-1787 |
| `src/app/api/study-kit/generate/route.ts` | Update templates (optional) | ~14-208 |

## Testing Checklist

- [ ] Inline math renders correctly: $x^2 + 2x + 1$
- [ ] Block math renders correctly: $$\int_0^1 x^2 dx$$
- [ ] Greek letters render: $\alpha$, $\beta$, $\pi$
- [ ] Fractions render: $\frac{a}{b}$
- [ ] Complex equations render properly
- [ ] No performance degradation
- [ ] Works on mobile devices
- [ ] Copy button still works with math content

## Alternative: Unicode Math Symbols (Fallback)

If LaTeX is too complex, a simpler approach is to use proper Unicode symbols:

```typescript
// In sanitizeMathText function (route.ts:228)
const mathMap: Record<string, string> = {
  'sqrt': '√', 'pi': 'π', 'infinity': '∞',
  'alpha': 'α', 'beta': 'β', 'theta': 'θ',
  'sigma': 'σ', 'delta': 'δ', 'lambda': 'λ',
  'mu': 'μ', 'nu': 'ν', 'omega': 'ω',
  'le': '≤', 'ge': '≥', 'ne': '≠',
  'plusminus': '±', 'times': '×', 'divide': '÷',
};
```

**Note:** This is less flexible than LaTeX but requires no additional dependencies.

## Recommendation

**Use KaTeX with remark-math** for the best balance of:
- Professional typesetting
- Performance
- Maintainability
- User experience

The implementation is straightforward and integrates cleanly with the existing ReactMarkdown setup.
