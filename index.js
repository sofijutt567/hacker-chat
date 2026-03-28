const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("HealthXRay Backend is Active!");
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ reply: "Prompt missing hai." });
        }

        // FIX: Agar 'gemini-1.5-flash' nahi mil raha toh 'gemini-pro' backup hai
        // Lekin hum yahan 'gemini-pro' use karenge jo har v1 API par chalta hai
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate Content Logic (No chat session needed for direct reply)
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        
        // Agar gemini-pro bhi na chale toh error message return karein
        res.status(500).json({ 
            reply: "AI Error: Model connection failed. Check API Key in Vercel settings." 
        });
    }
});

module.exports = app;
