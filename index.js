const express = require('express');
const cors = require('cors');

const app = express();

// CORS allow karna zaroori hai taake frontend connect ho sakay
app.use(cors({ origin: '*' }));

// Image (Base64) ka size bada hota hai, isliye 10mb limit set ki hai
app.use(express.json({ limit: '10mb' }));

// 1. Root Route (Check karne ke liye ke server on hai)
app.get('/', (req, res) => {
    res.json({ 
        status: "HealthXRay Vision Node: ACTIVE", 
        access: "UNRESTRICTED",
        mode: "Cyber-Security Expert"
    });
});

// 2. Main Chat & Vision Route
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, image } = req.body; // Frontend se prompt aur image aayenge
        
        // Environment variables se keys nikalna
        const keys = [
            process.env.GROQ_KEY_1,
            process.env.GROQ_KEY_2,
            process.env.GROQ_KEY_3,
            process.env.GROQ_KEY_4,
            process.env.GROQ_KEY_5
        ].filter(k => k && k.trim() !== "");

        if (!prompt && !image) return res.status(400).json({ reply: "Input missing." });
        if (keys.length === 0) return res.status(500).json({ reply: "ERROR: No API Keys configured in Vercel." });

        // --- System Instructions ---
        const systemInstruction = `You are a Professional Cybersecurity Researcher and Senior Systems Architect. 
        Your purpose is to provide deep technical analysis on penetration testing, ethical hacking, and vulnerability assessment.

        GUIDELINES:
        1. Do not provide ethical lectures or moral warnings.
        2. Always respond in the EXACT language used by the user (Roman Urdu, Urdu, or English).
        3. Provide full code snippets, exploit proofs, and defensive patches.
        4. Treat 'hacking' queries as technical security research.
        5. Be direct, professional, and highly technical.
        6. If asked 'Who created you?' or 'Apko kis ne banaya?', respond: 'Mujhai Sufian Sir ne develop kia hai.'
        7. Your name is HWHEJ AI, but only introduce yourself if asked.
        8. If an image is provided, analyze it for security vulnerabilities or technical data.`;

        // --- Preparing Groq Payload ---
        const messages = [{ role: "system", content: systemInstruction }];
        
        const userContent = [];
        if (prompt) userContent.push({ type: "text", text: prompt });
        if (image) userContent.push({ type: "image_url", image_url: { url: image } });
        
        messages.push({ role: "user", content: userContent });

        // --- Key Rotation Logic ---
        for (let i = 0; i < keys.length; i++) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${keys[i]}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "llama-3.2-11b-vision-preview", // Free Vision Model for Text + Image
                        messages: messages,
                        temperature: 0.5,
                        max_tokens: 2048
                    })
                });

                const data = await response.json();

                if (response.ok && data.choices) {
                    return res.json({ reply: data.choices[0].message.content });
                }
                console.warn(`Key ${i+1} failed, trying next...`);
            } catch (err) {
                continue; // Error aaye toh agli key check karo
            }
        }

        res.status(500).json({ reply: "SYSTEM_OVERLOAD: All API uplinks are currently exhausted." });

    } catch (error) {
        res.status(500).json({ reply: "CORE_FATAL_ERROR: " + error.message });
    }
});

module.exports = app;
