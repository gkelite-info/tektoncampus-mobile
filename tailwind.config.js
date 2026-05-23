/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jost-Regular'],
        medium: ['Jost-Medium'],
        semibold: ['Jost-SemiBold'],
        bold: ['Jost-Bold'],
      },
    },
  },
  plugins: [],
};
