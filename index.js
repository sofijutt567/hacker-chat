const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live (Direct Mode)!");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Prompt missing hai." });

        // Direct Google API URL (No Library Needed)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        // Response extraction
        const aiReply = data.candidates[0].content.parts[0].text;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Direct API Error:", error.message);
        res.status(500).json({ reply: "Direct API Error: " + error.message });
    }
});

module.exports = app;
