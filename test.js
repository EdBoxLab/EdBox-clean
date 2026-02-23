const jsonText = `[
  {
    "question": "Which sentence is correct, or incorrect?",
    "options": [
      "I like apples, oranges, and bananas.",
      "A, B, or C]",
      "A]",
      "]"
    ],
    "correctAnswer": 0
  }
]`;
let cleaned = jsonText;
// How it looks in utils.ts
cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '').replace(/\\n/g, ' ').replace(/\r?\n/g, ' ');
cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
console.log("Result string:");
console.log(cleaned);
try {
    JSON.parse(cleaned);
    console.log("Parsed successfully!");
} catch (e) {
    console.log("Parse failed: " + e.message);
}
