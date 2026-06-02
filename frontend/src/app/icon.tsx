import { ImageResponse } from "next/og";

// Route segment config — render on the edge.
export const runtime = "edge";

// Icon metadata consumed by Next to emit the app icon <link> tags.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Branded square app icon generated at build/request time (no static asset needed).
export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7B68EE 0%, #D4A843 100%)",
          color: "#FEF7FF",
          fontSize: 320,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        V
      </div>
    ),
    { ...size },
  );
}
