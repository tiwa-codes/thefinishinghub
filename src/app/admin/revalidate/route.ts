import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Gated by src/middleware.ts like every other /admin/* route (staff-only) —
// intentionally not re-checking auth here, same as the rest of this
// feature's "don't touch the gate" scope.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const paths = body?.paths;

  if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
    return NextResponse.json(
      { error: "paths must be an array of strings" },
      { status: 400 },
    );
  }

  for (const path of paths as string[]) {
    if (path.startsWith("/")) revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true });
}
