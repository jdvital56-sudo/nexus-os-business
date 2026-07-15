import { NextResponse } from "next/server";
import { config, callAI } from "@/lib/config";
import { db } from "@/lib/db";

// Telegram webhook handler
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!config.features.telegramEnabled) {
      return NextResponse.json({ ok: true, demo: true, message: "Telegram not configured. Set TELEGRAM_BOT_TOKEN in .env" });
    }

    const message = body.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;
    const userName = message.from?.first_name || "User";

    // Find workspace with active Telegram bot
    const bots = db.aiBots.findMany({ active: true });
    const bot = bots.find((b: any) => {
      const channels = typeof b.channels === "string" ? JSON.parse(b.channels) : b.channels;
      return channels?.includes("telegram");
    });

    if (!bot) {
      await sendTelegramMessage(chatId, "No active bot configured for Telegram.");
      return NextResponse.json({ ok: true });
    }

    // AI response
    const ws = db.workspaces.findById(bot.workspaceId);
    const systemPrompt = `You are ${bot.name}, a helpful ${bot.type} bot for ${ws?.name || "the business"}. Be concise and professional.`;

    const aiResponse = await callAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ]);

    await sendTelegramMessage(chatId, aiResponse.content);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

// GET for webhook verification
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "Nexus OS Telegram Bot",
    configured: config.features.telegramEnabled,
  });
}

async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!config.telegram.botToken) return;

  await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}
