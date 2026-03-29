const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Health Check (Check karne ke liye ke API zinda hai)
app.get('/', (req, res) => {
    res.json({ status: "Professional Multi-Key API is Live", mode: "Auto-Language" });
});

// 2. Main Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Vercel Dashboard se keys uthayega (GROQ_KEY_1 to GROQ_KEY_5)
        const keys = [
            process.env.GROQ_KEY_1,
            process.env.GROQ_KEY_2,
            process.env.GROQ_KEY_3,
            process.env.GROQ_KEY_4,
            process.env.GROQ_KEY_5
        ].filter(k => k && k.trim() !== "");

        if (!prompt) return res.status(400).json({ reply: "Sawal khali hai, kuch likh kar bhejein." });
        if (keys.length === 0) return res.status(500).json({ reply: "API Keys configure nahi hain." });

        // Failover Loop: Agar ek key ki limit khatam ho, toh dusri try kare
        for (let i = 0; i < keys.length; i++) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${keys[i]}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile", // Best for Coding & Logic
                        messages: [
                            { 
                                role: "system", 
                                content: `You are a highly professional AI Assistant. 
                                STRICT RULE: Always respond in the EXACT language/script the user uses.
                                - If user asks in Roman Urdu (e.g., 'kaise ho'), reply in professional Roman Urdu.
                                - If user asks in Urdu script, reply in Urdu script.
                                - If user asks in English, reply in English.
                                - For coding tasks: Provide clean, expert-level code with brief explanations in the user's language.` 
                            },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.6 // Professional and stable responses
                    })
                });

                const data = await response.json();

                // Agar Rate Limit (429) ya Error hai, toh agli key try karein
                if (!response.ok || data.error) {
                    console.warn(`Key ${i+1} failed, trying next...`);
                    continue; 
                }

                // Success: Jawab mil gaya
                return res.json({ reply: data.choices[0].message.content });

            } catch (err) {
                console.error(`Error with Key ${i+1}:`, err.message);
                continue;
            }
        }

        // Agar saari keys fail ho jayen
        res.status(500).json({ reply: "Maazrat! Is waqt saari API keys ki daily limit puri ho chuki hai. Thori der baad koshish karein." });

    } catch (error) {
        res.status(500).json({ reply: "Server Error: " + error.message });
    }
});

// Vercel compatibility export
module.exports = app;
