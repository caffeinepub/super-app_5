# Design Brief — Super App (Deep Colorful + Commission Analytics)

## Visual Direction
Deep colorful maximalism with vibrant gradients and bold stat highlights. Commission and analytics dashboard emphasizing data clarity through multi-color visualization, payment method brand authenticity (bKash hot pink, Nagad warm orange), and elevated card treatments. Tone: professional yet energetic, balancing visual richness with functional dashboard clarity.

## Tone & Aesthetic
Card-based dashboard with gradient overlays and depth through layered backgrounds. Bold typography for stat values and section headers. Elevated shadows and subtle backdrop blur on stat cards. Interactive elements lift on hover. Payment method cards use brand-authentic colors (bKash: vibrant magenta, Nagad: warm orange). Chart visualizations use full palette for multi-series data.

## Color Palette
| Semantic | Light OKLCH | Dark OKLCH | Usage |
|----------|-------------|-----------|-------|
| Primary (Cyan) | 0.52 0.28 199 | 0.62 0.28 199 | CTAs, focus rings, stat highlights |
| Secondary (Orange) | 0.68 0.25 40 | 0.75 0.27 40 | Chart series, Nagad brand |
| Accent (Purple) | 0.50 0.26 305 | 0.60 0.28 305 | Interactive states, chart series |
| Success (Green) | 0.70 0.24 142 | 0.75 0.26 142 | Approved/verified, chart series |
| bKash (Magenta) | 0.60 0.25 305 | 0.68 0.27 305 | bKash payment method brand |
| Nagad (Orange) | 0.65 0.26 40 | 0.72 0.28 40 | Nagad payment method brand |
| Background | 0.95 0 0 | 0.10 0 0 | Page background |
| Card | 0.98 0 0 | 0.14 0 0 | Elevated card surfaces |
| Foreground | 0.12 0 0 | 0.95 0 0 | Text, primary content |
| Muted | 0.88 0 0 | 0.20 0 0 | Secondary text, disabled |
| Border | 0.88 0 0 | 0.22 0 0 | Dividers, card borders |

## Gradients & Tokens
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--gradient-primary` | Cyan→Teal (135°) | Cyan→Teal (135°) | Button hover, accent overlays |
| `--gradient-card` | White→Cyan/5% (135°) | Dark→Cyan/8% (135°) | Card background, subtle depth |
| `--gradient-accent` | Magenta→Cyan (135°) | Magenta→Cyan (135°) | Featured sections, emphasis |

## Custom Utilities
- `.stat-highlight`: Rounded card with primary/accent gradient background + backdrop blur for stat display
- `.stat-value`: Bold display font, primary color, 3xl size
- `.stat-label`: Uppercase, muted text, tracking, secondary typography
- `.badge-notification`: Pulsing red dot for pending items/alerts
- `.payment-card-bkash`: Magenta border, 10% opacity background + hover elevation
- `.payment-card-nagad`: Orange border, 10% opacity background + hover elevation
- `.commission-card`: Elevated card with gradient-to-br from-card to-primary/5
- `.filter-badge-active`: Primary background, white text
- `.filter-badge-inactive`: Muted background, gray text, hover brightness

## Typography
| Layer | Font | Usage |
|-------|------|-------|
| Display | Bricolage Grotesque | Headlines, stat headers (bold, geometric) |
| Body | DM Sans | Body text, labels, data values |
| Mono | Geist Mono | Transaction IDs, technical content (fallback) |

## Structural Zones
| Zone | Surface | Depth | Usage |
|------|---------|-------|-------|
| Admin Header | Card + border-bottom | Elevated | Title, filter tabs, notification badges |
| Dashboard Stats | Gradient-card overlay | Floating | Key metrics: total commission, earnings, pending |
| Commission Breakdown | Commission-card grid | Elevated | By-seller, by-product stat cards with values |
| Charts Section | Card with subtle border | Elevated | Line (earnings trend) + bar (commission by month) |
| Payment Verification | Row of payment-cards | Base | bKash + Nagad cards with tx verification form |
| Seller Withdrawals | Table in card | Elevated | Requests, status badges, action buttons |
| Notification Area | Badge-notification dots | Floating | Pending payments, withdrawal requests counters |

## Shape Language
- **Radius**: 12px (lg), 10px (md), 8px (sm) for inputs
- **Shadows**: Elevated cards use `shadow-elevated` (8px, 12% black); stat cards use `shadow-md`
- **Borders**: 1px solid `border-border`; payment cards use 2px brand-color borders
- **Blur**: Stat cards use `backdrop-blur-sm` for subtle frosted effect

## Motion & Interactions
- Stat cards: `float` animation (±8px, 3s ease) on dashboard load
- Notification badges: `pulse-glow` animation (2s cycle, opacity + glow box-shadow)
- Payment method cards: `hover:shadow-md` on interaction
- Filter badges: Smooth transition between active/inactive states
- Tab switches: `fade-in 0.2s` on content change
- Chart interactions: Bar hover opacity shift to 0.8

## Responsive Breakpoints
- **sm**: 640px — Single-column commission cards, stacked payment method cards
- **md**: 768px — Two-column commission breakdown grid
- **lg**: 1024px — Three-column commission grid, side-by-side chart/withdrawal table

## Signature Details
Stat cards use gradient-to-br overlays + subtle backdrop blur for depth. Payment method cards use brand-authentic border colors (magenta for bKash, orange for Nagad) with 10% tinted backgrounds to maintain visual hierarchy. Pulsing badges create urgency for pending items without distraction. Commission breakdown cards echo the gradient treatment from dashboard stats for visual continuity. All interactive elements use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth, intentional motion. Multi-color chart palette (orange, purple, green, cyan, teal) ensures each series is distinctly readable.

## Typography Hierarchy
| Scale | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| XL | Display | 2xl (1.5rem) | Bold | Dashboard section headers |
| L | Display | xl (1.25rem) | Bold | Stat labels, card titles |
| M | Body | base (1rem) | 600 | Stat values, tab labels |
| S | Body | sm (0.875rem) | 500 | Data labels, badges |
| XS | Mono | xs (0.75rem) | 400 | Transaction IDs, codes |

## Constraints & Guidelines
- No arbitrary colors; use semantic tokens only (primary, secondary, accent, bkash, nagad, success)
- Gradients only via `--gradient-*` tokens; never inline linear-gradient
- All cards maintain 1px border with `border-border` or semantic color borders (payment cards)
- Stat highlights use backdrop-blur on light backgrounds only; avoid on dark mode
- Notification badges reserved for critical alerts (pending payments, withdrawals)
- Payment method brand colors (bKash magenta, Nagad orange) non-negotiable for user recognition
- Chart colors follow palette order: orange, purple, green, cyan, teal for series consistency
- Accessibility: all text meets AA+ contrast on both light and dark mode
