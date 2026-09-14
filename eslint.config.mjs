import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [...nextVitals, { ignores: [".next-test/**", "test-results/**", "playwright-report/**", ".cache/**"] }];

export default eslintConfig;
