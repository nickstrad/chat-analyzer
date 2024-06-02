import { runLiveStreamPrompt } from "@/utils/promptHelper";

export async function POST(req: Request) {
  const comments = await req.json();
  try {
    const data = await runLiveStreamPrompt(comments);
    return Response.json({ data });
  } catch (err) {
    console.error(err);
    return Response.json({ data: [] });
  }
}
