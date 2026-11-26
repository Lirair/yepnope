"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, Clock, Lock, Flag } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { useApp } from "@/components/AppProviders";

export default function TermsPage() {
  const { locale } = useApp();
  const isEn = locale === "en";

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <TopBar backHref="/" showThemePicker={false} />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-12 flex flex-col gap-5">
        <section className="px-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/14 text-accent mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isEn ? "Safety & Legal" : "Sicurezza & Regole"}</span>
          </span>
          <h1 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight text-foreground">
            {isEn ? "Terms of Use & Privacy" : "Termini d'Uso e Privacy"}
          </h1>
          <p className="mt-1.5 text-sm text-muted font-medium">
            {isEn
              ? "Clear rules to keep YepNope fun, private, and safe for every group."
              : "Regole chiare per mantenere YepNope divertente, privato e sicuro per tutti."}
          </p>
        </section>

        <div className="flex flex-col gap-3.5">
          {/* 1. User Generated Content Disclaimer */}
          <section className="rounded-3xl p-5 surface-panel flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="font-display font-bold text-base tracking-tight">
                {isEn
                  ? "1. User-created content (Custom Lists)"
                  : "1. Contenuti creati dagli utenti (Liste Libere)"}
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
              {isEn
                ? "YepNope provides private, temporary voting rooms with no account required. Titles, options in Custom Lists, and nicknames are entered directly by users, who bear sole responsibility for them. YepNope does not endorse, author, or pre-approve private user-created text."
                : "YepNope mette a disposizione stanze private e temporanee senza registrazione. I titoli, le voci inserite nelle Liste Libere e i nickname sono scritti liberamente dagli utenti, che ne sono gli unici responsabili. YepNope non approva, non redige e non si riconosce nei contenuti inseriti privatamente dagli utenti."}
            </p>
          </section>

          {/* 2. Prohibited Uses */}
          <section className="rounded-3xl p-5 surface-panel flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-4 h-4 text-nope shrink-0" />
              <h2 className="font-display font-bold text-base tracking-tight">
                {isEn ? "2. Prohibited conduct" : "2. Usi severamente vietati"}
              </h2>
            </div>
            <ul className="text-xs sm:text-[13px] text-muted leading-relaxed list-disc pl-4 space-y-1">
              <li>
                {isEn
                  ? "Hate speech, discrimination, slurs, threats, violence, or self-harm."
                  : "Incitamento all'odio, discriminazione, insulti gravi, minacce, violenza o autolesionismo."}
              </li>
              <li>
                {isEn
                  ? "Cyberbullying, defamation, harassment, or targeting real individuals."
                  : "Cyberbullismo, diffamazione, molestie o liste mirate a colpire persone reali."}
              </li>
              <li>
                {isEn
                  ? "Personal data of third parties (phone numbers, addresses, emails) or doxxing."
                  : "Dati personali di terzi (numeri di telefono, email, indirizzi) o doxxing."}
              </li>
              <li>
                {isEn
                  ? "Phishing links, spam, sexually explicit content, or illegal material."
                  : "Link di phishing, spam, contenuti sessualmente espliciti o illegali."}
              </li>
            </ul>
          </section>

          {/* 3. Moderation & Reporting */}
          <section className="rounded-3xl p-5 surface-panel flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <Flag className="w-4 h-4 text-accent shrink-0" />
              <h2 className="font-display font-bold text-base tracking-tight">
                {isEn
                  ? "3. Automatic filters & In-app reporting"
                  : "3. Filtri preventivi e segnalazioni"}
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
              {isEn
                ? "YepNope applies automated filters to block explicit hate speech, violence, links, and personal data. If you receive a Custom List link containing inappropriate content, use the 'Report' button inside the room to flag and immediately hide it on your device."
                : "YepNope applica filtri automatici preventivi contro odio, violenza, link e dati personali. Se ricevi un link di una Lista Libera con contenuti inappropriati, puoi usare il pulsante 'Segnala' dentro la stanza per inviare una segnalazione e oscurare subito la stanza sul tuo schermo."}
            </p>
          </section>

          {/* 4. Ephemeral Rooms & Privacy */}
          <section className="rounded-3xl p-5 surface-panel flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-yep shrink-0" />
              <h2 className="font-display font-bold text-base tracking-tight">
                {isEn
                  ? "4. Privacy & 24-hour auto-deletion"
                  : "4. Privacy ed eliminazione dopo 24 ore"}
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
              {isEn
                ? "No registration or personal profile is collected. Rooms are private (not indexed by search engines) and automatically deleted after 24 hours. Your chosen nickname and theme preference stay locally in your browser (localStorage). Aggregate, privacy-friendly traffic metrics are measured with Vercel Web Analytics."
                : "Non richiediamo account né raccogliamo profili personali. Le stanze sono private (non indicizzate dai motori di ricerca) e vengono eliminate automaticamente dopo 24 ore. Nickname e preferenza tema restano salvati solo nel tuo browser (localStorage). Le statistiche di traffico aggregate e anonime utilizzano Vercel Web Analytics."}
            </p>
          </section>

          {/* 5. Copyright & Third Parties */}
          <section className="rounded-3xl p-5 surface-panel flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground">
              <Lock className="w-4 h-4 text-muted shrink-0" />
              <h2 className="font-display font-bold text-base tracking-tight">
                {isEn
                  ? "5. Copyright & Attributions"
                  : "5. Copyright e attribuzioni"}
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
              © 2026 Carlo Contardi — YepNope.{" "}
              {isEn
                ? "All rights reserved on source code, UI design, logo, and original content. Movie and TV metadata is provided via the TMDB API (this product uses the TMDB API but is not endorsed or certified by TMDB)."
                : "Tutti i diritti riservati su codice sorgente, design, logo e contenuti originali. I metadati di film e serie TV utilizzano l'API TMDB (questo prodotto utilizza l'API TMDB ma non è approvato né certificato da TMDB)."}
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-1 w-full py-3.5 px-5 rounded-2xl bg-foreground text-background font-display font-extrabold text-sm text-center hover:opacity-90 active:scale-[0.97] transition-transform"
        >
          {isEn ? "Back to YepNope" : "Torna su YepNope"}
        </Link>
      </main>
    </div>
  );
}
