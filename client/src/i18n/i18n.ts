import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../i18n/en.json";
import ko from "../i18n/ko.json";

i18n
  .use(LanguageDetector) // Automatically detects user browser language
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
