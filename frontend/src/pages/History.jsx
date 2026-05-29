import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { useRequests } from "../hooks/useRequests";
import { formatFirestoreDate } from "../utils/formatDate";
import {
  closedRequestStatuses,
  getBorrowerLabel,
  getOwnerLabel,
  getStatusBadgeClass,
  getStatusBadgeLabel,
} from "../utils/requestStatus";

function getHistoryTimestamp(request) {
  if (request.status === "completed") {
    return formatFirestoreDate(request.completedAt);
  }

  if (request.status === "withdrawn") {
    return formatFirestoreDate(request.withdrawnAt);
  }

  if (request.status === "rejected") {
    return formatFirestoreDate(request.rejectedAt);
  }

  if (request.status === "item_deleted") {
    return formatFirestoreDate(request.itemDeletedAt);
  }

  return formatFirestoreDate(request.createdAt);
}

function History({ activeCommunity, user }) {
  const { incomingRequests, outgoingRequests, requestsLoading } = useRequests({
    activeCommunity,
    user,
  });
  const historyMap = new Map();

  [...incomingRequests, ...outgoingRequests]
    .filter((request) => closedRequestStatuses.includes(request.status))
    .forEach((request) => {
      const direction = request.ownerId === user.uid ? "incoming" : "outgoing";
      historyMap.set(request.id, { direction, request });
    });

  const history = Array.from(historyMap.values());

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Profile Tools
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          History
        </h1>
        <p className="mt-2 text-slate-600">
          Completed and closed sharing records in{" "}
          <span className="font-bold text-emerald-800">{activeCommunity}</span>.
        </p>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Past Records</h2>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-slate-600">
            {history.length}
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {requestsLoading && (
            <p className="text-sm font-medium text-slate-600">
              Loading history...
            </p>
          )}

          {!requestsLoading && history.length === 0 && (
            <EmptyState>No closed records yet.</EmptyState>
          )}

          {!requestsLoading &&
            history.map(({ direction, request }) => {
              const otherParty =
                direction === "incoming"
                  ? `Borrower: ${getBorrowerLabel(request)}`
                  : `Owner: ${getOwnerLabel(request)}`;

              return (
                <article
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5"
                  key={`${direction}-${request.id}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {request.itemName}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {otherParty}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Updated: {getHistoryTimestamp(request)}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeClass(request.status)}>
                      {getStatusBadgeLabel(request.status)}
                    </Badge>
                  </div>
                  {request.rejectionReason && (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-stone-200">
                      {request.rejectionReason}
                    </p>
                  )}
                  {request.itemDeletedReason && (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-stone-200">
                      This item was deleted by the owner.
                    </p>
                  )}
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}

export default History;
