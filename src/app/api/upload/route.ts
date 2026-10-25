import { isAdmin } from "@/lib/auth";
import { saveUpload, type Purpose } from "@/lib/uploads";

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please log in again" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    const purpose: Purpose = form.get("purpose") === "map" ? "map" : "photo";
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "No file received" }, { status: 400 });
    }
    const key = await saveUpload(file, purpose);
    return Response.json({ key });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
