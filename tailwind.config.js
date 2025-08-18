/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",                  // keep this for Vite
    "./src/**/*.{js,ts,jsx,tsx}",    // React source files
    "./node_modules/flowbite/**/*.js" // Flowbite components
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("flowbite/plugin")
  ],
};
