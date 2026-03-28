const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live (Stable Mode)!");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Prompt missing hai." });

        // STABLE ENDPOINT: v1 use kar rahe hain aur model gemini-pro
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Agar Google error deta hai
        if (data.error) {
            console.error("Google API Error Details:", data.error);
            return res.status(data.error.code || 500).json({ reply: "Google API Error: " + data.error.message });
        }

        // Response extraction (Safe check ke sath)
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "AI ne koi jawab nahi diya. Dubara koshish karein." });
        }

    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ reply: "Connection Error: " + error.message });
    }
});

module.exports = app;
