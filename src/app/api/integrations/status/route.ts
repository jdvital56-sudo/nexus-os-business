import { apiSuccess } from "@/lib/api-helpers";
import { config } from "@/lib/config";

export async function GET() {
  return apiSuccess({
    integrations: [
      { id: "openai", name: "OpenAI", status: config.features.aiEnabled ? "connected" : "not_configured", description: "AI for bots, agents, lead scoring" },
      { id: "claude", name: "Claude (Anthropic)", status: config.claude.apiKey ? "connected" : "not_configured", description: "Alternative AI provider" },
      { id: "telegram", name: "Telegram Bot", status: config.features.telegramEnabled ? "connected" : "not_configured", description: "Customer messaging via Telegram" },
      { id: "whatsapp", name: "WhatsApp Business", status: config.features.whatsappEnabled ? "connected" : "not_configured", description: "Customer messaging via WhatsApp" },
      { id: "stripe", name: "Stripe Payments", status: config.features.stripeEnabled ? "connected" : "not_configured", description: "Accept payments" },
      { id: "email", name: "Email (SendGrid)", status: config.features.emailEnabled ? "connected" : "not_configured", description: "Email campaigns and notifications" },
    ],
    demo: !config.features.aiEnabled,
  });
}
