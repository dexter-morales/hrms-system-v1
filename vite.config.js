import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: "127.0.0.1",
    },
    css: {
        postcss: "./postcss.config.js", // Ensure PostCSS config is loaded
    },
    resolve: {
        alias: {
            "tailwindcss/version.js": "tailwindcss/package.json",
        },
    },
});
