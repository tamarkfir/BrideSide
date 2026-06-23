import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // שמות הסגנון נבנים דינמית (`treat-${treatment}`), אז ה-purge לא רואה אותם — שומרים ידנית
  safelist: ["treat-deckle", "treat-bw", "treat-duotone", "treat-cutout"],
  theme: {
    extend: {
      colors: {
        brand: {
          blush: "#F3EAD9", // רקע ראשי — קרם חם
          rose: "#C77F77", // accent ראשי — ורוד עתיק
          roseDark: "#9B5750", // כותרות / hover
          sage: "#8A9A77", // ירוק-מרווה — בוטניקה
          sageDark: "#5E6B4C",
          sand: "#B5A18C", // טקסט משני
          cream: "#FAF4EA", // כרטיסים / משטחים
          ink: "#3A2E26", // טקסט ראשי — חום כהה
          paper: "#F4ECDD", // עמוד הספר
          tape: "#E7D9C9", // washi tape
          gold: "#B8893A", // אוכרה — כתב יד / script
          kraft: "#C9A98A", // נייר קרפט
          rust: "#B05640", // accent חם נוסף
          blue: "#6F86A6", // accent עריכותי מאופק (הג'נטלוומן)
          blueDark: "#54688A",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-heading-he)", "serif"],
        // גוף הטקסט ב-Gisha (פונט מערכת של Windows); נפילה ל-Inter/Assistant אם אינו מותקן
        body: ["Gisha", "var(--font-body)", "var(--font-body-he)", "sans-serif"],
        script: ["var(--font-script)", "var(--font-heading-he)", "cursive"],
      },
      animation: {
        "fade-in": "fadeIn 0.7s ease-out both",
        "fade-in-up": "fadeInUp 0.6s ease-out both",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
