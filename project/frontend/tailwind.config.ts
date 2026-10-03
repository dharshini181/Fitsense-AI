import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-variant": "var(--surface-variant)",
        primary: "var(--primary)",
        "primary-container": "var(--primary-container)",
        "primary-foreground": "var(--primary-foreground)",
        "on-primary-container": "var(--on-primary-container)",
        secondary: "var(--secondary)",
        "secondary-container": "var(--secondary-container)",
        "on-secondary-container": "var(--on-secondary-container)",
        tertiary: "var(--tertiary)",
        "tertiary-container": "var(--tertiary-container)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        outline: "var(--outline)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-xl": ["48px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        button: ["15px", { lineHeight: "1", letterSpacing: "0.02em", fontWeight: "600" }],
        caption: ["14px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" }],
      },
      spacing: {
        unit: "8px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "section-gap": "80px",
        gutter: "24px",
        "container-padding-mobile": "20px",
        "container-padding-desktop": "64px",
      },
      borderRadius: {
        "2xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
