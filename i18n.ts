import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import "./src/locales/en.json";
// import "./locales/te.json";
// import "./locales/hi.json";

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: "v4",
        lng: "en",
        fallbackLng: "en",

        resources: {
            en: {
                translation: "./locales/en.json",
            },
            te: {
                translation: "./locales/te.json",
            },
            hi: {
                translation: "./locales/hi.json",
            }
        },

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;