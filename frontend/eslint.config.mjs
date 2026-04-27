export default [
  {
    ignores: ["**/node_modules/**", "**/.next/**"],
  },
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
    },
    rules: {},
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
]
