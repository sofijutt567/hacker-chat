// 1. Dotenv load karein (Sirf local testing ke liye kaam aata hai)
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

const app = express();

// 2. Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// 3. Health Check
app.get('/', (req, res) => {
    res.json({ status: "Multi-Key Groq API is Live", time: new Date().toISOString() });
});

// 4. Main Chat Route with Auto-Failover
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Keys array (Vercel Dashboard se uthayega)
        const keys = [
            process.env.GROQ_KEY_1,
            process.env.GROQ_KEY_2,
            process.env.GROQ_KEY_3,
            process.env.GROQ_KEY_4,
            process.env.GROQ_KEY_5
        ].filter(k => k && k.trim() !== "");

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai." });
        if (keys.length === 0) return res.status(500).json({ reply: "Backend Error: API Keys configure nahi hain." });

        // Failover Loop
        for (let i = 0; i < keys.length; i++) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${keys[i]}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { 
                                role: "system", 
                                content: "You are a professional assistant. Respond in the EXACT SAME LANGUAGE the user uses (Urdu, Roman Urdu, or English). If it's a coding question, provide expert and clean code." 
                            },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.7
                    })
                });

                const data = await response.json();

                // Agar Rate Limit (429) ya invalid key hai, toh agli key try karein
                if (!response.ok || data.error) {
                    console.error(`Key ${i + 1} failed, trying next...`);
                    continue; 
                }

                // Success! Response bhej dein
                return res.json({ reply: data.choices[0].message.content });

            } catch (innerError) {
                console.error(`Error with Key ${i + 1}:`, innerError.message);
                continue;
            }
        }

        // Agar sari keys khatam ho jayen
        res.status(500).json({ reply: "Sabaq: Saari API keys ki limit khatam ho chuki hai. Please thori der baad koshish karein." });

    } catch (error) {
        res.status(500).json({ reply: "Server Error: " + error.message });
    }
});

// 5. Vercel ke liye Export (Zaroori)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
