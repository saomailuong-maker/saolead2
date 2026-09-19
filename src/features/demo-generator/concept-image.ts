import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { DemoBrief } from "./types";

export const conceptPresetSchema = z.enum(["WARM_HOSPITALITY", "MODERN_LOCAL_BUSINESS", "CLEAN_MINIMAL"]);
export type ConceptPreset = z.infer<typeof conceptPresetSchema>;
type ImagesClient = { images: { generate: (input: unknown) => Promise<{ data?: Array<{ b64_json?: string | null }> }> } };
export class ConceptImageError extends Error { constructor(public code: "CONFIG" | "PROVIDER" | "EMPTY_OUTPUT" | "STORAGE", message: string) { super(message); this.name = "ConceptImageError"; } }

const style: Record<ConceptPreset,string> = {
  WARM_HOSPITALITY: "warm boutique hospitality, editorial travel aesthetic, natural earthy palette, inviting typography and generous photography-led composition",
  MODERN_LOCAL_BUSINESS: "modern Vietnamese local business, confident but approachable, crisp information hierarchy, practical conversion-focused layout",
  CLEAN_MINIMAL: "clean minimal premium layout, abundant whitespace, restrained neutral palette, refined typography and clear calls to action",
};
export function buildConceptPrompt(brief: DemoBrief, preset: ConceptPreset) {
  return `Create one polished landscape visual concept for a website landing page direction. This is design inspiration, not a screenshot of a functioning or official website.
Business name: ${brief.brand.businessName}.
Industry: ${brief.brand.industry || "local service business"}.
Location: ${brief.brand.location || "not specified"}.
Goal: ${brief.objective}
Primary CTA direction: ${brief.primaryCTA.label}.
Visual direction: ${style[preset]}.
Show a cohesive desktop landing page composition with a strong hero, readable value blocks, tasteful generic illustrative imagery and clear CTA hierarchy. Do not depict the actual property or claim to use real business photos. Do not add prices, ratings, awards, promotions, amenities, availability, customer counts, or performance claims. Avoid tiny unreadable body copy and external brand logos. If text appears, limit it to the verified business name and short generic Vietnamese navigation/CTA labels.`;
}
export async function generateConceptImage(input: { brief: DemoBrief; preset: ConceptPreset; demoId: string }, options: { apiKey?: string; model?: string; client?: ImagesClient; outputRoot?: string; now?: Date } = {}) {
  const apiKey=options.apiKey??process.env.OPENAI_API_KEY; const model=options.model??process.env.OPENAI_IMAGE_MODEL??"gpt-image-2.5-sunburst";
  if(!apiKey&&!options.client) throw new ConceptImageError("CONFIG","OpenAI Image chưa được cấu hình.");
  const client=options.client??new OpenAI({apiKey}); const prompt=buildConceptPrompt(input.brief,input.preset); let response;
  try { response=await client.images.generate({model,prompt,n:1,size:"1536x1024",quality:"medium",output_format:"webp",moderation:"auto"}); }
  catch(error){ throw new ConceptImageError("PROVIDER",error instanceof Error?`Không thể tạo concept: ${error.message.slice(0,200)}`:"Không thể tạo concept."); }
  const encoded=response.data?.[0]?.b64_json; if(!encoded) throw new ConceptImageError("EMPTY_OUTPUT","OpenAI không trả về dữ liệu ảnh.");
  let bytes:Buffer; try { bytes=Buffer.from(encoded,"base64"); if(bytes.length<16) throw new Error("empty"); } catch { throw new ConceptImageError("EMPTY_OUTPUT","Dữ liệu ảnh không hợp lệ."); }
  const now=options.now??new Date(); const filename=`${input.demoId}-${now.getTime()}.webp`; const relativePath=`/generated/demo-concepts/${filename}`; const root=options.outputRoot??path.join(process.cwd(),"public","generated","demo-concepts");
  try { await mkdir(root,{recursive:true}); await writeFile(path.join(root,filename),bytes,{flag:"wx"}); } catch(error){ throw new ConceptImageError("STORAGE",error instanceof Error?`Không thể lưu ảnh concept: ${error.message.slice(0,160)}`:"Không thể lưu ảnh concept."); }
  return { imagePath:relativePath,prompt,model,generatedAt:now };
}
