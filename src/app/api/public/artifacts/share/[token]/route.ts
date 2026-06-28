import { NextResponse } from "next/server";
import { getSharedArtifact } from "@/actions/workspace";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const artifact = await getSharedArtifact(token);

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(artifact);
}
