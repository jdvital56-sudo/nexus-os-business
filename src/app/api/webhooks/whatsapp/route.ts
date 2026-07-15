import { NextResponse } from "next/server";
import { config, callAI } from "@/lib/config";
import { db } from "@/lib/db";

// WhatsApp webhook verification (GET)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// WhatsApp message handler (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!config.features.whatsappEnabled) {
      return NextResponse.json({ ok: true, demo: true, message: "WhatsApp not configured" });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message?.text?.body) return NextResponse.json({ ok: true });

    const from = message.from;
    const text = message.text.body;

    // Find workspace with active WhatsApp bot
    const bots = db.aiBots.findMany({ active: true });
    const bot = bots.find((b: any) => {
      const channels = typeof b.channels === "string" ? JSON.parse(b.channels) : b.channels;
      return channels?.includes("whatsapp");
    });

    if (!bot) return NextResponse.json({ ok: true });

    const ws = db.workspaces.findById(bot.workspaceId);
    const systemPrompt = `You are ${bot.name}, a helpful ${bot.type} bot for ${ws?.name || "the business"}. Be concise and professional. Keep responses short for WhatsApp.`;

    const aiResponse = await callAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ]);

    await sendWhatsAppMessage(from, aiResponse.content);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("WhatsApp webhook error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  if (!config.whatsapp.phoneNumberId || !config.whatsapp.accessToken) return;

  await fetch(`https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.whatsapp.accessToken}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
}
