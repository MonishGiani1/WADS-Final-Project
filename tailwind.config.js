/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx}",
    ],
    corePlugins: {
      preflight: true, 
    },
    plugins: [],
  }