import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Max (by Hanz and Franz)",
    short_name: "Max",
    description:
      "Daily workouts and per-move weight tracking for your gym's equipment.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    icons: [
      {
        src: "/hanz-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/hanz.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
