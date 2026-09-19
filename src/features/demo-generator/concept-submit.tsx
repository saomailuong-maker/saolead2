"use client";
import { useFormStatus } from "react-dom";
export function ConceptSubmit({regenerate=false}:{regenerate?:boolean}) { const {pending}=useFormStatus(); return <button className="btn" disabled={pending} type="submit">{pending?"Đang tạo concept…":regenerate?"Tạo lại concept":"Tạo concept giao diện"}</button>; }
