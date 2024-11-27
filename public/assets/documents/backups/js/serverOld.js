// require('dotenv').config();
// const express = require('express');
// const fetch = require('node-fetch');
// const app = express();

// app.use(express.json());

// app.post('/api/openai', async (req, res) => {
//     const prompt = req.body.prompt;

//     try {
//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//             },
//             body: JSON.stringify({
//                 model: 'gpt-3.5-turbo',
//                 messages: [
//                     { role: 'system', content: 'You are a helpful assistant.' },
//                     { role: 'user', content: prompt },
//                 ],
//                 max_tokens: 200,
//                 temperature: 0.7,
//             }),
//         });

//         const data = await response.json();
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'Erreur avec l\'API OpenAI.' });
//     }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Serveur en écoute sur http://localhost:${PORT}`));
