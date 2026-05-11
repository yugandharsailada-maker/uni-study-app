---
name: Lumiere
version: alpha
description: A high-performance, glassmorphic design system inspired by ColorOS 16 and architectural minimalism.
colors:
  primary: "#3b82f6"
  primary-foreground: "#ffffff"
  secondary: "#f4f4f5"
  secondary-foreground: "#09090b"
  accent: "#3b82f6"
  background: "#fafafa"
  foreground: "#09090b"
  muted: "#f4f4f5"
  muted-foreground: "#71717a"
  border: "#e4e4e7"
  card: "#ffffff"
  card-foreground: "#09090b"
  success: "#22c55e"
  warning: "#f59e0b"
  destructive: "#ef4444"
typography:
  h1:
    fontFamily: Inter
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.04em
  h2:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.03em
  h3:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.02em
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.01em
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
rounded:
  sm: 12px
  md: 24px
  lg: 40px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.xl}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.xl}"
  card-glass:
    backgroundColor: "rgba(255, 255, 255, 0.4)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
    border: "1px solid rgba(255, 255, 255, 0.5)"
    blur: "24px"
  input-field:
    backgroundColor: "{colors.background}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
  modal-overlay:
    backgroundColor: "rgba(0, 0, 0, 0.4)"
    blur: "8px"
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "#ffffff"
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "#ffffff"
  status-error:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
---

## Overview

Lumiere is designed for fluidity and depth. It combines the clean lines of architectural minimalism with the dynamic, tactile feel of modern mobile operating systems. The core philosophy is "Invisible Power" — a UI that feels light and airy but responds with precision and speed.

## Colors

The palette is centered around a vibrant Primary blue, balanced by soft neutrals and high-contrast text.

- **Primary (#3b82f6):** The driver of action and focus. Used for buttons, active states, and key highlights.
- **Background (#fafafa):** A near-white surface that provides a clean, breathable canvas.
- **Foreground (#09090b):** Deep charcoal for maximum legibility without the harshness of pure black.
- **Muted (#f4f4f5):** Subdued surfaces for secondary information and background depth.

## Typography

We use **Inter** for its exceptional legibility and modern, technical feel.

- **Headlines:** Bold and tight, creating a strong hierarchy.
- **Body:** Open and airy, optimized for long-form reading.
- **Labels:** Medium weight for clear functional identification.

## Layout & Spacing

A strict 8px grid ensures consistency across all components.

- **XS (4px):** Micro-adjustments.
- **SM (8px):** Internal component spacing.
- **MD (16px):** Standard gutter and component separation.
- **LG (24px):** Container padding and large section breaks.

## Elevation & Depth

Lumiere uses **Glassmorphism** to create a sense of layering.

- **Surface Elevated:** Cards and modals use a subtle backdrop blur (20px) and low-opacity borders to feel like they are floating above the background.
- **Glow:** Primary elements emit a soft blue glow to signify activity and importance.

## Shapes

Rounding is generous and intentional, mimicking physical hardware.

- **SM (12px):** Standard for inputs and buttons.
- **MD (24px):** The default for content cards and containers.
- **LG (40px):** Hero elements and large tiles.

## Components

### Buttons
Primary buttons use the standard rounding and primary color. They feature a "Ripple" effect on interaction to provide tactile feedback.

### Cards
Cards are the primary building block. They default to the MD rounding and feature a subtle border. Glass variants are used for overlays and navigation.

## Do's and Don'ts

- **Do** use backdrop blurs for overlapping elements.
- **Do** prioritize transform-based animations (scale, translate) over layout-shifting ones.
- **Don't** use pure black (#000) for text; stick to the Foreground token.
- **Don't** use sharp corners; every element should have at least the SM rounding.
