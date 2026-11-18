import { PageHeader } from "@/components/layout/PageHeader";
import { UnderConstruction } from "@/components/layout/UnderConstruction";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="page.prediction.title" descKey="page.prediction.desc" />
      <UnderConstruction />
    </div>
  );
}
