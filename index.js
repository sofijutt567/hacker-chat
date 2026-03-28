const express = require('express');
const cors = require('cors');

const app = express();

// CORS Setup: Localhost se connection allow karne ke liye
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Check Route
app.get('/', (req, res) => {
    res.send("HealthXRay API is Live! Ready for Localhost requests.");
});

// Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        // Vercel Settings mein 'API_KEY_NEW' lazmi check karein
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });
        if (!apiKey) return res.status(500).json({ reply: "Backend Error: API Key missing on Vercel." });

        /**
         * HUMNE DYNAMIC MODEL LISTING SE HAT KAR DIRECT FLASH USE KIYA HAI
         * Kyunke Flash model free tier par sab se stable chalta hai.
         */
        const modelName = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        const data = await response.json();

        // 1. Agar Quota ka masla aaye (429 Error)
        if (response.status === 429) {
            return res.status(429).json({ 
                reply: "HealthXRay Busy Hai: Google ki free limit khatam ho gayi hai. Baraye meherbani 1 minute baad dobara koshish karein." 
            });
        }

        // 2. Agar Google koi aur error bhejta hai
        if (data.error) {
            console.error("Google Error:", data.error.message);
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        // 3. Successful Jawab
        if (data.candidates && data.candidates[0]?.content?.parts[0]) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "AI ne koi jawab nahi diya. Shayad prompt block ho gaya hai." });
        }

    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ reply: "Connection Error: " + error.message });
    }
});

module.exports = app;
