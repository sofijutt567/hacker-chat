const express = require('express');
const cors = require('cors');

const app = express();

// 1. CORS Setup
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Health Check
app.get('/', (req, res) => {
    res.json({ status: "Live", message: "HealthXRay Backend is working!" });
});

// 3. Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        // Check both variable names just in case
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY_NEW;

        if (!prompt) return res.status(400).json({ reply: "Prompt missing." });
        if (!apiKey) return res.status(500).json({ reply: "API Key missing in Vercel settings." });

        /**
         * UPDATED URL:
         * Google API v1beta requires this exact format for Gemini 1.5 Flash.
         */
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // Handle Google API specific errors
        if (data.error) {
            console.error("Google Error Details:", data.error);
            return res.status(data.error.code || 500).json({ 
                reply: `Google API Error: ${data.error.message}` 
            });
        }

        // Handle Success
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "AI ne koi jawab nahi diya. Check Finish Reason: " + (data.candidates?.[0]?.finishReason || "Unknown") });
        }

    } catch (error) {
        console.error("Server Crash:", error.message);
        res.status(500).json({ reply: "Internal Server Error: " + error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
