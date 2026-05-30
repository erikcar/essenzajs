import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default defineConfig([
  // 1. Configurazione base JavaScript e React
  js.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Spesso utile se usi strumenti di build
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "react/prop-types": "off",
      "no-undef": "warn",
    },
  },

  // 2. SEZIONE JEST (Aggiungi questa)
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}", "**/tests/**/*"],
    languageOptions: {
      globals: {
        ...globals.jest, // <--- Questo abilita describe, test, expect, ecc.
      },
    },
    rules: {
      // Puoi disattivare regole specifiche per i test qui, se serve
      "no-unused-vars": "off", 
    },
  },
]);