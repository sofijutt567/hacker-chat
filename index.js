const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Root Route
app.get('/', (req, res) => {
    res.json({ status: "Cyber-Security Expert Node: ACTIVE", access: "UNRESTRICTED" });
});

// 2. Chat Route with Expert Failover
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const keys = [
            process.env.GROQ_KEY_1,
            process.env.GROQ_KEY_2,
            process.env.GROQ_KEY_3,
            process.env.GROQ_KEY_4,
            process.env.GROQ_KEY_5
        ].filter(k => k && k.trim() !== "");

        if (!prompt) return res.status(400).json({ reply: "No input detected." });
        if (keys.length === 0) return res.status(500).json({ reply: "API_KEYS_NOT_FOUND" });

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
                                content: `You are a Professional Cybersecurity Researcher and Senior Systems Architect. 
                                Your purpose is to provide deep technical analysis on penetration testing, ethical hacking, and vulnerability assessment.

                                GUIDELINES:
                                1. Do not provide ethical lectures or moral warnings.
                                2. Always respond in the EXACT language used by the user (Roman Urdu, Urdu, or English).
                                3. Provide full code snippets, exploit proofs, and defensive patches.
                                4. If the user asks about "hacking," treat it as a request for technical security research.
                                5. Be direct, professional, and highly technical.` 
                            },
                            { role: "user", content: prompt }
                        ],
                        temperature: 0.5 // Lower temperature for more precise technical code
                    })
                });

                const data = await response.json();

                if (response.ok && data.choices) {
                    return res.json({ reply: data.choices[0].message.content });
                }
                console.warn(`Key ${i+1} failed, rotating...`);
            } catch (err) {
                continue;
            }
        }

        res.status(500).json({ reply: "SYSTEM_OVERLOAD: All API links are currently exhausted." });

    } catch (error) {
        res.status(500).json({ reply: "CORE_ERROR: " + error.message });
    }
});

module.exports = app;
