const text = `6. a) Explain (13 Marks)\n\n[[meta:{"CO":"CO1"}]]`;
const regex = /^\s*(\d+)\.\s+(.*?)\s*\(([\d\.]+)\s*Marks?\)([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;
console.log([...text.matchAll(regex)]);
