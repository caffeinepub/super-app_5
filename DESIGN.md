# Design Brief — Super App (Enhanced + Product Pages)

## Visual Direction
Modern, approachable, energetic. Multi-service discovery hub with clear category differentiation, personalized user experiences, and live cross-category search. Tone balances playfulness with functional clarity — inspired by unified platforms (Grab, Gojek).

## Tone & Aesthetic
Clean, card-based layout. Geometric sans-serif display font. Functional hierarchy through color and scale. New features layer naturally atop base design: user account integration via sticky header, live search via dropdown overlay, featured content via accent borders and badges.

## Color Palette
| Semantic | OKLCH (light) | OKLCH (dark) | Usage |
|----------|---------------|--------------|-------|
| Primary (Cyan) | 0.54 0.24 199 | 0.60 0.25 199 | Active states, focus rings, CTAs |
| Secondary (Orange) | 0.65 0.22 40 | 0.72 0.23 40 | Shop category accent |
| Accent (Purple) | 0.52 0.22 305 | 0.58 0.23 305 | Delivery category accent |
| Success (Green) | 0.68 0.21 142 | 0.72 0.22 142 | Service category accent |
| Background | 0.97 0 0 | 0.13 0 0 | Page background |
| Card | 0.99 0 0 | 0.16 0 0 | Elevated surfaces |
| Foreground | 0.15 0 0 | 0.95 0 0 | Text, primary content |
| Muted | 0.92 0 0 | 0.22 0 0 | Secondary text, disabled |
| Border | 0.92 0 0 | 0.25 0 0 | Dividers, card borders |

## Typography
| Layer | Font | Usage |
|-------|------|-------|
| Display | Bricolage Grotesque | Headlines, welcome message (bold, geometric) |
| Body | DM Sans | Body text, labels, search input |
| Mono | Geist Mono | Code, technical content (fallback) |

## Shape Language
- **Radius**: 12px (lg), 10px (md), 8px (sm) for inputs
- **Shadows**: Subtle elevation—`shadow-sm` (2px), `shadow-md` (4px)
- **Borders**: 1px solid, primary color on hover/focus

## Structural Zones
| Zone | Surface | Depth | Usage |
|------|---------|-------|-------|
| Header (sticky) | Card (white/dark-16) | Elevated | User avatar, login/logout, personalization |
| Search Bar | Input (94% light / 22% dark) | Base | Full-width with live results dropdown |
| Search Results | Card overlay | Floating | Dropdown with category badges (Shop/Delivery/Service) |
| Personalized Greeting | Primary/10–Secondary/10 gradient | Base | Entry point after header, dynamic text |
| Featured Section | Primary/5 with border-primary/20 | Elevated | Top of category pages, trending badge |
| Category Grid | Card (99% light / 16% dark) | Elevated | 1px border, hover shadow |
| Footer | Background | Base | Implied depth |

## Component Patterns
- **Category Card**: `rounded-lg border border-border bg-card p-6 hover:shadow-md`
- **Search Input**: `search-input` utility—icon-left, focus ring on primary
- **Featured Section**: `rounded-lg border-2 border-primary/20 bg-primary/5` with `featured-badge` (secondary bg)
- **Search Results**: dropdown with `search-result-item` (hover: bg-muted/50) and category `badge-{shop|delivery|service}`
- **User Header**: Sticky top with user avatar, name, login/logout button
- **Personalized Greeting**: Light gradient background (primary/10 to secondary/10), display font headline

## Motion
- Smooth transitions: `cubic-bezier(0.4, 0, 0.2, 1)`, 300ms default
- Hover: shadow lift on cards, border color shift to primary
- Search dropdown: fade-in 200ms, scale-in 200ms from top
- Featured badge pulse: optional 1s pulse on new trending items
- No animations on page load; entrance is immediate

## Responsive Design
- **Mobile** (sm): 1-column category grid, full-width search
- **Tablet** (md): 2-column grid, adjusted padding
- **Desktop** (lg): 3-column grid, wider container

## Product Page Architecture
| Component | Surface | Usage |
|-----------|---------|-------|
| Product Grid | 2-col mobile / 3-col tablet / 4-col desktop | Efficient product browsing |
| Product Card | Card with image hero, name, price overlay | Tap-to-details flow |
| Stock Badge | Inline; green (in-stock), orange (low), muted (out) | Inventory status signal |
| Breadcrumb | Sticky top on details page | Navigation anchor |
| Product Hero | Full-width mobile / half-width desktop | Hero image establishes scale |
| Details Panel | Right column desktop / below image mobile | Name, price, rating, description, CTA |
| Add to Cart | Sticky bottom mobile / inline desktop | Cart affordance |
| Cart Badge | Header right, red counter | Live item count |

## Signature Detail
Category buttons are distinct color accents tied to purpose (Shop=orange, Delivery=purple, Service=green). Cards lift on hover. Featured sections use subtle primary border + light background wash to signal importance without clutter. User account header persists, reinforcing personalization. Live search results tagged with category badges via color system (orange, purple, green). Product cards prioritize imagery; hover lifts reveal details. Stock status via color-coded badges (green=available, orange=low, grey=out). All interactive states (hover, focus, active) layer tertiary color shifts atop base palette — no gradients, max contrast.

## Constraints
- No arbitrary colors; use semantic tokens only
- No gradients beyond brand intent
- Maintain AA contrast in both light/dark modes
- Icons from lucide-react or system defaults
- Product images fill entire card height on mobile; half-width hero on details
