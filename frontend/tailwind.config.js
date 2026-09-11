/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#eef7f4",500:"#0f9d76",600:"#0c7d5e",700:"#095f47" },
        ink: { DEFAULT:"#14201c", soft:"#4a5a54", faint:"#7c8b85" },
        line: "#e3e8e6",
      },
      fontFamily: { sans: ['"Inter"',"system-ui","sans-serif"] },
    },
  },
  plugins: [],
};
