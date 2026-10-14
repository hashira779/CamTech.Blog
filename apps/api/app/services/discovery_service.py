import os
import re
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from app.common.config import settings
from app.common.database import SessionLocal
from app.models.discovery import Discovery
from app.models.audit import SiteSetting
from app.services.image_search_service import image_search_service
from app.services import ai_gateway

logger = logging.getLogger(__name__)

CURATED_DISCOVERY_CANDIDATES = [
    {
        "title": "How Quantum Computers Use Superposition and Entanglement",
        "category": "Quantum Computing",
        "intro": "Unlike classical computers that compute using bits of 0s and 1s, quantum processors harness qubits that exist in probabilistic superpositions.",
        "main_explanation": "Quantum computing represents a fundamental shift in physics and computation. By cooling superconducting circuits near absolute zero (-273.15°C), quantum processors manipulate subatomic states using microwave pulses. When multiple qubits become entangled, calculating power grows exponentially, solving in seconds mathematical simulations that would take classical supercomputers thousands of years.",
        "important_facts": [
            "Superconducting qubits operate at 15 millikelvin — colder than outer space.",
            "Quantum entanglement allows qubits separated in space to instantly share states.",
            "Quantum algorithms like Shor's and Grover's threaten classical RSA cryptography but revolutionize molecular modeling."
        ],
        "visual_sections": [
            {
                "title": "1. Classical Bit vs. Quantum Qubit",
                "description": "A classical bit is like a light switch (ON or OFF). A qubit is a sphere (Bloch sphere) pointing in any continuous direction at once until measured.",
                "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=85",
                "caption": "Visualization of quantum superposition states"
            },
            {
                "title": "2. The Cryogenic Dilution Refrigerator",
                "description": "The golden chandelier housing the quantum processor isolates fragile quantum coherence from environmental thermal noise.",
                "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85",
                "caption": "Dilution refrigerator providing cryogenic cooling for quantum chips"
            }
        ],
        "sources": [
            {"name": "Nature Physics Review", "url": "https://nature.com"},
            {"name": "MIT Technology Review", "url": "https://technologyreview.com"}
        ]
    },
    {
        "title": "How Extreme Ultraviolet (EUV) Machines Etch 2-Nanometer Microchips",
        "category": "Semiconductors",
        "intro": "Inside the world's most intricate machines, molten tin droplets are vaporized by lasers 50,000 times a second to create light pure enough to carve billions of transistors onto silicon.",
        "main_explanation": "Modern silicon fabrication operates at atomic scales. ASML's High-NA EUV lithography systems use 13.5-nanometer light wavelengths bouncing across hyper-polished Zeiss mirrors in a complete vacuum to project circuit blueprints narrower than a single strand of human DNA.",
        "important_facts": [
            "An EUV scanner contains over 100,000 precision parts and costs upwards of $350 million.",
            "The molten tin target is struck by a CO2 laser pulse twice per droplet at 50,000 Hz.",
            "Mirrors inside the scanner are so smooth that if scaled to the size of Germany, the highest bump would be less than a millimeter."
        ],
        "visual_sections": [
            {
                "title": "1. Tin Plasma Light Generation",
                "description": "Laser pulses heat droplets to 400,000 degrees Celsius, releasing shortwave extreme ultraviolet photons.",
                "image_url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=85",
                "caption": "Precision optics and laser plasma generation in semiconductor fabrication"
            }
        ],
        "sources": [
            {"name": "IEEE Spectrum", "url": "https://spectrum.ieee.org"},
            {"name": "ASML Technology Insights", "url": "https://asml.com"}
        ]
    },
    {
        "title": "How Deep Sea Fiber Optic Cables Carry 99% of Global Internet Traffic",
        "category": "Networking",
        "intro": "Beneath ocean floors, hair-thin glass strands shielded in steel and petroleum jelly transmit hundreds of terabits per second across continents at the speed of light.",
        "main_explanation": "Satellites carry less than 1% of international internet bandwidth. Over 500 undersea telecommunication cables spanning 1.4 million kilometers connect global economies. Fiber cables use wavelength division multiplexing (WDM) to beam dozens of colored laser signals simultaneously through pure silica glass cores.",
        "important_facts": [
            "A single modern trans-oceanic cable can transmit over 250 Terabits per second.",
            "Optical repeaters every 60-100 kilometers amplify light signals without converting them to electricity.",
            "Specialized cable ships use underwater robotic plows to bury cables beneath the seabed in coastal zones."
        ],
        "visual_sections": [
            {
                "title": "1. Anatomy of an Undersea Fiber Cable",
                "description": "Eight layers of protective steel armor, polyethylene insulation, and aluminum water barriers encase fragile silica fibers.",
                "image_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=85",
                "caption": "Submarine fiber optic cable cross section"
            }
        ],
        "sources": [
            {"name": "TeleGeography Submarine Cable Map", "url": "https://submarinecablemap.com"},
            {"name": "Scientific American", "url": "https://scientificamerican.com"}
        ]
    }
]

class DiscoveryService:
    """Service for AI-powered generation and discovery of visual science/tech explainers."""

    @classmethod
    async def scan_and_generate_discoveries(cls, count: int = 2) -> Dict[str, Any]:
        """Discovers and generates in-depth scientific & technological discovery explainers."""
        db = SessionLocal()
        created_items = []
        skipped_count = 0

        try:
            existing_slugs = set(s[0] for s in db.query(Discovery.slug).all())
            existing_titles = set(t[0].lower().strip() for t in db.query(Discovery.title).all())

            # Try AI gateway discovery generation
            generated_data = []
            if ai_gateway.has_any_configured_provider():
                prompt = f"""You are a world-class science and engineering explainer writer (like Kurzgesagt or Scientific American).
Generate {count} fascinating, in-depth visual science or technology discovery articles explaining HOW something groundbreaking works.
Choose from cutting-edge topics:
- Quantum Computing, AI Neural Networks, Subsea Internet, Semiconductor Lithography, Fusion Energy, CRISPR Gene Editing, James Webb Optics, Electric Vehicle Solid-State Batteries.

Return STRICT JSON ARRAY OF OBJECTS with these exact keys:
[
  {{
    "title": "How [Concept] Actually Works: [Engaging Subtitle]",
    "category": "Science|AI|Semiconductors|Space|Energy|Cybersecurity",
    "intro": "Engaging 2-3 sentence overview introducing the paradox or technological wonder.",
    "main_explanation": "Detailed 3-4 paragraph markdown explanation detailing the physics, engineering, or computational mechanism.",
    "important_facts": ["Key bullet point fact 1 with numbers", "Key fact 2", "Key fact 3"],
    "visual_sections": [
      {{
        "title": "1. Section Heading",
        "description": "Step-by-step description of this mechanical or biological phase.",
        "caption": "Caption describing the visual diagram"
      }}
    ],
    "sources": [
      {{"name": "Authoritative Publication", "url": "https://example.com"}}
    ]
  }}
]
Do NOT repeat basic tutorials. Deliver mind-expanding, accurate technical journalism. Only output valid JSON."""

                data, meta = await asyncio.to_thread(
                    ai_gateway.generate_json, prompt, use_search=False, timeout=90.0
                )
                if isinstance(data, list):
                    generated_data = data

            # Fallback to curated candidates if AI is unavailable or returned empty
            if not generated_data:
                logger.info("Using verified curated discovery candidates...")
                generated_data = CURATED_DISCOVERY_CANDIDATES

            for item in generated_data:
                title = item.get("title", "").strip()
                if not title or title.lower() in existing_titles:
                    skipped_count += 1
                    continue

                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:100]
                if slug in existing_slugs:
                    slug = f"{slug}-{uuid.uuid4().hex[:4]}"

                # Search 1600px HD hero image
                category = item.get("category", "Science")
                hero_img, credit, alt = await image_search_service.search_news_image(
                    title=title,
                    category="science",
                    country="WORLD",
                    tags=[category, "technology", "physics"]
                )

                # Assign image to visual sections if missing
                visual_secs = item.get("visual_sections", [])
                for i, sec in enumerate(visual_secs):
                    if not sec.get("image_url"):
                        sec_img, _, _ = await image_search_service.search_news_image(
                            title=sec.get("title", title),
                            category="technology",
                            country="WORLD"
                        )
                        sec["image_url"] = sec_img

                disc = Discovery(
                    slug=slug,
                    title=title,
                    category=category,
                    hero_image_url=hero_img,
                    hero_image_credit=credit or "Unsplash / Wikimedia Science Library",
                    hero_image_alt=alt or title,
                    intro=item.get("intro", ""),
                    main_explanation=item.get("main_explanation", ""),
                    visual_sections=json.dumps(visual_secs),
                    important_facts=json.dumps(item.get("important_facts", [])),
                    sources=json.dumps(item.get("sources", [])),
                    is_published=1,
                    published_at=datetime.now(timezone.utc)
                )

                db.add(disc)
                db.commit()
                db.refresh(disc)

                existing_slugs.add(slug)
                existing_titles.add(title.lower())
                created_items.append({"id": disc.id, "title": disc.title, "slug": disc.slug, "hero_image_url": disc.hero_image_url})
                logger.info(f"Discovered & saved: {disc.title}")

            return {
                "status": "success",
                "created_count": len(created_items),
                "skipped_count": skipped_count,
                "items": created_items
            }

        except Exception as e:
            logger.error(f"Discovery scanner error: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "created_count": 0
            }
        finally:
            db.close()


discovery_service = DiscoveryService()
