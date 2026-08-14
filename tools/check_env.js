const keys = ['PORT','MONGO_URI','JWT_SECRET','FRONTEND_URL','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','GEMINI_API_KEY','GEMINI_MODEL'];
const result = {};
for (const k of keys) {
  result[k] = !!process.env[k];
}
console.log(JSON.stringify(result, null, 2));
