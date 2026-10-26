import { useEffect, useState } from "react";

// Router mínimo baseado na History API. Devolve pathname + query.
export function navigate(to) {
  if (to === window.location.pathname + window.location.search) return;
  window.history.pushState({}, "", to);
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
