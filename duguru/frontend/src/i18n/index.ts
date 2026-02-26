import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./messages/pt-BR.json";

/**
 * i18n configuration — duGuru
 *
 * Locale padrão: pt-BR (Princípio IX da Constituição)
 * Todas as strings visíveis ao usuário devem estar no namespace
 * correspondente em messages/pt-BR.json.
 * Zero strings hardcoded em componentes TSX.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": ptBR,
    },
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "chart",
      "horoscope",
      "dashboard",
      "compatibility",
      "profile",
      "onboarding",
      "errors",
    ],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
