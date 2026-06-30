import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 排除不需要检查的目录
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "data/**",
      "scripts/**",
      "*.mjs",
    ],
  },
  // Next.js 推荐配置
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  // Prettier 集成
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "warn",
      // 允许未使用的变量（以下划线开头表示有意为之）
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 允许 any 类型（现有代码中多处使用，逐步修复）
      "@typescript-eslint/no-explicit-any": "warn",
      // React 19 不需要显式导入 React
      "react/react-in-jsx-scope": "off",
    },
  },
];

export default eslintConfig;
