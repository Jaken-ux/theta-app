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
          background:
            "linear-gradient(135deg, #0A0F1C 0%, #151D2E 50%, #0D1117 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow top-right */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(42,184,230,0.18) 0%, rgba(42,184,230,0) 70%)",
            display: "flex",
          }}
        />

        {/* Glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 70%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #2AB8E6 0%, #10B981 100%)",
              color: "white",
              fontSize: "32px",
              fontWeight: 800,
              marginBottom: "32px",
              letterSpacing: "-1px",
            }}
          >
            TS
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "76px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            Theta Simplified
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "26px",
              color: "#B0B8C4",
              marginTop: "20px",
              marginBottom: "48px",
              letterSpacing: "0.3px",
            }}
          >
            Live Theta Network indexes
          </div>

          {/* Pills */}
          <div
            style={{
              display: "flex",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(42,184,230,0.35)",
                background: "rgba(42,184,230,0.1)",
                color: "#2AB8E6",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#2AB8E6",
                  display: "flex",
                }}
              />
              Main Chain Activity
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(16,185,129,0.35)",
                background: "rgba(16,185,129,0.1)",
                color: "#10B981",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "flex",
                }}
              />
              Metachain Utilization
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.1)",
                color: "#F59E0B",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#F59E0B",
                  display: "flex",
                }}
              />
              TFUEL Economics
            </div>
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            display: "flex",
            color: "#5C6675",
            fontSize: "16px",
            letterSpacing: "0.5px",
          }}
        >
          thetasimplified.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
