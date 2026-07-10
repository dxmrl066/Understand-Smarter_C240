const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Try this ultra-fast, high-volume workhorse model (has its own free quota!)
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

async function generateMindMap(notes) {
    // FIX: Removed the comment characters (//) so the prompt string is actually read by Javascript
    const systemPrompt = `
You are an expert mind map generator that outputs strictly valid Mermaid.js syntax.
Always start the output with the word: mindmap

CRITICAL RULES:
1. Every single node title that contains spaces, symbols, or numbers MUST be enclosed in double quotes. 
   Example:
   mindmap
     root("Database Integration with Express II")
       "Configuration"
         "Environment Variables"
2. Do not include markdown code blocks like \`\`\`mermaid or \`\`\`. Just return the raw text.

Based on the rules above, turn these notes into a mind map layout:
${notes}
`;

    // ACTUALLY CALL GEMINI HERE: Passing our combined prompt structure
    const result = await model.generateContent(systemPrompt);
    return result.response.text();
}

module.exports = generateMindMap;