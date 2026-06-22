import i18n, { LanguageDetectorAsyncModule } from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const en = require("./src/locales/en.json");
const hi = require("./src/locales/hi.json");
const te = require("./src/locales/te.json");
const ur = require("./src/locales/ur.json");

const languageDetector: LanguageDetectorAsyncModule = {
    type: "languageDetector",
    async: true,
    detect: async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem("app_language");
            if (savedLanguage) {
                return savedLanguage;
            }
        } catch (error) {
            console.error("Error reading language from AsyncStorage:", error);
        }
        return "en";
    },
    init: () => {},
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem("app_language", language);
        } catch (error) {
            console.error("Error saving language to AsyncStorage:", error);
        }
    },
};

i18n.use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: "v4",
        fallbackLng: "en",

        resources: {
            en: { translation: en },
            hi: { translation: hi },
            te: { translation: te },
            ur: { translation: ur },
        },

        interpolation: {
            escapeValue: false,
            prefix: "{",
            suffix: "}",
        },
    });

export default i18n;