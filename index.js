const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live!");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal likhein." });

        // NAYI SETTING: v1beta aur gemini-1.5-flash
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
            return res.status(500).json({ reply: "Google API Error: " + data.error.message });
        }

        if (data.candidates && data.candidates[0]) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "No response. Check API Key." });
        }

    } catch (error) {
        res.status(500).json({ reply: "System Error: " + error.message });
    }
});

module.exports = app;
