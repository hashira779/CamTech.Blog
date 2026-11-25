"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Download, HardDrive, Send, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  getPrivacyNoticeSeenSnapshot,
  getPrivacyNoticeServerSnapshot,
  markPrivacyNoticeSeen,
  subscribePrivacyNotice,
} from "@/lib/cv-session-notice";
import styles from "./CvBuilder.module.css";

/**
 * Calm, editorial first-session notice telling visitors their CV details
 * stay on their own device with zero account or database storage.
 * Supports immediate EN / ខ្មែរ switching synced with global site i18n.
 */
export function CvPrivacySessionNotice() {
  const { lang, setLang } = useI18n();
  const isKm = lang === "km";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);

  const dismissed = useSyncExternalStore(
    subscribePrivacyNotice,
    getPrivacyNoticeSeenSnapshot,
    getPrivacyNoticeServerSnapshot,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dismissed) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
        acceptRef.current?.focus();
      }
    } else if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [dismissed]);

  const handleDismiss = () => {
    markPrivacyNoticeSeen();
  };

  if (dismissed) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${styles.privacyModal}`}
      aria-labelledby="cv-privacy-notice-heading"
      aria-describedby="cv-privacy-notice-lead"
      lang={isKm ? "km" : undefined}
      onCancel={(event) => {
        event.preventDefault();
        handleDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div className={styles.privacyInner}>
        <div className={styles.privacyTopbar}>
          <span className={styles.privacyKicker}>
            {isKm
              ? "កំណត់ចំណាំឯកជនភាព · សម្រាប់ TAB នេះ"
              : "PRIVACY NOTE · LOCAL TO THIS TAB"}
          </span>

          <div className={styles.privacyControls}>
            <div className={styles.privacyLangSwitch} role="group" aria-label={isKm ? "ប្តូរភាសា" : "Switch language"}>
              <button
                type="button"
                aria-pressed={!isKm}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <button
                type="button"
                aria-pressed={isKm}
                onClick={() => setLang("km")}
              >
                ខ្មែរ
              </button>
            </div>

            <button
              type="button"
              className={styles.privacyClose}
              onClick={handleDismiss}
              aria-label={isKm ? "បិទកំណត់ចំណាំឯកជនភាព" : "Close privacy notice"}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <h2 id="cv-privacy-notice-heading" className={styles.privacyHeading}>
          {isKm
            ? "ទិន្នន័យ CV របស់អ្នក ស្ថិតលើឧបករណ៍នេះតែប៉ុណ្ណោះ។"
            : "Your CV stays on this device."}
        </h2>

        <p id="cv-privacy-notice-lead" className={styles.privacyLead}>
          {isKm
            ? "យើងមិនរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួន ប្រវត្តិការងារ ឬខ្លឹមសារ CV របស់អ្នកនៅក្នុង Database ឬគណនីណាមួយឡើយ។"
            : "We do not save your personal details, drafts, or work history in any database or account."}
        </p>

        <ul className={styles.privacyFacts}>
          <li>
            <HardDrive size={16} aria-hidden="true" />
            <div>
              <strong>
                {isKm ? "រៀបចំផ្ទាល់ក្នុង Browser" : "Edited only in your browser"}
              </strong>
              <span>
                {isKm
                  ? "ទិន្នន័យស្ថិតតែក្នុងទំព័រកំពុងបើក។ បើ Reload ឬបិទ Tab វានឹងត្រូវសម្អាតចោល។"
                  : "Everything lives in this open tab. Refreshing or closing the tab clears the draft."}
              </span>
            </div>
          </li>

          <li>
            <Download size={16} aria-hidden="true" />
            <div>
              <strong>
                {isKm ? "នាំចេញជា PDF ភ្លាមៗ" : "Instant PDF export on device"}
              </strong>
              <span>
                {isKm
                  ? "ទាញយកជាឯកសារ A4 PDF ដោយផ្ទាល់លើម៉ាស៊ីនរបស់អ្នក គ្មានស្នាមទឹក (Watermark)។"
                  : "Generate your A4 PDF straight from your browser before leaving, with no watermarks."}
              </span>
            </div>
          </li>

          <li>
            <Send size={16} aria-hidden="true" />
            <div>
              <strong>
                {isKm ? "ផ្ញើទៅ Telegram តាមបណ្ដោះអាសន្ន" : "Optional Telegram phone handoff"}
              </strong>
              <span>
                {isKm
                  ? "បើអ្នកប្រើ Telegram QR ឯកសារ PDF ត្រូវផ្ទុកក្នុង RAM ត្រឹម ១៥ នាទី ហើយលុបចោលភ្លាមពេលផ្ញើរួច។"
                  : "If you use Send to Telegram, only that temporary PDF stays in RAM up to 15 minutes until sent."}
              </span>
            </div>
          </li>
        </ul>

        <div className={styles.privacyFooter}>
          <span className={styles.privacyFootnote}>
            {isKm ? "បង្ហាញតែម្ដងគត់ក្នុងមួយ session" : "Shown once per browser session"}
          </span>
          <button
            ref={acceptRef}
            type="button"
            className={`${styles.button} ${styles.primary} ${styles.privacyAccept}`}
            onClick={handleDismiss}
          >
            {isKm ? "យល់ព្រម និងចាប់ផ្តើមបង្កើត CV" : "Got it, start building"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
