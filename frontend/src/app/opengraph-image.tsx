import { ImageResponse } from "next/og";

// Route segment config — render on the edge for fast OG generation.
export const runtime = "edge";

// Image metadata consumed by Next to wire up <meta property="og:image"> tags.
export const alt = "Viraha — Keep your travels alive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded Open Graph card generated at build/request time (no static asset needed).
export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1A1A2E 0%, #5A4FCF 55%, #7B68EE 100%)",
          color: "#FEF7FF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 32,
            marginBottom: 40,
            background: "linear-gradient(135deg, #7B68EE 0%, #D4A843 100%)",
            color: "#FEF7FF",
            fontSize: 84,
            fontWeight: 700,
          }}
        >
          V
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Viraha
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 400,
            color: "#DDD6FE",
            textAlign: "center",
            maxWidth: 880,
            lineHeight: 1.25,
          }}
        >
          Keep your travels alive — a memory platform where every journey finds
          its place.
        </div>
      </div>
    ),
    { ...size },
  );
}
