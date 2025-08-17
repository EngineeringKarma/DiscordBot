require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

// Node 18+ has native fetch, but for older versions install node-fetch v2
const fetch = require("node-fetch"); 

// Safety check: Ensure API keys exist
if (!process.env.TOKEN || !process.env.OPENROUTER_KEY) {
  console.error("❌ Missing Discord token or OpenRouter API key in .env file!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const IGNORE_PREFIX = "!";

// Function to call OpenRouter API with Deadpool personality
async function getReplyFromAI(userMessage) {
  try {
    const response = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: "system",
            content: `
You are Deadpool. Reply sarcastically, wittily, and in-character to everything.
Break the fourth wall naturally, keep it fun and entertaining, and never sound boring.
Always make the response sound like Deadpool is talking directly to the user.
`
          },
          { role: "user", content: userMessage }
        ]
      }),
    });

    if (!response.ok) {
      console.error("❌ OpenRouter API returned error status:", response.status);
      return "Deadpool is temporarily speechless due to technical issues.";
    }

    const data = await response.json();

    // Safe logging without exposing the API key
    console.log("🔎 OpenRouter response preview:", JSON.stringify(data?.choices?.[0]?.message?.content || "No message content", null, 2));

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      data?.choices?.[0]?.text;

    return reply && reply.trim().length > 0
      ? reply
      : "Deadpool is temporarily speechless... which is extremely rare.";
  } catch (err) {
    console.error("❌ Error fetching from OpenRouter:", err);
    return "Deadpool tried to speak, but the internet ate his words.";
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  
  if (message.content.toLowerCase() === "ping") {
    return message.channel.send("I can talk now!");
  }

  if (message.content.startsWith(IGNORE_PREFIX)) return;

  try {
    const replyText = await getReplyFromAI(message.content);

    console.log("💬 Reply Text:", replyText);
    await message.reply(replyText);
  } catch (error) {
    console.error("❌ Error replying:", error);
    await message.reply(
      "Deadpool here — something broke and my mouth went silent. Oops!"
    );
  }
});

client.login(process.env.TOKEN);
