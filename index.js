const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration: Localhost aur doosri domains ko allow karne ke liye
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Root Route (Checking ke liye)
app.get('/', (req, res) => {
    res.send("HealthXRay API is Live! Connection is Open for Localhost.");
});

// Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Vercel Environment Variables se key uthayein
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });
        if (!apiKey) return res.status(500).json({ reply: "Backend Error: API Key missing on Vercel." });

        // STEP 1: Pehle check karein aapki key par kaunse models enabled hain
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();

        if (listData.error) {
            return res.status(500).json({ reply: "Google API Error: " + listData.error.message });
        }

        // Available models ki list nikaalein
        const availableModels = listData.models ? listData.models.map(m => m.name) : [];
        
        // STEP 2: Behtareen model select karein jo aapki key par available ho
        let selectedModel = "models/gemini-1.5-flash"; // Default setup
        
        if (availableModels.includes("models/gemini-1.5-flash-latest")) {
            selectedModel = "models/gemini-1.5-flash-latest";
        } else if (availableModels.includes("models/gemini-pro")) {
            selectedModel = "models/gemini-pro";
        }

        // STEP 3: Gemini API ko call karein
        const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        });

        const data = await response.json();

        // Final Response Check
        if (data.error) {
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "AI ne koi jawab generate nahi kiya. Key check karein." });
        }

    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ reply: "Connection Error: " + error.message });
    }
});

// Vercel ke liye export
module.exports = app;
