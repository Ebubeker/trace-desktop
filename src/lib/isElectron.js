export function isElectron() {
  return typeof window !== "undefined" && !!window.process?.versions?.electron;
}
