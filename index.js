const express = require('express');
const cors = require('cors');

const app = express();

// CORS KO ALLOW KARNA LAZMI HAI (Localhost se connect karne ke liye)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay API is Live! Connection is Open for Localhost.");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        // Check karein ke Vercel mein 'API_KEY_NEW' save hai ya nahi
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });
        if (!apiKey) return res.status(500).json({ reply: "API Key missing hai." });

        // Step 1: Available models list
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        if (listData.error) {
            return res.status(500).json({ reply: "Google API Error: " + listData.error.message });
        }

        const availableModels = listData.models ? listData.models.map(m => m.name) : [];
        
        // Step 2: Model Select
        let selectedModel = "models/gemini-1.5-flash"; 
        if (availableModels.includes("models/gemini-1.5-flash-latest")) {
            selectedModel = "models/gemini-1.5-flash-latest";
        } else if (availableModels.includes("models/gemini-pro")) {
            selectedModel = "models/gemini-pro";
        }

        // Step 3: Chat Call
        const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "AI ne koi jawab generate nahi kiya." });
        }

    } catch (error) {
        res.status(500).json({ reply: "System Error: " + error.message });
    }
});

module.exports = app;
