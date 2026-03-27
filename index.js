const express = require('express');
const cors = require('cors');
// SAHI PACKAGE NAME: @google/generative-ai
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // System Instruction: Is se AI user ki language follow karega
        const chat = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 1000 },
        });

        const result = await chat.sendMessage(`
            User prompt: "${prompt}"
            Instruction: Respond naturally in the same language or script used by the user. 
            If they ask in Roman Urdu/Hindi, reply in Roman Urdu/Hindi. 
            Do not add any prefix like 'System:' or 'AI:'. Just give the direct answer.
        `);

        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Sorry, server mein error hai. Dubara koshish karein." });
    }
});

// Vercel ke liye export
module.exports = app;
