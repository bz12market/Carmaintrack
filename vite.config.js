import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * O Tailwind 4 escreve as transparências das cores do tema (p.ex. bg-ink/5)
 * com color-mix() e os gradientes com "in oklab". Em browsers que não os
 * suportam fica a cor sólida (texto ilegível) e os gradientes desaparecem.
 * Este passo reescreve o CSS para rgb(var(--x-rgb) / 5%), que funciona em
 * praticamente todos os browsers; as variáveis "-rgb" vêm de theme.js.
 */
export function legacyColors(css) {
  // 1. Os blocos "@supports (color-mix)" passam a aplicar-se sempre.
  const supports = /@supports\s*\(color:\s*color-mix\(in lab,\s*red,\s*red\)\)\s*\{/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = supports.exec(css))) {
    let depth = 1;
    let j = supports.lastIndex;
    while (depth && j < css.length) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    out += css.slice(last, m.index) + css.slice(supports.lastIndex, j - 1);
    last = supports.lastIndex = j;
  }
  out += css.slice(last);

  return (
    out
      // 2. color-mix(in oklab, var(--x) N%, transparent) -> rgb(var(--x-rgb) / N%)
      .replace(/color-mix\(in oklab,\s*var\((--[\w-]+)\)\s+([\d.]+%),\s*transparent\)/g, "rgb(var($1-rgb) / $2)")
      // 3. Sombras coloridas: dispensa a multiplicação pela opacidade da sombra.
      .replace(/color-mix\(in oklab,\s*(rgb\(var\(--[\w-]+\) \/ [\d.]+%\))\s+var\(--tw-shadow-alpha\),\s*transparent\)/g, "$1")
      // 4. Gradientes sem "in oklab".
      .replace(/(--tw-gradient-position:[^;}]*?)\s+in oklab/g, "$1")
  );
}

// Variáveis "-rgb" que existem (theme.js e index.css). Outra qualquer é um erro.
const KNOWN_RGB = /^--(brand|c-[a-z0-9-]+|color-black|color-white)-rgb$/;

function legacyColorsPlugin() {
  return {
    name: "carmaintrack:legacy-colors",
    enforce: "post",
    transform(code, id) {
      if (/\.css($|\?)/.test(id)) return { code: legacyColors(code), map: null };
    },
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle))
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          const css = legacyColors(String(file.source));
          for (const [, name] of css.matchAll(/rgb\(var\((--[\w-]+-rgb)\)/g))
            if (!KNOWN_RGB.test(name)) this.warn(`${name} não está definida (cor com transparência sem versão -rgb).`);
          for (const [fn] of css.matchAll(/\b(oklch|oklab|lab|lch)\([^)]*\)/g))
            if (!fn.includes("currentcolor")) this.warn(`Cor não suportada em browsers antigos: ${fn}`);
          file.source = css;
        }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), legacyColorsPlugin()],
  server: {
    port: 5174,
    host: true, // permite abrir a app no telemóvel na mesma rede Wi-Fi
  },
});
