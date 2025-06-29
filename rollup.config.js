import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
  // Build the main bundle
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        exports: "named",
        interop: "auto",
      },
      {
        file: "dist/index.esm.js",
        format: "es",
      },
    ],
    external: ["vue"],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.build.json",
      }),
    ],
  },
  // Build type definitions
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    external: ["vue"],
    plugins: [dts()],
  },
];
