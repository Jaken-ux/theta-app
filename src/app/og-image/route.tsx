import { ImageResponse } from "next/og";

export const runtime = "edge";

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
          background: "linear-gradient(135deg, #0A0F1C 0%, #151D2E 50%, #0D1117 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(42,53,72,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,53,72,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42,184,230,0.08) 0%, transparent 70%)",
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
          {/* Logo/brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2AB8E6 0%, #10B981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: "white",
                fontWeight: 700,
              }}
            >
              TS
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "white",
              margin: 0,
              letterSpacing: "-2px",
              lineHeight: 1.1,
            }}
          >
            Theta Simplified
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "24px",
              color: "#B0B8C4",
              margin: "16px 0 40px",
              letterSpacing: "0.5px",
            }}
          >
            Live Theta Network indexes
          </p>

          {/* Three index pills */}
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(42,184,230,0.3)",
                background: "rgba(42,184,230,0.08)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#2AB8E6",
                  display: "flex",
                }}
              />
              <span style={{ color: "#2AB8E6", fontSize: "16px", fontWeight: 600 }}>
                Main Chain Activity
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(16,185,129,0.3)",
                background: "rgba(16,185,129,0.08)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "flex",
                }}
              />
              <span style={{ color: "#10B981", fontSize: "16px", fontWeight: 600 }}>
                Metachain Utilization
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#F59E0B",
                  display: "flex",
                }}
              />
              <span style={{ color: "#F59E0B", fontSize: "16px", fontWeight: 600 }}>
                TFUEL Economics
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "#5C6675", fontSize: "14px" }}>
            theta-simplified.vercel.app
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
