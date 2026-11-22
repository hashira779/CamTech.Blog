import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Compass, MapPin, Route, Sparkles, Wrench } from "lucide-react";
import { getArticles, getDiscoveries, getTools } from "@/lib/api";
import { isArticleEligible } from "@/lib/content-quality";
import { cleanText, formatDate } from "@/lib/format";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { ToolCard } from "@/components/shared/tool-card";

export const revalidate = 60;
export const metadata: Metadata = {
  title: { absolute: "CamTech.Blog — Good places, useful things, fresh perspectives" },
  description: "Find your next Cambodian escape, a useful everyday tool, or an idea worth understanding. Travel, technology and practical discovery in one place.",
  alternates: { canonical: "/" },
};

const destinations = [
  { slug: "siem-reap", name: "Siem Reap", note: "Ancient temples. New perspectives.", image: "siem-reap", label: "Culture & heritage" },
  { slug: "kampot", name: "Kampot", note: "Take the scenic route.", image: "kampot", label: "Riverside escapes" },
  { slug: "ratanakiri", name: "Ratanakiri", note: "A little further off the beaten path.", image: "ratanakiri", label: "Nature & adventure" },
];
const pathways = [
  { href: "/travel", number: "01", title: "Go somewhere good", note: "Find a place. Make a plan. Take the trip.", Icon: Compass, tone: "green" },
  { href: "/tools", number: "02", title: "Make life a little easier", note: "Small tools for the things you do every day.", Icon: Wrench, tone: "orange" },
  { href: "/discover", number: "03", title: "Follow your curiosity", note: "Understand the ideas shaping our world.", Icon: BookOpen, tone: "purple" },
];

export default async function HomePage() {
  const [articles, discoveries, tools] = await Promise.all([
    getArticles({ limit: 30 }), getDiscoveries(), getTools(),
  ]);
  const journal = articles.items.filter(isArticleEligible).slice(0, 3);
  const explainers = discoveries.items.slice(0, 3);
  const selectedTools = ["image-compressor", "qr-code-generator", "json-formatter", "word-counter"]
    .map((slug) => tools.find((tool) => tool.slug === slug)).filter((tool) => tool !== undefined);

  return (
    <div className="field-home">
      <Container>
        <section className="field-hero" aria-labelledby="home-title">
          <div className="field-hero-copy">
            <p className="field-eyebrow"><span className="field-sun" aria-hidden="true">✳</span> A little local. A little limitless.</p>
            <h1 id="home-title">Good places.<br />Useful things.<br /><em>Fresh perspectives.</em></h1>
            <p className="field-hero-deck">Discover Cambodia, simplify your everyday, and find something worth knowing. Welcome to your curious corner of the internet.</p>
            <div className="field-actions">
              <Link href="/travel" className="field-button">Explore Cambodia <ArrowUpRight size={17} aria-hidden="true" /></Link>
              <Link href="/tools" className="field-text-link">Find a useful tool <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            <a href="#start-exploring" className="field-scroll"><span><ArrowDown size={14} aria-hidden="true" /></span> A good place to start</a>
          </div>
          <div className="field-hero-visual">
            <Link href="/travel/ratanakiri" className="field-cover group" aria-label="Explore Ratanakiri and its crater lake">
              <Image src="/images/destinations/ratanakiri.jpg" alt="A blue crater lake surrounded by the green landscape of Ratanakiri, Cambodia" fill priority sizes="(max-width: 767px) 94vw, 52vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="field-cover-scrim" />
              <span className="field-cover-tag"><MapPin size={12} aria-hidden="true" /> Ratanakiri, Cambodia</span>
              <span className="field-cover-caption"><span>The Cambodia collection</span><strong>There’s more<br />out there.</strong></span>
              <span className="field-cover-arrow"><ArrowUpRight size={23} aria-hidden="true" /></span>
            </Link>
            <Link href="/travel/planner" className="field-planner-note"><span className="field-note-icon"><Route size={22} aria-hidden="true" /></span><span><small>Less planning. More exploring.</small><strong>Build your own itinerary</strong></span><ArrowUpRight size={18} aria-hidden="true" /></Link>
            <span className="field-visual-note">A different kind of everyday discovery.</span>
          </div>
        </section>
        <nav id="start-exploring" aria-label="Find your next discovery" className="field-pathways">
          {pathways.map(({ href, number, title, note, Icon, tone }) => (
            <Link key={href} href={href} className="field-pathway group"><span className={`field-path-icon ${tone}`}><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><span className="min-w-0"><small>{number} / Explore your way</small><strong>{title}</strong><span>{note}</span></span><ArrowUpRight size={18} className="field-path-arrow" aria-hidden="true" /></Link>
          ))}
        </nav>
        <section className="field-section" aria-labelledby="places-title">
          <div className="field-section-heading"><div><p className="field-eyebrow">Out of the ordinary</p><h2 id="places-title">Your next “let’s go.”</h2><p>From familiar favourites to somewhere new. Start with a place.</p></div><Link href="/travel" className="field-text-link">Explore all destinations <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <div className="field-destinations">
            {destinations.map((place, index) => (
              <Link href={`/travel/${place.slug}`} key={place.slug} className="field-destination group"><div className="field-destination-image"><Image src={`/images/destinations/${place.image}.jpg`} alt={`Landscape of ${place.name}, Cambodia`} fill sizes="(max-width: 639px) 92vw, (max-width: 1023px) 45vw, 31vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /><span className="field-destination-label">{place.label}</span><span className="field-destination-number">0{index + 1}</span></div><div className="field-destination-copy"><div><h3>{place.name}</h3><p>{place.note}</p></div><span><ArrowUpRight size={20} aria-hidden="true" /></span></div></Link>
            ))}
          </div>
        </section>
      </Container>
      <section className="field-tools-section" aria-labelledby="useful-title">
        <Container>
          <div className="field-section-heading"><div><p className="field-eyebrow"><Wrench size={13} aria-hidden="true" /> A little everyday help</p><h2 id="useful-title">Small tools. Real time saved.</h2><p>Convert, create, calculate. Get on with the rest of your day.</p></div><Link href="/tools" className="field-text-link">Open the toolbox <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
          <div className="field-tools-grid">{selectedTools.map((tool) => <ToolCard key={tool.slug} slug={tool.slug} name={tool.name} category={tool.category} description={tool.description} />)}</div>
          <div className="field-tool-footnote"><span>No account needed for these tools.</span><Link href="/tools">Find the right tool for your task <ArrowRight size={14} aria-hidden="true" /></Link></div>
        </Container>
      </section>
      <Container>
        {explainers.length > 0 && <section className="field-section" aria-labelledby="curiosity-title"><div className="field-section-heading"><div><p className="field-eyebrow">A few things worth understanding</p><h2 id="curiosity-title">Stay a little curious.</h2><p>Science, technology, and the stories behind how things work.</p></div><Link href="/discover" className="field-text-link">Follow your curiosity <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="field-reading-grid">{explainers.map((item) => <Link className="field-reading-card group" href={`/discover/${item.slug}`} key={item.id}><Photo src={item.hero_image_url} alt={item.hero_image_alt || item.title} ratio="3/2" radius="xl" credit={item.hero_image_credit} /><div className="field-reading-copy"><p className="field-eyebrow">{item.category.replace(/_/g, " ")}</p><h3>{cleanText(item.title)}</h3><p>{cleanText(item.intro)}</p><span>Read the explainer <ArrowUpRight size={15} aria-hidden="true" /></span></div></Link>)}</div></section>}
        <section className="field-planner-banner" aria-labelledby="planner-title"><div className="field-banner-icon"><Route size={42} strokeWidth={1.2} aria-hidden="true" /></div><div><p className="field-eyebrow">Make it your kind of trip</p><h2 id="planner-title">A good trip starts with a little idea.</h2><p>Bring places together in a day-by-day itinerary. Move things around. Make room for a detour.</p></div><Link href="/travel/planner" className="field-button">Plan something good <ArrowUpRight size={17} aria-hidden="true" /></Link></section>
        {journal.length > 0 && <section className="field-section field-journal" aria-labelledby="journal-title"><div className="field-section-heading"><div><p className="field-eyebrow">From the journal</p><h2 id="journal-title">A wider perspective.</h2></div><Link href="/cambodia" className="field-text-link">Browse the journal <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="field-journal-list">{journal.map((article) => <Link key={article.id} href={`/${article.country === "KH" ? "cambodia" : "world"}/news/${article.slug}`}><span className="field-eyebrow">{article.category?.name || "Journal"}</span><h3>{cleanText(article.title)}</h3><time dateTime={article.published_at || article.created_at}>{formatDate(article.published_at || article.created_at)}</time><ArrowUpRight size={20} aria-hidden="true" /></Link>)}</div></section>}
        <section className="field-values" aria-label="About this corner of the internet"><span className="field-values-mark"><Sparkles size={20} aria-hidden="true" /></span><p><strong>Worth your time. Made to be useful.</strong> A place for practical discovery, clear explanations, and a closer look at Cambodia.</p><Link href="/about" className="field-text-link">Meet CamTech <ArrowUpRight size={15} aria-hidden="true" /></Link></section>
      </Container>
    </div>
  );
}
