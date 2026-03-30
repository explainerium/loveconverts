import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LoveConverts: Free Image Converter and Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FF4747 0%, #FF8C42 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: "white", marginBottom: 16, display: "flex" }}>
          LoveConverts
        </div>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.9)", textAlign: "center", maxWidth: 800, display: "flex" }}>
          Free Image Converter & Social Media Downloader
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)", marginTop: 20, display: "flex" }}>
          loveconverts.com
        </div>
      </div>
    ),
    { ...size }
  );
}
