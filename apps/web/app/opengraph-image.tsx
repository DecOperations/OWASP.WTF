import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "OWASP.WTF - AI-Powered Security Auditing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0f",
          padding: "60px 80px",
          fontFamily: "monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,65,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {/* Glow effect top-right */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,65,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Glow effect bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top bar with logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ff3333, #ff6633)",
              fontSize: "24px",
            }}
          >
            🐝
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            }}
          >
            <span
              style={{ fontSize: "32px", fontWeight: 700, color: "#e4e4e7" }}
            >
              OWASP
            </span>
            <span
              style={{ fontSize: "32px", fontWeight: 700, color: "#00ff41" }}
            >
              .WTF
            </span>
          </div>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#e4e4e7",
              lineHeight: 1.1,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>AI-Powered</span>
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #00ff41, #00d4ff)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Security Auditing
            </span>
          </div>

          <p
            style={{
              fontSize: "24px",
              color: "#71717a",
              marginTop: "8px",
              lineHeight: 1.4,
            }}
          >
            Scan any codebase for OWASP vulnerabilities in seconds.
          </p>
        </div>

        {/* Terminal snippet at bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            marginTop: "auto",
            padding: "24px 32px",
            backgroundColor: "rgba(18,18,26,0.8)",
            borderRadius: "12px",
            border: "1px solid #27272a",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#00ff41", fontSize: "18px" }}>$</span>
              <span style={{ color: "#e4e4e7", fontSize: "18px" }}>
                npx owasp-wtf
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#00ff41", fontSize: "18px" }}>
                Score: 72/100
              </span>
              <span style={{ color: "#71717a", fontSize: "18px" }}>|</span>
              <span style={{ color: "#ff3333", fontSize: "16px" }}>
                CRITICAL 2
              </span>
              <span style={{ color: "#71717a", fontSize: "18px" }}>|</span>
              <span style={{ color: "#ffb000", fontSize: "16px" }}>HIGH 5</span>
              <span style={{ color: "#71717a", fontSize: "18px" }}>|</span>
              <span style={{ color: "#ffb000", fontSize: "16px" }}>
                MEDIUM 8
              </span>
              <span style={{ color: "#71717a", fontSize: "18px" }}>|</span>
              <span style={{ color: "#00d4ff", fontSize: "16px" }}>LOW 12</span>
            </div>
          </div>
        </div>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            backgroundColor: "rgba(0,255,65,0.1)",
            borderRadius: "20px",
            border: "1px solid rgba(0,255,65,0.2)",
          }}
        >
          <span style={{ color: "#00ff41", fontSize: "18px", fontWeight: 600 }}>
            owasp.wtf
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
