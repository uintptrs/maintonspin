import { sendMessage } from "@/utils/httpClient";

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

export default async function handler(req, res) {
  if (!req.method === "POST") return;
  const { text } = req.body;
  await sendMessage(TOKEN, CHAT_ID, text);
  return await res.status(200).json({ status: true });
}
