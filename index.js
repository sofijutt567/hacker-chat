const express = require('express');
const cors = require('cors');
// SAHI LINE YE HAI:
const { GoogleGenerativeAI } = require('@google/generative-ai'); 

const app = express();
// ... baqi code wahi rahega jo maine pehle diya tha


// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Health Check Route (Browsing check ke liye)
app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Live and Running!");
});

// 3. Gemini Configuration
// Ensure GEMINI_API_KEY is set in Vercel Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ reply: "Aapka sawal khali hai, please kuch likhein." });
        }

        // Model define karein (Gemini 1.5 Flash is recommended)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "Respond naturally in the same language or script used by the user. If they use Roman Urdu or Hindi, reply in the same. Keep it direct and short."
        });

        // Chat session start karein
        const chat = model.startChat({
            history: [],
            generationConfig: { 
                maxOutputTokens: 1000,
                temperature: 0.7 
            },
        });

        // Message bheinjein
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        // JSON Response
        res.json({ reply: text });

    } catch (error) {
        // Detailed error logging for Vercel
        console.error("Gemini Backend Error:", error);
        
        let errorMessage = "Sorry, server mein kuch masla hai.";
        if (error.message.includes("404")) {
            errorMessage = "Model not found. Please check model name spelling.";
        } else if (error.message.includes("403")) {
            errorMessage = "API Key invalid hai ya permissions ka masla hai.";
        }

        res.status(500).json({ reply: errorMessage });
    }
});

// Vercel ke liye export
module.exports = app;
