// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Al entrar a la app, te lleva a Proyectos
  redirect("/proyecto");
  return null;
}
