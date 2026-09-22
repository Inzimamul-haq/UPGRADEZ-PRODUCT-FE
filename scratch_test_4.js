const text1 = "Explain (13 Marks)\n\n[[meta:{\"CO\":\"CO3\"}]]";
const m1 = text1.match(/[\(\[]\s*(\d+)\s*(?:marks?)?\s*[\)\]](?:\s*\[\[meta:.*?\]\])?\s*$/i);
console.log("Match 1:", !!m1);

if (m1) {
    const marksStrMatch = m1[0].match(/[\(\[]\s*(\d+)\s*(?:marks?)?\s*[\)\]]/i);
    const marksStr = marksStrMatch ? marksStrMatch[0] : m1[0];
    const cleanText = text1.replace(marksStr, '').trim();
    console.log("Cleaned:", cleanText);
    console.log("Marks:", parseInt(m1[1], 10));
}
