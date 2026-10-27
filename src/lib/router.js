import { useEffect, useState } from "react";

// Router mínimo baseado na History API.
// O painel corre em /app e a demonstração em /demo; as páginas internas usam
// caminhos relativos a essa base ("/veiculos"), e o router junta o prefixo.
let base = "";
let portalPrefix = "";

export function setArea(nextBase, nextPortalPrefix = "") {
  base = nextBase;
  portalPrefix = nextPortalPrefix;
}

/** Caminho completo (com a base da zona atual) para um caminho interno. */
export const href = (to) => (to.startsWith("/") ? base + to : to);

/** Prefixo dos links públicos do portal do cliente ("" ou "/demo"). */
export const getPortalPrefix = () => portalPrefix;

export function navigate(to, { replace = false } = {}) {
  const target = href(to);
  if (target === window.location.pathname + window.location.search) return;
  window.history[replace ? "replaceState" : "pushState"]({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

/** Navegação para fora da zona atual (p.ex. do painel para a landing). */
export function go(fullPath) {
  window.history.pushState({}, "", fullPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function usePath() {
  const here = () => window.location.pathname + window.location.search;
  const [path, setPath] = useState(here);
  useEffect(() => {
    const on = () => setPath(here());
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return path;
}
