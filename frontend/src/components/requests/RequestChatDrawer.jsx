import { useEffect, useMemo, useRef, useState } from "react";
import {
  markRequestChatRead,
  sendRequestMessage,
  subscribeToRequestMessages,
} from "../../services/requestService";
import {
  closedRequestStatuses,
  getBorrowerLabel,
  getOwnerLabel,
} from "../../utils/requestStatus";
import MessageBubble from "./MessageBubble";

function RequestChatDrawer({
  onClose,
  profilesById = {},
  request,
  user,
  userProfile,
}) {
  const [messageState, setMessageState] = useState({
    error: "",
    messages: [],
    requestId: "",
  });
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const requestId = request?.id || "";
  const userId = user?.uid || "";

  const isClosed = request
    ? closedRequestStatuses.includes(request.status)
    : false;
  const canSend =
    Boolean(request && user) &&
    !isClosed &&
    (request.ownerId === user.uid || request.borrowerId === user.uid);
  const counterpartId = request
    ? request.ownerId === user?.uid
      ? request.borrowerId
      : request.ownerId
    : "";
  const counterpartLabel = request
    ? profilesById[counterpartId]?.username ||
      (request.ownerId === user?.uid
        ? getBorrowerLabel(request)
        : getOwnerLabel(request))
    : "";
  const messages = useMemo(
    () => (messageState.requestId === requestId ? messageState.messages : []),
    [messageState.messages, messageState.requestId, requestId]
  );
  const loading = Boolean(requestId && messageState.requestId !== requestId);
  const loadError = messageState.requestId === requestId ? messageState.error : "";

  useEffect(() => {
    if (!requestId) {
      return undefined;
    }

    markRequestChatRead({ requestId, userId }).catch((error) => {
      console.error("Could not mark chat as read:", error);
    });

    const unsubscribe = subscribeToRequestMessages(
      requestId,
      (nextMessages) => {
        setMessageState({
          error: "",
          messages: nextMessages,
          requestId,
        });
      },
      (snapshotError) => {
        setMessageState({
          error: snapshotError.message || "Could not load chat messages.",
          messages: [],
          requestId,
        });
      }
    );

    return () => unsubscribe();
  }, [requestId, userId]);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, loading]);

  if (!request) {
    return null;
  }

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    if (trimmedText.length > 1000) {
      setSendError("Messages must be 1000 characters or fewer.");
      return;
    }

    setSending(true);
    setSendError("");

    try {
      await sendRequestMessage({
        currentUser: user,
        request,
        text: trimmedText,
        userProfile,
      });
      setText("");
    } catch (sendError) {
      setSendError(sendError.message || "Could not send this message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-stone-200 bg-[#f8f6f1] shadow-2xl">
        <header className="border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Request Chat
              </p>
              <h2 className="mt-1 truncate text-xl font-black text-slate-950">
                {request.itemName}
              </h2>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                With {counterpartLabel || "ShareSync user"}
              </p>
            </div>
            <button
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          {isClosed && (
            <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600">
              This conversation is closed.
            </p>
          )}
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
          ref={listRef}
        >
          {loading && (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-stone-200">
              Loading messages...
            </p>
          )}

          {!loading && loadError && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {loadError}
            </p>
          )}

          {!loading && !loadError && messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center shadow-sm">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl ring-1 ring-emerald-100">
                💬
              </span>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                No messages yet. Start the conversation about pickup or return
                details.
              </p>
            </div>
          )}

          {!loading && !loadError && messages.length > 0 && (
            <div className="grid gap-3">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={message.senderId === user?.uid}
                  senderProfile={profilesById[message.senderId]}
                />
              ))}
            </div>
          )}
        </div>

        <form
          className="border-t border-stone-200 bg-white px-5 py-4"
          onSubmit={sendMessage}
        >
          {sendError && (
            <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {sendError}
            </p>
          )}
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Message
            <textarea
              className="min-h-24 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!canSend || sending}
              maxLength={1000}
              placeholder={
                isClosed
                  ? "This conversation is closed."
                  : "Ask about pickup, handover, or return details..."
              }
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">
              {text.length}/1000
            </span>
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSend || sending || text.trim().length === 0}
              type="submit"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestChatDrawer;
