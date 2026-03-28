const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// 1. CORS aur JSON setup
app.use(cors());
app.use(express.json());

// 2. Base Route (Taake "Cannot GET /" wala error khatam ho jaye)
app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live and Running!");
});

// 3. Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // System Instruction model level par dena behtar hai
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Respond naturally in the same language or script used by the user. If they ask in Roman Urdu/Hindi, reply in Roman Urdu/Hindi. Do not add any prefix. Give direct answers."
        });

        const chat = model.startChat({
            history: [],
            generationConfig: { maxOutputTokens: 1000 },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "Sorry, server mein error hai. Apni API Key check karein." });
    }
});

module.exports = app;
