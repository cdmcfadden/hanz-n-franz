import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hanz n Franz",
    short_name: "Hanz n Franz",
    description:
      "Daily workouts + per-move weight tracking for your gym's equipment.",
    start_url: "/equipment",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#09090b",
    orientation: "portrait",
    icons: [
      {
        src: "/users/chris.jpg",
        sizes: "any",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
