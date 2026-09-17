import { requireActor } from "../../../lib/auth";
import { LeadForm } from "../../../components/lead-form";
export default async function NewLead() { await requireActor(); return <div className="max-w-4xl space-y-5"><h1 className="text-3xl font-bold">Thêm lead</h1><LeadForm/></div>; }
