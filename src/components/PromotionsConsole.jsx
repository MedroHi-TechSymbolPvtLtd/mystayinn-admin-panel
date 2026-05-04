import { useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import { fetchNotificationUsers, sendPushNotificationCampaign } from "../lib/adminPanelApi.js";

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", desc: "Template-based; requires approved business templates." },
  { id: "sms", label: "SMS", desc: "Short transactional or promotional with DLT headers." },
  { id: "email", label: "Email", desc: "Rich HTML; best for policy and long-form offers." },
  { id: "push", label: "Push", desc: "In-app / FCM for Customer app; Admin app optional." },
];

const AUDIENCES = [
  { id: "pg_admins", label: "PG admins (Admin app)" },
  { id: "tenants", label: "Tenants (Customer app)" },
  { id: "both", label: "Both (segmented send)" },
];

const SCHEDULE_OPTIONS = [
  { id: "now", label: "Send now" },
  { id: "later", label: "Schedule…" },
  { id: "draft", label: "Save as draft" },
];

const TARGET_MODES = [
  { id: "all", label: "All users" },
  { id: "multiple", label: "Multiple IDs" },
];

export default function PromotionsConsole({ breadcrumb }) {
  const { section = "Engagement", page = "Promotions" } = breadcrumb || {};
  const [channel, setChannel] = useState("push");
  const [audience, setAudience] = useState("pg_admins");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [targetMode, setTargetMode] = useState("all");
  const [uniqueIdsCsv, setUniqueIdsCsv] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersQ, setUsersQ] = useState("");
  const [selectedUniqueIds, setSelectedUniqueIds] = useState([]);

  const audienceForApi = useMemo(() => {
    if (audience === "pg_admins") return "admin";
    if (audience === "tenants") return "customer";
    return "both";
  }, [audience]);

  // Get all unique IDs from both checkbox selection and CSV input
  const getAllUniqueIds = useMemo(() => {
    const csvIds = uniqueIdsCsv
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    // Combine and deduplicate
    return [...new Set([...selectedUniqueIds, ...csvIds])];
  }, [selectedUniqueIds, uniqueIdsCsv]);

  const canSend = subject.trim() && body.trim() && 
    (targetMode === "all" || getAllUniqueIds.length > 0);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const list = await fetchNotificationUsers({
        audience: audienceForApi,
        q: usersQ,
        limit: 400,
      });
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setUsersError(e?.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [audienceForApi, usersQ]);

  const onSendPush = async () => {
    setSendError("");
    setSendResult(null);
    if (!canSend) return;
    try {
      setSending(true);
      const result = await sendPushNotificationCampaign({
        title: subject.trim(),
        message: body.trim(),
        audience: audienceForApi,
        mode: targetMode === "all" && getAllUniqueIds.length === 0 ? "all" : "multiple",
        uniqueIds: getAllUniqueIds, // Send combined unique IDs
        uniqueIdsCsv: getAllUniqueIds.join(','), // Send combined as CSV string
      });
      setSendResult(result || null);
      
      // Optional: Clear selections after successful send
      if (result?.success) {
        setSelectedUniqueIds([]);
        setUniqueIdsCsv("");
      }
    } catch (e) {
      setSendError(e?.message || "Failed to send push campaign");
    } finally {
      setSending(false);
    }
  };

  const isSelected = (uid) => selectedUniqueIds.includes(uid);
  
  const toggleUser = (uid) => {
    setSelectedUniqueIds((prev) => 
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  };
  
  const selectAllVisible = () => {
    const visible = users.map((u) => u.uniqueId).filter(Boolean);
    setSelectedUniqueIds((prev) => [...new Set([...prev, ...visible])]);
  };
  
  const clearSelected = () => setSelectedUniqueIds([]);
  
  const clearAllIds = () => {
    setSelectedUniqueIds([]);
    setUniqueIdsCsv("");
  };

  // Parse CSV IDs for display count
  const csvIdCount = useMemo(() => {
    return uniqueIdsCsv
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0).length;
  }, [uniqueIdsCsv]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-6 px-4 py-6 lg:px-8 pb-16 max-w-7xl mx-auto">
        
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Promotional messages</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Send push campaigns to Admin app users, Customer app users, or specific unique IDs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Channel Selection */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-gray-900">Channel</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      channel === c.id
                        ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500"
                        : "border-gray-100 bg-gray-50/80 hover:border-gray-200"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-gray-900">{c.label}</p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Message</h3>
              
              {/* Subject Line */}
              <div>
                <label className="text-[12px] font-medium text-gray-600">Subject / Title</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Monsoon rent offer — 10% off first month"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[12px] font-medium text-gray-600">Message Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Write your promotional message..."
                  className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="text-[12px] font-medium text-gray-600">Schedule</label>
                <div className="mt-2 flex gap-2">
                  {SCHEDULE_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSchedule(s.id)}
                      className={`rounded-full px-4 py-1.5 text-[12px] font-medium ${
                        schedule === s.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  disabled={!canSend || sending}
                  onClick={onSendPush}
                  className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm ${
                    !canSend || sending ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {sending ? "Sending..." : "Send Notification"}
                </button>
              </div>

              {/* Status Messages */}
              {sendError && (
                <p className="text-[12px] text-red-600">{sendError}</p>
              )}
              {sendResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
                  Sent! Matched users: <strong>{Number(sendResult.totalMatched || 0)}</strong>
                  {sendResult.invalidUniqueIds?.length > 0 && (
                    <> | Invalid IDs: {sendResult.invalidUniqueIds.join(", ")}</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Audience Selection */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-semibold text-gray-900">Audience</h3>
              <div className="mt-3 space-y-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudience(a.id)}
                    className={`w-full rounded-xl px-4 py-2.5 text-[12px] font-medium text-left transition ${
                      audience === a.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Mode */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-semibold text-gray-900">Target Mode</h3>
              <div className="mt-3 space-y-2">
                {TARGET_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setTargetMode(m.id);
                      if (m.id === "all") {
                        setSelectedUniqueIds([]);
                        setUniqueIdsCsv("");
                      }
                    }}
                    className={`w-full rounded-xl px-4 py-2.5 text-[12px] font-medium text-left transition ${
                      targetMode === m.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* User Selection (only for multiple IDs mode) */}
            {targetMode === "multiple" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-gray-900">Select Users</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllVisible}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearSelected}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear selected
                    </button>
                    <button
                      type="button"
                      onClick={clearAllIds}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Search */}
                <input
                  value={usersQ}
                  onChange={(e) => setUsersQ(e.target.value)}
                  placeholder="Search by name, ID, or email..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-3"
                />

                {/* Selected count summary */}
                <div className="mb-3 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-[11px] text-indigo-800">
                    <strong>Total recipients: {getAllUniqueIds.length}</strong> 
                    {selectedUniqueIds.length > 0 && ` (${selectedUniqueIds.length} from list)`}
                    {csvIdCount > 0 && ` (${csvIdCount} from CSV)`}
                  </p>
                </div>

                {/* Users List with checkboxes */}
                {usersError && <p className="text-[12px] text-red-600 mb-2">{usersError}</p>}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                  {usersLoading ? (
                    <p className="p-3 text-[12px] text-gray-500">Loading users...</p>
                  ) : users.length === 0 ? (
                    <p className="p-3 text-[12px] text-gray-500">No users found.</p>
                  ) : (
                    users.map((u) => (
                      <label key={u.id || u.uniqueId} className="flex cursor-pointer items-start gap-2 border-b border-gray-100 px-3 py-2 hover:bg-gray-50 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={isSelected(u.uniqueId)}
                          onChange={() => toggleUser(u.uniqueId)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-gray-900">{u.fullName || "Unknown"}</p>
                          <p className="text-[11px] text-gray-500">{u.uniqueId}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Manual IDs input */}
                <div className="mt-3">
                  <label className="text-[11px] font-medium text-gray-600">
                    Or enter IDs manually (comma-separated)
                    {csvIdCount > 0 && (
                      <span className="ml-2 text-indigo-600">({csvIdCount} IDs entered)</span>
                    )}
                  </label>
                  <textarea
                    value={uniqueIdsCsv}
                    onChange={(e) => setUniqueIdsCsv(e.target.value)}
                    rows={3}
                    placeholder="myo26a000001, mys26a000001, example_user_001"
                    className="mt-1 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">
                    Tip: You can combine users selected from the list with manually entered IDs
                  </p>
                </div>

                {/* Preview of all IDs (optional, for transparency) */}
                {getAllUniqueIds.length > 0 && getAllUniqueIds.length <= 10 && (
                  <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-medium text-gray-600 mb-1">Recipients preview:</p>
                    <p className="text-[10px] text-gray-500 break-words">
                      {getAllUniqueIds.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Compliance Checklist */}
            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
              <h3 className="text-[13px] font-semibold text-gray-900">Compliance Checklist</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600 list-disc list-inside">
                <li>Consent and opt-out for promotional sends</li>
                <li>DLT / template IDs for SMS &amp; WhatsApp</li>
                <li>Rate limits per channel</li>
                <li>Test on staging first</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="p-6">
              <h3 className="text-[15px] font-semibold text-gray-900">Preview</h3>
              <p className="mt-1 text-[12px] text-gray-500">
                {CHANNELS.find((c) => c.id === channel)?.label} → {AUDIENCES.find((a) => a.id === audience)?.label}
              </p>
              {targetMode === "multiple" && getAllUniqueIds.length > 0 && (
                <p className="mt-2 text-[11px] text-indigo-600">
                  Sending to {getAllUniqueIds.length} recipient(s)
                </p>
              )}
              {subject && (
                <p className="mt-4 text-[13px] font-medium text-gray-900">{subject}</p>
              )}
              <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-gray-50 p-3 text-[13px] text-gray-800 whitespace-pre-wrap">
                {body || "(Empty body)"}
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}