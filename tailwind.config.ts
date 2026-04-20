import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-weak": "var(--accent-weak)",
        "accent-soft": "var(--accent-soft)",
        "accent-strong": "var(--accent-strong)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-4": "var(--ink-4)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        amber: "var(--amber)",
        "amber-weak": "var(--amber-weak)",
        red: "var(--red)",
        "red-weak": "var(--red-weak)",
        green: "var(--green)",
        "green-weak": "var(--green-weak)",
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [],
};
export default config;
