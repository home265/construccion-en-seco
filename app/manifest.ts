// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bob Constructor - En Seco",
    short_name: "Bob Seco",
    description: "Cómputo de materiales para construcción en seco. Funciona offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#2C3333",
    theme_color: "#0E8388",
    // icons: [
//   {
//     src: "/icons/icon-192.png",
//     sizes: "192x192",
//     type: "image/png",
//   },
//   {
//     src: "/icons/icon-512.png",
//     sizes: "512x512",
//     type: "image/png",
//   },
// ],
  };
}
// NOTA: No te olvides de crear una carpeta /public/icons y poner ahí
// dos imágenes con esos nombres (icon-192.png y icon-512.png).