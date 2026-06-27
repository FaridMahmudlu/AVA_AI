import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getPrompts, renderTemplate } from "@/lib/prompts";

const googleApiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: googleApiKey,
});

// Python kodundaki gibi birden fazla model deneme fonksiyonu
async function tryAllModels(
  prompt: string,
  imageContents: Array<{ type: "image"; image: string; mimeType: string }>,
) {
  const prompts = await getPrompts();
  const modelList = prompts.analyze.modelOrder;

  for (const modelName of modelList) {
    try {
      const result = streamText({
        model: google(modelName as any),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              ...imageContents,
            ],
          },
        ],
      });

      // İlk başarılı modeli döndür
      return result;
    } catch (error) {
      console.error(`Model ${modelName} hatası:`, error);
      // Bir sonraki modeli dene
      continue;
    }
  }

  // Hiçbiri çalışmazsa son modeli zorla dene
  return streamText({
    model: google("gemini-2.0-flash"),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          ...imageContents,
        ],
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    if (!googleApiKey) {
      return Response.json(
        {
          error:
            "Google API key bulunamadi. .env dosyasina GOOGLE_GENERATIVE_AI_API_KEY veya GOOGLE_API_KEY ekleyin.",
        },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const topic = formData.get("topic") as string;
    const transcript = formData.get("transcript") as string | null;
    const intervalSecRaw = formData.get("intervalSec") as string | null;
    const frames = formData.getAll("frames") as File[];

    if (!frames || frames.length === 0) {
      return Response.json(
        { error: "En az bir video karesi gerekli" },
        { status: 400 },
      );
    }

    // Kareleri modelin anlayacağı formata çeviriyoruz
    const imageContents: Array<{
      type: "image";
      image: string;
      mimeType: string;
    }> = [];

    for (const frame of frames) {
      const bytes = await frame.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      imageContents.push({
        type: "image",
        image: base64,
        mimeType: frame.type || "image/jpeg",
      });
    }

    const prompts = await getPrompts();
    
    // İnstagram Dil Parmak İzi (Context) Oluşturma
    let instagramContext = "";
    try {
      const { getSession } = await import("@/lib/auth");
      const user = await getSession();
      if (user && user.instagramProfileData) {
        const data = user.instagramProfileData as any;
        let contextParts = [
          `Instagram Kullanıcı Adı: @${data.username}`,
          `Takipçi Sayısı: ${data.followersCount}`,
        ];
        if (data.biography) {
          contextParts.push(`Biyografi: ${data.biography}`);
        }
        if (data.recentPosts && Array.isArray(data.recentPosts) && data.recentPosts.length > 0) {
          contextParts.push(`\nSon Paylaşımların Metinleri (Dil Parmak İzi analizi için):`);
          data.recentPosts.slice(0, 10).forEach((post: any, i: number) => {
            if (post.caption) {
              contextParts.push(`[Post ${i + 1}]: ${post.caption.trim()}`);
            }
          });
        }
        instagramContext = contextParts.join("\n");
      }
    } catch (e) {
      console.error("Instagram context alinirken hata:", e);
    }

    const promptText = renderTemplate(prompts.analyze.template, {
      topic: topic || "",
      transcript: transcript || "",
      intervalSec: Number(intervalSecRaw) || 2,
      instagramContext: instagramContext,
    });

    // Birden fazla model dene
    const result = await tryAllModels(promptText, imageContents);

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Analiz Hatasi:", error);
    return Response.json(
      { error: "Analiz sırasında hata oluştu" },
      { status: 500 },
    );
  }
}