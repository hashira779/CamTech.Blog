"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Download, LayoutTemplate, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CV_TEMPLATES, cvDate, cvFileName, cvTextLines, type CvLanguage, type CvTemplate, type CvText } from "@/lib/cv-templates";
import styles from "./CvBuilder.module.css";

type Entry = { id: string; title: CvText; organization: CvText; details: CvText; from: string; to: string; current: boolean };
type Project = { id: string; title: CvText; details: CvText };
type CvData = { name: CvText; role: CvText; location: CvText; email: string; phone: string; website: string;
  summary: CvText; skills: CvText; languages: CvText; experience: Entry[]; education: Entry[]; projects: Project[] };
const pair = (): CvText => ({ en: "", km: "" });
const entry = (id: string): Entry => ({ id, title: pair(), organization: pair(), details: pair(), from: "", to: "", current: false });
const emptyCv = (): CvData => ({ name: pair(), role: pair(), location: pair(), email: "", phone: "", website: "",
  summary: pair(), skills: pair(), languages: pair(), experience: [entry("experience-1")], education: [entry("education-1")], projects: [] });
const hasData = (cv: CvData) => JSON.stringify(cv) !== JSON.stringify(emptyCv());

function CvPair({ value, language }: { value: CvText; language: CvLanguage }) {
  return <>{cvTextLines(value, language).map((line, index) => <span key={line.language} lang={line.language} className={`${styles.textLine} ${index > 0 ? styles.secondary : ""}`}>{line.text}</span>)}</>;
}

function CvHeading({ en, km, language }: { en: string; km: string; language: CvLanguage }) {
  return <h3 className={styles.sectionTitle}>{language !== "km" && <span lang="en">{en}</span>}{language === "bilingual" && <span aria-hidden="true"> / </span>}{language !== "en" && <span lang="km">{km}</span>}</h3>;
}

function CvLines({ value, language }: { value: CvText; language: CvLanguage }) {
  const lines = cvTextLines(value, language);
  return <>{lines.map((line) => <ul key={line.language} lang={line.language} className={styles.bullets}>{line.text.split(/\r?\n/).map((text) => text.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean).map((text, i) => <li key={i}>{text}</li>)}</ul>)}</>;
}

function CvPreview({ data, template, language }: { data: CvData; template: CvTemplate; language: CvLanguage }) {
  const entries = (items: Entry[], en: string, km: string) => {
    const visible = items.filter((item) => [item.title, item.organization, item.details].some((text) => cvTextLines(text, language).length));
    if (!visible.length) return null;
    return <section className={styles.cvSection}><CvHeading en={en} km={km} language={language} />{visible.map((item) => <div key={item.id} className={styles.cvEntry}>
      {cvTextLines(item.title, language).length > 0 && <h4><CvPair value={item.title} language={language} /></h4>}
      <div className={styles.organization}><CvPair value={item.organization} language={language} /></div>
      {(item.from || item.to || item.current) && <span className={styles.cvDate}>{cvDate(item.from)}{item.from && (item.to || item.current) ? " — " : ""}{item.current ? language === "km" ? "បច្ចុប្បន្ន" : language === "bilingual" ? "Present / បច្ចុប្បន្ន" : "Present" : cvDate(item.to)}</span>}
      <CvLines value={item.details} language={language} />
    </div>)}</section>;
  };
  const education = entries(data.education, "Education", "ការអប់រំ");
  const experience = entries(data.experience, "Experience", "បទពិសោធន៍ការងារ");
  const projects = data.projects.filter((item) => cvTextLines(item.title, language).length || cvTextLines(item.details, language).length);
  return <article data-cv-document className={[styles.paper, styles[template.layout], styles[template.heading], template.serif ? styles.serif : "", template.compact ? styles.compact : ""].join(" ")} style={{ "--cv-accent": template.accent } as CSSProperties} lang={language === "km" ? "km" : "en"}>
    <header className={styles.cvHeader}><h2 className={styles.name}>{cvTextLines(data.name, language).length ? <CvPair value={data.name} language={language} /> : <span className={styles.placeholder}>{language === "km" ? "ឈ្មោះរបស់អ្នក" : "Your name"}</span>}</h2>
      {cvTextLines(data.role, language).length > 0 && <div className={styles.role}><CvPair value={data.role} language={language} /></div>}
      <div className={styles.contact}>{[data.email, data.phone, ...cvTextLines(data.location, language).map((line) => line.text), data.website].filter((text) => text.trim()).map((text, i) => <span key={i}>{text}</span>)}</div>
    </header>
    <div className={styles.cvBody}>
      <div className={styles.mainContent}>
        {cvTextLines(data.summary, language).length > 0 && <section className={styles.cvSection}><CvHeading en="Profile" km="សេចក្ដីសង្ខេប" language={language} /><CvPair value={data.summary} language={language} /></section>}
        {template.educationFirst ? <>{education}{experience}</> : <>{experience}{education}</>}
        {projects.length > 0 && <section className={styles.cvSection}><CvHeading en="Projects & achievements" km="គម្រោង និងសមិទ្ធផល" language={language} />{projects.map((item) => <div className={styles.cvEntry} key={item.id}><h4><CvPair value={item.title} language={language} /></h4><CvLines value={item.details} language={language} /></div>)}</section>}
      </div>
      <aside className={styles.sideContent}>
        {cvTextLines(data.skills, language).length > 0 && <section className={styles.cvSection}><CvHeading en="Skills" km="ជំនាញ" language={language} /><CvLines value={data.skills} language={language} /></section>}
        {cvTextLines(data.languages, language).length > 0 && <section className={styles.cvSection}><CvHeading en="Languages" km="ភាសា" language={language} /><CvLines value={data.languages} language={language} /></section>}
      </aside>
    </div>
  </article>;
}

function MiniTemplate({ template }: { template: CvTemplate }) {
  const blocks = (count: number) => Array.from({ length: count }, (_, index) => <span className={styles.miniSection} key={index}>{[0, 1, 2].map((i) => <span key={i} className={styles.miniLine} />)}</span>);
  return <span aria-hidden="true" className={styles.mini} data-layout={template.layout} data-education={template.educationFirst || false} style={{ "--mini-accent": template.accent, fontFamily: template.serif ? "Georgia, serif" : undefined } as CSSProperties}><span className={styles.miniHeader} /><span className={styles.miniBody}><span className={styles.miniColumn}>{blocks(template.compact ? 4 : 3)}</span>{["sidebar", "split"].includes(template.layout) && <span className={styles.miniColumn}>{blocks(3)}</span>}</span></span>;
}

function Field({ id, label, value, onChange, multiline = false, type = "text", maxLength = 160, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void; multiline?: boolean;
  type?: string; maxLength?: number; placeholder?: string;
}) {
  return <label htmlFor={id} className={styles.field}><span>{label}</span>{multiline ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} placeholder={placeholder} autoComplete="off" /> : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} placeholder={placeholder} autoComplete="off" />}</label>;
}

function PairField({ id, label, value, onChange, multiline = false, maxLength = 160 }: {
  id: string; label: string; value: CvText; onChange: (value: CvText) => void; multiline?: boolean; maxLength?: number;
}) {
  return <div className={styles.pair}><Field id={`${id}-en`} label={`${label} · English`} value={value.en} onChange={(en) => onChange({ ...value, en })} multiline={multiline} maxLength={maxLength} /><Field id={`${id}-km`} label={`${label} · ខ្មែរ`} value={value.km} onChange={(km) => onChange({ ...value, km })} multiline={multiline} maxLength={maxLength} /></div>;
}

export function CvBuilder() {
  const { lang } = useI18n();
  const t = (en: string, km: string) => lang === "km" ? km : en;
  const [data, setData] = useState<CvData>(emptyCv);
  const [templateId, setTemplateId] = useState(CV_TEMPLATES[0].id);
  const [language, setLanguage] = useState<CvLanguage>("bilingual");
  const [printing, setPrinting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDialogElement>(null);
  const printFrame = useRef<HTMLIFrameElement | null>(null);
  const printTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const template = CV_TEMPLATES.find((item) => item.id === templateId) || CV_TEMPLATES[0];
  const dirty = hasData(data);
  const invalidDates = [...data.experience, ...data.education].some((item) => !item.current && item.from && item.to && item.to < item.from);
  const canExport = cvTextLines(data.name, language).length > 0 && !invalidDates;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => () => { printFrame.current?.remove(); if (printTimer.current) clearTimeout(printTimer.current); }, []);

  function update(key: "name" | "role" | "location" | "summary" | "skills" | "languages", value: CvText) {
    setData((current) => ({ ...current, [key]: value }));
  }
  function updateEntry(section: "experience" | "education", id: string, changes: Partial<Entry>) {
    setData((current) => ({ ...current, [section]: current[section].map((item) => item.id === id ? { ...item, ...changes } : item) }));
  }
  function reset() {
    if (!dirty || window.confirm(t("Clear this temporary CV? Download a PDF first if you want to keep it.", "លុប CV បណ្ដោះអាសន្ននេះ? សូមរក្សាទុក PDF ជាមុន បើអ្នកចង់រក្សាវាទុក។"))) {
      setData(emptyCv()); setMessage(""); setError(false);
    }
  }
  async function savePdf() {
    if (!canExport || printing || !preview.current?.firstElementChild) return;
    setPrinting(true); setMessage(""); setError(false);
    const frame = document.createElement("iframe");
    frame.title = "CV print document";
    frame.setAttribute("aria-hidden", "true");
    Object.assign(frame.style, { position: "fixed", left: "-10000px", top: "0", width: "210mm", height: "297mm", border: "0" });
    document.body.appendChild(frame); printFrame.current = frame;
    const cleanup = () => { frame.remove(); if (printFrame.current === frame) printFrame.current = null; if (printTimer.current) { clearTimeout(printTimer.current); printTimer.current = null; } };
    try {
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      if (!doc || !win) throw new Error("Print window unavailable");
      doc.open(); doc.write("<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>"); doc.close();
      doc.documentElement.className = document.documentElement.className.replace(/\bdark\b/g, "") + " light";
      doc.documentElement.lang = language === "km" ? "km" : "en";
      doc.title = cvFileName(data.name.en || data.name.km);
      const loads: Promise<void>[] = [];
      for (const source of document.querySelectorAll('link[rel="stylesheet"], style')) {
        const clone = doc.importNode(source, true);
        if (clone.nodeName === "LINK") loads.push(new Promise((resolve, reject) => {
          (clone as HTMLLinkElement).onload = () => resolve(); (clone as HTMLLinkElement).onerror = () => reject(new Error("Print styles unavailable"));
        }));
        doc.head.appendChild(clone);
      }
      const printStyle = doc.createElement("style");
      printStyle.textContent = "@page{size:A4;margin:14mm}html,body{margin:0;padding:0;background:white!important;color:#20262d!important}body{display:block!important}*{animation:none!important;transition:none!important}article{box-shadow:none!important}h2,h3,h4{break-after:avoid}p,li{orphans:3;widows:3}";
      doc.head.appendChild(printStyle);
      doc.body.appendChild(doc.importNode(preview.current.firstElementChild, true));
      await Promise.race([Promise.all(loads), new Promise((_, reject) => setTimeout(() => reject(new Error("Print styles timed out")), 15000))]);
      // Font readiness matters for Khmer shaping and selectable PDF text.
      void doc.body.offsetHeight;
      await Promise.race([doc.fonts.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("Print fonts timed out")), 15000))]);
      win.addEventListener("afterprint", cleanup, { once: true });
      printTimer.current = setTimeout(cleanup, 120000);
      win.focus(); win.print();
      setMessage(t("Choose “Save as PDF” in the print dialog. Use A4 paper and turn off browser headers and footers. Your CV has not been uploaded.", "ជ្រើសរើស “Save as PDF” ក្នុងផ្ទាំងបោះពុម្ព។ ប្រើក្រដាស A4 ហើយបិទ headers និង footers របស់ browser។ CV របស់អ្នកមិនត្រូវបានផ្ញើទៅ server ទេ។"));
    } catch {
      cleanup(); setError(true);
      setMessage(t("Could not open the print preview. Try again in an up-to-date browser. Your information is still in this tab.", "មិនអាចបើកផ្ទាំងបោះពុម្ពបានទេ។ សូមសាកល្បងម្ដងទៀតក្នុង browser ដែលបានធ្វើបច្ចុប្បន្នភាព។ ព័ត៌មានរបស់អ្នកនៅតែក្នុងទំព័រនេះ។"));
    } finally { setPrinting(false); }
  }

  function entryEditor(section: "experience" | "education", title: string) {
    return <details className={styles.section}><summary>{title}</summary><div className={styles.sectionBody}>
      <p className={styles.guidance}>{t("Put your most recent entry first. Use specific responsibilities and real achievements, one bullet per line.", "ដាក់ព័ត៌មានថ្មីបំផុតនៅខាងលើ។ សរសេរភារកិច្ច និងសមិទ្ធផលពិតប្រាកដ មួយចំណុចក្នុងមួយបន្ទាត់។")}</p>
      {data[section].map((item, index) => <div className={styles.entry} key={item.id}><div className={styles.entryTop}><span>{index + 1}. {title}</span><button className={styles.remove} type="button" aria-label={`${t("Remove", "លុប")} ${section} ${index + 1}`} onClick={() => setData((current) => ({ ...current, [section]: current[section].filter((row) => row.id !== item.id) }))}><Trash2 size={13} aria-hidden="true" />{t("Remove", "លុប")}</button></div>
        <PairField id={`${item.id}-title`} label={section === "experience" ? t("Job title", "តួនាទី") : t("Qualification", "សញ្ញាបត្រ")} value={item.title} onChange={(title) => updateEntry(section, item.id, { title })} />
        <PairField id={`${item.id}-organization`} label={section === "experience" ? t("Employer", "ក្រុមហ៊ុន") : t("School / university", "សាលា / សាកលវិទ្យាល័យ")} value={item.organization} onChange={(organization) => updateEntry(section, item.id, { organization })} />
        <div className={styles.dates}><Field id={`${item.id}-from`} label={t("From", "ចាប់ពី")} type="month" value={item.from} onChange={(from) => updateEntry(section, item.id, { from })} />{!item.current && <Field id={`${item.id}-to`} label={t("To", "ដល់")} type="month" value={item.to} onChange={(to) => updateEntry(section, item.id, { to })} />}</div>
        <label className={styles.checkbox}><input type="checkbox" checked={item.current} onChange={(event) => updateEntry(section, item.id, { current: event.target.checked })} />{t("Currently here", "បច្ចុប្បន្ននៅទីនេះ")}</label>
        <PairField id={`${item.id}-details`} label={t("Details · one point per line", "ព័ត៌មានលម្អិត · មួយចំណុចក្នុងមួយបន្ទាត់")} value={item.details} onChange={(details) => updateEntry(section, item.id, { details })} multiline maxLength={2400} />
      </div>)}
      <button className={styles.button} type="button" disabled={data[section].length >= 8} onClick={() => setData((current) => ({ ...current, [section]: [...current[section], entry(crypto.randomUUID())] }))}><Plus size={15} aria-hidden="true" />{t("Add entry", "បន្ថែមព័ត៌មាន")}</button>
    </div></details>;
  }

  return <div className={styles.builder}>
    <div className={styles.toolbar}><div><h2>{t("Your next opportunity starts here.", "ឱកាសបន្ទាប់របស់អ្នកចាប់ផ្ដើមនៅទីនេះ។")}</h2><p>{t("Free templates. No account. No watermark. Your draft lives only in this tab; export it before leaving or refreshing.", "គំរូឥតគិតថ្លៃ មិនត្រូវការគណនី និងគ្មាន watermark។ សេចក្ដីព្រាងស្ថិតក្នុងទំព័រនេះតែប៉ុណ្ណោះ។ សូមរក្សាទុក PDF មុនចាកចេញ ឬ refresh។")}</p></div><div className={styles.actions}><button className={styles.button} type="button" onClick={() => picker.current?.showModal()}><LayoutTemplate size={16} aria-hidden="true" />{t("24 free templates", "គំរូឥតគិតថ្លៃ ២៤")}</button><button className={`${styles.button} ${styles.primary}`} type="button" onClick={savePdf} disabled={!canExport || printing}><Download size={16} aria-hidden="true" />{printing ? t("Preparing…", "កំពុងរៀបចំ…") : t("Print / save PDF", "បោះពុម្ព / រក្សាទុក PDF")}</button></div></div>
    {message && <p className={`${styles.status} ${error ? styles.error : ""}`} role="status">{message}</p>}
    {invalidDates && <p className={`${styles.status} ${styles.error}`} role="alert">{t("An end date is before its start date. Correct the dates before exporting.", "កាលបរិច្ឆេទបញ្ចប់នៅមុនថ្ងៃចាប់ផ្ដើម។ សូមកែតម្រូវមុនរក្សាទុក PDF។")}</p>}
    <div className={styles.workspace}>
      <div className={styles.editor}>
        <p className={styles.notice}><ShieldCheck size={16} className="mb-2" aria-hidden="true" /><strong>{t("Temporary and private.", "បណ្ដោះអាសន្ន និងឯកជន។")}</strong> {t("No CV data is sent to our server or saved in browser storage. Enter both languages yourself; changing the display language does not translate your content.", "ទិន្នន័យ CV មិនត្រូវបានផ្ញើទៅ server ឬរក្សាទុកក្នុង browser storage ទេ។ សូមបំពេញភាសាទាំងពីរដោយខ្លួនឯង។ ការប្ដូរភាសាបង្ហាញមិនបកប្រែអត្ថបទរបស់អ្នកទេ។")}</p>
        <div className={styles.preferences}><label className={styles.field}><span>{t("CV language", "ភាសា CV")}</span><select aria-label="CV language" value={language} onChange={(event) => setLanguage(event.target.value as CvLanguage)}><option value="bilingual">English + ខ្មែរ</option><option value="en">English</option><option value="km">ខ្មែរ</option></select></label><label className={styles.field}><span>{t("Selected template", "គំរូដែលបានជ្រើសរើស")}</span><select aria-label="CV template" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{CV_TEMPLATES.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.layout}</option>)}</select></label></div>
        <details className={styles.section} open><summary>{t("1. Personal details", "១. ព័ត៌មានផ្ទាល់ខ្លួន")}</summary><div className={styles.sectionBody}>
          <PairField id="cv-name" label={t("Full name", "ឈ្មោះពេញ")} value={data.name} onChange={(value) => update("name", value)} />
          <PairField id="cv-role" label={t("Professional title", "តួនាទីវិជ្ជាជីវៈ")} value={data.role} onChange={(value) => update("role", value)} />
          <div className={styles.pair}><Field id="cv-email" label={t("Email", "អ៊ីមែល")} type="email" value={data.email} onChange={(email) => setData((current) => ({ ...current, email }))} /><Field id="cv-phone" label={t("Phone", "លេខទូរស័ព្ទ")} type="tel" value={data.phone} onChange={(phone) => setData((current) => ({ ...current, phone }))} /></div>
          <PairField id="cv-location" label={t("City / country", "ក្រុង / ប្រទេស")} value={data.location} onChange={(value) => update("location", value)} />
          <Field id="cv-website" label={t("Portfolio or professional profile (optional)", "Portfolio ឬប្រវត្តិរូបវិជ្ជាជីវៈ (ជាជម្រើស)")} value={data.website} maxLength={300} onChange={(website) => setData((current) => ({ ...current, website }))} />
        </div></details>
        <details className={styles.section}><summary>{t("2. Profile", "២. សេចក្ដីសង្ខេប")}</summary><div className={styles.sectionBody}><p className={styles.guidance}>{t("Write a concise introduction tailored to the role. Describe skills and experience you actually have.", "សរសេរសេចក្ដីណែនាំខ្លីដែលសមនឹងតួនាទី។ រៀបរាប់ជំនាញ និងបទពិសោធន៍ដែលអ្នកមានពិតប្រាកដ។")}</p><PairField id="cv-summary" label={t("Profile", "សេចក្ដីសង្ខេប")} value={data.summary} onChange={(value) => update("summary", value)} multiline maxLength={2000} /></div></details>
        {entryEditor("experience", t("3. Experience", "៣. បទពិសោធន៍ការងារ"))}
        {entryEditor("education", t("4. Education", "៤. ការអប់រំ"))}
        <details className={styles.section}><summary>{t("5. Skills & languages", "៥. ជំនាញ និងភាសា")}</summary><div className={styles.sectionBody}><PairField id="cv-skills" label={t("Skills · one per line", "ជំនាញ · មួយក្នុងមួយបន្ទាត់")} value={data.skills} onChange={(value) => update("skills", value)} multiline maxLength={1800} /><PairField id="cv-languages" label={t("Languages & proficiency", "ភាសា និងកម្រិត")} value={data.languages} onChange={(value) => update("languages", value)} multiline maxLength={1000} /></div></details>
        <details className={styles.section}><summary>{t("6. Projects & achievements", "៦. គម្រោង និងសមិទ្ធផល")}</summary><div className={styles.sectionBody}>{data.projects.map((item, index) => <div key={item.id} className={styles.entry}><div className={styles.entryTop}><span>{t("Project", "គម្រោង")} {index + 1}</span><button className={styles.remove} type="button" onClick={() => setData((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== item.id) }))}><Trash2 size={13} aria-hidden="true" />{t("Remove", "លុប")}</button></div><PairField id={`${item.id}-project-title`} label={t("Title", "ចំណងជើង")} value={item.title} onChange={(title) => setData((current) => ({ ...current, projects: current.projects.map((project) => project.id === item.id ? { ...project, title } : project) }))} /><PairField id={`${item.id}-project-details`} label={t("Details", "ព័ត៌មានលម្អិត")} value={item.details} multiline maxLength={2400} onChange={(details) => setData((current) => ({ ...current, projects: current.projects.map((project) => project.id === item.id ? { ...project, details } : project) }))} /></div>)}<button className={styles.button} type="button" disabled={data.projects.length >= 8} onClick={() => setData((current) => ({ ...current, projects: [...current.projects, { id: crypto.randomUUID(), title: pair(), details: pair() }] }))}><Plus size={15} aria-hidden="true" />{t("Add a project", "បន្ថែមគម្រោង")}</button></div></details>
        <div className="mt-5"><button type="button" className={styles.remove} onClick={reset} disabled={!dirty}><Trash2 size={14} aria-hidden="true" />{t("Clear this CV", "លុប CV នេះ")}</button></div>
        <p className={styles.guidance}>{t("For online applications, start with a single-column design such as Foundation or Essential. Follow the employer’s instructions; no template guarantees acceptance. Leave out sensitive identifiers that the application does not require.", "សម្រាប់ការដាក់ពាក្យតាមអនឡាញ សូមចាប់ផ្ដើមពីរចនាមួយជួរឈរ ដូចជា Foundation ឬ Essential។ អនុវត្តតាមលក្ខខណ្ឌរបស់និយោជក។ គ្មានគំរូណាមួយធានាការទទួលយកទេ។ កុំបញ្ចូលលេខសម្គាល់សម្ងាត់ដែលមិនចាំបាច់។")}</p>
      </div>
      <div className={styles.previewWrap}><div className={styles.previewTop}><span>{t("Live preview", "មើលលទ្ធផលភ្លាមៗ")}</span><small>{template.name} · A4 · {language === "bilingual" ? "EN + ខ្មែរ" : language === "en" ? "English" : "ខ្មែរ"}</small></div><div className={styles.previewScroll} aria-label={t("CV preview", "មើល CV")} tabIndex={0}><div ref={preview}><CvPreview data={data} template={template} language={language} /></div></div><p className={styles.previewHelp}>{t("Empty sections are omitted. A long CV continues onto additional PDF pages. Add your name to enable export; check the print preview before saving.", "ផ្នែកដែលមិនបានបំពេញនឹងមិនបង្ហាញ។ CV វែងនឹងបន្តទៅទំព័រ PDF បន្ទាប់។ បំពេញឈ្មោះដើម្បីរក្សាទុក ហើយពិនិត្យផ្ទាំងបោះពុម្ពជាមុន។")}</p></div>
    </div>
    <dialog ref={picker} className={styles.modal} aria-labelledby="cv-template-heading"><div className={styles.modalHeader}><div><h2 id="cv-template-heading">{t("Choose your style", "ជ្រើសរើសរចនាបទរបស់អ្នក")}</h2><p>{t("24 free templates across six layouts. Switch designs without losing your information. Single-column layouts are the simplest starting point for application systems.", "គំរូឥតគិតថ្លៃ ២៤ ជាមួយរចនាសម្ព័ន្ធ ៦ ប្រភេទ។ ប្ដូរគំរូដោយមិនបាត់ព័ត៌មាន។ គំរូមួយជួរឈរជាជម្រើសសាមញ្ញសម្រាប់ប្រព័ន្ធដាក់ពាក្យ។")}</p></div><button className={styles.button} type="button" onClick={() => picker.current?.close()} aria-label={t("Close templates", "បិទគំរូ")}><X size={18} /></button></div><div className={styles.templateGrid}>{CV_TEMPLATES.map((item) => <button key={item.id} type="button" className={styles.templateButton} aria-pressed={templateId === item.id} aria-label={`${item.name}, ${item.layout}${item.educationFirst ? ", education first" : ""}`} onClick={() => { setTemplateId(item.id); picker.current?.close(); }}><MiniTemplate template={item} /><strong>{templateId === item.id && <Check size={12} className="mr-1 inline" aria-hidden="true" />}{item.name}</strong><small>{item.layout}{item.educationFirst ? " · education first" : item.compact ? " · compact" : item.serif ? " · serif" : " · standard"}</small></button>)}</div></dialog>
  </div>;
}
