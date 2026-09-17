import { redirect } from "next/navigation";
import { getActor } from "../../lib/auth";
import { login } from "../actions";
import { Button } from "../../components/ui/button";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getActor()) redirect("/");
  const params = await searchParams;
  return <div className="min-h-[80vh] grid place-items-center"><form action={login} className="card w-full max-w-sm p-8 space-y-5"><div><div className="text-2xl font-bold">✦ SAOBEO LEAD</div><p className="text-slate-500 mt-1">Đăng nhập workspace</p></div>{params.error && <p className="text-red-600 text-sm">Email hoặc mật khẩu không đúng.</p>}<div><label className="label">Email</label><input name="email" type="email" required autoComplete="username" /></div><div><label className="label">Mật khẩu</label><input name="password" type="password" required autoComplete="current-password" /></div><Button
  type="submit"
  className="w-full bg-[#3563e9] hover:bg-[#254ed0]"
>
  Đăng nhập
</Button></form></div>;
}
