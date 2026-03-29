const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Health Check
app.get('/', (req, res) => res.json({ status: "Multi-Key Groq API is Live" }));

// 2. Main Chat Route with Auto-Failover
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    // Aapki 5 Keys (Inhein Vercel Environment Variables mein save karein)
    const keys = [
        process.env.GROQ_KEY_1,
        process.env.GROQ_KEY_2,
        process.env.GROQ_KEY_3,
        process.env.GROQ_KEY_4,
        process.env.GROQ_KEY_5
    ].filter(k => k); // Khali keys ko nikal dega

    if (!prompt || keys.length === 0) {
        return res.status(400).json({ reply: "Prompt missing ya API Keys set nahi hain." });
    }

    // Har key ko baari baari try karne ka loop
    for (let i = 0; i < keys.length; i++) {
        try {
            console.log(`Trying Key ${i + 1}...`);
            
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
                            content: "You are a professional assistant. Respond in the SAME LANGUAGE the user uses. If they ask in Urdu/Roman Urdu, reply in professional Roman Urdu. If they ask in English, reply in professional English. Be concise and expert in coding." 
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();

            // Agar rate limit (429) ya koi error aaye toh agli key par jayein
            if (!response.ok || data.error) {
                console.warn(`Key ${i + 1} failed: ${data.error?.message || response.statusText}`);
                continue; // Agli key par jump karein
            }

            // Agar jawab mil gaya toh foran bhej dein
            return res.json({ reply: data.choices[0].message.content });

        } catch (error) {
            console.error(`Network error with Key ${i + 1}:`, error.message);
            // Loop chalta rahega agli key ke liye
        }
    }

    // Agar saari keys fail ho jayen
    res.status(500).json({ reply: "Sabaq: Saari API keys ki limit khatam ho chuki hai. Please thori der baad koshish karein." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running with ${process.env.PORT || 5000}`));

module.exports = app;
