const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Active!");
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ reply: "Prompt missing hai." });
        }

        // FIX: Model name ko "models/" prefix ke sath likhein
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // FIX: sendMessage ki jagah generateContent use karein (zyada stable hai v1 ke liye)
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000 }
        });

        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "AI Error: " + error.message });
    }
});

module.exports = app;
