import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		auth: "src/auth/index.ts",
	},
	format: ["esm"],
	target: "node22",
	outDir: "dist",
	clean: true,
	dts: true,
	sourcemap: true,
	splitting: false,
});
