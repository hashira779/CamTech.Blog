# Daily Discovery — News & Editorial Policy

## 1. Editorial Quality Principles
* **Anti-Scraping / Anti-Mirroring:** Full articles from external sites are never copied.
* **Genuine Original Value:** Every news story contains an original summary, key takeaways, why it matters, timelines, who said what, and what remains documented vs disputed.
* **Human Editorial Approval:** AI draft assistance is strictly supervisory; human editors approve all publications.
* **Source Attribution:** Direct links to verified primary sources (AKP, NBC, Reuters, NASA, WHO).

## 2. Deduplication Engine
Incoming stories are normalized and checked for duplication using word-level Jaccard similarity index:
$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
Stories with similarity index $> 0.55$ are grouped into event clusters rather than duplicated.

## 3. Bilingual Support
Native Khmer (`km`) and English (`en`) support with Unicode integrity and localized typography.
