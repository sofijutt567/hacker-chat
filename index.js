const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });

        // Step 1: Pehle models ki list mangwayein (Dynamic Check)
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        if (listData.error) {
            return res.status(500).json({ reply: "Google API Key Error: " + listData.error.message });
        }

        // Step 2: Available models mein se behtareen select karein
        const models = listData.models || [];
        // Hum check karenge ke 'gemini-1.5-flash' ya 'gemini-pro' mein se kya hai
        let modelToUse = models.find(m => m.name.includes('gemini-1.5-flash'))?.name 
                         || models.find(m => m.name.includes('gemini-pro'))?.name;

        if (!modelToUse) {
            return res.status(500).json({ reply: "Aapki key par koi bhi Gemini model active nahi mila." });
        }

        // Step 3: Call the selected model
        const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`;

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "Model mil gaya par jawab nahi aaya. Error: " + (data.error?.message || "Unknown") });
        }

    } catch (error) {
        res.status(500).json({ reply: "System Error: " + error.message });
    }
});

module.exports = app;
