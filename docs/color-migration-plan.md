# Color Migration Plan - weviniApp

**Date:** 2026-04-24
**Status:** Plan Defined / Awaiting New Palette

## 1. Objective
Perform a complete visual overhaul of the application by changing the global color palette. The goal is to move from a collection of hardcoded colors to a robust, semantic design system that is easy to maintain and update.

## 2. Audit Results (Current State)
The current implementation uses **Tailwind CSS 4** with a centralized `@theme` block in `src/index.css`.

### Existing Tokens
| Token | Value (Hex) | Usage |
| :--- | :--- | :--- |
| `--color-paper` | `#F5F2ED` | Main background |
| `--color-ink` | `#1A1A1A` | Main text |

### Issues Identified
- **Hardcoded Colors:** 26 instances of direct Tailwind color classes (e.g., `text-red-600`, `bg-stone-100`, `text-emerald-500`) were found across `src/views/` and `src/components/`.
- **Maintenance Risk:** Changing the theme currently requires manual searching and replacing of specific color utilities, which is error-prone and incomplete.

## 3. Strategy: Semantic Refactor
Instead of just swapping hex codes, we will implement a **Semantic Design System**. This means we will name colors based on their *purpose* rather than their *appearance*.

### Proposed Token Mapping (Draft)
Once the new palette is provided, we will map them as follows:

| Semantic Token | Visual Purpose | Replaces (Example) |
| :--- | :--- | :--- |
| `primary` | Main brand actions/elements | `blue-600`, etc. |
| `error` | Errors, warnings, destructive actions | `red-500`, `red-600` |
| `success` | Success states, positive indicators | `emerald-500` |
| `surface` | Card backgrounds, input backgrounds, subtle dividers | `stone-100`, `stone-50` |
| `text-main` | Primary text content | `ink`, `stone-800` |
| `text-muted` | Secondary/disabled text | `stone-500` |
| `bg-main` | Main application background | `paper` |

## 4. Execution Plan

### Phase 1: Definition
- [ ] Receive new color palette from user.
- [ ] Map new colors to the semantic tokens defined in section 3.

### Phase 2: Implementation (Core)
- [ ] Update `src/index.css` inside the `@theme` block with the new semantic variables.
- [ ] Update `body` styles in `src/index.css` to use the new `bg-main` and `text-main`.

### Phase 3: Implementation (Refactor)
- [ ] Search and replace hardcoded utilities in:
    - `src/views/`
    - `src/components/`
    - `src/App.tsx`
- [ ] Ensure all error states use the `error` token.
- [ ] Ensure all success states use the `success` token.

### Phase 4: Validation
- [ ] Manual visual audit of all main views (`Dashboard`, `Suppliers`, `Customers`, `Inventory`, `Login`).
- [ ] Verify responsiveness and accessibility (contrast).

## 5. Notes
- **Tooling:** Use `grep` and `sed` (via AI tools) for efficient replacements.
- **Safety:** Never delete existing colors until the new semantic system is fully functional.
