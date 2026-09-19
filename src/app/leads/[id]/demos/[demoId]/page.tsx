import { notFound } from "next/navigation";
import { requireActor } from "../../../../../lib/auth";
import { db } from "../../../../../lib/db";
import { DemoRenderer } from "../../../../../features/demo-generator/render";
import { demoBriefSchema, demoContentSchema, demoPresetSchema } from "../../../../../features/demo-generator/types";
export default async function DemoPreview({params}:{params:Promise<{id:string;demoId:string}>}) { const {workspaceId}=await requireActor(); const {id,demoId}=await params; const demo=await db.leadDemo.findFirst({where:{id:demoId,leadId:id,workspaceId},select:{brief:true,content:true,preset:true,conceptImagePath:true,conceptStatus:true}}); if(!demo) notFound(); const brief=demoBriefSchema.safeParse(demo.brief); const content=demoContentSchema.safeParse(demo.content); const preset=demoPresetSchema.safeParse(demo.preset); if(!brief.success||!content.success||!preset.success) notFound(); return <DemoRenderer brief={brief.data} content={content.data} preset={preset.data} conceptImagePath={demo.conceptStatus==="READY"?demo.conceptImagePath:null}/>; }
