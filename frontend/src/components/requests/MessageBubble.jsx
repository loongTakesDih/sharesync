import { formatFirestoreDate } from "../../utils/formatDate";

function MessageBubble({ message, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={
          mine
            ? "max-w-[85%] rounded-2xl rounded-br-md bg-emerald-700 px-4 py-3 text-white shadow-sm"
            : "max-w-[85%] rounded-2xl rounded-bl-md border border-stone-200 bg-white px-4 py-3 text-slate-800 shadow-sm"
        }
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={
              mine
                ? "text-xs font-black text-emerald-50"
                : "text-xs font-black text-slate-700"
            }
          >
            {message.senderUsername || "User"}
          </span>
          <span
            className={
              mine
                ? "text-xs font-semibold text-emerald-100"
                : "text-xs font-semibold text-slate-400"
            }
          >
            {formatFirestoreDate(message.createdAt, "Sending...")}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
