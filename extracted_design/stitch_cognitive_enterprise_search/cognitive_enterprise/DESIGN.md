---
name: Cognitive Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#00190e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301e'
  on-tertiary-container: '#00a472'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-margin: 32px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-stakes enterprise environments where clarity, security, and intelligence are paramount. The visual language follows a **Corporate Modern** aesthetic—blending the reliability of traditional finance platforms with the fluid, forward-thinking nature of AI technology. 

The core personality is **Intelligent and Secure**. To achieve this, the UI utilizes a structured hierarchy, generous whitespace, and a "low-friction" interface that avoids unnecessary visual noise. The emotional response should be one of absolute confidence and professional mastery over complex data.

## Colors

The palette is anchored in **Deep Slate (#1E293B)** to establish authority and trust. **Intelligence Blue (#3B82F6)** serves as the primary action color, signaling the presence of AI-augmented features and interactivity. 

**Color Usage Guidelines:**
- **Primary:** Used for sidebars, primary navigation headers, and high-level structural elements.
- **Accent:** Reserved for primary calls-to-action, focus states, and active selection indicators.
- **Success/Mint:** Used for positive growth metrics, "AI verified" statuses, and completed workflows.
- **Background:** Utilize the Cool Gray (#F8FAFC) for the application canvas to reduce eye strain compared to pure white.

## Typography

This design system employs a dual-font strategy. **Plus Jakarta Sans** is used for headlines to provide a sophisticated, slightly modern geometric touch. **Inter** is used for all body copy and data-heavy interfaces due to its exceptional legibility and systematic performance.

**Type Rules:**
- Use `display-lg` exclusively for dashboard overviews or marketing-heavy landing pages.
- `label-md` should be used for category tags and table headers, always in uppercase with increased tracking for readability.
- Maintain a minimum contrast ratio of 4.5:1 for all body text against surface colors.

## Layout & Spacing

The layout is based on a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm follows a strict 4px/8px incremental scale to ensure mathematical precision and alignment.

**Grid Philosophy:**
- **Desktop (1440px+):** 12 columns, 24px gutter, 32px side margins.
- **Tablet (768px - 1439px):** 8 columns, 16px gutter, 24px side margins.
- **Mobile (<767px):** 4 columns, 16px gutter, 16px side margins.

Apply `lg` (24px) spacing for internal card padding and `xxl` (48px) for vertical section separation.

## Elevation & Depth

Hierarchy is established using **Tonal Layering** supplemented by **Ambient Shadows**. Instead of aggressive borders, we use subtle shadows to lift interactive elements from the background.

- **Level 0 (Base):** #F8FAFC (The application background).
- **Level 1 (Card/Surface):** White (#FFFFFF) with a 1px border (#E2E8F0). No shadow.
- **Level 2 (Hover/Active):** White surface with a soft, diffused shadow: `0px 4px 12px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Modals/Popovers):** White surface with a deep shadow: `0px 12px 32px rgba(15, 23, 42, 0.12)`.

Avoid glassmorphism for functional enterprise components; keep surfaces opaque to ensure data clarity and eliminate background distractions.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional balance between the "harshness" of sharp corners and the "casualness" of fully rounded components.

- **Standard Elements (Buttons, Inputs, Small Cards):** 4px (0.25rem) radius.
- **Large Elements (Containers, Modals):** 8px (0.5rem) radius.
- **Specific AI Elements:** "Insights" or "AI Suggestions" can use a slightly larger 12px (0.75rem) radius to differentiate generated content from structured system data.

## Components

### Buttons
- **Primary:** Solid Intelligence Blue (#3B82F6) with white text. 4px radius.
- **Secondary:** Transparent background with Intelligence Blue border and text.
- **Tertiary/Ghost:** No border or background. Used for low-priority actions like "Cancel."

### Input Fields
- **Default State:** 1px border (#CBD5E1), white background.
- **Focus State:** 2px border (#3B82F6) with a subtle 4px blue outer glow (20% opacity).
- **AI-Powered Input:** Include a subtle gradient border transition using Mint Green and Intelligence Blue when the AI is processing.

### Cards
- Standard white background, 8px radius, and a 1px #E2E8F0 border.
- Headers within cards should use a 1px bottom border to separate metadata from content.

### Chips & Badges
- **Status Badges:** Use low-saturation backgrounds (e.g., 10% opacity Mint Green) with high-saturation text for high legibility without visual clutter.
- **Action Chips:** 100px (pill) radius to distinguish them from rectangular buttons.

### Lists & Data Tables
- Use alternating row colors (Zebra striping) only in very dense tables.
- Row hover state: #F1F5F9 (Cool Gray 100).
- Typography in tables should default to `body-sm`.