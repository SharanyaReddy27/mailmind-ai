require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = process.env.GEMINI_API_KEY;
const client = new GoogleGenerativeAI(key);
const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'];

(async () => {
  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'Say hi in one word.' }] }] });
      const text = result.response.text();
      console.log(modelName, '=>', text);
    } catch (err) {
      console.log(modelName, 'ERROR', err.message);
    }
  }
})();
