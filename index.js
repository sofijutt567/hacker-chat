const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live and Dynamic!");
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.API_KEY_NEW;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });

        // Step 1: Pehle models ki list check karte hain (Debug ke liye)
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        // Step 2: Available models mein se koi ek select karein
        // Hum "gemini-1.5-flash-latest" ya "gemini-pro" try karenge jo 100% available hote hain
        const availableModels = listData.models ? listData.models.map(m => m.name) : [];
        console.log("Available Models:", availableModels);

        // Best match select karna
        let selectedModel = "models/gemini-1.5-flash"; // Default
        if (availableModels.includes("models/gemini-1.5-flash-latest")) {
            selectedModel = "models/gemini-1.5-flash-latest";
        } else if (availableModels.includes("models/gemini-pro")) {
            selectedModel = "models/gemini-pro";
        }

        // Step 3: Selected model ko call karein
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
            return res.status(500).json({ 
                reply: `Google Error: ${data.error.message}. Try creating a new API key in a fresh project.` 
            });
        }

        const aiReply = data.candidates[0].content.parts[0].text;
        res.json({ reply: aiReply });

    } catch (error) {
        res.status(500).json({ reply: "System Error: " + error.message });
    }
});

module.exports = app;
