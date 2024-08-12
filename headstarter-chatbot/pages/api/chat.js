// pages/api/chat.js

import { OpenAI } from 'openai';

export default async function handler(req, res) {
  const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  if (req.method === 'POST') {
    const { messages } = req.body;  // Expect an array of messages

    try {
      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: messages,  // Pass the entire conversation history
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
      });

      // Directly access the response instead of treating it as an async iterable
      const botResponse = completion.choices[0]?.message?.content || "No response";

      res.status(200).json({ response: botResponse });
    } catch (error) {
      console.error('Error fetching NVIDIA response:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: "Failed to fetch NVIDIA response" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
