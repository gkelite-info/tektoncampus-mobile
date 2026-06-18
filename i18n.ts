import i18n, { LanguageDetectorAsyncModule } from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./src/locales/en.json";
import hi from "./src/locales/hi.json";
import te from "./src/locales/te.json";

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
        },

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;