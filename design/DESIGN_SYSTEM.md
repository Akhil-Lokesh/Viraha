# Design System

**Viraha Design System** - UI Guidelines and Standards

---

## Brand Identity

**Name**: Viraha (विरह)  
**Meaning**: Sanskrit - "the ache of separation from what you love"

**Tagline Options**:
- "Your travel memories, mapped"
- "The ache fades. The memories stay."
- "Curate your journey"

**Brand Voice**:
- Thoughtful, not rushed
- Authentic, not performative
- Minimal, not cluttered
- Warm, not cold

## Color Palette

### Primary Colors

```css
--primary: 230 100% 20%;      /* Deep Ocean Blue #002366 */
--primary-foreground: 0 0% 100%;

--secondary: 30 40% 60%;      /* Warm sand #C4A57B */
--secondary-foreground: 0 0% 0%;

--accent: 15 75% 55%;         /* Terracotta #E27856 */
--accent-foreground: 0 0% 100%;
```

### Neutral Colors

```css
--background: 0 0% 100%;      /* White */
--foreground: 222 47% 11%;    /* Dark slate */

--muted: 210 40% 96.1%;       /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%;

--card: 0 0% 100%;
--card-foreground: 222 47% 11%;

--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 24 58% 50%;
```

### Semantic Colors

```css
--destructive: 0 84.2% 60.2%;     /* Red */
--destructive-foreground: 0 0% 98%;

--success: 142 76% 36%;           /* Green */
--warning: 48 96% 53%;            /* Yellow */
--info: 199 89% 48%;              /* Blue */
```

### Dark Mode

```css
--background: 222 47% 11%;
--foreground: 210 40% 98%;
--card: 222 47% 15%;
--border: 217.2 32.6% 17.5%;
```

## Typography

### Font Families

**Primary**: Inter (system fonts fallback)
```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, sans-serif;
```

**Alternative**: Geist Sans
```css
font-family: "Geist Sans", -apple-system, sans-serif;
```

### Type Scale

```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

