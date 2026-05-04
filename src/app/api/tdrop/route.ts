import { NextResponse } from "next/server";
import { fetchTdropData } from "../../../lib/tdrop";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchTdropData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("TDROP fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch TDROP data" },
      { status: 500 }
    );
  }
}
