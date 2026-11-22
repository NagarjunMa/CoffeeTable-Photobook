import nextVitals from "eslint-config-next/core-web-vitals";

// Taste's copied runtime is vendor source and must remain byte-for-byte unchanged.
const eslintConfig = [...nextVitals, { ignores: [".next-test/**", "test-results/**", "playwright-report/**", ".cache/**", "public/assets/**", ".taste-skill/**"] }];

export default eslintConfig;
