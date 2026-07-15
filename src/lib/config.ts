// ─── Nexus OS Business — Configuration ─────────────────────────────
// When user provides API keys, they go here.

export const config = {
  // AI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o",
    maxTokens: 4096,
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || "",
    model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
  },

  // Messaging
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  },

  // Payments
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  // Email
  email: {
    provider: (process.env.EMAIL_PROVIDER || "console") as "sendgrid" | "smtp" | "console",
    sendgridKey: process.env.SENDGRID_API_KEY || "",
    from: process.env.EMAIL_FROM || "noreply@nexusos.com",
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  },

  // App
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET || "nexus-dev-secret-change-in-production",
  },

  // Feature flags
  features: {
    aiEnabled: !!(process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY),
    telegramEnabled: !!process.env.TELEGRAM_BOT_TOKEN,
    whatsappEnabled: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    emailEnabled: process.env.EMAIL_PROVIDER !== "console",
  },
};

// ─── AI Provider Abstraction ───────────────────────────────────────

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: { prompt: number; completion: number; total: number };
}

export async function callAI(messages: AIMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<AIResponse> {
  const { temperature = 0.7, maxTokens = 2048 } = options || {};

  // Try OpenAI first
  if (config.openai.apiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openai.apiKey}` },
      body: JSON.stringify({ model: config.openai.model, messages, temperature, max_tokens: maxTokens }),
    });
    const data = await res.json();
    if (data.choices?.[0]) {
      return { content: data.choices[0].message.content, usage: data.usage };
    }
  }

  // Try Claude
  if (config.claude.apiKey) {
    const systemMsg = messages.find((m) => m.role === "system")?.content || "";
    const userMsgs = messages.filter((m) => m.role !== "system");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": config.claude.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: config.claude.model, system: systemMsg, messages: userMsgs, max_tokens: maxTokens, temperature }),
    });
    const data = await res.json();
    if (data.content?.[0]) {
      return { content: data.content[0].text, usage: data.usage };
    }
  }

  // Demo mode — return simulated response
  return { content: generateDemoAIResponse(messages[messages.length - 1]?.content || ""), usage: { prompt: 0, completion: 0, total: 0 } };
}

function generateDemoAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("lead") || lower.includes("customer")) {
    return "Based on my analysis, this lead has a score of 78/100. Key factors: established business (5+ years), active social media presence, recent website update. Recommendation: prioritize outreach via email with a personalized demo offer.";
  }
  if (lower.includes("email") || lower.includes("campaign")) {
    return "I recommend a 5-step email sequence:\n\n1. Day 0: Introduction + value proposition\n2. Day 2: Case study from similar business\n3. Day 5: Free trial offer\n4. Day 8: Social proof + testimonials\n5. Day 12: Limited-time discount\n\nExpected conversion rate: 3-5%.";
  }
  if (lower.includes("report") || lower.includes("analytics")) {
    return "Weekly Summary:\n• New leads: 24 (+12% vs last week)\n• Qualified leads: 8 (33% qualification rate)\n• Deals in pipeline: 5 ($47,000 total)\n• Conversion rate: 4.2%\n• Best performing channel: Google Maps (42% of leads)\n\nRecommendation: Increase Google Maps outreach budget by 20%.";
  }
  if (lower.includes("automation") || lower.includes("workflow")) {
    return "I suggest setting up these automations:\n\n1. **Lead Welcome** → Instant email when new lead is captured\n2. **Follow-up** → Reminder after 3 days if no response\n3. **Qualification** → AI score leads automatically\n4. **Deal Won** → Trigger onboarding workflow\n5. **Review Request** → Ask for review 7 days after service\n\nShall I create any of these?";
  }
  return "I understand your request. Based on your business profile, I recommend focusing on lead generation and automation first. These two areas typically deliver the highest ROI within the first 30 days. Would you like me to help with either of these?";
}
