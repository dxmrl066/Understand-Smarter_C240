require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// 1. Initialize the official Google Gen AI SDK client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateQuiz(subject, difficulty, count, type) {
    // Check if the API key is set up correctly in the backend environment
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing. Please set GEMINI_API_KEY in your .env file.');
    }

    // 2. Build the training instructions for the model
    const prompt = `
You are an expert educational quiz generator.

Generate exactly ${count} ${difficulty} level ${type} questions about the topic "${subject}".

You must output a JSON object containing a "quiz" array. 
The layout inside the JSON must match this structure exactly:
{
  "quiz": [
    {
      "question": "Clear and detailed question text here",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "answer": "The exact matching text of the correct option choice string",
      "explanation": "A short educational note explaining why it is correct"
    }
  ]
}

Return ONLY raw valid JSON text matching the schema. No markdown formatting codeblocks, and no conversational intro/outro text.
`;

    try {
        // 3. Dispatch the production network request to Gemini 2.5 Flash
       // 3. Dispatch the production network request to Gemini 3.1 Flash Lite
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite', // CHANGED: Points to the active quota model pool
            contents: prompt,
            config: {
                temperature: 0.3,
                // Forces Gemini to output strictly parsed structured JSON data matching our request schema
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        quiz: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    question: { type: 'STRING' },
                                    options: {
                                        type: 'ARRAY',
                                        items: { type: 'STRING' }
                                    },
                                    answer: { type: 'STRING' },
                                    explanation: { type: 'STRING' }
                                },
                                required: ['question', 'options', 'answer', 'explanation']
                            }
                        }
                    },
                    required: ['quiz']
                }
            }
        });

        // 4. Extract the cleanly formatted text payload returned from Google's servers
        const rawText = response.text;

        if (!rawText) {
            throw new Error('Gemini returned an empty generation response.');
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(rawText);
        } catch (err) {
            console.error("Raw text that failed parsing:", rawText);
            throw new Error('Gemini returned text that could not be parsed as valid JSON.');
        }

        // Handle extraction safely to locate the questions collection array
        const rawQuestionsArray = Array.isArray(parsedPayload) ? parsedPayload : parsedPayload.quiz;

        if (!Array.isArray(rawQuestionsArray) || rawQuestionsArray.length === 0) {
            throw new Error('Gemini failed to generate an accessible array of quiz questions.');
        }

        // 5. Clean, sanitize, and validate array elements to align with your frontend expectations
        return rawQuestionsArray.map((item) => {
            if (!item || typeof item.question !== 'string' || !Array.isArray(item.options) || item.options.length < 2) {
                throw new Error('Gemini returned an item with invalid structural layout.');
            }

            // Ensure the frontend gets a valid string answer value matching the text option choice to pass grading
            const validAnswer = typeof item.answer === 'string' ? item.answer : (item.options[0] || '');

            return {
                question: item.question,
                options: item.options,
                answer: validAnswer,
                explanation: typeof item.explanation === 'string' ? item.explanation : ''
            };
        }).slice(0, Number(count) || 5);

    } catch (error) {
        console.error("Error inside Gemini Quiz Service:", error);
        throw error;
    }
}

module.exports = generateQuiz;