import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export async function NavbarServer() {
  const user = await getCurrentUser();
  return <Navbar user={user} />;
}
