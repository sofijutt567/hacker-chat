const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.send("API is Live!"));

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY_NEW;

        if (!prompt || !apiKey) {
            return res.status(400).json({ reply: "Missing prompt or API Key." });
        }

        /**
         * VERSION CHANGE: 
         * Agar v1beta 404 de raha hai, toh hum 'v1' use karenge 
         * aur model name ko 'gemini-pro' ya 'gemini-1.5-flash' check karenge.
         */
        // Is URL ko copy karke replace karein:
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;


        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Agar 404 abhi bhi aaye, toh gemini-pro try karein (Backup)
        if (response.status === 404) {
            console.log("Flash not found, trying Pro model...");
            const backupUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
            const backupRes = await fetch(backupUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const backupData = await backupRes.json();
            
            if (backupData.candidates) {
                return res.json({ reply: backupData.candidates[0].content.parts[0].text });
            }
        }

        if (data.error) {
            return res.status(data.error.code || 500).json({ reply: "Google Error: " + data.error.message });
        }

        if (data.candidates) {
            res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.json({ reply: "AI ne koi jawab nahi diya." });
        }

    } catch (error) {
        res.status(500).json({ reply: "Error: " + error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server Live"));

module.exports = app;
