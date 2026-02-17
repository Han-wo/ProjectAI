const { FlatCompat } = require("@eslint/eslintrc");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettierPlugin = require("eslint-plugin-prettier");
const simpleImportSort = require("eslint-plugin-simple-import-sort");

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const apiAndCoreFiles = ["apps/api/**/*.ts", "packages/llm-core/**/*.ts"];
const webFiles = ["apps/web/**/*.{ts,tsx,js,jsx}"];

const withFiles = (configs, files) =>
  configs.map((config) => ({
    ...config,
    files
  }));

module.exports = [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.d.ts"
    ]
  },

  ...withFiles(
    compat.extends("airbnb-base", "airbnb-typescript/base", "prettier"),
    apiAndCoreFiles
  ),
  {
    files: apiAndCoreFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./apps/api/tsconfig.json", "./packages/llm-core/tsconfig.json"],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "prettier/prettier": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/return-await": "off",
      "import/prefer-default-export": "off",
      "class-methods-use-this": "off",
      "no-void": "off",
      "no-console": "off"
    }
  },

  ...withFiles(
    compat.extends(
      "airbnb",
      "airbnb-typescript",
      "airbnb/hooks",
      "next/core-web-vitals",
      "prettier"
    ),
    webFiles
  ),
  {
    files: webFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./apps/web/tsconfig.json"],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./apps/web/tsconfig.json"
        }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      "simple-import-sort": simpleImportSort
    },
    rules: {
      "prettier/prettier": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "react/react-in-jsx-scope": "off",
      "react/require-default-props": "off",
      "import/prefer-default-export": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "no-nested-ternary": "off",
      "no-void": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  }
];
