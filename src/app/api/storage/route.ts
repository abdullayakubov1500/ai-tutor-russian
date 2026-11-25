import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStorageClient, isStorageConfigured } from "@/lib/storage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Neon Object Storage не настроен" },
      { status: 503 }
    );
  }

  try {
    const files = getStorageClient();
    const prefix = `users/${user.id}/`;
    const list = await files.list({ prefix });
    const items = await Promise.all(
      list.items.slice(0, 20).map(async (entry) => {
        const url = await files.url(entry.key, { expiresIn: 3600 });
        return { key: entry.key, url };
      })
    );
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Storage list error:", err);
    return NextResponse.json(
      { error: "Не удалось получить список файлов" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Neon Object Storage не настроен" },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Файл не передан" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "note.txt";
    const key = `users/${user.id}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const files = getStorageClient();
    await files.upload(key, buffer, {
      contentType: file.type || "application/octet-stream",
    });

    const url = await files.url(key, { expiresIn: 3600 });
    return NextResponse.json({ key, url }, { status: 201 });
  } catch (err) {
    console.error("Storage upload error:", err);
    return NextResponse.json(
      { error: "Не удалось загрузить файл в Neon Object Storage" },
      { status: 500 }
    );
  }
}
