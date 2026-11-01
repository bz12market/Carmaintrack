// Opções de impressão das etiquetas (tamanho, modo, papel, cópias). Dependem
// da impressora deste computador, por isso ficam no browser e não na conta.
const KEY = "carmaintrack-label-prefs";
const DEFAULTS = { size: "100x60", mode: "mono", paper: "roll", copies: 1 };

export function readLabelPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return DEFAULTS;
  }
}

export function saveLabelPrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignora */
  }
}
