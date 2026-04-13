import { useState } from "react";
import Navbar from "./Navbar";

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

export default function PromotionsConsole({ breadcrumb }) {
  const { section = "Engagement", page = "Promotions" } = breadcrumb || {};
  const [channel, setChannel] = useState("whatsapp");
  const [audience, setAudience] = useState("pg_admins");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar section={section} page={page} />
      <div className="space-y-8 px-4 py-6 lg:px-8 pb-16 max-w-5xl">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Promotional messages</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-gray-500">
            Compose campaigns for PG admins and tenants. This screen is UI-only — connect to your messaging provider
            (Twilio, MSG91, FCM, etc.) when ready.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-gray-900">Channel</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-gray-900">Audience</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAudience(a.id)}
                    className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${
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

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Message</h3>
              {(channel === "email" || channel === "push") && (
                <div>
                  <label className="text-[12px] font-medium text-gray-600">Subject / title</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Monsoon rent offer — 10% off first month"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium text-gray-600">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your promotional copy. For WhatsApp/SMS, keep under provider limits and include opt-out where required."
                  className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-600">Schedule</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: "now", label: "Send now" },
                    { id: "later", label: "Schedule…" },
                    { id: "draft", label: "Save as draft" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSchedule(s.id)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
                        schedule === s.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Queue send (mock)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-5">
              <h3 className="text-[13px] font-semibold text-gray-900">Compliance checklist</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600 list-disc list-inside">
                <li>Consent and opt-out for promotional sends</li>
                <li>DLT / template IDs for SMS &amp; WhatsApp</li>
                <li>Rate limits per channel</li>
                <li>Test on staging tenant list first</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-[13px] font-semibold text-gray-900">Recent drafts</h3>
              <ul className="mt-3 space-y-2 text-[12px] text-gray-600">
                <li className="flex justify-between gap-2">
                  <span className="truncate">Festive cashback — tenants</span>
                  <span className="shrink-0 text-gray-400">Email</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="truncate">New billing export — admins</span>
                  <span className="shrink-0 text-gray-400">Push</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="truncate">Referral program v2</span>
                  <span className="shrink-0 text-gray-400">WhatsApp</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-[15px] font-semibold text-gray-900">Preview</h3>
            <p className="mt-1 text-[12px] text-gray-500">
              {CHANNELS.find((c) => c.id === channel)?.label} → {AUDIENCES.find((a) => a.id === audience)?.label}
            </p>
            {(channel === "email" || channel === "push") && subject && (
              <p className="mt-4 text-[13px] font-medium text-gray-900">{subject}</p>
            )}
            <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-gray-50 p-3 text-[13px] text-gray-800 whitespace-pre-wrap">
              {body || "(Empty body)"}
            </div>
            <div className="mt-6 flex justify-end gap-2">
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
