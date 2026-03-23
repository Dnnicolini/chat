import HelpdeskPlayground from "@/app/ui/helpdesk-playground";
import { getSessionSnapshot } from "@/lib/helpdesk";

export default async function Home() {
  const session = await getSessionSnapshot();

  return <HelpdeskPlayground initialSession={session} />;
}
