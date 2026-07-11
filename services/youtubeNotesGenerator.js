require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateYouTubeNotes(input, noteStyle = "Summary") {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is missing.");
    }

    const transcript = typeof input === 'string'
        ? input
        : input?.transcript || input?.youtubeLink || input?.videoUrl || input?.text || '';

    if (!transcript || !transcript.trim()) {
        throw new Error("No transcript or YouTube link was provided.");
    }

    const prompt = `
You are an expert study assistant.

A student has provided the transcript from a YouTube educational video.

Convert the transcript into clear and organised study notes. The preferred note style is:

${noteStyle}

If noteStyle is:

Summary -> concise notes
Detailed -> explain concepts
Revision -> exam revision notes
Cheatsheet -> only the most important facts

Follow this format exactly.

# Title
Create a suitable title.

# Overview
Write a short summary of the topic.

# Key Concepts
• Bullet point
• Bullet point
• Bullet point

# Important Definitions
Definition - explanation
Definition - explanation

# Examples
Provide practical examples where appropriate.

# Key Takeaways
• Bullet point
• Bullet point

Rules:
- Do NOT copy the transcript.
- Rewrite everything in your own words.
- Do NOT include timestamps.
- Make the notes concise and easy for students to study.

Transcript:

${transcript}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });

        const notes = response?.text
            || response?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
            || '';

        if (!notes || notes.trim() === "") {
            throw new Error("Gemini returned an empty response.");
        }

        return notes;
    } catch (error) {
        console.error("Gemini YouTube Notes Error:", error);
        throw error;
    }
}

module.exports = generateYouTubeNotes;
