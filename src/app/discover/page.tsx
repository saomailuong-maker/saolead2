import { requireActor } from "../../lib/auth";
import { SearchForm } from "../../features/discovery/search-form";
import { SearchHistory } from "../../features/discovery/search-history";
import { getRecentSearchSessions, restoreSearchSession } from "../../features/discovery/actions";

export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  await requireActor();
  const [{ session }, historySessions] = await Promise.all([
    searchParams,
    getRecentSearchSessions(10),
  ]);
  const initialState = session ? await restoreSearchSession(session) : { results: [] };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Tìm khách hàng</h1>
        <p className="mt-1 text-slate-500">
          Tìm doanh nghiệp địa phương, lọc khách hàng mới và chọn đưa vào Lead Inbox.
        </p>
      </div>

      <SearchHistory sessions={historySessions} currentSessionId={session} />

      <SearchForm initialState={initialState} />
    </div>
  );
}
