import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0A0F1C",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          Theta Simplified
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#B0B8C4",
            marginTop: "16px",
          }}
        >
          Live Theta Network indexes
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
