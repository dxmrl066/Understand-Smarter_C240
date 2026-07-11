const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

async function generateMindMap(notes) {
    // Safety check: cut off text if it overflows text payload parameters 
    if (notes && notes.length > 8000) {
        notes = notes.substring(0, 8000) + "... [Content compressed due to size limits]";
    }

    const systemPrompt = `
You are an expert mind map generator that outputs strictly valid Mermaid.js mindmap syntax.
Always start the output with the word: mindmap

CRITICAL COMPRESSION RULES:
1. The user will provide a short topic summary or notes. Keep the resulting tree structure highly concise.
2. Limit the map branches to a maximum of 3 levels deep (Root -> Main Branches -> Details).
3. Do not include verbose descriptions. Keep each node phrase under 4 words maximum.

CRITICAL SYNTAX RULES:
- Every single node title that contains spaces, symbols, or numbers MUST be enclosed in double quotes. 
  Example:
  mindmap
    root("Database Integration with Express II")
      "Configuration"
        "Environment Variables"
- Do not include markdown code blocks like \`\`\`mermaid or \`\`\`. Just return the raw text.

Turn this short topic line into a clean, complete mind map layout:
${notes}
`;

    const result = await model.generateContent(systemPrompt);
    return result.response.text();
}

module.exports = generateMindMap;