const express = require('express');
const cors = require('cors');
// Local testing ke liye dotenv zaroori hai
require('dotenv').config(); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live and Dynamic!");
});

// Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        // Check karein ke variable ka naam wahi ho jo aapne .env ya Vercel mein rakha hai
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });
        if (!apiKey) return res.status(500).json({ reply: "API Key missing hai server par." });

        // Step 1: Available models check karna
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        if (listData.error) {
            return res.status(500).json({ reply: "Google List Error: " + listData.error.message });
        }

        const availableModels = listData.models ? listData.models.map(m => m.name) : [];
        console.log("Available Models on your Key:", availableModels);

        // Step 2: Best Model Selection Logic
        let selectedModel = "models/gemini-1.5-flash"; // Default
        if (availableModels.includes("models/gemini-1.5-flash-latest")) {
            selectedModel = "models/gemini-1.5-flash-latest";
        } else if (availableModels.includes("models/gemini-pro")) {
            selectedModel = "models/gemini-pro";
        }

        // Step 3: API Call
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
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "AI ne koi response generate nahi kiya." });
        }

    } catch (error) {
        console.error("Server Crash Error:", error.message);
        res.status(500).json({ reply: "System Error: " + error.message });
    }
});

// LOCALHOST LISTENER (Vercel ke liye module.exports kaam karega, Local ke liye listen)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Test simple link: http://localhost:${PORT}/`);
    });
}

module.exports = app;
