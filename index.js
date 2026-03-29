const express = require('express');
const cors = require('cors');

const app = express();

// 1. Precise CORS Setup (Har origin se request allow karega)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Health Check Route
app.get('/', (req, res) => {
    res.json({ 
        status: "Online", 
        message: "HealthXRay API is Live",
        timestamp: new Date().toISOString()
    });
});

// 3. Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Vercel par 'GEMINI_API_KEY' naam se variable save hona chahiye
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY_NEW;

        if (!prompt) {
            return res.status(400).json({ reply: "Sawal khali hai, kuch likh kar bhejein." });
        }

        if (!apiKey) {
            console.error("CRITICAL ERROR: API Key is missing.");
            return res.status(500).json({ reply: "Backend Error: API Key nahi mili (Vercel Settings check karein)." });
        }

        /**
         * STABLE MODEL CONFIGURATION
         * Hum 'v1' (stable) aur 'gemini-1.5-flash' use kar rahe hain.
         */
        const modelName = "gemini-1.5-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

        // External API Call using Fetch
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: prompt }] 
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        const data = await response.json();

        // Error handling for Gemini
        if (response.status === 429) {
            return res.status(429).json({ reply: "Google limit khatam! 1 minute baad koshish karein." });
        }

        if (data.error) {
            console.error("Google Error:", data.error.message);
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        // Response Logic
        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiReply) {
            res.json({ reply: aiReply });
        } else {
            const reason = data?.candidates?.[0]?.finishReason || "Unknown";
            res.json({ reply: `AI ne jawab nahi diya (Reason: ${reason}). Shayad content block ho gaya hai.` });
        }

    } catch (error) {
        console.error("Backend Server Error:", error.message);
        res.status(500).json({ reply: "Backend Connection Error: " + error.message });
    }
});

// Port handling for local and Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
