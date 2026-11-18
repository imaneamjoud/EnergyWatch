import { PageHeader } from "@/components/layout/PageHeader";
import { UnderConstruction } from "@/components/layout/UnderConstruction";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.notifications.title" descKey="page.notifications.desc" />
      <UnderConstruction />
    </div>
  );
}
