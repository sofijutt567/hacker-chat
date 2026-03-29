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
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY_NEW;

        if (!prompt) return res.status(400).json({ reply: "Prompt is required." });
        if (!apiKey) return res.status(500).json({ reply: "API Key missing in Vercel settings." });

        /**
         * FIX: Hum v1beta use karenge kyunke flash model beta mein 
         * zyada support hota hai free users ke liye.
         */
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        });

        const data = await response.json();

        // Agar Google koi error deta hai
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            return res.status(data.error.code || 500).json({ 
                reply: `Google Error: ${data.error.message}` 
            });
        }

        // Success Jawab
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const aiReply = data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.json({ reply: "AI ne koi jawab nahi diya. Prompt block ho gaya ya logic fail hui." });
        }

    } catch (error) {
        console.error("Server Crash Error:", error.message);
        res.status(500).json({ reply: "Server Error: " + error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

module.exports = app;
