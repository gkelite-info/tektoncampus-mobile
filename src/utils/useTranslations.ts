import { useTranslation } from "react-i18next";

export function useTranslations(namespace: string) {
    const { t } = useTranslation();

    return (key: string, options?: Record<string, string>) => {
        const fullKey = `${namespace}.${key}`;

        let result: string = t(fullKey, { defaultValue: key });

        if (options) {
            Object.entries(options).forEach(([placeholder, value]) => {
                result = result.replace(`{${placeholder}}`, value);
            });
        }

        return result;
    };
}