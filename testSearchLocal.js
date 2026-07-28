function calculateScore(pattern, text) {
  if (!pattern || !text) return 0;
  pattern = pattern.toLowerCase();
  text = text.toLowerCase();
  if (text === pattern) return 100;
  if (text.startsWith(pattern)) return 80;
  if (text.includes(pattern)) return 60;
  let pIdx = 0, tIdx = 0, matches = 0;
  while (pIdx < pattern.length && tIdx < text.length) {
    if (pattern[pIdx] === text[tIdx]) { matches++; pIdx++; }
    tIdx++;
  }
  if (matches === pattern.length) return 40;
  let overlap = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (text.includes(pattern[i])) overlap++;
  }
  if (overlap / pattern.length > 0.7) return 20;
  return 0;
}

console.log("Subham in Subham fashion:", calculateScore("Subham", "Subham fashion"));
console.log("subham in Subham fashion:", calculateScore("subham", "Subham fashion"));
console.log("Fashion in Subham fashion:", calculateScore("Fashion", "Subham fashion"));
console.log("Subham fashion in Subham fashion:", calculateScore("Subham fashion", "Subham fashion"));
