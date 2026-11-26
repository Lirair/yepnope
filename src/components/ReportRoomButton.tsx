"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flag, X, ShieldAlert } from "lucide-react";
import type { Room } from "@/types/yepnope";
import { useApp } from "@/components/AppProviders";
import { reportRoom, type RoomReportReason } from "@/lib/roomService";

interface ReportRoomButtonProps {
  room: Room;
  onReported: () => void;
}

export function ReportRoomButton({ room, onReported }: ReportRoomButtonProps) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<RoomReportReason>("hate_violence");
  const [submitting, setSubmitting] = useState(false);

  const reasons: { id: RoomReportReason; label: string }[] = [
    { id: "hate_violence", label: t.room.reportReasonHate },
    { id: "bullying", label: t.room.reportReasonBullying },
    { id: "personal_data", label: t.room.reportReasonPersonal },
    { id: "other", label: t.room.reportReasonOther },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportRoom(room, reason);
      setOpen(false);
      onReported();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-muted hover:text-nope hover:bg-nope/10 active:scale-[0.97] transition cursor-pointer"
        aria-label={t.room.reportTitle}
      >
        <Flag className="w-3.5 h-3.5" />
        <span>{t.room.reportButton}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="w-full max-w-sm rounded-3xl p-5 card-elevated flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-nope/15 text-nope flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-extrabold text-base tracking-tight text-foreground">
                    {t.room.reportTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                  aria-label={t.room.reportCancel}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                {t.room.reportSubtitle}
              </p>

              <div className="flex flex-col gap-2">
                {reasons.map((item) => {
                  const selected = reason === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReason(item.id)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition cursor-pointer ${
                        selected
                          ? "border-nope bg-nope/10 text-foreground"
                          : "border-[var(--border)] bg-surface-muted/60 text-foreground hover:bg-surface-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="py-3 px-4 rounded-2xl surface-panel font-display font-bold text-xs hover:opacity-90 active:scale-[0.97] transition cursor-pointer"
                >
                  {t.room.reportCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 px-4 rounded-2xl bg-nope hover:bg-nope-strong text-white font-display font-extrabold text-xs nope-glow active:scale-[0.97] transition cursor-pointer disabled:opacity-60"
                >
                  {t.room.reportSubmit}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
