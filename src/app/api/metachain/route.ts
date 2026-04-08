import { NextResponse } from "next/server";
import { fetchMetachainData } from "../../../lib/metachain/data";

export const revalidate = 60;

/**
 * GET /api/metachain
 *
 * Returns current composite score + per-chain breakdown + history.
 * Also used as a client-side refresh endpoint.
 */
export async function GET() {
  try {
    const data = await fetchMetachainData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Metachain API failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch metachain data" },
      { status: 500 }
    );
  }
}
