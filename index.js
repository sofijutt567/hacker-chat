const express = require('express');
const cors = require('cors');

const app = express();

// 1. Precise CORS Setup
app.use(cors({
    origin: '*', // Production mein yahan apni frontend domain ka link dena behtar hai
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 2. Health Check Route (Hamesha JSON bhejein)
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
        
        // API Key safety check
        const apiKey = process.env.API_KEY_NEW || process.env.GEMINI_API_KEY;

        if (!prompt) {
            return res.status(400).json({ reply: "Sawal khali hai, kuch likh kar bhejein." });
        }

        if (!apiKey) {
            console.error("CRITICAL ERROR: API Key is missing in Environment Variables.");
            return res.status(500).json({ reply: "Backend Config Error: API Key nahi mili." });
        }

        const modelName = "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        // External API Call
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const rawError = await response.text();
            throw new Error(`Google API sent non-JSON response: ${rawError.substring(0, 100)}`);
        }

        const data = await response.json();

        // 4. Detailed Error Handling for Gemini
        if (response.status === 429) {
            return res.status(429).json({ reply: "Limit khatam! 1 minute baad koshish karein." });
        }

        if (data.error) {
            return res.status(500).json({ reply: `Google Error: ${data.error.message}` });
        }

        // 5. Success Logic with Optional Chaining
        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiReply) {
            res.json({ reply: aiReply });
        } else {
            // Check if blocked by safety filters
            const finishReason = data?.candidates?.[0]?.finishReason;
            res.json({ reply: `AI ne jawab nahi diya. Reason: ${finishReason || "Unknown"}` });
        }

    } catch (error) {
        console.error("Backend Server Error:", error.message);
        res.status(500).json({ reply: "Backend Error: " + error.message });
    }
});

// Port handling for local and Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
