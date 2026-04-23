import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Max (by Hanz and Franz)",
    short_name: "Max",
    description:
      "Daily workouts and per-move weight tracking for your gym's equipment.",
    start_url: "/",
    display: "standalone",
    background_color: "#16092e",
    theme_color: "#16092e",
    orientation: "portrait",
    icons: [
      {
        src: "/max-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/max.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
