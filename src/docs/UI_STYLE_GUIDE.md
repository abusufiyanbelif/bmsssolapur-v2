# UI Style Guide - Baitul Mal Samajik Sanstha

This document outlines the complete design system and UI components used in the application. It serves as a comprehensive guide for replicating the visual style and user experience in other projects.

The entire UI is built upon **ShadCN UI** components, styled with **Tailwind CSS**, and uses **Lucide React** for icons.

---

## 1. Color Palette

The color system is defined in `src/app/globals.css` using HSL CSS variables for easy theming in both light and dark modes.

- **Primary (Green)**: The main brand color used for primary buttons, active links, page titles, and important highlights.
  - `--primary: 142.1 76.2% 36.3%`

- **Accent (Gold/Yellow)**: A complementary color used sparingly to draw attention to secondary but important information.
  - `--accent: 45 93.4% 47.5%`

- **Destructive (Red)**: Reserved for actions that delete or remove data, and for displaying error messages.
  - `--destructive: 0 84.2% 60.2%`

- **Success (Green)**: Used for success notifications and confirmation indicators.
  - `--success: 142.1 76.2% 36.3%`

- **Warning (Amber)**: Used for non-critical warnings or to draw attention to potentially important information.
  - `--warning: 38.8 92.3% 50.2%`
  
- **Info (Blue)**: Used for informational alerts and messages.
  - `--info: 217.2 91.2% 59.8%`

- **Background & Foreground**: The base colors for the application's layout and text.
  - `--background`: `hsl(0 0% 100%)` (White)
  - `--foreground`: `hsl(224 71.4% 4.1%)` (Near Black)

- **Supporting Colors**:
  - `--secondary` & `--muted`: Subtle shades of gray used for card backgrounds, borders, and input fields.
  - `--card`: The background color for card components.
  - Each color has a corresponding `-foreground` color (e.g., `--primary-foreground`) to ensure text on top is always legible.

---

## 2. Typography (Text Styles)

The application uses a two-font system, configured in `tailwind.config.ts` and loaded from Google Fonts in `src/app/layout.tsx`.

- **Headlines (`font-headline`)**: **Space Grotesk** is used for all major page titles (`<h2>`) and card titles (`<CardTitle>`) for a modern, clean look. They are consistently colored with `text-primary`.

- **Body Text (`font-body`)**: **Inter** is the primary font for all paragraphs, labels, descriptions, and other content, chosen for its high readability on screens.
  - **Standard Text**: Uses `text-foreground`.
  - **Descriptive/Muted Text**: Uses `text-muted-foreground` for subheadings, descriptions, and less important information.

All text styling for size and weight is handled by standard [Tailwind CSS](https://tailwindcss.com/) utility classes (e.g., `text-lg`, `font-semibold`).

---

## 3. Buttons

Button styles are defined in `src/components/ui/button.tsx` and offer several variants:

- **Default**: Solid green (`--primary`) for primary calls to action (e.g., "Create Lead", "Donate Now").
- **Destructive**: Solid red (`--destructive`) for dangerous actions (e.g., "Delete User").
- **Outline**: A bordered button with a transparent background for secondary actions (e.g., "Cancel", "Clear Filters").
- **Secondary**: A light gray (`--secondary`) button for less prominent actions.
- **Ghost**: A button with no background or border, often used for icon-only actions within menus.

---

## 4. Frames & Layout Styling

The application's layout is structured using modern card-based design and consistent spacing.

- **Cards (`Card`)**: The primary container for content, defined in `src/components/ui/card.tsx`. They feature a subtle border, rounded corners (`rounded-lg`), and a light box-shadow.

- **Layout Structure (`AppShell`)**: The main layout is a two-column grid (`md:grid-cols-[220px_1fr]`) managed by `src/components/app-shell.tsx`, with a fixed sidebar for navigation.

- **Spacing**: Consistent spacing is achieved via Tailwind CSS margin and padding utilities (e.g., `p-6` for card content, `space-y-4` for vertical spacing).

- **Separators (`Separator`)**: A thin horizontal line (`src/components/ui/separator.tsx`) is used to divide sections within a page or component.

---

## 5. Messages, Alerts, and Notifications

User feedback is provided through a consistent set of components.

- **Toasts (`Toaster`)**: Non-critical, temporary pop-up notifications that appear at the top-right of the screen for feedback like "Profile Updated". Managed by `src/components/ui/toaster.tsx` and the `useToast` hook. All toasts include an "OK" button, and `destructive` (error) toasts also include a "Copy" button.

- **Alerts (`Alert`)**: Inline messages used to convey important, contextual information. They have variants for `default`, `destructive`, `success`, `warning`, and `info`, each styled with its corresponding theme color.
  - Defined in `src/components/ui/alert.tsx`.

- **Dialogs (`AlertDialog`, `Dialog`)**: Modal windows that require focused user interaction.
  - **AlertDialog**: For confirming irreversible actions (e.g., "Are you sure you want to delete?").
  - **Dialog**: For displaying forms or information in an overlay (e.g., the Role Switcher).

---

## 6. Icons

All icons are from the **Lucide React** library. This provides a comprehensive set of clean, consistent, and highly readable icons.

- **Navigation**: `Home`, `Users`, `HandHeart`, `Settings`
- **Actions**: `Edit`, `Trash2`, `PlusCircle`, `Save`
- **Feedback**: `AlertCircle`, `CheckCircle`, `Loader2`
- **Admin**: `ShieldCheck`, `UserCog`, `FileCheck`
- **General**: `ChevronDown`, `MoreHorizontal`, `X`

The full set of available icons can be browsed at [lucide.dev](https://lucide.dev/).