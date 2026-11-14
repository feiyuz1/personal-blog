import { redirect } from "next/navigation";

export default function ContactRoute() {
  redirect("/about#contact");
}
