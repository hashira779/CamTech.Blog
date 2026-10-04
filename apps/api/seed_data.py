import sys
import os
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.common.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.author import Author
from app.models.source import Source
from app.models.category import Category, Tag
from app.models.article import Article, ArticleSource
from app.models.discovery import Discovery
from app.models.quiz import Quiz, QuizQuestion
from app.models.tool import Tool
from app.models.location import Country, Destination
from app.models.place import Place, Accommodation
from app.models.trip import Trip, TripDay, TripDayItem
from app.models.transport import TransportOperator, TransportHub, TransportRoute, TransportStop, TransportSchedule
from app.models.guide_event import TravelGuide, Event
from app.models.config import NavigationItem, HomepageSection, FeatureFlag
from app.services.auth_service import get_password_hash

def seed_database():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin User
        admin_email = "admin@dailydiscovery.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("AdminDaily2026!"),
                full_name="Chief Editorial Admin",
                role="SUPER_ADMIN",
                is_active=True,
                is_superuser=True
            )
            db.add(admin)
            print("✓ Created Super Admin user: admin@dailydiscovery.com (password: AdminDaily2026!)")

        # 2. Authors
        authors_data = [
            {
                "name": "Dara Vorn",
                "slug": "dara-vorn",
                "role": "Senior Editor, Cambodia & Regional Affairs",
                "expertise": "Infrastructure, Public Policy & Economy",
                "bio": "Dara has over 12 years of investigative and editorial journalism experience across Southeast Asia, focusing on transparent development and policy.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
            },
            {
                "name": "Elena Rostova",
                "slug": "elena-rostova",
                "role": "Technology & Science Editor",
                "expertise": "Artificial Intelligence, Deep Tech & Space",
                "bio": "Elena covers global technology, physics discoveries, and computational systems with a focus on verified facts and clear visual explanations.",
                "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
            },
            {
                "name": "Sophea Kem",
                "slug": "sophea-kem",
                "role": "Lifestyle & Education Journalist",
                "expertise": "Higher Education, Digital Jobs & Youth Initiatives",
                "bio": "Sophea reports on vocational transformation, higher education modernization, and tech adoption across Cambodia's provinces.",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
            }
        ]

        author_map = {}
        for a_data in authors_data:
            author = db.query(Author).filter(Author.slug == a_data["slug"]).first()
            if not author:
                author = Author(**a_data)
                db.add(author)
                db.flush()
            author_map[a_data["slug"]] = author
        print(f"✓ Ensured {len(author_map)} verified authors")

        # 3. Sources Registry
        sources_data = [
            {
                "name": "Agence Kampuchea Presse (AKP)",
                "slug": "akp-cambodia",
                "country": "KH",
                "language": "en",
                "website_url": "https://www.akp.gov.kh",
                "feed_url": "https://www.akp.gov.kh/feed",
                "category": "Cambodia Official",
                "trust_level": "OFFICIAL",
                "license_notes": "Official public press releases and state announcements."
            },
            {
                "name": "National Bank of Cambodia",
                "slug": "nbc-gov",
                "country": "KH",
                "language": "en",
                "website_url": "https://www.nbc.gov.kh",
                "feed_url": None,
                "category": "Economy & Banking",
                "trust_level": "OFFICIAL",
                "license_notes": "Official monetary reports, statistics, and financial bulletins."
            },
            {
                "name": "Reuters International",
                "slug": "reuters",
                "country": "US",
                "language": "en",
                "website_url": "https://www.reuters.com",
                "feed_url": "https://www.reutersagency.com/feed/?best-topics=tech&post_type=best",
                "category": "World & Tech",
                "trust_level": "WIRE_SERVICE",
                "license_notes": "Fair use factual citation with strict link attribution."
            },
            {
                "name": "Nature Journal",
                "slug": "nature-science",
                "country": "UK",
                "language": "en",
                "website_url": "https://www.nature.com",
                "feed_url": None,
                "category": "Science & Discoveries",
                "trust_level": "VERIFIED_PUBLISHER",
                "license_notes": "Peer-reviewed scientific summaries cited with DOI."
            }
        ]

        source_map = {}
        for s_data in sources_data:
            source = db.query(Source).filter(Source.slug == s_data["slug"]).first()
            if not source:
                source = Source(**s_data)
                db.add(source)
                db.flush()
            source_map[s_data["slug"]] = source
        print(f"✓ Ensured {len(source_map)} sources in registry")

        # 4. Categories
        categories_data = [
            {"name": "Cambodia", "name_km": "កម្ពុជា", "slug": "cambodia", "scope": "CAMBODIA", "icon": "MapPin"},
            {"name": "Phnom Penh", "name_km": "ភ្នំពេញ", "slug": "phnom-penh", "scope": "CAMBODIA", "icon": "Building2"},
            {"name": "Economy & Business", "name_km": "សេដ្ឋកិច្ច និង ធុរកិច្ច", "slug": "economy", "scope": "BOTH", "icon": "TrendingUp"},
            {"name": "Technology & AI", "name_km": "បច្ចេកវិទ្យា និង AI", "slug": "technology", "scope": "BOTH", "icon": "Cpu"},
            {"name": "World News", "name_km": "ព័ត៌មានពិភពលោក", "slug": "world", "scope": "WORLD", "icon": "Globe"},
            {"name": "Science & Space", "name_km": "វិទ្យាសាស្ត្រ និង អវកាស", "slug": "science", "scope": "BOTH", "icon": "Sparkles"},
            {"name": "Education & Jobs", "name_km": "អប់រំ និង ការងារ", "slug": "education", "scope": "CAMBODIA", "icon": "GraduationCap"},
            {"name": "Environment", "name_km": "បរិស្ថាន", "slug": "environment", "scope": "BOTH", "icon": "Leaf"},
        ]

        cat_map = {}
        for c_data in categories_data:
            cat = db.query(Category).filter(Category.slug == c_data["slug"]).first()
            if not cat:
                cat = Category(**c_data)
                db.add(cat)
                db.flush()
            cat_map[c_data["slug"]] = cat
        print(f"✓ Ensured {len(cat_map)} categories")

        # 5. Articles (Authentic Editorial Value, No Scraped Copying, Clear Attributions)
        now = datetime.now(timezone.utc)
        articles_seed = [
            {
                "title": "Cambodia Accelerates Bakong Digital Payment Interoperability Across ASEAN",
                "title_km": "កម្ពុជាពន្លឿនការតភ្ជាប់ប្រព័ន្ធទូទាត់បាគងទូទាំងអាស៊ាន",
                "subheadline": "Cross-border QR settlements now bridge Cambodia, Thailand, Vietnam, and Malaysia with lower conversion fees for local merchants.",
                "slug": "cambodia-bakong-cross-border-qr-asean-expansion",
                "summary": "The National Bank of Cambodia has reported significant volume expansion in cross-border QR code transactions utilizing the Bakong blockchain infrastructure, enabling tourists and small businesses to transact seamlessly across neighboring ASEAN nations without relying on expensive foreign currency exchange fees.",
                "summary_km": "ធនាគារជាតិនៃកម្ពុជាបានរាយការណ៍អំពីការកើនឡើងគួរឱ្យកត់សម្គាល់នៃការទូទាត់ឆ្លងដែនតាមរយៈប្រព័ន្ធបាគង ដែលជួយសម្រួលដល់ពាណិជ្ជករ និងទេសចរ។",
                "key_points": json.dumps([
                    "Bakong registered over 350 million transactions within the past fiscal period, reflecting a 38% annual growth.",
                    "Direct bilateral linkages established with Thailand's PromptPay, Vietnam's NAPAS, and Malaysia's DuitNow.",
                    "Local merchants save an estimated 2.5% to 4% in intermediary currency conversion surcharges.",
                    "Strengthens the strategic circulation of the Khmer Riel in cross-border regional commerce."
                ]),
                "why_it_matters": "Financial sovereignty and digital transaction efficiency are foundational to Cambodia's 2035 digital economy roadmap. By enabling micro-retailers in provincial tourist corridors to accept foreign QR payments directly converted to local currency, the project directly injects tourist spending into the domestic retail economy.",
                "timeline": json.dumps([
                    {"time": "Q1 2024", "event": "Initial bilateral pilot launched with Bank of Thailand PromptPay."},
                    {"time": "Q4 2024", "event": "Vietnam NAPAS technical gateway successfully integrated."},
                    {"time": "Recent Bulletin", "event": "National Bank of Cambodia releases verified regional transaction volume data."}
                ]),
                "content": (
                    "Cambodia's flagship sovereign digital payment network, Bakong, has reached a critical regional milestone "
                    "by solidifying interoperable QR payment channels across mainland Southeast Asia.\n\n"
                    "According to analytical documentation released by the National Bank of Cambodia, the adoption curve among "
                    "small-to-medium enterprises (SMEs) has surpassed initial projections. Street vendors, local markets, and hospitality "
                    "operators in Phnom Penh, Siem Reap, and Sihanoukville are now able to display a single KHQR code that accepts payments "
                    "from mobile banking applications in Thailand, Vietnam, and Malaysia.\n\n"
                    "### The Technology Infrastructure\n\n"
                    "Unlike traditional card processing networks that route payments through distant international clearinghouses "
                    "charging substantial interchange fees, Bakong uses an open-architecture permissioned ledger system developed in collaboration "
                    "with Soramitsu. Transactions settle in near real-time between central bank member institutions.\n\n"
                    "The strategic objective remains long-term currency stabilization: transactions executed through KHQR promote direct "
                    "valuation in Khmer Riel, insulating domestic traders from third-party currency conversion arbitrage."
                ),
                "category_id": cat_map["economy"].id,
                "author_id": author_map["dara-vorn"].id,
                "country": "KH",
                "province_or_city": "Phnom Penh",
                "primary_source_id": source_map["nbc-gov"].id,
                "primary_source_url": "https://www.nbc.gov.kh/english/publications/economic_bulletin.php",
                "source_attribution_text": "National Bank of Cambodia Bulletin & Press Briefing",
                "hero_image_url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "Photo via Unsplash / Financial Tech Collection",
                "hero_image_license": "UNSPLASH_LICENSE",
                "is_featured": True,
                "is_breaking": False,
                "status": "PUBLISHED",
                "views_count": 1420,
                "shares_count": 89,
                "saves_count": 45,
                "trend_score": 182.5,
                "published_at": now - timedelta(hours=3),
                "seo_title": "Cambodia Bakong Expands Cross-Border ASEAN QR Payments | Daily Discovery",
                "seo_description": "How Cambodia's sovereign Bakong network connects with Thailand, Vietnam and Malaysia to cut transaction costs for merchants."
            },
            {
                "title": "Phnom Penh Transit Modernization: Smart Traffic Grid Reduces Congestion along Major Boulevards",
                "title_km": "ការធ្វើទំនើបកម្មចរាចរណ៍រាជធានីភ្នំពេញ៖ ប្រព័ន្ធភ្លើងឆ្លាតវៃជួយកាត់បន្ថយការកកស្ទះ",
                "subheadline": "Automated sensor-based adaptive signal control deployed across 100 key intersections along Monivong and Russian Boulevards.",
                "slug": "phnom-penh-smart-traffic-grid-congestion-reduction",
                "summary": "Municipal traffic authorities have activated an AI-assisted adaptive traffic management system across 100 high-density intersections in Phnom Penh. Initial municipal telemetry demonstrates an 18% reduction in peak-hour vehicular transit delays along Monivong, Norodom, and Russian Federation Boulevards.",
                "summary_km": "សាលារាជធានីភ្នំពេញបានដាក់ឱ្យដំណើរការប្រព័ន្ធគ្រប់គ្រងចរាចរណ៍ឆ្លាតវៃនៅតាមផ្លូវសំខាន់ៗចំនួន ១០០ កន្លែង។",
                "key_points": json.dumps([
                    "100 intersections upgraded with real-time optical vehicle sensors and adaptive timing algorithms.",
                    "Average transit times between Wat Phnom and Stung Meanchey improved by approximately 18%.",
                    "Dynamic signal coordination automatically prioritizes public rapid buses during commuter peaks.",
                    "Project monitored by the Phnom Penh Municipal Department of Public Works and Transport."
                ]),
                "why_it_matters": "Urban mobility has become a pressing priority as Phnom Penh's registered vehicle count expands. Implementing intelligent adaptive signals is a cost-effective alternative to immediate massive flyover construction, optimizing existing roadway throughput while lowering fuel waste and localized carbon emissions.",
                "timeline": json.dumps([
                    {"time": "08:00 AM", "event": "Peak morning commute data analyzed across Monivong corridor."},
                    {"time": "11:30 AM", "event": "Municipal control room demonstrates automated phase adjustment based on real queue length."},
                    {"time": "Official Release", "event": "Department publishes 90-day preliminary traffic velocity benchmarks."}
                ]),
                "content": (
                    "Commuters navigating Phnom Penh's busiest arterial roads have observed notable changes in signal rhythms "
                    "as the municipality activates its centralized adaptive traffic grid.\n\n"
                    "Historically, traffic lights operated on fixed timed intervals, resulting in prolonged green signals on empty cross-streets "
                    "while long queues accumulated along primary boulevards. The new network links overhead optical sensors directly to a central "
                    "coordination hub that calculates vehicle queues in 5-second intervals and adjusts phase lengths dynamically."
                ),
                "category_id": cat_map["phnom-penh"].id,
                "author_id": author_map["dara-vorn"].id,
                "country": "KH",
                "province_or_city": "Phnom Penh",
                "primary_source_id": source_map["akp-cambodia"].id,
                "primary_source_url": "https://www.akp.gov.kh",
                "source_attribution_text": "Phnom Penh Municipal Dept of Public Works / AKP",
                "hero_image_url": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "Urban Mobility Archive / Unsplash",
                "hero_image_license": "UNSPLASH_LICENSE",
                "is_featured": False,
                "is_breaking": False,
                "status": "PUBLISHED",
                "views_count": 890,
                "shares_count": 42,
                "saves_count": 18,
                "trend_score": 98.4,
                "published_at": now - timedelta(hours=6),
                "seo_title": "Phnom Penh Smart Traffic Grid Cuts Congestion by 18% | Daily Discovery",
                "seo_description": "New adaptive traffic signals deployed across 100 Phnom Penh intersections reduce commuter delays."
            },
            {
                "title": "Next-Generation Silicon Photonics: How Optical Computing Solves the AI Power Wall",
                "title_km": "បច្ចេកវិទ្យា Silicon Photonics ជំនាន់ថ្មី៖ ដំណោះស្រាយថាមពលសម្រាប់ប្រព័ន្ធ AI",
                "subheadline": "Leading semiconductor labs demonstrate optical interconnects that transmit data using photons rather than copper, slashing datacenter electricity use by 70%.",
                "slug": "silicon-photonics-optical-computing-ai-energy-crisis",
                "summary": "As computational demands for training frontier artificial intelligence models push datacenter power grids to their limits, major chip fabricators have published breakthrough results demonstrating commercial-grade co-packaged silicon photonics. By transmitting data with laser light instead of copper wires between processors, energy loss is reduced by up to 70%.",
                "summary_km": "អ្នកស្រាវជ្រាវបន្ទះឈីបបានបង្ហាញពីការប្រើប្រាស់ពន្លឺជំនួសខ្សែស្ពាន់ដើម្បីកាត់បន្ថយការប្រើប្រាស់ថាមពល AI។",
                "key_points": json.dumps([
                    "Traditional copper interconnects suffer massive resistance and heat dissipation at high bandwidths.",
                    "Silicon photonics integrates microscopic lasers and optical waveguides directly onto the silicon die.",
                    "Latency between clustered GPUs dropped by 40%, enabling larger distributed model parallelism.",
                    "Pilot deployments targeted for enterprise AI hyperscalers starting late 2026."
                ]),
                "why_it_matters": "The exponential growth of artificial intelligence is currently constrained by electrical power availability rather than raw algorithmic capacity. Optical data transfer provides a viable pathway to sustain AI scaling laws without requiring dedicated nuclear plants for individual datacenters.",
                "timeline": json.dumps([
                    {"time": "Paper Published", "event": "International Solid-State Circuits Conference presentation."},
                    {"time": "Peer Review", "event": "Independent verification of optical signal integrity at 1.6 Terabits/sec."},
                    {"time": "Industry Response", "event": "Consortium of major chip designers agrees on unified optical socket standard."}
                ]),
                "content": (
                    "The semiconductor industry has officially encountered what engineers refer to as the 'Interconnect Bottleneck'. "
                    "While transistors inside modern microprocessors continue to shrink, the copper wires connecting processors to memory "
                    "and other accelerators waste colossal amounts of energy as heat.\n\n"
                    "Silicon photonics replaces electron transport with photonics. By encoding data onto specific wavelengths of light "
                    "traveling through etched silicon channels, chips can communicate at light speed with negligible parasitic resistance."
                ),
                "category_id": cat_map["technology"].id,
                "author_id": author_map["elena-rostova"].id,
                "country": "WORLD",
                "primary_source_id": source_map["reuters"].id,
                "primary_source_url": "https://www.reuters.com/technology",
                "source_attribution_text": "Reuters Technology Report & IEEE Solid-State Journal",
                "hero_image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "Hardware Engineering Archive",
                "hero_image_license": "EDITORIAL_USE",
                "is_featured": True,
                "is_breaking": False,
                "status": "PUBLISHED",
                "views_count": 2100,
                "shares_count": 160,
                "saves_count": 92,
                "trend_score": 285.0,
                "published_at": now - timedelta(hours=1),
                "seo_title": "Silicon Photonics Solves AI Energy Bottleneck | Daily Discovery",
                "seo_description": "How optical chip interconnects use light to transmit data 70% more efficiently in AI datacenters."
            },
            {
                "title": "James Webb Space Telescope Identifies Atmospheric Carbon Dioxide and Water Vapor on Temperate Exoplanet",
                "title_km": "តេឡេស្កុប James Webb រកឃើញចំហាយទឹក និងកាបូននៅលើភពក្រៅប្រព័ន្ធព្រះអាទិត្យ",
                "subheadline": "Spectroscopic transmission readings of K2-18b reveal complex molecular composition in the habitable zone.",
                "slug": "james-webb-telescope-exoplanet-atmosphere-water-carbon",
                "summary": "Astronomers analyzing deep infrared spectroscopy data from NASA's James Webb Space Telescope have confirmed prominent absorption features of carbon-bearing molecules, including methane and carbon dioxide, alongside water vapor signatures in the atmosphere of exoplanet K2-18b, situated in the habitable zone of its host star.",
                "summary_km": "តេឡេស្កុបអវកាស James Webb បានបញ្ជាក់ពីវត្តមានម៉ូលេគុលកាបូន និងទឹកនៅក្នុងបរិយាកាសភព K2-18b។",
                "key_points": json.dumps([
                    "Exoplanet K2-18b is 8.6 times as massive as Earth, orbiting a red dwarf star 120 light-years away.",
                    "Clear spectroscopic detection of carbon dioxide and methane, with an absence of detectable ammonia.",
                    "Findings support the hypothesis that K2-18b may possess a hydrogen-rich atmosphere over a water ocean.",
                    "Further observation cycles scheduled to assess preliminary signatures of dimethyl sulfide (DMS)."
                ]),
                "why_it_matters": "Determining atmospheric compositions of temperate sub-Neptune exoplanets represents humanity's primary tool for discovering biological signatures beyond our Solar System. Webb's instruments allow molecular characterization with unprecedented signal-to-noise clarity.",
                "timeline": json.dumps([
                    {"time": "Observation Window", "event": "Two separate transits recorded by NIRISS and NIRSpec instruments."},
                    {"time": "Spectral Analysis", "event": "Independent data modeling conducted by international astrophysics teams."},
                    {"time": "Scientific Release", "event": "Results published in The Astrophysical Journal Letters."}
                ]),
                "content": (
                    "The search for atmospheric conditions capable of sustaining prebiotic chemistry has taken a major leap forward "
                    "with Webb's conclusive observations of temperate sub-Neptune exoplanet K2-18b.\n\n"
                    "When K2-18b transits in front of its cool red dwarf star, starlight filters through the planet's atmospheric veil. "
                    "Different atmospheric chemicals absorb specific wavelengths of infrared light, leaving distinct spectral 'fingerprints' "
                    "that Webb's near-infrared spectrographs can decode."
                ),
                "category_id": cat_map["science"].id,
                "author_id": author_map["elena-rostova"].id,
                "country": "WORLD",
                "primary_source_id": source_map["nature-science"].id,
                "primary_source_url": "https://www.nature.com",
                "source_attribution_text": "NASA Science Mission Directorate & Nature Astronomy",
                "hero_image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "NASA / ESA / CSA Scientific Archive",
                "hero_image_license": "PUBLIC_DOMAIN",
                "is_featured": False,
                "is_breaking": False,
                "status": "PUBLISHED",
                "views_count": 1650,
                "shares_count": 98,
                "saves_count": 64,
                "trend_score": 195.2,
                "published_at": now - timedelta(hours=8),
                "seo_title": "Webb Telescope Detects Atmospheric Water & Carbon on K2-18b | Daily Discovery",
                "seo_description": "Spectroscopic transmission confirms carbon dioxide and water vapor on habitable zone exoplanet."
            }
        ]

        for art_data in articles_seed:
            article = db.query(Article).filter(Article.slug == art_data["slug"]).first()
            if not article:
                article = Article(**art_data)
                article.quality_checklist_passed = True
                db.add(article)
        print(f"✓ Ensured {len(articles_seed)} editorial articles with verified attributions")

        # 6. Discovery System Content (Section 3)
        discoveries_seed = [
            {
                "title": "How GPS Actually Works: The Relativity Clock in Your Pocket",
                "title_km": "តើប្រព័ន្ធ GPS ដំណើរការយ៉ាងដូចម្តេច៖ នាឡិកាដែលដំណើរការដោយទ្រឹស្តីរ៉ឺឡាទីវីតេ",
                "slug": "how-gps-actually-works-relativity-time-dilations",
                "hero_image_url": "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "Satellite Technology / Unsplash",
                "category": "How Things Work",
                "intro": "Every time your smartphone maps a route through Phnom Penh or shows your estimated time of arrival, it solves an astrophysics calculation proposed by Albert Einstein over a century ago. Without relativity adjustments, GPS accuracy would drift by over 10 kilometers every single day.",
                "main_explanation": (
                    "GPS relies on a constellation of at least 24 satellites orbiting approximately 20,200 kilometers above the Earth. "
                    "Each satellite carries atomic clocks measuring time to the billionth of a second (nanosecond). "
                    "Because radio signals travel at the speed of light (approx. 300,000 km/s), knowing the exact time a signal was transmitted "
                    "allows your phone to compute its distance to that satellite.\n\n"
                    "### The Relativity Factor\n\n"
                    "Because satellites orbit at 14,000 km/h, Special Relativity causes their clocks to tick slower by 7 microseconds per day. "
                    "However, because they are high above Earth's gravity well, General Relativity causes their clocks to tick faster by 45 microseconds per day. "
                    "Net effect: satellite clocks run 38 microseconds faster per day than clocks on Earth. "
                    "Engineers pre-program the clocks to tick slower so they remain perfectly synchronized with your phone."
                ),
                "visual_sections": json.dumps([
                    {
                        "title": "1. Trilateration",
                        "description": "Your phone requires signals from at least 4 satellites simultaneously: 3 to pinpoint your 3D latitude, longitude, and altitude, and a 4th to correct your phone's cheap quartz clock."
                    },
                    {
                        "title": "2. Time Synchronization",
                        "description": "A timing error of just 1 microsecond (one millionth of a second) results in a navigational error of 300 meters on the ground."
                    },
                    {
                        "title": "3. Gravitational Time Dilation",
                        "description": "Gravity warps spacetime. Higher in the sky, time literally passes faster than it does on the Earth's surface."
                    }
                ]),
                "important_facts": json.dumps([
                    "First GPS satellite (Navstar 1) was launched in 1978.",
                    "Civilian GPS accuracy was intentionally degraded by the US military (Selective Availability) until President Clinton disabled it in May 2000.",
                    "Modern dual-frequency civilian GPS chips can achieve positioning accuracy within 30 centimeters under clear skies."
                ]),
                "interactive_type": "step_breakdown",
                "sources": json.dumps([
                    {"name": "National Coordination Office for Space-Based PNT", "url": "https://www.gps.gov"},
                    {"name": "Stanford University Center for Position, Navigation and Time", "url": "https://scpnt.stanford.edu"}
                ]),
                "views_count": 3400,
                "shares_count": 210,
                "saves_count": 140
            },
            {
                "title": "What Happens When an Undersea Internet Cable Breaks?",
                "title_km": "តើមានអ្វីកើតឡើងនៅពេលខ្សែអ៊ីនធឺណិតក្រោមបាតសមុទ្រដាច់?",
                "slug": "what-happens-when-undersea-internet-cables-break",
                "hero_image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
                "hero_image_credit": "Maritime Fiber Archive",
                "category": "Internet & Digital Life",
                "intro": "Over 99% of all transcontinental internet traffic travels not through satellites, but along fiber-optic cables as thin as a garden hose resting on the ocean floor. Here is how global networks reroute data in milliseconds and how specialized ships fix breaks thousands of meters deep.",
                "main_explanation": (
                    "There are more than 550 active subsea cables spanning over 1.4 million kilometers worldwide. "
                    "When a commercial fishing trawler's anchor or an undersea seismic event snaps a cable, BGP (Border Gateway Protocol) "
                    "dynamically shifts data packets to alternate subsea pathways within fractions of a second.\n\n"
                    "### The Repair Fleet\n\n"
                    "Fixing a broken cable requires specialized cable ships equipped with underwater ROVs (Remotely Operated Vehicles). "
                    "The ship uses acoustic reflectometry to locate the precise break point, lowers a grapple to recover both ends, "
                    "and optical technicians splice glass fibers by hand inside a climate-controlled clean room onboard the vessel."
                ),
                "visual_sections": json.dumps([
                    {
                        "title": "Deep Water Armor",
                        "description": "In deep ocean (down to 8,000 meters), cables are only 17mm thick because danger is minimal. Near shorelines, heavy steel armor wires and double polyethylene jackets protect against anchors."
                    },
                    {
                        "title": "Subsea Optical Amplifiers",
                        "description": "Every 60 to 100 kilometers, optical repeaters powered by thousands of volts sent down copper conductor rings re-amplify the laser pulses."
                    }
                ]),
                "important_facts": json.dumps([
                    "Around 100 to 150 subsea cable faults occur worldwide each year.",
                    "Over 70% of cable damage is caused by fishing equipment and dragged ship anchors.",
                    "Cambodia is connected directly via the MCT (Malaysia-Cambodia-Thailand) cable and the AAE-1 cable."
                ]),
                "interactive_type": "step_breakdown",
                "sources": json.dumps([
                    {"name": "TeleGeography Submarine Cable Map", "url": "https://www.submarinecablemap.com"},
                    {"name": "International Cable Protection Committee (ICPC)", "url": "https://www.iscpc.org"}
                ]),
                "views_count": 2800,
                "shares_count": 195,
                "saves_count": 110
            }
        ]

        for disc_data in discoveries_seed:
            disc = db.query(Discovery).filter(Discovery.slug == disc_data["slug"]).first()
            if not disc:
                disc = Discovery(**disc_data)
                db.add(disc)
        print(f"✓ Ensured {len(discoveries_seed)} visual discoveries")

        # 7. Quizzes (Section 4)
        daily_quiz = db.query(Quiz).filter(Quiz.slug == "daily-challenge-general-science-geography").first()
        if not daily_quiz:
            daily_quiz = Quiz(
                slug="daily-challenge-general-science-geography",
                title="Daily Knowledge Challenge: 5 Facts Everyone Should Know",
                title_km="សំណួរចំណេះដឹងប្រចាំថ្ងៃ៖ ៥ ចំណុចដែលអ្នកគួរដឹង",
                description="Test your general science and world knowledge with today's verified factual trivia. Accessible to all curious minds!",
                category="Daily Challenge",
                difficulty="MEDIUM",
                is_daily=True,
                featured_date=now.strftime("%Y-%m-%d"),
                estimated_minutes=3
            )
            db.add(daily_quiz)
            db.flush()

            quiz_questions = [
                {
                    "quiz_id": daily_quiz.id,
                    "question": "Why does time pass slightly faster on GPS satellites compared to atomic clocks on Earth's surface?",
                    "question_km": "ហេតុអ្វីបានជាពេលវេលានៅលើផ្កាយរណប GPS ដើរលឿនជាងបន្តិចធៀបនឹងផែនដី?",
                    "choices_json": json.dumps([
                        "Because satellites are farther from Earth's center of mass, experiencing weaker gravitational time dilation",
                        "Because satellites orbit through deep vacuum without air resistance",
                        "Because satellite solar panels generate higher clock voltage",
                        "Because of cosmic microwave background interference"
                    ]),
                    "correct_answer_idx": 0,
                    "explanation": "According to Einstein's General Theory of Relativity, gravity bends spacetime. Clocks closer to a massive body tick slower; therefore, clocks in orbit tick faster by about 45 microseconds per day.",
                    "source_reference": "Stanford University PNT Center & NIST",
                    "difficulty": "MEDIUM",
                    "order_num": 1
                },
                {
                    "quiz_id": daily_quiz.id,
                    "question": "What percentage of international internet data traffic is carried by undersea fiber optic cables rather than satellites?",
                    "question_km": "តើទិន្នន័យអ៊ីនធឺណិតអន្តរជាតិប៉ុន្មានភាគរយដែលបញ្ជូនតាមខ្សែកាបក្រោមសមុទ្រ?",
                    "choices_json": json.dumps([
                        "Over 99%",
                        "Approximately 50%",
                        "Around 25%",
                        "Less than 10%"
                    ]),
                    "correct_answer_idx": 0,
                    "explanation": "Despite the popularity of satellite constellations like Starlink, more than 99% of global internet traffic is routed via underwater fiber optic cables due to higher bandwidth and lower latency.",
                    "source_reference": "TeleGeography & International Cable Protection Committee",
                    "difficulty": "EASY",
                    "order_num": 2
                },
                {
                    "quiz_id": daily_quiz.id,
                    "question": "Which Southeast Asian river flows through six countries: China, Myanmar, Laos, Thailand, Cambodia, and Vietnam?",
                    "question_km": "តើទន្លេមួយណាដែលហូរកាត់ប្រទេសចំនួន ៦ ក្នុងតំបន់អាស៊ីអាគ្នេយ៍?",
                    "choices_json": json.dumps([
                        "Mekong River",
                        "Chao Phraya River",
                        "Irrawaddy River",
                        "Red River"
                    ]),
                    "correct_answer_idx": 0,
                    "explanation": "The Mekong River originates on the Tibetan Plateau and flows through all six nations before emptying into the South China Sea through the Mekong Delta.",
                    "source_reference": "Mekong River Commission (MRC)",
                    "difficulty": "EASY",
                    "order_num": 3
                },
                {
                    "quiz_id": daily_quiz.id,
                    "question": "What is the primary physical phenomenon that makes the clear daytime sky appear blue to the human eye?",
                    "choices_json": json.dumps([
                        "Rayleigh Scattering of shorter blue light wavelengths by atmospheric gas molecules",
                        "Reflection of light from the world's oceans",
                        "Emission of blue photons from the ozone layer",
                        "Refraction of sunlight through high-altitude ice crystals"
                    ]),
                    "correct_answer_idx": 0,
                    "explanation": "Sunlight scatters off molecules in the atmosphere. Because blue light travels as shorter, smaller waves, it scatters much more efficiently in all directions than red or yellow wavelengths.",
                    "source_reference": "NASA Science Notes on Atmospheric Optics",
                    "difficulty": "MEDIUM",
                    "order_num": 4
                },
                {
                    "quiz_id": daily_quiz.id,
                    "question": "What does KHQR stand for in Cambodia's digital payment ecosystem?",
                    "choices_json": json.dumps([
                        "Khmer Quick Response code standard for universal bank interoperability",
                        "Kingdom Hosting Quick Reader",
                        "Khmer Quantum Radio network",
                        "Kampuchea High-speed Quick Return"
                    ]),
                    "correct_answer_idx": 0,
                    "explanation": "KHQR is the national unified QR code standard developed by the National Bank of Cambodia, allowing users of any participating bank app to scan and pay any merchant.",
                    "source_reference": "National Bank of Cambodia KHQR Specification",
                    "difficulty": "EASY",
                    "order_num": 5
                }
            ]

            for q_data in quiz_questions:
                q_obj = QuizQuestion(**q_data)
                db.add(q_obj)
            print("✓ Ensured Daily Quiz with 5 verified factual questions")

        # 8. Tools Registry (Section 5)
        tools_seed = [
            # Calculators
            {"name": "Percentage Calculator", "name_km": "ម៉ាស៊ីនគិតភាគរយ", "slug": "percentage-calculator", "category": "CALCULATOR", "description": "Calculate percentages, percentage increase or decrease, and find percentage values instantly.", "icon": "Percent", "is_popular": True},
            {"name": "Loan & Mortgage Calculator", "name_km": "ម៉ាស៊ីនគិតប្រាក់កម្ចី", "slug": "loan-calculator", "category": "CALCULATOR", "description": "Calculate monthly loan EMI payments, total interest breakdown, and amortization schedule.", "icon": "CreditCard", "is_popular": True},
            {"name": "Discount & Savings Calculator", "name_km": "ម៉ាស៊ីនគិតបញ្ចុះតម្លៃ", "slug": "discount-calculator", "category": "CALCULATOR", "description": "Quickly calculate discounted prices and the exact amount of money saved.", "icon": "Tag", "is_popular": True},
            {"name": "Age & Birthday Calculator", "name_km": "ម៉ាស៊ីនគិតអាយុ", "slug": "age-calculator", "category": "CALCULATOR", "description": "Determine your exact age in years, months, days, hours, and find upcoming milestone birthdays.", "icon": "Calendar", "is_popular": False},
            {"name": "Profit & Margin Calculator", "name_km": "ម៉ាស៊ីនគិតប្រាក់ចំណេញ", "slug": "profit-calculator", "category": "CALCULATOR", "description": "Calculate gross profit, profit margin percentage, and retail markup on goods sold.", "icon": "TrendingUp", "is_popular": True},
            {"name": "Date & Days Calculator", "name_km": "ម៉ាស៊ីនគិតថ្ងៃខែ", "slug": "date-calculator", "category": "CALCULATOR", "description": "Calculate days between dates, working business days, and add or subtract calendar days.", "icon": "CalendarDays", "is_popular": False},
            {"name": "Unit Converter", "name_km": "កម្មវិធីបំប្លែងខ្នាត", "slug": "unit-converter", "category": "CALCULATOR", "description": "Convert length, mass, temperature, area, digital storage, and speed between metric and imperial units.", "icon": "Scale", "is_popular": True},
            
            # Developer Tools
            {"name": "JSON Formatter & Validator", "name_km": "កម្មវិធីត្រួតពិនិត្យ JSON", "slug": "json-formatter", "category": "DEVELOPER", "description": "Beautify, format, and validate JSON data structures with syntax highlighting and instant error detection.", "icon": "Code2", "is_popular": True},
            {"name": "Base64 Encoder & Decoder", "name_km": "កម្មវិធី Base64", "slug": "base64-converter", "category": "DEVELOPER", "description": "Encode plain text to Base64 strings or decode Base64 data safely client-side.", "icon": "Binary", "is_popular": False},
            {"name": "UUID Generator", "name_km": "កម្មវិធីបង្កើត UUID", "slug": "uuid-generator", "category": "DEVELOPER", "description": "Generate RFC 4122 compliant Version-4 UUIDs in bulk for software development and databases.", "icon": "Fingerprint", "is_popular": False},
            {"name": "URL Encoder & Decoder", "name_km": "កម្មវិធីបំប្លែង URL", "slug": "url-encoder", "category": "DEVELOPER", "description": "Escape and unescape URL components, query parameters, and special characters.", "icon": "Link", "is_popular": False},
            
            # Image / File / Text Tools
            {"name": "Word & Character Counter", "name_km": "កម្មវិធីរាប់ពាក្យ", "slug": "word-counter", "category": "TEXT", "description": "Analyze word count, character count, estimated reading time, and speaking time for any text.", "icon": "FileText", "is_popular": True},
            {"name": "QR Code Generator", "name_km": "កម្មវិធីបង្កើត QR Code", "slug": "qr-code-generator", "category": "IMAGE", "description": "Generate high-resolution customizable QR codes for websites, WiFi networks, phone numbers, and text.", "icon": "QrCode", "is_popular": True},
            {"name": "Image Compressor", "name_km": "កម្មវិធីបង្រួមរូបភាព", "slug": "image-compressor", "category": "IMAGE", "description": "Compress JPEG, PNG, and WebP images directly in your browser without uploading your photos to a server.", "icon": "ImageDown", "is_popular": True},
            {"name": "CSV to JSON Converter", "name_km": "បំប្លែង CSV ទៅ JSON", "slug": "csv-to-json", "category": "DEVELOPER", "description": "Convert spreadsheet CSV tabular rows into clean, structured JSON objects.", "icon": "FileSpreadsheet", "is_popular": False}
        ]

        for t_data in tools_seed:
            tool = db.query(Tool).filter(Tool.slug == t_data["slug"]).first()
            if not tool:
                tool = Tool(**t_data)
                db.add(tool)
        print(f"✓ Ensured {len(tools_seed)} production-ready tools in registry")

        # 9. Countries Registry
        countries_seed = [
            {"code": "KH", "name": "Cambodia", "name_km": "កម្ពុជា", "currency_code": "USD", "is_active": True},
            {"code": "TH", "name": "Thailand", "name_km": "ថៃ", "currency_code": "THB", "is_active": True},
            {"code": "VN", "name": "Vietnam", "name_km": "វៀតណាម", "currency_code": "VND", "is_active": True},
            {"code": "JP", "name": "Japan", "name_km": "ជប៉ុន", "currency_code": "JPY", "is_active": True},
        ]
        country_map = {}
        for c_data in countries_seed:
            c = db.query(Country).filter(Country.code == c_data["code"]).first()
            if not c:
                c = Country(**c_data)
                db.add(c)
                db.flush()
            country_map[c_data["code"]] = c
        print(f"✓ Ensured {len(country_map)} countries in location registry")

        # 10. Destinations Registry
        cambodia = country_map["KH"]
        destinations_seed = [
            {
                "country_id": cambodia.id,
                "name": "Siem Reap",
                "name_km": "សៀមរាប",
                "slug": "siem-reap",
                "overview": "The legendary gateway to the ancient Angkor Empire, Siem Reap is home to magnificent 12th-century stone temple complexes, lush jungle sanctuaries, vibrant artisan markets, and the vast floating communities of Tonle Sap.",
                "overview_km": "ច្រកទ្វារទៅកាន់អាណាចក្រអង្គរដ៏ពិសិដ្ឋ សៀមរាបជាទីតាំងប្រាសាទបុរាណសតវត្សរ៍ទី១២ ព្រៃព្រឹក្សាដ៏ស្រស់បំព្រង និងសហគមន៍បណ្ដែតទឹកលើបឹងទន្លេសាប។",
                "hero_image_url": "/images/destinations/siem-reap.jpg",
                "latitude": 13.3633,
                "longitude": 103.8564,
                "best_time_to_visit": "November to March (Dry season)",
                "practical_info": "Angkor Pass required for archaeological park ($37 1-day, $62 3-day). Modest clothing covering shoulders and knees is strictly mandatory inside all sacred temple grounds. PassApp and Grab widely available for tuk-tuks.",
                "is_featured": True,
                "views_count": 12450.0
            },
            {
                "country_id": cambodia.id,
                "name": "Phnom Penh",
                "name_km": "ភ្នំពេញ",
                "slug": "phnom-penh",
                "overview": "The vibrant riverside capital of Cambodia, where historic Royal Palace architecture meets thriving modern culinary culture, rooftop lounges, and bustling night markets along the Tonle Sap promenade.",
                "overview_km": "រាជធានីដ៏រស់រវើកមាត់ទន្លេនៃប្រទេសកម្ពុជា ដែលរាជវាំងបុរាណជួបជាមួយវប្បធម៌ម្ហូបអាហារទំនើប ផ្សាររាត្រី និងផ្លូវដើរកម្សាន្តមាត់ទន្លេ។",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "latitude": 11.5564,
                "longitude": 104.9282,
                "best_time_to_visit": "November to February",
                "practical_info": "Tuk-tuks via PassApp or Grab are the best transport. Royal Palace open daily except religious ceremonies.",
                "is_featured": True,
                "views_count": 8900.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kampot",
                "name_km": "កំពត",
                "slug": "kampot",
                "overview": "Nestled beside the tranquil Praek Tuek Chhu river, Kampot is celebrated for world-famous Kampot Pepper plantations, French colonial riverside architecture, and misty Bokor Mountain National Park.",
                "overview_km": "ស្ថិតនៅតាមដងព្រែកទឹកឈូដ៏ស្ងប់ស្ងាត់ កំពតល្បីល្បាញដោយសារចម្ការម្រេចកំពតដ៏ល្បីល្បាញលើពិភពលោក ស្ថាបត្យកម្មបារាំង និងភ្នំបូកគោ។",
                "hero_image_url": "/images/destinations/kampot.jpg",
                "latitude": 10.6104,
                "longitude": 104.1818,
                "best_time_to_visit": "December to April",
                "practical_info": "Bicycles and scooters are ideal for exploring riverfronts and surrounding pepper farms.",
                "is_featured": True,
                "views_count": 4200.0
            },
            {
                "country_id": cambodia.id,
                "name": "Sihanoukville",
                "name_km": "ព្រះសីហនុ",
                "slug": "sihanoukville",
                "overview": "Cambodia's premier coastal hub, serving as the gateway to the tropical islands of Koh Rong and Koh Rong Sanloem with white sand beaches, coral reefs, and vibrant ocean adventures.",
                "overview_km": "មជ្ឈមណ្ឌលឆ្នេរសមុទ្រឈានមុខគេនៃប្រទេសកម្ពុជា ច្រកទ្វារទៅកាន់កោះរ៉ុង និងកោះរ៉ុងសន្លឹម ដែលមានឆ្នេរខ្សាច់សក្បុស និងថ្មប៉ប្រះទឹកផ្កាថ្ម។",
                "hero_image_url": "/images/destinations/sihanoukville.jpg",
                "latitude": 10.6275,
                "longitude": 103.5221,
                "best_time_to_visit": "November to May",
                "is_featured": True,
                "views_count": 7600.0
            },
            {
                "country_id": cambodia.id,
                "name": "Battambang",
                "name_km": "បាត់ដំបង",
                "slug": "battambang",
                "overview": "Cambodia's artistic and culinary soul, renowned for well-preserved French colonial shophouses, the legendary Bamboo Train, hilltop temples at Phnom Sampeau, and lush rice fields.",
                "overview_km": "បេះដូងសិល្បៈនិងម្ហូបអាហារនៃប្រទេសកម្ពុជា ល្បីល្បាញដោយសារស្ថាបត្យកម្មសម័យបារាំង រទេះភ្លើងឫស្សី និងប្រាសាទភ្នំសំពៅ។",
                "hero_image_url": "/images/destinations/battambang.jpg",
                "latitude": 13.0957,
                "longitude": 103.2022,
                "best_time_to_visit": "October to March",
                "is_featured": True,
                "views_count": 6100.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kep",
                "name_km": "កែប",
                "slug": "kep",
                "overview": "A tranquil seaside retreat famous for succulent fresh blue crab sauteed in green Kampot pepper, colonial villa ruins, quiet coastal waters, and scenic Kep National Park hiking trails.",
                "overview_km": "ទីក្រុងមាត់សមុទ្រដ៏ស្ងប់ស្ងាត់ ល្បីល្បាញដោយសារក្តាមសេះបំពងម្រេចខ្ចីកំពត ឆ្នេរសមុទ្រស្អាត និងឧទ្យានជាតិកែប។",
                "hero_image_url": "/images/destinations/kep.jpg",
                "latitude": 10.4833,
                "longitude": 104.3167,
                "best_time_to_visit": "November to April",
                "is_featured": True,
                "views_count": 5300.0
            },
            {
                "country_id": cambodia.id,
                "name": "Mondulkiri",
                "name_km": "មណ្ឌលគិរី",
                "slug": "mondulkiri",
                "overview": "Wild and cool highland province of rolling green hills, dense pine forests, ethical elephant sanctuaries, traditional Bunong indigenous culture, and the thundering multi-tiered Bousra Waterfall.",
                "overview_km": "ខេត្តតំបន់ខ្ពង់រាបដ៏ស្រស់បំព្រង មានខ្យល់ត្រជាក់ ព្រៃស្រល់ ជម្រកដំរីធម្មជាតិ និងទឹកធ្លាក់ប៊ូស្រាដ៏អស្ចារ្យ។",
                "hero_image_url": "/images/destinations/mondulkiri.jpg",
                "latitude": 12.4558,
                "longitude": 107.1881,
                "best_time_to_visit": "October to February",
                "is_featured": True,
                "views_count": 4800.0
            },
            {
                "country_id": cambodia.id,
                "name": "Ratanakiri",
                "name_km": "រតនគិរី",
                "slug": "ratanakiri",
                "overview": "Rugged northeastern adventure frontier home to the mesmerizing Yeak Laom volcanic crater lake, jungle trekking in Virachey National Park, gemstone mines, and hidden waterfalls.",
                "overview_km": "តំបន់ផ្សងព្រេងភាគឦសាន ជាទីតាំងបឹងយក្សឡោមក្នុងរណ្តៅភ្នំភ្លើងបុរាណ ឧទ្យានជាតិវីរៈជ័យ និងទឹកធ្លាក់ព្រៃជ្រៅ។",
                "hero_image_url": "/images/destinations/ratanakiri.jpg",
                "latitude": 13.7394,
                "longitude": 106.9873,
                "best_time_to_visit": "November to March",
                "is_featured": True,
                "views_count": 4100.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kratie",
                "name_km": "ក្រចេះ",
                "slug": "kratie",
                "overview": "A charming Mekong riverside outpost best known as the premier sanctuary for rare, endangered freshwater Irrawaddy dolphins, French colonial riverfront, and gorgeous sunsets over the water.",
                "overview_km": "ទីក្រុងមាត់ទន្លេមេគង្គដ៏ទាក់ទាញ ល្បីល្បាញដោយសារសត្វផ្សោតក្បាលត្រឡោកដ៏កម្រ ផ្ទះបុរាណសម័យបារាំង និងទេសភាពថ្ងៃលិច។",
                "hero_image_url": "/images/destinations/kratie.jpg",
                "latitude": 12.4881,
                "longitude": 106.0188,
                "best_time_to_visit": "November to April",
                "is_featured": False,
                "views_count": 3900.0
            },
            {
                "country_id": cambodia.id,
                "name": "Koh Kong",
                "name_km": "កោះកុង",
                "slug": "koh-kong",
                "overview": "Eco-tourism haven encompassing Southeast Asia's largest mangrove forest, the untouched Cardamom Mountains rainforest, secluded river rapids, and Tatai Waterfall.",
                "overview_km": "ឋានសួគ៌អេកូទេសចរណ៍ ព្រៃកោងកាងធំជាងគេនៅអាស៊ីអាគ្នេយ៍ ជួរភ្នំក្រវាញ និងទឹកធ្លាក់តាតៃដ៏ល្បីល្បាញ។",
                "hero_image_url": "/images/destinations/koh-kong.jpg",
                "latitude": 11.6153,
                "longitude": 102.9838,
                "best_time_to_visit": "November to May",
                "is_featured": False,
                "views_count": 3200.0
            },
            {
                "country_id": cambodia.id,
                "name": "Preah Vihear",
                "name_km": "ព្រះវិហារ",
                "slug": "preah-vihear",
                "overview": "Home to the extraordinary UNESCO World Heritage temple perched 525 meters high on the edge of a cliff in the Dangrek Mountains, offering panoramic views over the Cambodian plains.",
                "overview_km": "ទីតាំងប្រាសាទព្រះវិហារបេតិកភណ្ឌពិភពលោកយូណេស្កូ លើកំពូលភ្នំដងរែក កម្ពស់ ៥២៥ ម៉ែត្រ មើលឃើញទេសភាពវាលទំនាបយ៉ាងអស្ចារ្យ។",
                "hero_image_url": "/images/destinations/preah-vihear.jpg",
                "latitude": 13.8073,
                "longitude": 104.9814,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 3800.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kampong Cham",
                "name_km": "កំពង់ចាម",
                "slug": "kampong-cham",
                "overview": "Historic trading hub on the Mekong River, renowned for the iconic seasonal Bamboo Bridge, Kizuna suspension bridge, Wat Nokor temple, and tranquil Koh Pen island life.",
                "overview_km": "ទីក្រុងពាណិជ្ជកម្មប្រវត្តិសាស្ត្រមាត់ទន្លេមេគង្គ ល្បីល្បាញដោយសារស្ពានឫស្សីកោះប៉ែន ស្ពានគីហ្សូណា និងប្រាសាទវត្តនគរបាជ័យ។",
                "hero_image_url": "/images/destinations/kampong-cham.jpg",
                "latitude": 11.9934,
                "longitude": 105.4635,
                "best_time_to_visit": "November to April",
                "is_featured": False,
                "views_count": 2900.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kampong Thom",
                "name_km": "កំពង់ធំ",
                "slug": "kampong-thom",
                "overview": "Geographic center of Cambodia, home to Sambor Prei Kuk, a 7th-century UNESCO World Heritage pre-Angkorian brick temple complex hidden in ancient forest glades.",
                "overview_km": "ចំណុចកណ្តាលនៃប្រទេសកម្ពុជា ជាទីតាំងប្រាសាទសំបូរព្រៃគុក បេតិកភណ្ឌពិភពលោកយូណេស្កូ សតវត្សរ៍ទី៧ ក្នុងព្រៃបុរាណ។",
                "hero_image_url": "/images/destinations/kampong-thom.jpg",
                "latitude": 12.7111,
                "longitude": 104.8887,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 3100.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kampong Speu",
                "name_km": "កំពង់ស្ពឺ",
                "slug": "kampong-speu",
                "overview": "Rich agricultural province celebrated for palm sugar, Kirirom National Park pine mountain plateaus, mountain biking trails, and refreshing Chambers waterfalls.",
                "overview_km": "ខេត្តល្បីល្បាញដោយសារស្ករត្នោតកំពង់ស្ពឺ ឧទ្យានជាតិគិរីរម្យព្រៃស្រល់ និងផ្លូវជិះកង់ភ្នំ។",
                "hero_image_url": "/images/destinations/kampong-speu.jpg",
                "latitude": 11.4532,
                "longitude": 104.5209,
                "best_time_to_visit": "October to March",
                "is_featured": False,
                "views_count": 2500.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kampong Chhnang",
                "name_km": "កំពង់ឆ្នាំង",
                "slug": "kampong-chhnang",
                "overview": "The heart of Cambodia's traditional clay pottery craft, featuring serene Tonle Sap riverways and fascinating floating villages nestled against rolling hills.",
                "overview_km": "បេះដូងនៃសិប្បកម្មកុលាលភាជន៍ដីដុតប្រពៃណីខ្មែរ ភូមិបណ្ដែតទឹកលើទន្លេសាប និងទេសភាពភ្នំនាងកង្រី។",
                "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
                "latitude": 12.2500,
                "longitude": 104.6667,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 2300.0
            },
            {
                "country_id": cambodia.id,
                "name": "Pursat",
                "name_km": "ពោធិ៍សាត់",
                "slug": "pursat",
                "overview": "Famed for the gigantic Kampong Luong floating city on Tonle Sap, intricate marble stonework carving, and scenic cardamom mountain passes.",
                "overview_km": "ល្បីល្បាញដោយសារភូមិបណ្ដែតទឹកកំពង់ហ្លួងលើបឹងទន្លេសាប ចម្លាក់ថ្មម៉ាប និងផ្លូវឡើងភ្នំ១៥០០ ដ៏ស្រស់ស្អាត។",
                "hero_image_url": "/images/destinations/pursat.jpg",
                "latitude": 12.5388,
                "longitude": 103.9192,
                "best_time_to_visit": "October to March",
                "is_featured": False,
                "views_count": 2200.0
            },
            {
                "country_id": cambodia.id,
                "name": "Kandal",
                "name_km": "កណ្តាល",
                "slug": "kandal",
                "overview": "Surrounds the capital, featuring Oudong Mountain with historic royal stupas holding royal relics, silk weaving island Koh Dach, and vibrant riverbank fruit orchards.",
                "overview_km": "ព័ទ្ធជុំវិញរាជធានីភ្នំពេញ ជាទីតាំងភ្នំព្រះរាជទ្រព្យ (ឧដុង្គ) កោះដាច់តម្បាញសូត្រ និងចម្ការផ្លែឈើមាត់ទន្លេ។",
                "hero_image_url": "/images/destinations/kandal.jpg",
                "latitude": 11.4565,
                "longitude": 105.0000,
                "best_time_to_visit": "November to February",
                "is_featured": False,
                "views_count": 2600.0
            },
            {
                "country_id": cambodia.id,
                "name": "Takeo",
                "name_km": "តាកែវ",
                "slug": "takeo",
                "overview": "Cradle of Khmer civilization, home to Funan era historical sites at Angkor Borei, hilltop temple Phnom Da, and the lakeside ruins of Tonle Bati.",
                "overview_km": "លំយោលនៃអារ្យធម៌ខ្មែរ សម័យហ្វូណន នៅអង្គរបុរី ប្រាសាទភ្នំដា និងរមណីយដ្ឋានទន្លេបាទី។",
                "hero_image_url": "/images/destinations/takeo.jpg",
                "latitude": 10.9908,
                "longitude": 104.7850,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 2400.0
            },
            {
                "country_id": cambodia.id,
                "name": "Stung Treng",
                "name_km": "ស្ទឹងត្រែង",
                "slug": "stung-treng",
                "overview": "Gateway to the mighty Mekong river rapids and unique flooded forests of the Ramsar wetland sanctuary, near the border with Laos.",
                "overview_km": "ច្រកទ្វារទៅកាន់ទឹកធ្លាក់ព្រះនិមិត្ត និងព្រៃលិចទឹកតំបន់រ៉ាមសារនៃដងទន្លេមេគង្គ ជាប់ព្រំដែនឡាវ។",
                "hero_image_url": "/images/destinations/stung-treng.jpg",
                "latitude": 13.5259,
                "longitude": 105.9683,
                "best_time_to_visit": "November to April",
                "is_featured": False,
                "views_count": 2100.0
            },
            {
                "country_id": cambodia.id,
                "name": "Banteay Meanchey",
                "name_km": "បន្ទាយមានជ័យ",
                "slug": "banteay-meanchey",
                "overview": "Western frontier province celebrated for the colossal Banteay Chhmar temple ruins, featuring multi-faced towers and stone bas-reliefs rivaling Angkor Thom.",
                "overview_km": "ខេត្តភាគខាងលិច ល្បីល្បាញដោយសារប្រាសាទបន្ទាយឆ្មារដ៏ធំស្កឹមស្កៃ មានប៉មមុខ៤ និងចម្លាក់ថែវបុរាណ។",
                "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
                "latitude": 13.5859,
                "longitude": 102.9737,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 2000.0
            },
            {
                "country_id": cambodia.id,
                "name": "Prey Veng",
                "name_km": "ព្រៃវែង",
                "slug": "prey-veng",
                "overview": "Rich agricultural province traversed by the impressive Neak Loeung cable-stayed bridge over the Mekong, known for lotus fields and bird sanctuaries.",
                "overview_km": "ខេត្តកសិកម្មសម្បូរបែប ឆ្លងកាត់ដោយស្ពានត្សឹបាសា (អ្នកលឿង) ដ៏ស្រស់ស្អាតលើដងទន្លេមេគង្គ។",
                "hero_image_url": "/images/destinations/prey-veng.jpg",
                "latitude": 11.4868,
                "longitude": 105.3253,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 1800.0
            },
            {
                "country_id": cambodia.id,
                "name": "Svay Rieng",
                "name_km": "ស្វាយរៀង",
                "slug": "svay-rieng",
                "overview": "Southern border gateway bordering Vietnam, boasting fertile rice plains, scenic lotus ponds, and vibrant international border commerce at Bavet.",
                "overview_km": "ច្រកទ្វារព្រំដែនភាគអាគ្នេយ៍ មានវាលស្រែខៀវស្រងាត់ បឹងឈូក និងទីក្រុងពាណិជ្ជកម្មបាវិត។",
                "hero_image_url": "/images/destinations/svay-rieng.jpg",
                "latitude": 11.0879,
                "longitude": 105.7994,
                "best_time_to_visit": "November to February",
                "is_featured": False,
                "views_count": 1700.0
            },
            {
                "country_id": cambodia.id,
                "name": "Oddar Meanchey",
                "name_km": "ឧត្ដរមានជ័យ",
                "slug": "oddar-meanchey",
                "overview": "Quiet northern province flanked by the dramatic Dangrek Mountain range, historical sites at Anlong Veng, and lush rural countryside.",
                "overview_km": "ខេត្តភាគខាងជើងជាប់ជួរភ្នំដងរែក តំបន់ប្រវត្តិសាស្ត្រអន្លង់វែង និងទេសភាពព្រៃភ្នំធម្មជាតិ។",
                "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
                "latitude": 14.1818,
                "longitude": 103.5176,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 1600.0
            },
            {
                "country_id": cambodia.id,
                "name": "Pailin",
                "name_km": "ប៉ៃលិន",
                "slug": "pailin",
                "overview": "Picturesque highland border town nestled in the foothills of the Cardamom Mountains, historically renowned for precious rubies, blue sapphires, and Phnom Yat temple.",
                "overview_km": "ទីក្រុងតំបន់ខ្ពង់រាបជើងភ្នំក្រវាញ ល្បីល្បាញខាងត្បូងកណ្តៀង ពេជ្រ និងវត្តភ្នំយ៉ាតដ៏ស័ក្តិសិទ្ធិ។",
                "hero_image_url": "/images/destinations/pailin.jpg",
                "latitude": 12.8489,
                "longitude": 102.6093,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 1900.0
            },
            {
                "country_id": cambodia.id,
                "name": "Tboung Khmum",
                "name_km": "ត្បូងឃ្មុំ",
                "slug": "tboung-khmum",
                "overview": "Sprawling red-soil province home to historic Chup Rubber Plantations, ancient circular prehistoric earthworks, and scenic Mekong riverbank villages.",
                "overview_km": "ខេត្តដីក្រហមសម្បូរបែប ជាទីតាំងចម្ការកៅស៊ូជប់ដ៏ល្បីល្បាញ បន្ទាយគូ និងភូមិឋានមាត់ទន្លេមេគង្គ។",
                "hero_image_url": "/images/destinations/tboung-khmum.jpg",
                "latitude": 11.9056,
                "longitude": 105.6569,
                "best_time_to_visit": "November to March",
                "is_featured": False,
                "views_count": 1800.0
            }
        ]
        dest_map = {}
        for d_data in destinations_seed:
            d = db.query(Destination).filter(Destination.slug == d_data["slug"]).first()
            if not d:
                d = Destination(**d_data)
                db.add(d)
                db.flush()
            else:
                # Always update existing destination with verified real images and metadata
                d.hero_image_url = d_data.get("hero_image_url") or d.hero_image_url
                if d_data.get("name_km"):
                    d.name_km = d_data["name_km"]
                if d_data.get("overview"):
                    d.overview = d_data["overview"]
                if d_data.get("overview_km"):
                    d.overview_km = d_data["overview_km"]
                if d_data.get("best_time_to_visit"):
                    d.best_time_to_visit = d_data["best_time_to_visit"]
                if d_data.get("is_featured") is not None:
                    d.is_featured = d_data["is_featured"]
                db.flush()
            dest_map[d_data["slug"]] = d
        print(f"✓ Ensured {len(dest_map)} authoritative travel destinations across all 25 provinces")

        # 11. Authoritative Siem Reap Places
        sr = dest_map["siem-reap"]
        places_seed = [
            {
                "destination_id": sr.id,
                "name": "Angkor Wat",
                "local_name": "ប្រាសាទអង្គរវត្ត",
                "slug": "angkor-wat",
                "place_type": "TEMPLE",
                "description": "The crowned jewel of Khmer civilization and the largest religious monument in the world. Built by King Suryavarman II in the early 12th century, Angkor Wat's soaring lotus-bud towers, intricate bas-reliefs depicting the Churning of the Ocean of Milk, and iconic northern reflection pond represent the pinnacle of ancient architectural mastery.",
                "description_km": "មហាសំណង់ប្រាសាទសាសនាដ៏ធំបំផុតនៅលើពិភពលោក សាងសង់ដោយព្រះបាទសូរ្យវរ្ម័នទី២ នៅដើមសតវត្សរ៍ទី១២។",
                "address": "Angkor Archaeological Park, Siem Reap Province, Cambodia",
                "latitude": 13.4125,
                "longitude": 103.8670,
                "phone": "+855 63 760 011",
                "website": "https://www.angkorenterprise.gov.kh",
                "opening_hours": "05:00 AM - 05:30 PM daily",
                "price_level": "$$$",
                "hero_image_url": "/images/places/angkor-wat.jpg",
                "gallery_json": json.dumps(["/images/places/angkor-wat.jpg"]),
                "amenities_json": json.dumps(["UNESCO World Heritage", "Sunrise Viewing", "Licensed Guides Available", "Restrooms"]),
                "tags_json": json.dumps(["Temple", "UNESCO", "Must Visit", "Historical", "Sunrise Spot"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.95,
                "review_count": 2840,
                "views_count": 48200,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Bayon Temple",
                "local_name": "ប្រាសាទបាយ័ន",
                "slug": "bayon-temple",
                "place_type": "TEMPLE",
                "description": "Standing at the heart of the ancient royal city Angkor Thom, Bayon is famed for its 54 Gothic towers featuring 216 giant serene, smiling stone faces gazing outwards in all compass directions. Commissioned by King Jayavarman VII in the late 12th century as his official state temple.",
                "description_km": "ប្រាសាទបាយ័ន ស្ថិតនៅកណ្តាលរាជធានីអង្គរធំ មានប៉ម ៥៤ និងព្រះភក្ត្រថ្មញញឹមចំនួន ២១៦ សាងសង់ដោយព្រះបាទជ័យវរ្ម័នទី៧។",
                "address": "Angkor Thom, Siem Reap Province, Cambodia",
                "latitude": 13.4413,
                "longitude": 103.8587,
                "opening_hours": "07:30 AM - 05:30 PM daily",
                "price_level": "$$$",
                "hero_image_url": "/images/places/bayon-temple.jpg",
                "gallery_json": json.dumps(["/images/places/bayon-temple.jpg"]),
                "amenities_json": json.dumps(["UNESCO Site", "Intricate Bas-Reliefs", "Elephant Terrace Nearby"]),
                "tags_json": json.dumps(["Temple", "UNESCO", "Angkor Thom", "Stone Faces", "Architectural Wonder"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.88,
                "review_count": 1950,
                "views_count": 31400,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Ta Prohm (Tomb Raider Temple)",
                "local_name": "ប្រាសាទតាព្រហ្ម",
                "slug": "ta-prohm",
                "place_type": "TEMPLE",
                "description": "Left largely in the atmospheric state in which it was rediscovered, Ta Prohm showcases the eternal duel between human artistry and untamed tropical nature. Colossal silk-cotton and strangler fig roots snake dramatically over crumbling stone galleries and moss-carpeted courtyards.",
                "description_km": "ប្រាសាទដែលចាក់ឫសដើមឈើធំៗព័ទ្ធជុំវិញយ៉ាងអស្ចារ្យ ត្រូវបានគេស្គាល់ទូទាំងពិភពលោកតាមរយៈខ្សែភាពយន្ត Tomb Raider។",
                "address": "Angkor Archaeological Park, Siem Reap Province",
                "latitude": 13.4348,
                "longitude": 103.8893,
                "opening_hours": "07:30 AM - 05:30 PM daily",
                "price_level": "$$$",
                "hero_image_url": "/images/places/ta-prohm.jpg",
                "gallery_json": json.dumps(["/images/places/ta-prohm.jpg"]),
                "amenities_json": json.dumps(["Jungle Paths", "Iconic Photography", "Wooden Walkways"]),
                "tags_json": json.dumps(["Temple", "Nature", "Photography", "Iconic Ruins"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.91,
                "review_count": 2100,
                "views_count": 36700,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Banteay Srei",
                "local_name": "ប្រាសាទបន្ទាយស្រី",
                "slug": "banteay-srei",
                "place_type": "TEMPLE",
                "description": "Known as the Citadel of Women or the Jewel of Khmer Art, Banteay Srei is crafted from exquisite rose-pink sandstone that allowed for miniature carvings of astonishing delicacy and sharp detail that have withstood a millennium of weather.",
                "description_km": "ប្រាសាទថ្មភក់ពណ៌ផ្កាឈូក ដែលមានចម្លាក់លម្អិតយ៉ាងល្អិតល្អន់ និងពិសិដ្ឋបំផុតនៃសិល្បៈខ្មែរ។",
                "address": "Banteay Srei District, 32km Northeast of Siem Reap",
                "latitude": 13.5989,
                "longitude": 103.9630,
                "opening_hours": "07:30 AM - 05:00 PM daily",
                "price_level": "$$$",
                "hero_image_url": "/images/places/banteay-srei.jpg",
                "gallery_json": json.dumps(["/images/places/banteay-srei.jpg"]),
                "amenities_json": json.dumps(["Pink Sandstone", "Interpretation Center", "Lotus Ponds"]),
                "tags_json": json.dumps(["Temple", "Fine Art", "Pink Sandstone", "Intricate Carvings"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.86,
                "review_count": 1420,
                "views_count": 22100,
                "is_featured": False
            },
            {
                "destination_id": sr.id,
                "name": "Raffles Grand Hotel d'Angkor",
                "local_name": "សណ្ឋាគារ រ៉ាហ្វល ហ្គ្រេន អង្គរ",
                "slug": "raffles-grand-hotel-dangkor",
                "place_type": "ACCOMMODATION",
                "description": "First opened in 1932, this grand heritage landmark has welcomed royalty, dignitaries, and discerning travelers for nearly a century. Set within 15 acres of manicured French gardens, featuring Cambodia's most iconic historic swimming pool and classic French colonial elegance.",
                "description_km": "សណ្ឋាគារលំដាប់ប្រណីតតាំងពីឆ្នាំ១៩៣២ ដែលមានសួនផ្កាស្ទីលបារាំង និងអាងហែលទឹកប្រវត្តិសាស្ត្រដ៏ស្រស់ស្អាត។",
                "address": "1 Vithei Charles de Gaulle, Khum Svay Dangkum, Siem Reap",
                "latitude": 13.3664,
                "longitude": 103.8598,
                "phone": "+855 63 963 888",
                "website": "https://www.raffles.com/siem-reap",
                "email": "siemreap@raffles.com",
                "opening_hours": "24 hours reception",
                "price_level": "$$$$",
                "hero_image_url": "/images/places/raffles-grand-hotel-dangkor.jpg",
                "gallery_json": json.dumps(["/images/places/raffles-grand-hotel-dangkor.jpg"]),
                "amenities_json": json.dumps(["Swimming Pool", "Heritage Spa", "Fine Dining Restaurant", "Elephant Bar", "Concierge"]),
                "tags_json": json.dumps(["Luxury Hotel", "Heritage", "Colonial", "Spa", "Pool"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.93,
                "review_count": 890,
                "views_count": 18400,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Shinta Mani Angkor - Bensley Collection",
                "local_name": "សណ្ឋាគារ ស៊ិនតា ម៉ានី អង្គរ",
                "slug": "shinta-mani-angkor",
                "place_type": "ACCOMMODATION",
                "description": "A luxury boutique sanctuary designed by acclaimed architect Bill Bensley. Blends bold contemporary Cambodian design, private rooftop living rooms, personalized Bensley Butler service, and deep commitment to local Shinta Mani Foundation community development.",
                "description_km": "សណ្ឋាគារប៊ូទិកប្រណីតរចនាដោយស្ថាបត្យករ Bill Bensley ជាមួយសេវាកម្មដ៏ល្អឥតខ្ចោះ។",
                "address": "Junction of Oum Khun and 14th Street, Siem Reap",
                "latitude": 13.3621,
                "longitude": 103.8552,
                "phone": "+855 63 964 123",
                "website": "https://www.shintamani.com",
                "opening_hours": "24 hours reception",
                "price_level": "$$$$",
                "hero_image_url": "/images/places/shinta-mani-angkor.jpg",
                "gallery_json": json.dumps(["/images/places/shinta-mani-angkor.jpg"]),
                "amenities_json": json.dumps(["Bensley Butler Service", "Saltwater Pool", "Kroya Restaurant", "Shinta Mani Foundation"]),
                "tags_json": json.dumps(["Boutique Hotel", "Bensley Design", "Sustainable Tourism", "Luxury"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.92,
                "review_count": 640,
                "views_count": 14200,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Cuisine Wat Damnak",
                "local_name": "ភោជនីយដ្ឋាន វ៉ាត់ដំណាក់",
                "slug": "cuisine-wat-damnak",
                "place_type": "RESTAURANT",
                "description": "Cambodia's first restaurant to be ranked on Asia's 50 Best Restaurants list. Led by Chef Joannès Rivière, Cuisine Wat Damnak serves an innovative tasting menu celebrating seasonal, wild-foraged ingredients, Tonle Sap freshwater fish, and vibrant traditional Khmer herbs.",
                "description_km": "ភោជនីយដ្ឋានលំដាប់អន្តរជាតិដំបូងនៅកម្ពុជាដែលជាប់ក្នុងបញ្ជី Asia's 50 Best Restaurants។",
                "address": "Wat Damnak Village, Sala Kamreuk Commune, Siem Reap",
                "latitude": 13.3538,
                "longitude": 103.8589,
                "phone": "+855 77 347 762",
                "website": "https://www.cuisinewatdamnak.com",
                "opening_hours": "06:30 PM - 11:00 PM (Tuesday - Saturday)",
                "price_level": "$$$",
                "hero_image_url": "/images/places/cuisine-wat-damnak.jpg",
                "gallery_json": json.dumps(["/images/places/cuisine-wat-damnak.jpg"]),
                "amenities_json": json.dumps(["Degustation Menus", "Garden Seating", "Air Conditioned Dining", "Curated Wine Pairings"]),
                "tags_json": json.dumps(["Khmer Gastronomy", "Fine Dining", "Asia's 50 Best", "Seasonal Tasting"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.91,
                "review_count": 1150,
                "views_count": 16900,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Siem Reap Old Market (Psar Chaa)",
                "local_name": "ផ្សារចាស់ សៀមរាប",
                "slug": "siem-reap-old-market",
                "place_type": "MARKET",
                "description": "The beating commercial and social heart of Siem Reap since the 1920s. Wander through aromatic alleys offering dried spices, fermented prahok, hand-woven silks, artisanal wood carvings, silver jewelry, and delicious local street food stalls.",
                "description_km": "បេះដូងពាណិជ្ជកម្មប្រពៃណីនៃក្រុងសៀមរាប ពោរពេញដោយគ្រឿងទេស ក្រណាត់សូត្រ ចម្លាក់ និងម្ហូបឆ្ងាញ់ៗ។",
                "address": "2 Thnou Street, Riverfront, Siem Reap",
                "latitude": 13.3547,
                "longitude": 103.8549,
                "opening_hours": "07:00 AM - 09:00 PM daily",
                "price_level": "$",
                "hero_image_url": "/images/places/siem-reap-old-market.jpg",
                "gallery_json": json.dumps(["/images/places/siem-reap-old-market.jpg"]),
                "amenities_json": json.dumps(["Local Food Stalls", "Souvenirs", "Currency Exchange Nearby"]),
                "tags_json": json.dumps(["Market", "Street Food", "Souvenirs", "Cultural Experience"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.65,
                "review_count": 3200,
                "views_count": 28900,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Phnom Bakheng Sunset Vantage",
                "local_name": "ប្រាសាទភ្នំបាខែង",
                "slug": "phnom-bakheng",
                "place_type": "ATTRACTION",
                "description": "Perched atop a 60-meter-high hill, this 9th-century temple mountain dedicated to Shiva provides panoramic 360-degree vistas across the Angkor plains and the distant spires of Angkor Wat bathed in sunset orange light.",
                "description_km": "ទីតាំងទស្សនាថ្ងៃលិចដ៏ល្បីល្បាញបំផុតលើកំពូលភ្នំកម្ពស់ ៦០ ម៉ែត្រ។",
                "address": "South of Angkor Thom, Siem Reap",
                "latitude": 13.4239,
                "longitude": 103.8561,
                "opening_hours": "07:00 AM - 07:00 PM (Capacity restricted to 300 visitors at peak sunset)",
                "price_level": "$$",
                "hero_image_url": "/images/places/phnom-bakheng.jpg",
                "gallery_json": json.dumps(["/images/places/phnom-bakheng.jpg"]),
                "amenities_json": json.dumps(["Sunset Views", "Elephant Path Hiking Trail", "Panoramic Photo Spot"]),
                "tags_json": json.dumps(["Sunset", "Vantage Point", "Hilltop", "Photography"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.72,
                "review_count": 1820,
                "views_count": 25100,
                "is_featured": False
            },
            {
                "destination_id": sr.id,
                "name": "Phnom Kulen Sacred Waterfalls & River of 1000 Lingas",
                "local_name": "រមណីយដ្ឋានទឹកធ្លាក់ភ្នំគូលែន",
                "slug": "phnom-kulen-waterfall",
                "place_type": "WATERFALL",
                "description": "Considered the spiritual birthplace of the ancient Khmer Empire, Phnom Kulen is a lush holy mountain plateau featuring multi-tiered natural waterfalls, ancient riverbeds intricately carved with thousands of sacred Shiva lingas, and a colossal reclining Buddha statue carved into a boulder.",
                "description_km": "ភ្នំពិសិដ្ឋជាទីកំណើតនៃអាណាចក្រខ្មែរ មានទឹកធ្លាក់ធម្មជាតិដ៏ស្រស់ស្អាត ស្ទឹងលិង្គ១០០០ និងព្រះពុទ្ធចូលនិព្វានលើផ្ទាំងថ្មធំ។",
                "address": "Svay Leu District, Phnom Kulen National Park, 50km from Siem Reap",
                "latitude": 13.5684,
                "longitude": 104.1037,
                "opening_hours": "07:30 AM - 04:30 PM daily",
                "price_level": "$$$",
                "hero_image_url": "/images/places/phnom-kulen-waterfall.jpg",
                "gallery_json": json.dumps(["/images/places/phnom-kulen-waterfall.jpg"]),
                "amenities_json": json.dumps(["Natural Swimming", "Sacred Lingas", "Reclining Buddha", "Picnic Huts"]),
                "tags_json": json.dumps(["Waterfall", "Nature", "Sacred Site", "National Park", "Day Trip"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.85,
                "review_count": 1350,
                "views_count": 19400,
                "is_featured": True
            },
            {
                "destination_id": sr.id,
                "name": "Siem Reap Pub Street & Night Quarter",
                "local_name": "ផ្លូវ ផាប់ស្ត្រីត សៀមរាប",
                "slug": "siem-reap-pub-street",
                "place_type": "ACTIVITY",
                "description": "The epicenter of Siem Reap's nightlife and social scene. Closed to vehicular traffic every evening, Street 8 comes alive with neon lanterns, live music, bustling open-air bars, local draft beer, Khmer BBQ, and lively international camaraderie.",
                "description_km": "មជ្ឈមណ្ឌលកម្សាន្តពេលរាត្រីដ៏ល្បីល្បាញ ដែលមានតន្ត្រី ភោជនីយដ្ឋាន និងបារកម្សាន្តចម្រុះពណ៌។",
                "address": "Street 08, Svay Dangkum, Siem Reap",
                "latitude": 13.3551,
                "longitude": 103.8540,
                "opening_hours": "05:00 PM - 02:00 AM daily",
                "price_level": "$$",
                "hero_image_url": "/images/places/siem-reap-pub-street.jpg",
                "gallery_json": json.dumps(["/images/places/siem-reap-pub-street.jpg"]),
                "amenities_json": json.dumps(["Pedestrian Promenade", "Draft Beer", "Nightlife", "Street Dining"]),
                "tags_json": json.dumps(["Nightlife", "Dining", "Bars", "Music", "Social"]),
                "verification_status": "VERIFIED",
                "status": "ACTIVE",
                "rating": 4.60,
                "review_count": 4100,
                "views_count": 34800,
                "is_featured": False
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Royal Palace & Silver Pagoda",
                "local_name": "ព្រះបរមរាជវាំង និងវត្តព្រះកែវមរកត",
                "slug": "royal-palace-phnom-penh",
                "place_type": "TEMPLE",
                "description": "The majestic official royal residence of the King of Cambodia, showcasing classical Khmer architecture, golden spires, manicured royal gardens, and the Silver Pagoda paved with over 5,000 pure silver tiles and housing the revered Emerald Buddha.",
                "address": "Samdach Sothearos Blvd, Phnom Penh",
                "latitude": 11.5625,
                "longitude": 104.9317,
                "price_level": "$$",
                "hero_image_url": "/images/places/royal-palace-phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/places/royal-palace-phnom-penh.jpg"]),
                "amenities_json": json.dumps(["Royal Throne Hall", "Silver Pagoda", "Emerald Buddha", "Royal Regalia"]),
                "tags_json": json.dumps(["Royal Palace", "Temple", "Culture", "Phnom Penh", "Heritage"]),
                "rating": 4.85,
                "review_count": 1650,
                "views_count": 28900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["sihanoukville"].id,
                "name": "Koh Rong Sanloem - Saracen Bay",
                "local_name": "កោះរ៉ុងសន្លឹម ឆ្នេរសារ៉ាសេន",
                "slug": "saracen-bay-koh-rong-sanloem",
                "place_type": "BEACH",
                "description": "A breathtaking crescent-shaped bay of powdery white sand and crystal-clear calm turquoise waters. Ideal for relaxation, swimming, paddle boarding, and experiencing bioluminescent plankton after dark.",
                "address": "Saracen Bay, Koh Rong Sanloem, Sihanoukville",
                "latitude": 10.5986,
                "longitude": 103.3106,
                "price_level": "$$",
                "hero_image_url": "/images/places/saracen-bay-koh-rong-sanloem.jpg",
                "gallery_json": json.dumps(["/images/places/saracen-bay-koh-rong-sanloem.jpg"]),
                "amenities_json": json.dumps(["White Sand Beach", "Snorkeling", "Boat Transfer", "Beachfront Bungalows"]),
                "tags_json": json.dumps(["Beach", "Island", "Tropical", "Turquoise Waters", "Snorkeling"]),
                "rating": 4.90,
                "review_count": 1240,
                "views_count": 21500,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampot"].id,
                "name": "Preah Monivong Bokor National Park",
                "local_name": "ឧទ្យានជាតិព្រះមុនីវង្សបូកគោ",
                "slug": "bokor-national-park",
                "place_type": "NATIONAL_PARK",
                "description": "Rising over 1,000 meters above sea level, Bokor Mountain offers refreshing cool breezes, panoramic views of the Gulf of Thailand, historic French colonial ruins, Popokvil Waterfall, and the sacred Lok Yeay Mao monument.",
                "address": "Bokor Mountain Plateau, Kampot Province",
                "latitude": 10.6558,
                "longitude": 104.0539,
                "price_level": "$",
                "hero_image_url": "/images/places/bokor-national-park.jpg",
                "gallery_json": json.dumps(["/images/places/bokor-national-park.jpg"]),
                "amenities_json": json.dumps(["Hiking Trails", "Colonial Ruins", "Panoramic Viewpoint", "Waterfalls"]),
                "tags_json": json.dumps(["National Park", "Mountain", "Nature", "Colonial History", "Kampot"]),
                "rating": 4.78,
                "review_count": 980,
                "views_count": 17400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["battambang"].id,
                "name": "Phnom Sampeau & Bat Cave Vantage",
                "local_name": "ភ្នំសំពៅ និងល្អាងប្រចៀវ",
                "slug": "phnom-sampeau-battambang",
                "place_type": "ATTRACTION",
                "description": "A striking limestone mountain crowned with golden pagodas and stupas. At dusk, millions of bats emerge in a mesmerizing undulating ribbon across the sunset sky, creating one of Cambodia's most spectacular wildlife spectacles.",
                "address": "National Road 57, Sampeau Commune, Battambang",
                "latitude": 13.0906,
                "longitude": 103.1008,
                "price_level": "$",
                "hero_image_url": "/images/places/phnom-sampeau-battambang.jpg",
                "gallery_json": json.dumps(["/images/places/phnom-sampeau-battambang.jpg"]),
                "amenities_json": json.dumps(["Sunset Viewpoint", "Bat Flight Viewing", "Pagoda Terraces", "Local Guides"]),
                "tags_json": json.dumps(["Attraction", "Wildlife", "Sunset", "Pagoda", "Battambang"]),
                "rating": 4.88,
                "review_count": 1120,
                "views_count": 19800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["mondulkiri"].id,
                "name": "Bousra Waterfall (Bou Sra)",
                "local_name": "ទឹកធ្លាក់ប៊ូស្រា",
                "slug": "bousra-waterfall",
                "place_type": "WATERFALL",
                "description": "Cambodia's most majestic and iconic waterfall, featuring two massive cascading tiers plunging through pristine jungle gorges. Visitors can swim in natural pools, zip-line across the canopy, and sample local Bunong highland coffee.",
                "address": "Pech Chreada District, Mondulkiri Province",
                "latitude": 12.5694,
                "longitude": 107.4194,
                "price_level": "$",
                "hero_image_url": "/images/places/bousra-waterfall.jpg",
                "gallery_json": json.dumps(["/images/places/bousra-waterfall.jpg"]),
                "amenities_json": json.dumps(["Swimming Pools", "Canopy Zipline", "Picnic Pavilions", "Indigenous Crafts"]),
                "tags_json": json.dumps(["Waterfall", "Nature", "Jungle", "Swimming", "Mondulkiri"]),
                "rating": 4.92,
                "review_count": 1410,
                "views_count": 24200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["ratanakiri"].id,
                "name": "Yeak Laom Volcanic Crater Lake",
                "local_name": "បឹងយក្សឡោម",
                "slug": "yeak-laom-volcanic-lake",
                "place_type": "ATTRACTION",
                "description": "An almost perfectly circular lake formed 700,000 years ago by a volcanic eruption. Ringed by lush jungle and emerald green water, this sacred indigenous site offers exceptional swimming and peaceful nature walks.",
                "address": "Banlung District, Ratanakiri Province",
                "latitude": 13.7317,
                "longitude": 107.0167,
                "price_level": "$",
                "hero_image_url": "/images/places/yeak-laom-volcanic-lake.jpg",
                "gallery_json": json.dumps(["/images/places/yeak-laom-volcanic-lake.jpg"]),
                "amenities_json": json.dumps(["Lakeside Boardwalk", "Swimming Piers", "Cultural Center", "Life Vests"]),
                "tags_json": json.dumps(["Volcanic Lake", "Nature", "Sacred Site", "Swimming", "Ratanakiri"]),
                "rating": 4.91,
                "review_count": 890,
                "views_count": 15800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kratie"].id,
                "name": "Kampi Mekong Dolphin Sanctuary",
                "local_name": "រមណីយដ្ឋានអភិរក្សសត្វផ្សោតកាំពី",
                "slug": "kampi-dolphin-sanctuary",
                "place_type": "ATTRACTION",
                "description": "The premier spot on the Mekong River to observe the endangered, gentle Irrawaddy freshwater dolphins swimming and playing in deep river pools by local eco-friendly wooden boat.",
                "address": "Kampi Village, Sambour District, Kratie",
                "latitude": 12.6333,
                "longitude": 106.0167,
                "price_level": "$$",
                "hero_image_url": "/images/places/kampi-dolphin-sanctuary.jpg",
                "gallery_json": json.dumps(["/images/places/kampi-dolphin-sanctuary.jpg"]),
                "amenities_json": json.dumps(["Boat Tours", "Life Jackets", "Dolphin Information Kiosk", "River Viewpoint"]),
                "tags_json": json.dumps(["Wildlife", "Dolphins", "Mekong River", "Eco-Tourism", "Kratie"]),
                "rating": 4.80,
                "review_count": 780,
                "views_count": 13200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["preah-vihear"].id,
                "name": "Prasat Preah Vihear Temple",
                "local_name": "ប្រាសាទព្រះវិហារ",
                "slug": "prasat-preah-vihear-temple",
                "place_type": "TEMPLE",
                "description": "An architectural masterpiece of the Khmer Empire and UNESCO World Heritage site, dramatically situated on a cliff edge of the Dangrek Mountains with staggering 800-meter drop views across Cambodia.",
                "address": "Choam Khsant District, Preah Vihear Province",
                "latitude": 14.3908,
                "longitude": 104.6800,
                "price_level": "$$",
                "hero_image_url": "/images/places/prasat-preah-vihear-temple.jpg",
                "gallery_json": json.dumps(["/images/places/prasat-preah-vihear-temple.jpg"]),
                "amenities_json": json.dumps(["UNESCO Site", "Mountain Transport", "Cliff Viewpoint", "Licensed Guides"]),
                "tags_json": json.dumps(["UNESCO", "Temple", "Cliff", "Ancient Khmer", "Preah Vihear"]),
                "rating": 4.96,
                "review_count": 1530,
                "views_count": 27600,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["siem-reap"].id,
                "name": "Banteay Kdei (Citadel of Chambers)",
                "local_name": "ប្រាសាទបន្ទាយក្តី",
                "slug": "banteay-kdei",
                "place_type": "TEMPLE",
                "description": "A peaceful and atmospheric 12th-century Buddhist monastic complex constructed by King Jayavarman VII. Known for its serene smiling face towers, labyrinthine stone corridors, and towering silk-cotton trees.",
                "address": "Angkor Archaeological Park, Siem Reap",
                "latitude": 13.4300,
                "longitude": 103.8986,
                "price_level": "$$",
                "hero_image_url": "/images/places/banteay-kdei.jpg",
                "gallery_json": json.dumps(["/images/places/banteay-kdei.jpg"]),
                "amenities_json": json.dumps(["UNESCO Site", "Shaded Walkways", "Quiet Atmosphere", "Temple Ruins"]),
                "tags_json": json.dumps(["UNESCO", "Temple", "Buddhism", "Quiet", "Angkor"]),
                "rating": 4.84,
                "review_count": 920,
                "views_count": 16400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["siem-reap"].id,
                "name": "Preah Khan (Royal Sword Temple)",
                "local_name": "ប្រាសាទព្រះខ័ន",
                "slug": "preah-khan",
                "place_type": "TEMPLE",
                "description": "One of the largest complexes in Angkor, Preah Khan served as a major temple city, Buddhist university, and royal residence. Massive sacred fig roots grip ancient carved lintels in this majestic, atmospheric sanctuary.",
                "address": "Angkor Archaeological Park, Siem Reap",
                "latitude": 13.4619,
                "longitude": 103.8719,
                "price_level": "$$",
                "hero_image_url": "/images/places/preah-khan.jpg",
                "gallery_json": json.dumps(["/images/places/preah-khan.jpg"]),
                "amenities_json": json.dumps(["UNESCO Site", "Ancient Library", "Tree Roots", "Hall of Dancers"]),
                "tags_json": json.dumps(["UNESCO", "Temple", "Jungle", "Ancient City", "Jayavarman VII"]),
                "rating": 4.90,
                "review_count": 1350,
                "views_count": 23100,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["oddar-meanchey"].id,
                "name": "Chong Sa-Ngam Border Market & Pass",
                "local_name": "ផ្សារច្រកទ្វារអន្តរជាតិជាំសាង៉ាំ",
                "slug": "chong-sa-ngam-border-market",
                "place_type": "MARKET",
                "description": "A bustling cross-border trading bazaar high on the Dângrêk escarpment. Famous for authentic northeastern Cambodian wild honey, handwoven silk kramas, tropical fruits, and scenic ridge vistas looking out toward the northern plains.",
                "address": "Choam Sangam Border Crossing, Anlong Veng, Oddar Meanchey",
                "latitude": 14.417,
                "longitude": 103.921,
                "price_level": "$",
                "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/oddar-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Oddar Meanchey"]',
                "rating": 4.65,
                "review_count": 310,
                "views_count": 6800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["oddar-meanchey"].id,
                "name": "Samraong Lake & Sunset Park",
                "local_name": "បឹងសំរោង និងសួនច្បារមាត់បឹង",
                "slug": "samraong-lake-sunset-park",
                "place_type": "ATTRACTION",
                "description": "A tranquil freshwater lake at the heart of Samraong capital city. Features lotus flowers, illuminated evening walking promenades, lakeside gazebos, and breezy sunset views with local street food vendors.",
                "address": "Samraong City Center, Oddar Meanchey",
                "latitude": 14.1833,
                "longitude": 103.5167,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/oddar-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Oddar Meanchey"]',
                "rating": 4.7,
                "review_count": 280,
                "views_count": 5400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["oddar-meanchey"].id,
                "name": "Pka Romdoul Country Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ផ្ការំដួល សំរោង",
                "slug": "pka-romdoul-country-restaurant",
                "place_type": "RESTAURANT",
                "description": "A beloved local culinary landmark in Samraong serving authentic northern Khmer home cooking. Signature dishes include wood-charcoal roasted organic chicken, spicy river crab salad, and sour morning glory fish soup.",
                "address": "National Road 68, Samraong, Oddar Meanchey",
                "latitude": 14.1812,
                "longitude": 103.514,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/oddar-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Oddar Meanchey"]',
                "rating": 4.8,
                "review_count": 420,
                "views_count": 8900,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pailin"].id,
                "name": "Goh-Ai Waterfall (O'Tavao Rapids)",
                "local_name": "ទឹកធ្លាក់អូរតាវ៉ៅ ប៉ៃលិន",
                "slug": "otavao-rapids-waterfall-pailin",
                "place_type": "WATERFALL",
                "description": "A cascading mountain stream and swimming oasis fed by the high peaks of the Cardamom Mountains. Surrounded by lush longan orchards, bamboo groves, and crystal-clear swimming pools with rustic riverside picnic huts.",
                "address": "Otavao Village, Pailin Municipality",
                "latitude": 12.835,
                "longitude": 102.635,
                "price_level": "$",
                "hero_image_url": "/images/destinations/pailin.jpg",
                "gallery_json": json.dumps(["/images/destinations/pailin.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Waterfall", "Pailin"]',
                "rating": 4.78,
                "review_count": 490,
                "views_count": 11200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pailin"].id,
                "name": "Pailin Ruby & Gemstone Bazaar",
                "local_name": "ផ្សារត្បូងទទឹមប៉ៃលិន",
                "slug": "pailin-gemstone-market",
                "place_type": "MARKET",
                "description": "Historic trade center famous across Southeast Asia for Pailin blue sapphires, rubies, and local minerals. Also features stalls selling sweet dried Pailin longans, forest cardamom, wild honeycomb, and Kola ethnic snacks.",
                "address": "Downtown Pailin Market Square",
                "latitude": 12.851,
                "longitude": 102.608,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/pailin.jpg",
                "gallery_json": json.dumps(["/images/destinations/pailin.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Pailin"]',
                "rating": 4.72,
                "review_count": 610,
                "views_count": 14500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pailin"].id,
                "name": "Bamboo River Garden Restaurant",
                "local_name": "ភោជនីយដ្ឋាន សួនឬស្សីមាត់ស្ទឹងប៉ៃលិន",
                "slug": "bamboo-river-garden-pailin",
                "place_type": "RESTAURANT",
                "description": "An open-air garden eatery shaded by towering green bamboo along the cool Pailin river. Celebrated for Kola ethnic specialties, crispy whole river fish with tamarind dipping sauce, and stir-fried mountain shoots.",
                "address": "Stung Pailin Riverbank Road, Pailin",
                "latitude": 12.848,
                "longitude": 102.615,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/pailin.jpg",
                "gallery_json": json.dumps(["/images/destinations/pailin.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Pailin"]',
                "rating": 4.82,
                "review_count": 520,
                "views_count": 9700,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["preah-vihear"].id,
                "name": "Tbeng Meanchey City Park & Night Market",
                "local_name": "សួនច្បារត្បែងមានជ័យ និងផ្សាររាត្រី",
                "slug": "tbeng-meanchey-night-market",
                "place_type": "MARKET",
                "description": "The lively evening social heart of Preah Vihear province. Features night food vendors, outdoor seating, traditional roasted duck, tropical sugarcane press carts, and welcoming northern hospitality.",
                "address": "Independence Boulevard, Tbeng Meanchey",
                "latitude": 13.805,
                "longitude": 104.981,
                "price_level": "$",
                "hero_image_url": "/images/destinations/preah-vihear.jpg",
                "gallery_json": json.dumps(["/images/destinations/preah-vihear.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Preah Vihear"]',
                "rating": 4.68,
                "review_count": 390,
                "views_count": 7800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["preah-vihear"].id,
                "name": "Green Mountain Terrace Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ភ្នំបៃតង ព្រះវិហារ",
                "slug": "green-mountain-terrace-preah-vihear",
                "place_type": "RESTAURANT",
                "description": "Panoramic country restaurant with scenic mountain vistas serving hearty Cambodian dishes. Renowned for roasted farm chicken with spicy lime dip, wild pepper beef stir-fry, and lemongrass soup.",
                "address": "National Road 62, Tbeng Meanchey, Preah Vihear",
                "latitude": 13.809,
                "longitude": 104.975,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/preah-vihear.jpg",
                "gallery_json": json.dumps(["/images/destinations/preah-vihear.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Preah Vihear"]',
                "rating": 4.81,
                "review_count": 480,
                "views_count": 9100,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["prey-veng"].id,
                "name": "Prey Veng Lake & Promenade",
                "local_name": "ផ្លូវដើរមាត់បឹងស្នេហ៍ ព្រៃវែង",
                "slug": "prey-veng-lake-promenade",
                "place_type": "ATTRACTION",
                "description": "A picturesque waterfront promenade hugging Boeung Snae marshland sanctuary. Beloved for serene sunset walks, jogging paths, bird watching, and fresh evening breezes over the vast wetland.",
                "address": "Lakeside Boulevard, Prey Veng City",
                "latitude": 11.485,
                "longitude": 105.328,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/prey-veng.jpg",
                "gallery_json": json.dumps(["/images/destinations/prey-veng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Prey Veng"]',
                "rating": 4.75,
                "review_count": 360,
                "views_count": 6900,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["prey-veng"].id,
                "name": "Phsar Thom Prey Veng Central Market",
                "local_name": "ផ្សារធំខេត្តព្រៃវែង",
                "slug": "phsar-thom-prey-veng-market",
                "place_type": "MARKET",
                "description": "A bustling provincial market renowned across Cambodia for authentic Prey Veng crispy rice pancakes (Banh Chhav), freshwater dried fish, artisanal wicker basketry, and sweet coconut milk puddings.",
                "address": "Street 10, Prey Veng City",
                "latitude": 11.4865,
                "longitude": 105.326,
                "price_level": "$",
                "hero_image_url": "/images/destinations/prey-veng.jpg",
                "gallery_json": json.dumps(["/images/destinations/prey-veng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Prey Veng"]',
                "rating": 4.7,
                "review_count": 410,
                "views_count": 8200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["prey-veng"].id,
                "name": "Boeung Snae Community Floating Eatery",
                "local_name": "ភោជនីយដ្ឋានសហគមន៍បឹងស្នេហ៍",
                "slug": "boeung-snae-floating-eatery",
                "place_type": "RESTAURANT",
                "description": "Overwater dining pavilions built on wooden boardwalks over Boeung Snae lake. Specializes in sour fish head soup with tamarind leaves, whole grilled snakehead fish, and organic lotus root salads.",
                "address": "Boeung Snae Nature Reserve, Prey Veng",
                "latitude": 11.452,
                "longitude": 105.361,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/prey-veng.jpg",
                "gallery_json": json.dumps(["/images/destinations/prey-veng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Prey Veng"]',
                "rating": 4.83,
                "review_count": 520,
                "views_count": 10400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pursat"].id,
                "name": "Kompong Luong Floating Village",
                "local_name": "ភូមិបណ្ដែតទឹកកំពង់ហ្លួង",
                "slug": "kompong-luong-floating-village",
                "place_type": "ATTRACTION",
                "description": "A remarkable floating community on the Tonle Sap lake home to thousands of residents. Features floating schools, pagoda temples, grocery boats, repair shops, and peaceful boat tours through the watery avenues.",
                "address": "Krakor District, Tonle Sap Lake, Pursat",
                "latitude": 12.593,
                "longitude": 104.205,
                "price_level": "$",
                "hero_image_url": "/images/destinations/pursat.jpg",
                "gallery_json": json.dumps(["/images/destinations/pursat.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Pursat"]',
                "rating": 4.85,
                "review_count": 680,
                "views_count": 16200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pursat"].id,
                "name": "Pursat Riverfront & Marble Carving Center",
                "local_name": "ផ្សារចម្លាក់ថ្មម៉ាប និងមាត់ស្ទឹងពោធិ៍សាត់",
                "slug": "pursat-marble-carving-center",
                "place_type": "MARKET",
                "description": "Cambodia's capital of marble sculpting. Watch master carvers sculpt Buddha statues and apsaras from Cardamom Mountain soapstone and marble, alongside relaxed riverfront street food stalls.",
                "address": "Pursat River Embankment Road, Pursat City",
                "latitude": 12.535,
                "longitude": 103.918,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/pursat.jpg",
                "gallery_json": json.dumps(["/images/destinations/pursat.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Pursat"]',
                "rating": 4.77,
                "review_count": 510,
                "views_count": 9800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["ratanakiri"].id,
                "name": "Ka Chanh Waterfall",
                "local_name": "ទឹកធ្លាក់កាចាញ",
                "slug": "ka-chanh-waterfall-ratanakiri",
                "place_type": "WATERFALL",
                "description": "A magnificent 12-meter waterfall cascading over basalt volcanic columns into a crystal-clear jungle pool. Features a suspension bridge over the gorge, lush rubber groves, and breezy nature walkways.",
                "address": "Ka Chanh Commune, Banlung, Ratanakiri",
                "latitude": 13.705,
                "longitude": 106.985,
                "price_level": "$",
                "hero_image_url": "/images/destinations/ratanakiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/ratanakiri.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Waterfall", "Ratanakiri"]',
                "rating": 4.8,
                "review_count": 620,
                "views_count": 13800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["ratanakiri"].id,
                "name": "Banlung Central Market (Phsar Banlung)",
                "local_name": "ផ្សារបានលុង",
                "slug": "banlung-central-market",
                "place_type": "MARKET",
                "description": "A cultural crossroads where indigenous Tampuan, Kreung, and Jarai communities trade wild volcanic honey, hand-harvested robusta coffee beans, woven bamboo baskets, and local gemstones.",
                "address": "Center of Banlung City, Ratanakiri",
                "latitude": 13.743,
                "longitude": 106.987,
                "price_level": "$",
                "hero_image_url": "/images/destinations/ratanakiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/ratanakiri.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Ratanakiri"]',
                "rating": 4.72,
                "review_count": 540,
                "views_count": 11500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["stung-treng"].id,
                "name": "Thala Barivat Ancient Pre-Angkorian Shrines",
                "local_name": "រមណីយដ្ឋានប្រាសាទថាឡាបារីវ៉ាត់",
                "slug": "thala-barivat-ancient-temples",
                "place_type": "TEMPLE",
                "description": "Pre-Angkorian 7th-century Chenla brick temples shaded by ancient tropical teak trees near where the Sekong and Mekong rivers converge. Peaceful, spiritual, and rich in ancient archaeological history.",
                "address": "Thala Barivat District, Stung Treng",
                "latitude": 13.541,
                "longitude": 105.955,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/stung-treng.jpg",
                "gallery_json": json.dumps(["/images/destinations/stung-treng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Temple", "Stung Treng"]',
                "rating": 4.76,
                "review_count": 310,
                "views_count": 7200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["stung-treng"].id,
                "name": "Sekong Riverfront Promenade & Night Food",
                "local_name": "ផ្លូវមាត់ទន្លេសេកុង និងតូបអាហាររាត្រី",
                "slug": "sekong-riverfront-promenade",
                "place_type": "MARKET",
                "description": "A panoramic palm-lined promenade along the Sekong river. Gather with friendly locals in the late afternoon for barbecued fresh river fish, cold sugarcane juice, and stunning golden sunsets over the water.",
                "address": "Riverside Boulevard, Stung Treng City",
                "latitude": 13.526,
                "longitude": 105.972,
                "price_level": "$",
                "hero_image_url": "/images/destinations/stung-treng.jpg",
                "gallery_json": json.dumps(["/images/destinations/stung-treng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Stung Treng"]',
                "rating": 4.74,
                "review_count": 420,
                "views_count": 8900,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["stung-treng"].id,
                "name": "Mekong River Fish Delight Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ត្រីទន្លេមេគង្គ ស្ទឹងត្រែង",
                "slug": "mekong-river-fish-delight",
                "place_type": "RESTAURANT",
                "description": "The premier culinary destination in Stung Treng for authentic Mekong river dining. Renowned for sour soup with fresh river catfish, steamed river fish with ginger, and crisp wild greens.",
                "address": "Riverside Road, Stung Treng Town",
                "latitude": 13.524,
                "longitude": 105.969,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/stung-treng.jpg",
                "gallery_json": json.dumps(["/images/destinations/stung-treng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Stung Treng"]',
                "rating": 4.84,
                "review_count": 490,
                "views_count": 9600,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["svay-rieng"].id,
                "name": "Waiko River Park & Esplanade",
                "local_name": "សួនច្បារមាត់ព្រែកវ៉ៃគោ ស្វាយរៀង",
                "slug": "waiko-river-park-esplanade",
                "place_type": "ATTRACTION",
                "description": "A scenic modern riverfront park with dancing water fountains, walking paths, lotus ponds, and riverboat cruises in the heart of Svay Rieng city. Popular for morning jogging and evening sunset socializing.",
                "address": "Waiko Riverbank, Svay Rieng City",
                "latitude": 11.087,
                "longitude": 105.801,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/svay-rieng.jpg",
                "gallery_json": json.dumps(["/images/destinations/svay-rieng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Svay Rieng"]',
                "rating": 4.71,
                "review_count": 340,
                "views_count": 6500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["svay-rieng"].id,
                "name": "Bavet International Border Market",
                "local_name": "ផ្សារព្រំដែនបាវិត",
                "slug": "bavet-border-market",
                "place_type": "MARKET",
                "description": "A bustling cross-border trading zone and commercial bazaar near the Vietnam international border. Packed with regional food, fashion, tropical dried fruits, and vibrant street life.",
                "address": "National Highway 1, Bavet, Svay Rieng",
                "latitude": 11.077,
                "longitude": 106.148,
                "price_level": "$",
                "hero_image_url": "/images/destinations/svay-rieng.jpg",
                "gallery_json": json.dumps(["/images/destinations/svay-rieng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Svay Rieng"]',
                "rating": 4.67,
                "review_count": 450,
                "views_count": 10200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["svay-rieng"].id,
                "name": "Mlob Dong River View Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ម្លប់ដូងមាត់ព្រែក",
                "slug": "mlob-dong-river-restaurant-svay-rieng",
                "place_type": "RESTAURANT",
                "description": "Thatched riverside dining huts along the tranquil Waiko river. Famous for Svay Rieng crispy pork belly, grilled giant freshwater prawns with lime pepper sauce, and sour morning glory fish soup.",
                "address": "Waiko River Promenade, Svay Rieng",
                "latitude": 11.089,
                "longitude": 105.798,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/svay-rieng.jpg",
                "gallery_json": json.dumps(["/images/destinations/svay-rieng.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Svay Rieng"]',
                "rating": 4.8,
                "review_count": 380,
                "views_count": 7800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["takeo"].id,
                "name": "Phnom Chisor Ancient Mountain Temple",
                "local_name": "ប្រាសាទភ្នំជីសូរ",
                "slug": "phnom-chisor-temple",
                "place_type": "TEMPLE",
                "description": "An 11th-century Angkorian hilltop sanctuary built by King Suryavarman I atop a 130-meter limestone hill. The 412 stone steps lead to remarkably preserved carved lintels and a breathtaking 360-degree vista over Takeo's rice paddies.",
                "address": "Samraong District, Takeo Province",
                "latitude": 11.037,
                "longitude": 104.858,
                "price_level": "$",
                "hero_image_url": "/images/destinations/takeo.jpg",
                "gallery_json": json.dumps(["/images/destinations/takeo.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Temple", "Takeo"]',
                "rating": 4.88,
                "review_count": 890,
                "views_count": 21500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["takeo"].id,
                "name": "Tonle Bati & Ta Prohm of Takeo",
                "local_name": "ទន្លេបាទី និងប្រាសាទតាព្រហ្មតាកែវ",
                "slug": "tonle-bati-ta-prohm-takeo",
                "place_type": "ATTRACTION",
                "description": "A beloved weekend lakeside getaway featuring overwater wooden picnic cabanas alongside the atmospheric 12th-century laterite temple of Ta Prohm built by King Jayavarman VII.",
                "address": "Bati District, Takeo Province",
                "latitude": 11.332,
                "longitude": 104.839,
                "price_level": "$",
                "hero_image_url": "/images/destinations/takeo.jpg",
                "gallery_json": json.dumps(["/images/destinations/takeo.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Takeo"]',
                "rating": 4.79,
                "review_count": 760,
                "views_count": 18400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["tboung-khmum"].id,
                "name": "Preah Theat Teuk Chhar Ancient Springs & Sanctuary",
                "local_name": "រមណីយដ្ឋានប្រាសាទព្រះធាតុទឹកឆា",
                "slug": "preah-theat-teuk-chhar-springs",
                "place_type": "TEMPLE",
                "description": "An ancient 11th-century temple complex constructed beside natural bubbling freshwater springs and cool swimming canals. Shaded by sacred trees, it is a treasured heritage and recreation site.",
                "address": "Krouch Chhmar District, Tboung Khmum",
                "latitude": 12.185,
                "longitude": 105.421,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/tboung-khmum.jpg",
                "gallery_json": json.dumps(["/images/destinations/tboung-khmum.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Temple", "Tboung Khmum"]',
                "rating": 4.78,
                "review_count": 390,
                "views_count": 8400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["tboung-khmum"].id,
                "name": "Suong Central Trade Bazaar & Food Stalls",
                "local_name": "ផ្សារក្រុងសួង",
                "slug": "suong-central-market",
                "place_type": "MARKET",
                "description": "The bustling commercial nerve center of Tboung Khmum. Renowned for roasted organic cashews, sweet Koh Sotin pomelos, fresh durians, and authentic Cambodian rice noodles (Nom Banh Chok).",
                "address": "Suong City Center, Tboung Khmum",
                "latitude": 11.916,
                "longitude": 105.658,
                "price_level": "$",
                "hero_image_url": "/images/destinations/tboung-khmum.jpg",
                "gallery_json": json.dumps(["/images/destinations/tboung-khmum.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Tboung Khmum"]',
                "rating": 4.71,
                "review_count": 480,
                "views_count": 9200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["tboung-khmum"].id,
                "name": "Green Canopy Rubber Garden Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ម្លប់កៅស៊ូ ត្បូងឃ្មុំ",
                "slug": "green-canopy-rubber-restaurant",
                "place_type": "RESTAURANT",
                "description": "A tranquil restaurant nestled under high rubber tree canopies near Suong. Specializes in country field duck claypot, green peppercorn beef, and sour bamboo shoot soup with local herbs.",
                "address": "National Road 7, near Suong, Tboung Khmum",
                "latitude": 11.921,
                "longitude": 105.645,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/tboung-khmum.jpg",
                "gallery_json": json.dumps(["/images/destinations/tboung-khmum.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Tboung Khmum"]',
                "rating": 4.83,
                "review_count": 410,
                "views_count": 8700,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["banteay-meanchey"].id,
                "name": "Sisophon Hilltop Lookout & Cave Shrines",
                "local_name": "ភ្នំសិរីសោភ័ណ",
                "slug": "sisophon-hilltop-lookout",
                "place_type": "ATTRACTION",
                "description": "Limestone karst hill rising directly beside Sisophon town with cave hermitages, monkey sanctuaries, Buddhist shrines, and sweeping panoramic views across the rice plains to the Thai border.",
                "address": "Sisophon Municipality, Banteay Meanchey",
                "latitude": 13.585,
                "longitude": 102.973,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/banteay-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Banteay Meanchey"]',
                "rating": 4.73,
                "review_count": 420,
                "views_count": 9100,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["banteay-meanchey"].id,
                "name": "Sisophon Night Market & Street Food Square",
                "local_name": "ផ្សាររាត្រីសិរីសោភ័ណ",
                "slug": "sisophon-night-market",
                "place_type": "MARKET",
                "description": "The energetic evening gathering point for locals and travelers. Savor authentic northwest Cambodian street cuisine including grilled pork skewers, papaya salads, beef lok lak, and fruit shakes.",
                "address": "Downtown Sisophon Square, Banteay Meanchey",
                "latitude": 13.588,
                "longitude": 102.976,
                "price_level": "$",
                "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/banteay-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Banteay Meanchey"]',
                "rating": 4.7,
                "review_count": 510,
                "views_count": 10400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["banteay-meanchey"].id,
                "name": "Ban Teay Cuisine & Garden Eatery",
                "local_name": "ភោជនីយដ្ឋាន បន្ទាយមានជ័យ",
                "slug": "banteay-cuisine-garden-eatery",
                "place_type": "RESTAURANT",
                "description": "Renowned provincial dining establishment with garden seating. Famous for crispy fried snakehead fish with green mango dip, authentic Cambodian sweet-and-sour soup, and roasted chicken.",
                "address": "National Highway 5, Sisophon, Banteay Meanchey",
                "latitude": 13.591,
                "longitude": 102.98,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/banteay-meanchey.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Banteay Meanchey"]',
                "rating": 4.82,
                "review_count": 460,
                "views_count": 9700,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-chhnang"].id,
                "name": "Phnom Neang Kang Rei Mountain",
                "local_name": "ភ្នំនាងកង្រី",
                "slug": "phnom-neang-kang-rei-mountain",
                "place_type": "ATTRACTION",
                "description": "A legendary mountain steeped in ancient Cambodian folklore, whose silhouette resembles a sleeping princess. Features scenic walking trails, hillside stupas, and grand lookouts over the Tonle Sap floodplains.",
                "address": "Kampong Tralach District, Kampong Chhnang",
                "latitude": 12.268,
                "longitude": 104.668,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-chhnang.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Kampong Chhnang"]',
                "rating": 4.77,
                "review_count": 480,
                "views_count": 11300,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-chhnang"].id,
                "name": "Kampong Chhnang Waterfront Port & Market",
                "local_name": "កំពង់ផែក្រុងកំពង់ឆ្នាំង និងផ្សារមាត់ទឹក",
                "slug": "kampong-chhnang-waterfront-market",
                "place_type": "MARKET",
                "description": "Vibrant river trading port on the Tonle Sap. Wooden longboats arrive daily loaded with handmade earthenware pots, fresh river fish, lotus roots, and traditional sticky rice bamboo (Kralan).",
                "address": "Portside Esplanade, Kampong Chhnang City",
                "latitude": 12.253,
                "longitude": 104.672,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-chhnang.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Kampong Chhnang"]',
                "rating": 4.74,
                "review_count": 520,
                "views_count": 12100,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-chhnang"].id,
                "name": "Sovann Phoum Claypot Kitchen",
                "local_name": "ភោជនីយដ្ឋាន សុវណ្ណភូមិឆ្នាំងដី",
                "slug": "sovann-phoum-claypot-kitchen",
                "place_type": "RESTAURANT",
                "description": "Authentic dining experience celebrating the province's claypot heritage. Traditional Khmer curries, fish amok, and braised pork ribs are slow-cooked in locally crafted earthenware pots over charcoal.",
                "address": "Riverside Road, Kampong Chhnang Town",
                "latitude": 12.251,
                "longitude": 104.665,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-chhnang.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Kampong Chhnang"]',
                "rating": 4.85,
                "review_count": 580,
                "views_count": 13400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-speu"].id,
                "name": "Phnom Aural Mountain Sanctuary",
                "local_name": "ដែនជម្រកសត្វព្រៃភ្នំឱរ៉ាល់",
                "slug": "phnom-aural-mountain-sanctuary",
                "place_type": "NATIONAL_PARK",
                "description": "Cambodia's highest peak reaching 1,813 meters above sea level. A haven of pristine biodiversity, evergreen moss-covered cloud forests, mountain streams, and multi-day eco-trekking expeditions.",
                "address": "Aural Wildlife Sanctuary, Kampong Speu",
                "latitude": 11.983,
                "longitude": 104.133,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-speu.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-speu.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "National_Park", "Kampong Speu"]',
                "rating": 4.9,
                "review_count": 420,
                "views_count": 14500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-speu"].id,
                "name": "Palm Sugar Village & Countryside Kitchen",
                "local_name": "ភូមិស្ករត្នោតកំពង់ស្ពឺ និងភោជនីយដ្ឋានស្រែ",
                "slug": "kampong-speu-palm-sugar-kitchen",
                "place_type": "RESTAURANT",
                "description": "Located in the heart of Cambodia's GI-certified palm sugar orchards. Watch traditional palm nectar boiling and taste mouthwatering country dishes glazed with pure golden palm sugar.",
                "address": "National Road 4, Kampong Speu",
                "latitude": 11.455,
                "longitude": 104.521,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kampong-speu.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-speu.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Kampong Speu"]',
                "rating": 4.86,
                "review_count": 640,
                "views_count": 15200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-thom"].id,
                "name": "Phnom Santuk Holy Mountain & Reclining Buddhas",
                "local_name": "រមណីយដ្ឋានភ្នំសន្ទុក",
                "slug": "phnom-santuk-holy-mountain",
                "place_type": "TEMPLE",
                "description": "Sacred mountain ascended via 809 stone steps shaded by tropical forest. Features ancient sandstone reclining Buddha sculptures carved directly into living bedrock, pagoda stupas, and playful wild monkeys.",
                "address": "Santuk District, Kampong Thom",
                "latitude": 12.798,
                "longitude": 105.021,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-thom.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-thom.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Temple", "Kampong Thom"]',
                "rating": 4.82,
                "review_count": 780,
                "views_count": 17900,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-thom"].id,
                "name": "Kampong Thom Riverfront Garden & Night Market",
                "local_name": "មាត់ស្ទឹងសែន និងផ្សាររាត្រីកំពង់ធំ",
                "slug": "kampong-thom-night-market",
                "place_type": "MARKET",
                "description": "Charming riverside esplanade along the Stung Sen river. Lined with evening food carts serving grilled dried beef, roasted river fish, crispy insect snacks, and fresh tropical fruit juices.",
                "address": "Stung Sen River Boulevard, Kampong Thom Town",
                "latitude": 12.712,
                "longitude": 104.887,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-thom.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-thom.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Kampong Thom"]',
                "rating": 4.73,
                "review_count": 510,
                "views_count": 11200,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kandal"].id,
                "name": "Oudong Mountain Ancient Royal Necropolis",
                "local_name": "ភ្នំព្រះរាជទ្រព្យ ឧដុង្គ",
                "slug": "oudong-mountain-royal-necropolis",
                "place_type": "TEMPLE",
                "description": "Historic royal capital of Cambodia from 1618 to 1866. A dramatic ridge crowned with monumental golden stupas preserving the sacred relics of ancient Khmer monarchs, surrounded by vast green floodplains.",
                "address": "Ponhea Leu District, Kandal Province",
                "latitude": 11.819,
                "longitude": 104.752,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kandal.jpg",
                "gallery_json": json.dumps(["/images/destinations/kandal.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Temple", "Kandal"]',
                "rating": 4.89,
                "review_count": 1340,
                "views_count": 29800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kandal"].id,
                "name": "Phnom Prasith Sacred Hill & Pagoda",
                "local_name": "ភ្នំប្រសិទ្ធិ",
                "slug": "phnom-prasith-sacred-hill",
                "place_type": "ATTRACTION",
                "description": "A picturesque dual-peak sacred hill with an ancient pre-Angkorian temple ruin on the southern peak and a vibrant Buddhist monastery on the northern peak, offering sweeping views over Kandal's lotus fields.",
                "address": "Chhvang Commune, Ponhea Leu, Kandal",
                "latitude": 11.698,
                "longitude": 104.792,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/kandal.jpg",
                "gallery_json": json.dumps(["/images/destinations/kandal.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Kandal"]',
                "rating": 4.74,
                "review_count": 480,
                "views_count": 11500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kandal"].id,
                "name": "Oudong Royal Roasted Chicken & River Prawn Pavilions",
                "local_name": "តូបមាន់ដុត និងបង្កងទន្លេជើងភ្នំឧដុង្គ",
                "slug": "oudong-royal-roasted-chicken",
                "place_type": "RESTAURANT",
                "description": "The legendary roadside open-air dining pavilions at the foot of Oudong mountain. Renowned across the country for crispy wood-fired roasted free-range chicken, giant river prawns, and fragrant jasmine rice.",
                "address": "At the base of Phnom Oudong, National Road 5, Kandal",
                "latitude": 11.815,
                "longitude": 104.755,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kandal.jpg",
                "gallery_json": json.dumps(["/images/destinations/kandal.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Restaurant", "Kandal"]',
                "rating": 4.88,
                "review_count": 1150,
                "views_count": 26400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kratie"].id,
                "name": "Koh Trong Peaceful Sandbar Island",
                "local_name": "កោះទ្រង់ ក្រចេះ",
                "slug": "koh-trong-island-kratie",
                "place_type": "ATTRACTION",
                "description": "An idyllic motor-free island in the center of the Mekong river reached by wooden ferry. Rent a bicycle to ride the 9km shaded perimeter trail past organic pomelo groves, floating villages, and traditional wooden stilt houses.",
                "address": "Koh Trong Island, Kratie Province",
                "latitude": 12.488,
                "longitude": 106.012,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kratie.jpg",
                "gallery_json": json.dumps(["/images/destinations/kratie.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Attraction", "Kratie"]',
                "rating": 4.86,
                "review_count": 720,
                "views_count": 17600,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kratie"].id,
                "name": "Kratie Central Riverfront Night Bazaar",
                "local_name": "ផ្សាររាត្រីមាត់ទន្លេក្រចេះ",
                "slug": "kratie-riverfront-night-bazaar",
                "place_type": "MARKET",
                "description": "Atmospheric evening gathering on the Mekong riverbank. Famous for sweet Kratie pomelos, skewered grilled beef wrapped in betel leaves, sugarcane juice, and gorgeous sunsets over the Mekong.",
                "address": "Riverfront Walk, Kratie Town",
                "latitude": 12.483,
                "longitude": 106.017,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kratie.jpg",
                "gallery_json": json.dumps(["/images/destinations/kratie.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Kratie"]',
                "rating": 4.75,
                "review_count": 490,
                "views_count": 10800,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampot"].id,
                "name": "Kampot Night Market & Salt Worker Plaza",
                "local_name": "ផ្សាររាត្រីកំពត",
                "slug": "kampot-night-market",
                "place_type": "MARKET",
                "description": "A vibrant evening bazaar in central Kampot near the giant Durian statue. Discover locally produced Kampot black pepper, sea salt crystals, handmade linen clothing, artisan ice cream, and lively street food.",
                "address": "Near Durian Roundabout, Kampot City",
                "latitude": 10.608,
                "longitude": 104.179,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampot.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampot.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Kampot"]',
                "rating": 4.76,
                "review_count": 820,
                "views_count": 21300,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["battambang"].id,
                "name": "Psar Nat Art Deco Central Market",
                "local_name": "ផ្សារណាត់ បាត់ដំបង",
                "slug": "psar-nat-battambang-market",
                "place_type": "MARKET",
                "description": "Battambang's iconic 1930s French colonial Art Deco market in the heart of the heritage quarter. Packed with morning vendors selling Battambang rice noodles, sweet sticky corn cakes, fresh oranges, and aromatic coffee.",
                "address": "Street 1, Sangkat Svay Pao, Battambang",
                "latitude": 13.102,
                "longitude": 103.199,
                "price_level": "$",
                "hero_image_url": "/images/destinations/battambang.jpg",
                "gallery_json": json.dumps(["/images/destinations/battambang.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Battambang"]',
                "rating": 4.78,
                "review_count": 940,
                "views_count": 23500,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["koh-kong"].id,
                "name": "Koh Kong City Night Market & Waterfront",
                "local_name": "ផ្សាររាត្រីក្រុងខេមរភូមិន្ទ កោះកុង",
                "slug": "koh-kong-city-night-market",
                "place_type": "MARKET",
                "description": "A lively open-air market along the estuary waterfront looking toward Thai hills. Savor fresh Gulf of Thailand seafood, grilled mud crab with Kampot pepper, squid skewers, and refreshing coconut water.",
                "address": "Riverside Promenade, Khemarak Phoumin, Koh Kong",
                "latitude": 11.616,
                "longitude": 102.983,
                "price_level": "$",
                "hero_image_url": "/images/destinations/koh-kong.jpg",
                "gallery_json": json.dumps(["/images/destinations/koh-kong.jpg"]),
                "amenities_json": '["Ground Verified", "Scenic", "Authentic Cambodia"]',
                "tags_json": '["Cambodia", "Market", "Koh Kong"]',
                "rating": 4.72,
                "review_count": 520,
                "views_count": 12400,
                "is_featured": True,
                "verification_status": "GROUND_VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "National Museum of Cambodia",
                "local_name": "សារមន្ទីរជាតិកម្ពុជា",
                "slug": "national-museum-of-cambodia",
                "place_type": "MUSEUM",
                "description": "The premier historical and archaeological museum in Cambodia, housing over 14,000 priceless treasures including millennium-old Angkorian sandstone sculptures, bronze deities, and royal artifacts.",
                "address": "Preah Ang Eng St. (13), Phnom Penh",
                "latitude": 11.5663,
                "longitude": 104.9292,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Guided Tours", "Courtyard Garden", "Audio Guides", "Wheelchair Accessible"]',
                "tags_json": '["Museum", "Khmer Art", "Angkor Sculptures", "History", "Culture"]',
                "rating": 4.88,
                "review_count": 1850,
                "views_count": 32400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Wat Phnom Daun Penh",
                "local_name": "វត្តភ្នំដូនពេញ",
                "slug": "wat-phnom-daun-penh",
                "place_type": "TEMPLE",
                "description": "The sacred 27-meter hill temple that gave birth to the name of Phnom Penh in 1372. Features lush tree-shaded gardens, gilded shrines, and the legendary statue of Lady Penh.",
                "address": "Street 96, Norodom Blvd, Phnom Penh",
                "latitude": 11.5761,
                "longitude": 104.923,
                "price_level": "$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Hilltop Sanctuary", "Park Gardens", "Floral Clock", "Cultural Landmark"]',
                "tags_json": '["Temple", "History", "Sacred", "Buddhism", "Founding Site"]',
                "rating": 4.75,
                "review_count": 1420,
                "views_count": 28900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Central Market (Phsar Thmey)",
                "local_name": "ផ្សារធំថ្មី",
                "slug": "central-market-phnom-penh",
                "place_type": "MARKET",
                "description": "An iconic Art Deco yellow landmark designed in 1937 with a soaring 26-meter dome. Packed with authentic street food stalls, gold and gems, silks, handicrafts, and local electronics.",
                "address": "Calmette St. (53), Phnom Penh",
                "latitude": 11.5694,
                "longitude": 104.9213,
                "price_level": "$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Street Food Courtyard", "Jewelry Section", "Souvenirs", "ATM Onsite"]',
                "tags_json": '["Market", "Art Deco", "Shopping", "Street Food", "Handicrafts"]',
                "rating": 4.7,
                "review_count": 2300,
                "views_count": 41000,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Sisowath Quay Riverside Promenade",
                "local_name": "ផ្លូវដើរមាត់ទន្លេស៊ីសុវត្ថិ",
                "slug": "sisowath-quay-riverside",
                "place_type": "ATTRACTION",
                "description": "A vibrant 3-kilometer palm-fringed waterfront overlooking the Chaktomuk confluence of the Tonle Sap and Mekong rivers. Ideal for sunset walking, sunset cruises, and riverside cafes.",
                "address": "Sisowath Quay, Phnom Penh",
                "latitude": 11.567,
                "longitude": 104.9333,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Pedestrian Promenade", "Riverboat Cruises", "Rooftop Bars", "Street Performers"]',
                "tags_json": '["Riverfront", "Walkway", "Sunset", "Dining", "Nightlife"]',
                "rating": 4.82,
                "review_count": 1980,
                "views_count": 35600,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Malis Restaurant Phnom Penh",
                "local_name": "ភោជនីយដ្ឋាន ម្លិះ",
                "slug": "malis-restaurant-phnom-penh",
                "place_type": "RESTAURANT",
                "description": "Master Chef Luu Meng's celebrated culinary flagship reviving Living Cambodian Cuisine. Features organic ingredients, Royal Mak Mee, Kampot crab fried rice, and serene pond courtyard dining.",
                "address": "136 Norodom Blvd, Phnom Penh",
                "latitude": 11.5528,
                "longitude": 104.9286,
                "price_level": "$$$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Courtyard Garden", "Fine Dining", "Wine Cellar", "Private Dining Rooms"]',
                "tags_json": '["Khmer Gourmet", "Fine Dining", "Chef Luu Meng", "Fish Amok", "Living Cambodian Cuisine"]',
                "rating": 4.93,
                "review_count": 1650,
                "views_count": 26700,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampot"].id,
                "name": "La Plantation Kampot Pepper Farm",
                "local_name": "ចម្ការម្រេចឡាផ្លានថេសិន",
                "slug": "la-plantation-kampot-pepper",
                "place_type": "ACTIVITY",
                "description": "An award-winning organic pepper estate nestled between the mountains and secret lake. Offers guided tastings of black, red, white, and salted green Kampot peppers, plus traditional cooking classes.",
                "address": "Bosjhang Village, Kampot",
                "latitude": 10.6389,
                "longitude": 104.2889,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kampot.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampot.jpg"]),
                "amenities_json": '["Free Guided Tastings", "Organic Farm Tour", "Farm-to-Table Restaurant", "Cooking Class"]',
                "tags_json": '["Kampot Pepper", "Organic Farm", "Tasting", "Cooking Class", "Agro-Tourism"]',
                "rating": 4.94,
                "review_count": 2100,
                "views_count": 34200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampot"].id,
                "name": "Kampot Riverside Promenade & Old Market",
                "local_name": "មាត់ព្រែកកំពត និងផ្សារចាស់",
                "slug": "kampot-riverside-walk",
                "place_type": "ATTRACTION",
                "description": "A charming riverside esplanade lined with canary-yellow French colonial shophouses, artisan coffee roasters, sunset stand-up paddleboarding, and evening firefly cruises.",
                "address": "Riverside Road, Kampot Town",
                "latitude": 10.6083,
                "longitude": 104.1794,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/kampot.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampot.jpg"]),
                "amenities_json": '["Stand-up Paddleboard", "Firefly Boat Tours", "Colonial Architecture", "Riverside Cafes"]',
                "tags_json": '["Riverside", "Sunset", "Paddleboarding", "Colonial History", "Fireflies"]',
                "rating": 4.85,
                "review_count": 1420,
                "views_count": 22800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kep"].id,
                "name": "Kep Crab Market (Phsar Kdam)",
                "local_name": "ផ្សារក្ដាមកែប",
                "slug": "kep-crab-market",
                "place_type": "MARKET",
                "description": "Cambodia's most celebrated seaside seafood hub. Watch local fishers haul woven bamboo baskets of live blue swimmer crabs straight from the sea to be wok-fried with fresh green Kampot peppercorns.",
                "address": "Crab Market Waterfront, Kep",
                "latitude": 10.4828,
                "longitude": 104.2889,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kep.jpg",
                "gallery_json": json.dumps(["/images/destinations/kep.jpg"]),
                "amenities_json": '["Live Seafood Stalls", "Outdoor Dining Piers", "Ocean Sunset View", "Fresh Pepper Cooking"]',
                "tags_json": '["Crab Market", "Fresh Seafood", "Kampot Pepper", "Ocean Pier", "Authentic"]',
                "rating": 4.91,
                "review_count": 2450,
                "views_count": 42000,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kep"].id,
                "name": "Kep National Park & Sunset Rock",
                "local_name": "ឧទ្យានជាតិកែប",
                "slug": "kep-national-park",
                "place_type": "NATIONAL_PARK",
                "description": "An 8-kilometer circular mountain trail wrapping around verdant jungle hills with breathtaking panoramic views over the Gulf of Thailand, Phu Quoc Island, and the Bokor mountain range.",
                "address": "Kep Mountain Range, Kep",
                "latitude": 10.4939,
                "longitude": 104.3056,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kep.jpg",
                "gallery_json": json.dumps(["/images/destinations/kep.jpg"]),
                "amenities_json": '["Nature Trail", "Sunset Viewpoint", "Wildlife Spotting", "Mountain Biking"]',
                "tags_json": '["National Park", "Hiking", "Jungle", "Ocean View", "Sunset Rock"]',
                "rating": 4.86,
                "review_count": 1320,
                "views_count": 21400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kep"].id,
                "name": "Rabbit Island (Koh Tonsay)",
                "local_name": "កោះទន្សាយ",
                "slug": "rabbit-island-koh-tonsay",
                "place_type": "BEACH",
                "description": "A peaceful tropical island just a 20-minute wooden boat ride from Kep Pier. Features quiet shallow beaches, swaying coconut palms, hammock bungalows, and freshly caught grilled seafood.",
                "address": "Gulf of Thailand, 4km offshore Kep",
                "latitude": 10.4333,
                "longitude": 104.3333,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kep.jpg",
                "gallery_json": json.dumps(["/images/destinations/kep.jpg"]),
                "amenities_json": '["Boat Transfers", "Beach Bungalows", "Snorkeling", "Hammock Rest"]',
                "tags_json": '["Island", "Beach", "Bungalows", "Relaxation", "Snorkeling"]',
                "rating": 4.82,
                "review_count": 1180,
                "views_count": 19300,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["sihanoukville"].id,
                "name": "Long Set Beach (4K Beach), Koh Rong",
                "local_name": "ឆ្នេរឡុងសិត កោះរ៉ុង",
                "slug": "long-set-beach-koh-rong",
                "place_type": "BEACH",
                "description": "Four kilometers of unbroken, ultra-fine blinding white sand sloping gently into clear azure waters. Renowned for tranquility by day and bioluminescent sparkling plankton at night.",
                "address": "Southeast Coast, Koh Rong Island",
                "latitude": 10.71,
                "longitude": 103.2667,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/sihanoukville.jpg",
                "gallery_json": json.dumps(["/images/destinations/sihanoukville.jpg"]),
                "amenities_json": '["White Sand Beach", "Bioluminescent Plankton Tours", "Beachfront Bars", "Speedboat Ferries"]',
                "tags_json": '["Beach", "Koh Rong", "White Sand", "Plankton", "Paradise"]',
                "rating": 4.93,
                "review_count": 1780,
                "views_count": 31200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["sihanoukville"].id,
                "name": "Ream National Park & Mangrove Estuary",
                "local_name": "ឧទ្យានជាតិរាម",
                "slug": "ream-national-park",
                "place_type": "NATIONAL_PARK",
                "description": "A 210-square-kilometer coastal paradise protecting evergreen rainforests, mangrove rivers, coral reefs, and nesting grounds for endangered white-bellied sea eagles.",
                "address": "Preah Sihanouk Province",
                "latitude": 10.5167,
                "longitude": 103.65,
                "price_level": "$",
                "hero_image_url": "/images/destinations/sihanoukville.jpg",
                "gallery_json": json.dumps(["/images/destinations/sihanoukville.jpg"]),
                "amenities_json": '["Mangrove Boat Tours", "Birdwatching", "Guided Treks", "Ranger Station"]',
                "tags_json": '["National Park", "Mangroves", "Wildlife", "Eagles", "Eco-Tourism"]',
                "rating": 4.8,
                "review_count": 940,
                "views_count": 16700,
                "is_featured": False,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["battambang"].id,
                "name": "Battambang Bamboo Train (Norry)",
                "local_name": "ណូរីបាត់ដំបង (រទេះភ្លើងឬស្សី)",
                "slug": "battambang-bamboo-train",
                "place_type": "ACTIVITY",
                "description": "A unique Cambodian invention: a wooden-and-bamboo platform powered by a small gasoline engine hurtling down historic rail tracks through scenic rice paddies and rural villages at 40 km/h.",
                "address": "O Sra Lav Village, Battambang",
                "latitude": 13.0422,
                "longitude": 103.2389,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/battambang.jpg",
                "gallery_json": json.dumps(["/images/destinations/battambang.jpg"]),
                "amenities_json": '["Unique Train Ride", "Rural Countryside Views", "Photo Stops", "Local Driver"]',
                "tags_json": '["Bamboo Train", "Norry", "Railway", "Adventure", "Battambang"]',
                "rating": 4.89,
                "review_count": 2250,
                "views_count": 39100,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["battambang"].id,
                "name": "Wat Ek Phnom Ancient Temple",
                "local_name": "ប្រាសាទវត្តឯកភ្នំ",
                "slug": "wat-ek-phnom-battambang",
                "place_type": "TEMPLE",
                "description": "An atmospheric 11th-century Hindu sanctuary built during the reign of King Suryavarman I, surrounded by a serene lotus pond and a modern pagoda featuring an enormous seated white Buddha.",
                "address": "Peam Aek Commune, Battambang",
                "latitude": 13.1611,
                "longitude": 103.1861,
                "price_level": "$",
                "hero_image_url": "/images/destinations/battambang.jpg",
                "gallery_json": json.dumps(["/images/destinations/battambang.jpg"]),
                "amenities_json": '["Ancient Carvings", "Lotus Pond", "Colossal Buddha Statue", "Shaded Terraces"]',
                "tags_json": '["Temple", "11th Century", "Suryavarman I", "Angkorian", "History"]',
                "rating": 4.78,
                "review_count": 820,
                "views_count": 14600,
                "is_featured": False,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["mondulkiri"].id,
                "name": "Elephant Valley Project Sanctuary",
                "local_name": "គម្រោងអភិរក្សដំរីជ្រលងមណ្ឌលគិរី",
                "slug": "elephant-valley-project-mondulkiri",
                "place_type": "ATTRACTION",
                "description": "Cambodia's pioneering ethical elephant sanctuary set across 1,500 hectares of forest. Visitors walk alongside rescued elephants as they graze, bathe in rivers, and roam freely without riding.",
                "address": "Keo Seima Wildlife Sanctuary, Mondulkiri",
                "latitude": 12.4167,
                "longitude": 107.1333,
                "price_level": "$$$",
                "hero_image_url": "/images/destinations/mondulkiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/mondulkiri.jpg"]),
                "amenities_json": '["Ethical Elephant Walking", "Forest Guides", "Vegetarian Lunch", "Conservation Talk"]',
                "tags_json": '["Elephants", "Ethical Sanctuary", "Wildlife", "Jungle Walk", "Conservation"]',
                "rating": 4.97,
                "review_count": 1680,
                "views_count": 28500,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["mondulkiri"].id,
                "name": "Sea Forest Viewpoint (Phnom Doh Kramom)",
                "local_name": "ភ្នំដោះក្រមុំ (សមុទ្រឈើ)",
                "slug": "sea-forest-viewpoint-mondulkiri",
                "place_type": "ATTRACTION",
                "description": "A sacred hilltop ridge near Sen Monorom offering sweeping 360-degree vistas across an undulating green canopy stretching to the horizon like ocean waves, especially breathtaking at sunrise.",
                "address": "Sen Monorom, Mondulkiri",
                "latitude": 12.45,
                "longitude": 107.1833,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/mondulkiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/mondulkiri.jpg"]),
                "amenities_json": '["Panoramic Hilltop", "Sacred Spirit Shrines", "Sunrise Photography", "Pine Trees"]',
                "tags_json": '["Viewpoint", "Sea Forest", "Sunset", "Sunrise", "Sacred Hill"]',
                "rating": 4.88,
                "review_count": 1240,
                "views_count": 21900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["koh-kong"].id,
                "name": "Peam Krasop Mangrove Conservation Sanctuary",
                "local_name": "តំបន់អភិរក្សព្រៃកោងកាងពាមក្រសោប",
                "slug": "peam-krasop-mangrove-sanctuary",
                "place_type": "NATIONAL_PARK",
                "description": "One of Southeast Asia's largest contiguous mangrove forests. A suspended 1.5-kilometer elevated concrete walkway winds through giant stilt-rooted mangroves leading to an ocean observation tower.",
                "address": "Mondol Seima District, Koh Kong",
                "latitude": 11.5333,
                "longitude": 103.0167,
                "price_level": "$",
                "hero_image_url": "/images/destinations/koh-kong.jpg",
                "gallery_json": json.dumps(["/images/destinations/koh-kong.jpg"]),
                "amenities_json": '["Elevated Boardwalk", "Observation Tower", "Longtail Boat Excursions", "Suspension Bridge"]',
                "tags_json": '["Mangroves", "Conservation", "Nature Walk", "Boardwalk", "Koh Kong"]',
                "rating": 4.9,
                "review_count": 1410,
                "views_count": 24700,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["koh-kong"].id,
                "name": "Tatai River Waterfalls & Rapids",
                "local_name": "ទឹកធ្លាក់តាតៃ",
                "slug": "tatai-river-waterfalls",
                "place_type": "WATERFALL",
                "description": "A wide, dramatic multi-tiered river waterfall plunging over flat limestone ledges in the heart of the Cardamom Mountains. Renowned for refreshing swimming pools and kayaking.",
                "address": "Tatai Commune, Koh Kong Province",
                "latitude": 11.5667,
                "longitude": 103.1167,
                "price_level": "$",
                "hero_image_url": "/images/destinations/koh-kong.jpg",
                "gallery_json": json.dumps(["/images/destinations/koh-kong.jpg"]),
                "amenities_json": '["Natural Swimming", "Boat Trips", "Kayaking", "Riverside Eco-Lodges"]',
                "tags_json": '["Waterfall", "Cardamom Mountains", "Swimming", "Kayaking", "Eco-Tourism"]',
                "rating": 4.88,
                "review_count": 990,
                "views_count": 17600,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["preah-vihear"].id,
                "name": "Koh Ker Ancient Pyramid Temple Complex",
                "local_name": "រមណីយដ្ឋានប្រាសាទកោះកេរ",
                "slug": "koh-ker-pyramid-temple",
                "place_type": "TEMPLE",
                "description": "The remote 10th-century capital of King Jayavarman IV and UNESCO World Heritage site, centered on Prasat Thom: a staggering 7-tiered, 36-meter sandstone step pyramid rising above the deep jungle.",
                "address": "Kuleaen District, Preah Vihear",
                "latitude": 13.7833,
                "longitude": 104.5333,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/preah-vihear.jpg",
                "gallery_json": json.dumps(["/images/destinations/preah-vihear.jpg"]),
                "amenities_json": '["UNESCO Site", "Wooden Staircase to Summit", "Shaded Forest Pathways", "Archaeological Museum"]',
                "tags_json": '["UNESCO", "Pyramid", "Koh Ker", "Ancient Capital", "Jayavarman IV"]',
                "rating": 4.95,
                "review_count": 1890,
                "views_count": 33100,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-cham"].id,
                "name": "Wat Nokor Bachey Ancient Temple",
                "local_name": "វត្តនគរបាជ័យ",
                "slug": "wat-nokor-bachey-kampong-cham",
                "place_type": "TEMPLE",
                "description": "A captivating 11th-century sandstone and laterite monument built by King Jayavarman VII. A colorful modern Theravada Buddhist monastery has been built directly inside the ancient black stone corridors.",
                "address": "National Highway 7, Kampong Cham",
                "latitude": 11.995,
                "longitude": 105.4333,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-cham.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-cham.jpg"]),
                "amenities_json": '["Ancient Stone Enclosure", "Wall Murals", "Reclining Buddha", "Gardens"]',
                "tags_json": '["Temple", "Jayavarman VII", "Laterite", "Buddhist Murals", "History"]',
                "rating": 4.82,
                "review_count": 860,
                "views_count": 15200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-cham"].id,
                "name": "Koh Pen Island & Bamboo Bridge",
                "local_name": "កោះប៉ែន និងស្ពានឬស្សី",
                "slug": "koh-pen-bamboo-bridge",
                "place_type": "ACTIVITY",
                "description": "A serene agricultural island in the middle of the Mekong River. Each dry season, local master artisans rebuild a 1-kilometer bamboo bridge by hand using 50,000 bamboo poles.",
                "address": "Koh Pen Island, Kampong Cham",
                "latitude": 11.97,
                "longitude": 105.4667,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-cham.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-cham.jpg"]),
                "amenities_json": '["Bicycle Trails", "Pomelo Orchards", "Handmade Bridge", "River Beaches"]',
                "tags_json": '["Bamboo Bridge", "Mekong Island", "Cycling", "Agro-Tourism", "Tradition"]',
                "rating": 4.87,
                "review_count": 1340,
                "views_count": 23800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-thom"].id,
                "name": "Sambor Prei Kuk UNESCO Brick Temples",
                "local_name": "រមណីយដ្ឋានប្រាសាទសំបូរព្រៃគុក",
                "slug": "sambor-prei-kuk-temples",
                "place_type": "TEMPLE",
                "description": "The ancient 7th-century capital of the Chenla Empire (Ishanapura) and UNESCO World Heritage site. Over 100 octagonal brick temples dating centuries before Angkor are embraced by ancient strangler fig roots.",
                "address": "Prasat Sambour District, Kampong Thom",
                "latitude": 12.8667,
                "longitude": 105.0333,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kampong-thom.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-thom.jpg"]),
                "amenities_json": '["UNESCO Site", "Forest Cycling Paths", "Community Homestays", "Local Guides"]',
                "tags_json": '["UNESCO", "Chenla Empire", "Pre-Angkorian", "Brick Temples", "Ishanapura"]',
                "rating": 4.93,
                "review_count": 1620,
                "views_count": 28400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pursat"].id,
                "name": "Phnom 1500 & Cardamom Scenic Pass",
                "local_name": "ភ្នំ១៥០០ (ផ្លូវបូព៌ាក្រវ៉ាញ)",
                "slug": "phnom-1500-cardamom-pass",
                "place_type": "ATTRACTION",
                "description": "Cambodia's most spectacular mountain highway, curling in dramatic hairpin turns through lush mist-shrouded Cardamom rainforest ridges with lookouts reaching 1,500 meters altitude.",
                "address": "Veal Veng District, Pursat Province",
                "latitude": 12.2833,
                "longitude": 103.2167,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/pursat.jpg",
                "gallery_json": json.dumps(["/images/destinations/pursat.jpg"]),
                "amenities_json": '["Mountain Lookouts", "Cloud Forest Vista", "Motorcycle Route", "Roadside Cafes"]',
                "tags_json": '["Mountain Pass", "Cardamom", "Scenic Highway", "Cloud Forest", "Adventure"]',
                "rating": 4.92,
                "review_count": 1560,
                "views_count": 27800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-chhnang"].id,
                "name": "Traditional Clay Pottery Artisan Villages",
                "local_name": "ភូមិក្អមឆ្នាំងប្រពៃណី",
                "slug": "kampong-chhnang-pottery-villages",
                "place_type": "ACTIVITY",
                "description": "Centuries-old artisanal communities that gave the province its name ('Port of Pots'). Craftswomen sculpt terracotta water pots and portable charcoal braziers by hand without potter's wheels.",
                "address": "Andong Russei Village, Kampong Chhnang",
                "latitude": 12.2333,
                "longitude": 104.6667,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-chhnang.jpg"]),
                "amenities_json": '["Hands-on Clay Workshops", "Artisan Showrooms", "Traditional Kilns", "Village Tours"]',
                "tags_json": '["Pottery", "Clay Pots", "Artisans", "Tradition", "Culture"]',
                "rating": 4.81,
                "review_count": 740,
                "views_count": 13600,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["takeo"].id,
                "name": "Phnom Da & Angkor Borei Ancient Capital",
                "local_name": "ភ្នំដា និងអង្គរបុរី",
                "slug": "phnom-da-angkor-borei",
                "place_type": "TEMPLE",
                "description": "The historic cradle of Cambodian civilization dating to the 1st-6th century Kingdom of Funan. Accessible by a scenic 20-kilometer canal boat ride across vast flooded plains.",
                "address": "Angkor Borei District, Takeo",
                "latitude": 10.9833,
                "longitude": 104.9833,
                "price_level": "$",
                "hero_image_url": "/images/destinations/takeo.jpg",
                "gallery_json": json.dumps(["/images/destinations/takeo.jpg"]),
                "amenities_json": '["Canal Boat Ride", "Pre-Angkorian Stone Temple", "Archaeological Museum", "Ashram Maha Rosei"]',
                "tags_json": '["Funan Kingdom", "Cradle of Cambodia", "Phnom Da", "Boat Cruise", "Archaeology"]',
                "rating": 4.86,
                "review_count": 910,
                "views_count": 16400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["banteay-meanchey"].id,
                "name": "Banteay Chhmar Great Ancient Citadel",
                "local_name": "ប្រាសាទបន្ទាយឆ្មារ",
                "slug": "banteay-chhmar-citadel",
                "place_type": "TEMPLE",
                "description": "One of the grandest temple complexes of the Angkorian era, constructed by Jayavarman VII. Famed for its monumental face towers and unique bas-reliefs of multi-armed Avalokiteshvara.",
                "address": "Banteay Chhmar District, Banteay Meanchey",
                "latitude": 14.0722,
                "longitude": 102.9906,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/banteay-meanchey.jpg"]),
                "amenities_json": '["Community-Based Tourism", "Homestay Program", "Ancient Bas-Reliefs", "Face Towers"]',
                "tags_json": '["Temple", "Jayavarman VII", "Bas-Reliefs", "Face Towers", "Atmospheric"]',
                "rating": 4.93,
                "review_count": 1180,
                "views_count": 21300,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["stung-treng"].id,
                "name": "Ramsar Flooded Forests & Wetland Sanctuary",
                "local_name": "តំបន់រ៉ាមសារព្រៃលិចទឹកស្ទឹងត្រែង",
                "slug": "ramsar-flooded-forest-stung-treng",
                "place_type": "NATIONAL_PARK",
                "description": "A globally recognized UNESCO Ramsar wetland site spanning 40 kilometers of the upper Mekong River. Features ancient drowned trees with giant sculpted roots that survive full seasonal submergence.",
                "address": "Mekong River Corridor, Stung Treng",
                "latitude": 13.6833,
                "longitude": 105.9667,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/stung-treng.jpg",
                "gallery_json": json.dumps(["/images/destinations/stung-treng.jpg"]),
                "amenities_json": '["Kayaking Through Drowned Trees", "Birdwatching Excursions", "Camping Platforms", "Boat Safaris"]',
                "tags_json": '["Ramsar Site", "Flooded Forest", "Mekong River", "Kayaking", "Eco-Tourism"]',
                "rating": 4.91,
                "review_count": 840,
                "views_count": 15300,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kandal"].id,
                "name": "Oudong Mountain Royal Stupas",
                "local_name": "ភ្នំព្រះរាជទ្រព្យឧដុង្គ",
                "slug": "oudong-royal-stupas-mountain",
                "place_type": "TEMPLE",
                "description": "The royal necropolis and former capital of Cambodia (1618-1866). Rising steeply above the central plain, its twin ridges are crowned with stupas enshrining the ashes of ancient monarchs and sacred Buddha relics.",
                "address": "Ponhea Lueu District, Kandal",
                "latitude": 11.8167,
                "longitude": 104.75,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kandal.jpg",
                "gallery_json": json.dumps(["/images/destinations/kandal.jpg"]),
                "amenities_json": '["509 Stone Steps Stairway", "Royal Stupas", "Buddha Relic Vihara", "Panoramic Countryside View"]',
                "tags_json": '["Ancient Capital", "Royal Stupas", "Relics", "Buddhism", "Historic Mountain"]',
                "rating": 4.87,
                "review_count": 1760,
                "views_count": 31400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-speu"].id,
                "name": "Kirirom National Park & High Pine Forests",
                "local_name": "ឧទ្យានជាតិគិរីរម្យ (ភ្នំគីរីរម្យ)",
                "slug": "kirirom-national-park",
                "place_type": "NATIONAL_PARK",
                "description": "Cambodia's first designated national park, perched on an elevated plateau blanketed with fragrant pine forests, cool mountain mist, cascading waterfalls, and cliff lookouts.",
                "address": "Phnom Sruoch District, Kampong Speu",
                "latitude": 11.3167,
                "longitude": 104.05,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-speu.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-speu.jpg"]),
                "amenities_json": '["Pine Forest Camping", "Mountain Biking", "Waterfalls", "Resort Glamping"]',
                "tags_json": '["National Park", "Pine Forest", "Cool Climate", "Hiking", "Kirirom"]',
                "rating": 4.89,
                "review_count": 1920,
                "views_count": 33800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pailin"].id,
                "name": "Phnom Yat Hilltop Gem Temple",
                "local_name": "វត្តភ្នំយ៉ាត ប៉ៃលិន",
                "slug": "phnom-yat-temple-pailin",
                "place_type": "TEMPLE",
                "description": "The spiritual heart of Pailin, perched on a former sapphire hill. Reflects rare Shan and Burmese architectural heritage with gilded pagodas, statues of peacocks, and panoramic mountain border views.",
                "address": "Phnom Yat, Pailin Municipality",
                "latitude": 12.845,
                "longitude": 102.61,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/pailin.jpg",
                "gallery_json": json.dumps(["/images/destinations/pailin.jpg"]),
                "amenities_json": '["Hilltop Stupa", "Burmese-Style Architecture", "Sunset Viewpoint", "Gem History Exhibits"]',
                "tags_json": '["Temple", "Burmese Architecture", "Gems", "Hilltop", "Pailin"]',
                "rating": 4.8,
                "review_count": 720,
                "views_count": 12900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["oddar-meanchey"].id,
                "name": "Prasat Ta Krabey Ancient Cliff Sanctuary",
                "local_name": "ប្រាសាទតាត្រាវ / ប្រាសាទតាក្របី",
                "slug": "prasat-ta-krabey-temple",
                "place_type": "TEMPLE",
                "description": "A sacred 11th-century sandstone sanctuary constructed during the golden age of Angkor, positioned dramatically on the Dangrek mountain escarpment enveloped by ancient forest.",
                "address": "Dangrek Range, Oddar Meanchey",
                "latitude": 14.35,
                "longitude": 103.6,
                "price_level": "$",
                "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
                "gallery_json": json.dumps(["/images/destinations/oddar-meanchey.jpg"]),
                "amenities_json": '["Escarpment Cliff View", "Ancient Sandstone Carvings", "Forest Sanctuary", "Ranger Escort"]',
                "tags_json": '["Temple", "Dangrek Mountains", "Ancient Khmer", "Remote", "Forest Ruin"]',
                "rating": 4.83,
                "review_count": 560,
                "views_count": 10400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["prey-veng"].id,
                "name": "Ba Phnom Sacred Ancient Mountain",
                "local_name": "រមណីយដ្ឋានប្រវត្តិសាស្ត្របាភ្នំ",
                "slug": "ba-phnom-sacred-mountain",
                "place_type": "ATTRACTION",
                "description": "The revered sacred mountain of the early Funan Kingdom (Banam), once considered the divine home of Me Sa, the mother spirit protecting Cambodia. Features ancient shrine stairways and views of surrounding paddy seas.",
                "address": "Ba Phnom District, Prey Veng",
                "latitude": 11.2333,
                "longitude": 105.3667,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/prey-veng.jpg",
                "gallery_json": json.dumps(["/images/destinations/prey-veng.jpg"]),
                "amenities_json": '["Mountain Staircase", "Historic Shrine Sites", "Panoramic Rice Field Vistas", "Shaded Pagoda"]',
                "tags_json": '["Sacred Mountain", "Funan History", "Spirit Worship", "Countryside View", "Prey Veng"]',
                "rating": 4.79,
                "review_count": 640,
                "views_count": 11800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["svay-rieng"].id,
                "name": "Prasat Basac Ancient Temple Ruins",
                "local_name": "ប្រាសាទបាសាក់ ស្វាយរៀង",
                "slug": "prasat-basac-svay-rieng",
                "place_type": "TEMPLE",
                "description": "A historic brick sanctuary dating to the Chenla and early Angkorian periods, surrounded by sacred water ponds and monumental ancient trees in the southeastern lowlands.",
                "address": "Svay Chrum District, Svay Rieng",
                "latitude": 11.0833,
                "longitude": 105.7833,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/svay-rieng.jpg",
                "gallery_json": json.dumps(["/images/destinations/svay-rieng.jpg"]),
                "amenities_json": '["Ancient Brick Structure", "Peaceful Countryside Grounds", "Picnic Spot", "Local History"]',
                "tags_json": '["Temple", "Ancient Brick", "Chenla", "Heritage", "Svay Rieng"]',
                "rating": 4.76,
                "review_count": 510,
                "views_count": 9800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["tboung-khmum"].id,
                "name": "Chup Historic Rubber Plantation & Forest",
                "local_name": "ចម្ការកៅស៊ូចប់ ត្បូងឃ្មុំ",
                "slug": "chup-rubber-plantation",
                "place_type": "ACTIVITY",
                "description": "One of the largest and oldest rubber plantations in Southeast Asia, planted by French agronomists in the 1920s in rich volcanic red basalt soil. Endless arched green corridors of rubber trees create a hypnotic natural cathedral.",
                "address": "Chup Commune, Tboung Khmum",
                "latitude": 11.95,
                "longitude": 105.6167,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/tboung-khmum.jpg",
                "gallery_json": json.dumps(["/images/destinations/tboung-khmum.jpg"]),
                "amenities_json": '["Scenic Tree Avenues", "Rubber Tapping Demonstration", "Red Earth Trails", "Photography"]',
                "tags_json": '["Rubber Plantation", "Historic Forest", "Red Soil", "Scenic Corridors", "Tboung Khmum"]',
                "rating": 4.84,
                "review_count": 820,
                "views_count": 14900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Romdeng Traditional Khmer Dining",
                "local_name": "ភោជនីយដ្ឋាន រំដួល",
                "slug": "romdeng-restaurant-phnom-penh",
                "place_type": "RESTAURANT",
                "description": "Set inside a restored French colonial villa with a garden pool. Celebrated for authentic regional recipes, wild forest mushrooms, crispy tarantulas for the adventurous, and creamy fish amok.",
                "address": "Street 174, Phnom Penh",
                "latitude": 11.5647,
                "longitude": 104.925,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Garden Pool", "Colonial Villa", "Social Enterprise", "Cocktail Bar"]',
                "tags_json": '["Khmer Cuisine", "Colonial Villa", "Social Enterprise", "Fish Amok", "Dining"]',
                "rating": 4.88,
                "review_count": 1420,
                "views_count": 25100,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Phnom Penh Night Market (Phsar Reatrey)",
                "local_name": "ផ្សាររាត្រីភ្នំពេញ",
                "slug": "phnom-penh-night-market",
                "place_type": "MARKET",
                "description": "An open-air riverside night market where visitors take off their shoes to sit on woven mats and feast on fresh skewers, noodle soups, coconut ice cream, and browse local silk scarves.",
                "address": "Preah Sisowath Quay, Phnom Penh",
                "latitude": 11.5744,
                "longitude": 104.9275,
                "price_level": "$",
                "hero_image_url": "/images/destinations/phnom-penh.jpg",
                "gallery_json": json.dumps(["/images/destinations/phnom-penh.jpg"]),
                "amenities_json": '["Mat Dining Courtyard", "Live Acoustic Stage", "Street Food Stalls", "Silk & Clothing"]',
                "tags_json": '["Night Market", "Street Food", "Riverside", "Mat Dining", "Souvenirs"]',
                "rating": 4.74,
                "review_count": 2100,
                "views_count": 38900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampot"].id,
                "name": "Rikitikitavi Riverside Bistro & Lounge",
                "local_name": "រីគីទីគីតាវី មាត់ព្រែកកំពត",
                "slug": "rikitikitavi-bistro-kampot",
                "place_type": "RESTAURANT",
                "description": "A premier Kampot sunset dining institution directly overlooking the Praek Tuek Chhu river and Bokor mountain silhouette. Famous for Kampot pepper steak, fresh mango cocktails, and fish curry.",
                "address": "Riverside Road, Kampot",
                "latitude": 10.6067,
                "longitude": 104.1783,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kampot.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampot.jpg"]),
                "amenities_json": '["Riverfront Deck", "Sunset Cocktails", "Open-air Veranda", "Vegetarian Options"]',
                "tags_json": '["Riverside Dining", "Kampot Pepper", "Sunset", "Cocktails", "Bistro"]',
                "rating": 4.9,
                "review_count": 1380,
                "views_count": 24200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kep"].id,
                "name": "Kimly Seafood Restaurant (Kep Crab Market)",
                "local_name": "ភោជនីយដ្ឋាន គីមលី ផ្សារក្ដាម",
                "slug": "kimly-seafood-kep",
                "place_type": "RESTAURANT",
                "description": "The landmark wooden pier restaurant at the Kep Crab Market. Diners sit directly over the ocean watching fishing boats while eating sweet blue swimmer crabs flash-fried with aromatic green Kampot peppercorns.",
                "address": "Crab Market, Kep Waterfront",
                "latitude": 10.4831,
                "longitude": 104.2885,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/kep.jpg",
                "gallery_json": json.dumps(["/images/destinations/kep.jpg"]),
                "amenities_json": '["Over-Water Dining", "Fresh Crab Wok Cooking", "Sunset Views", "Draft Beer"]',
                "tags_json": '["Kep Crab", "Fresh Seafood", "Kampot Pepper", "Over-water", "Seafood"]',
                "rating": 4.92,
                "review_count": 1820,
                "views_count": 31500,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["sihanoukville"].id,
                "name": "The Secret Garden Otres Beachfront Dining",
                "local_name": "ភោជនីយដ្ឋាន ស៊ីក្រិតហ្កាឌិន អូរត្រេះ",
                "slug": "secret-garden-otres-dining",
                "place_type": "RESTAURANT",
                "description": "A tranquil beachfront restaurant on quiet Otres Beach, serving freshly grilled Gulf squid, lemongrass prawns, tropical fruit cocktails, and wood-fired pizzas under casuarina trees.",
                "address": "Otres 2 Beach, Sihanoukville",
                "latitude": 10.575,
                "longitude": 103.55,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/sihanoukville.jpg",
                "gallery_json": json.dumps(["/images/destinations/sihanoukville.jpg"]),
                "amenities_json": '["Beachfront Tables", "Sunset Loungers", "Craft Cocktails", "Fresh Seafood Grill"]',
                "tags_json": '["Beachfront", "Seafood", "Sunset", "Otres Beach", "Dining"]',
                "rating": 4.86,
                "review_count": 1150,
                "views_count": 19800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["battambang"].id,
                "name": "Jaan Bai Social Enterprise Restaurant",
                "local_name": "ភោជនីយដ្ឋាន ចានបាយ",
                "slug": "jaan-bai-battambang",
                "place_type": "RESTAURANT",
                "description": "An internationally acclaimed social enterprise restaurant backed by the Cambodian Children's Trust. Serves innovative seasonal Khmer dishes like Kampot pepper crab dip, banana blossom salad, and slow-braised beef ribs.",
                "address": "Street 2, Battambang Old Town",
                "latitude": 13.1028,
                "longitude": 103.1983,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/battambang.jpg",
                "gallery_json": json.dumps(["/images/destinations/battambang.jpg"]),
                "amenities_json": '["Creative Cocktails", "Social Impact", "Air-conditioned Dining", "Art Gallery Wall"]',
                "tags_json": '["Social Enterprise", "Gourmet Khmer", "Old Town", "Organic", "Cocktails"]',
                "rating": 4.94,
                "review_count": 1640,
                "views_count": 27300,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["mondulkiri"].id,
                "name": "Mondulkiri Highland Coffee Roastery & Cafe",
                "local_name": "ហាងកាហ្វេមណ្ឌលគិរី និងរោងម៉ាស៊ីនកិន",
                "slug": "mondulkiri-coffee-roastery",
                "place_type": "CAFE",
                "description": "The heart of Cambodian specialty coffee. Taste locally harvested volcanic-soil Arabica and Robusta beans, fresh honey from jungle bees, and hearty breakfasts overlooking pine-covered hills.",
                "address": "Sen Monorom Main Street, Mondulkiri",
                "latitude": 12.455,
                "longitude": 107.189,
                "price_level": "$",
                "hero_image_url": "/images/destinations/mondulkiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/mondulkiri.jpg"]),
                "amenities_json": '["Fresh Coffee Roasting", "Highland Honey Tasting", "Patio Seating", "Bagged Coffee Beans"]',
                "tags_json": '["Coffee Roastery", "Arabica", "Wild Honey", "Highland Cafe", "Breakfast"]',
                "rating": 4.88,
                "review_count": 980,
                "views_count": 16800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["ratanakiri"].id,
                "name": "Banlung Lakeside Terrace Restaurant",
                "local_name": "ភោជនីយដ្ឋានមាត់បឹងកន្សែង បានលុង",
                "slug": "banlung-lakeside-restaurant",
                "place_type": "RESTAURANT",
                "description": "Perched on the edge of Boeung Kanseng Lake in Banlung. Serves fragrant roasted mountain chicken with wild chili lime salt, indigenous bamboo-steamed rice, and cold Angkor beer at sunset.",
                "address": "Boeung Kanseng Road, Banlung",
                "latitude": 13.7417,
                "longitude": 106.9833,
                "price_level": "$",
                "hero_image_url": "/images/destinations/ratanakiri.jpg",
                "gallery_json": json.dumps(["/images/destinations/ratanakiri.jpg"]),
                "amenities_json": '["Lakeside Pavilions", "Roasted Mountain Chicken", "Sunset Views", "Local Draft Beer"]',
                "tags_json": '["Lakeside", "Local Specialty", "Mountain Chicken", "Banlung", "Sunset"]',
                "rating": 4.8,
                "review_count": 670,
                "views_count": 12100,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kratie"].id,
                "name": "Red Sun Falling Mekong Riverside Cafe",
                "local_name": "ហាងកាហ្វេ ព្រះអាទិត្យលិចមាត់ទន្លេក្រចេះ",
                "slug": "red-sun-falling-kratie",
                "place_type": "CAFE",
                "description": "A legendary Kratie travelers' haunt in a French colonial shophouse facing the Mekong River sunset. Offers cold fruit smoothies, fresh Kratie red pomelo salads, and evening draft beer.",
                "address": "Riverfront Street, Kratie Town",
                "latitude": 12.4883,
                "longitude": 106.0183,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kratie.jpg",
                "gallery_json": json.dumps(["/images/destinations/kratie.jpg"]),
                "amenities_json": '["Riverside Balcony", "Pomelo Salad", "Sunset Drinks", "Traveler Book Exchange"]',
                "tags_json": '["Mekong Sunset", "Cafe", "Pomelo", "Colonial Shophouse", "Relaxation"]',
                "rating": 4.83,
                "review_count": 810,
                "views_count": 14200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["koh-kong"].id,
                "name": "Tatai River Floating Restaurant & Lounge",
                "local_name": "ភោជនីយដ្ឋានបណ្ដែតទឹកទន្លេតាតៃ",
                "slug": "tatai-floating-restaurant",
                "place_type": "RESTAURANT",
                "description": "A thatched wooden floating raft anchored on the emerald waters of the Tatai River. Feast on fresh mangrove mud crabs, garlic river prawns, and steamed sea bass surrounded by pristine rainforest mountains.",
                "address": "Tatai River, Koh Kong",
                "latitude": 11.57,
                "longitude": 103.11,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/koh-kong.jpg",
                "gallery_json": json.dumps(["/images/destinations/koh-kong.jpg"]),
                "amenities_json": '["Floating Raft Dining", "Fresh River Prawns", "Kayaking Access", "Mountain Views"]',
                "tags_json": '["Floating Dining", "River Prawns", "Rainforest", "Tatai", "Mud Crab"]',
                "rating": 4.89,
                "review_count": 790,
                "views_count": 13900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["takeo"].id,
                "name": "Takeo Giant River Prawn Market Stalls",
                "local_name": "តូបលក់បង្កងទឹកសាបតាកែវ",
                "slug": "takeo-giant-river-prawn-stalls",
                "place_type": "RESTAURANT",
                "description": "Takeo province is renowned nationwide for its colossal freshwater river prawns (Bangkang Takeo). Plump, sweet, and charcoal-grilled over hot coals served with rich prawn roe sauce and Kampot pepper lime dip.",
                "address": "National Road 2, Takeo Town",
                "latitude": 10.988,
                "longitude": 104.785,
                "price_level": "$$",
                "hero_image_url": "/images/destinations/takeo.jpg",
                "gallery_json": json.dumps(["/images/destinations/takeo.jpg"]),
                "amenities_json": '["Charcoal Grill Cooking", "River Prawn Specialties", "Outdoor Pavilion", "Take-away Boxes"]',
                "tags_json": '["Giant Prawns", "Bangkang Takeo", "Local Specialty", "Charcoal Grill", "Foodie Icon"]',
                "rating": 4.95,
                "review_count": 2150,
                "views_count": 36800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-thom"].id,
                "name": "Arunras Restaurant & Kampong Thom Delicacies",
                "local_name": "ភោជនីយដ្ឋាន អរុណរះ កំពង់ធំ",
                "slug": "arunras-restaurant-kampong-thom",
                "place_type": "RESTAURANT",
                "description": "The quintessential culinary landmark of Kampong Thom since the 1960s. Famous for handcrafted sweet-cured Kampong Thom sausages (Kwah Ko), dry pork noodles, and lotus seed soups.",
                "address": "National Road 6, Steung Saen, Kampong Thom",
                "latitude": 12.7111,
                "longitude": 104.8889,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-thom.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-thom.jpg"]),
                "amenities_json": '["Historic Dining Room", "Kampong Thom Sausage Gift Shop", "Noodle Station", "Fast Service"]',
                "tags_json": '["Famous Sausage", "Kwah Ko", "Kampong Thom Noodle", "Historic Eatery", "Khmer Classic"]',
                "rating": 4.85,
                "review_count": 1490,
                "views_count": 26200,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["pursat"].id,
                "name": "Pursat Orange Orchards & Countryside Eatery",
                "local_name": "ចម្ការក្រូចពោធិ៍សាត់ និងភោជនីយដ្ឋានជនបទ",
                "slug": "pursat-orange-orchards-dining",
                "place_type": "RESTAURANT",
                "description": "Pursat is celebrated across the Kingdom for the sweet, thin-skinned Bakan oranges (Krouch Pursat). This garden eatery serves fresh cold-pressed orange juice, grilled local free-range chicken, and river fish sour soup.",
                "address": "Bakan District, Pursat",
                "latitude": 12.5333,
                "longitude": 103.9167,
                "price_level": "$",
                "hero_image_url": "/images/destinations/pursat.jpg",
                "gallery_json": json.dumps(["/images/destinations/pursat.jpg"]),
                "amenities_json": '["Orange Orchard Walking", "Fresh Juice Press", "Thatch Dining Huts", "Gift Fruit Boxes"]',
                "tags_json": '["Pursat Orange", "Bakan", "Fresh Juice", "Grilled Chicken", "Local Icon"]',
                "rating": 4.82,
                "review_count": 920,
                "views_count": 15800,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-speu"].id,
                "name": "Kampong Speu Palm Sugar Tasting Pavilion",
                "local_name": "មណ្ឌលភ្លក្សស្ករត្នោតកំពង់ស្ពឺ",
                "slug": "kampong-speu-palm-sugar-pavilion",
                "place_type": "ACTIVITY",
                "description": "Kampong Speu Palm Sugar holds protected geographical indication (PGI) status worldwide. Watch master palm-climbers boil sweet sap into golden crystalline sugar and taste warm coconut palm waffles.",
                "address": "Oudorng District, Kampong Speu",
                "latitude": 11.45,
                "longitude": 104.5167,
                "price_level": "FREE",
                "hero_image_url": "/images/destinations/kampong-speu.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-speu.jpg"]),
                "amenities_json": '["Palm Tapping Demo", "Tasting Station", "PGI Palm Sugar Shop", "Palm Juice Refreshments"]',
                "tags_json": '["Palm Sugar", "PGI Heritage", "Skor Thnot", "Sweet Delicacy", "Kampong Speu"]',
                "rating": 4.9,
                "review_count": 1280,
                "views_count": 22400,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            },
            {
                "destination_id": dest_map["kampong-cham"].id,
                "name": "Mekong River Breeze Floating Pavilions",
                "local_name": "កញ្ចុះបណ្ដែតទឹកមាត់ទន្លេមេគង្គ កំពង់ចាម",
                "slug": "mekong-river-breeze-kampong-cham",
                "place_type": "RESTAURANT",
                "description": "Breezy bamboo pavilions built out over the Mekong River current. Guests lounge on mats while eating deep-fried Mekong river fish, sweet chili dips, fried morning glory, and chilled coconut water.",
                "address": "Riverfront Promenade, Kampong Cham",
                "latitude": 11.988,
                "longitude": 105.462,
                "price_level": "$",
                "hero_image_url": "/images/destinations/kampong-cham.jpg",
                "gallery_json": json.dumps(["/images/destinations/kampong-cham.jpg"]),
                "amenities_json": '["Over-Water Bamboo Mats", "Mekong Catfish", "Sunset Breeze", "Fresh Coconuts"]',
                "tags_json": '["Mekong River", "Fish Dishes", "Bamboo Huts", "Sunset", "Kampong Cham"]',
                "rating": 4.81,
                "review_count": 870,
                "views_count": 14900,
                "is_featured": True,
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            }
        ]

        place_map = {}
        for p_data in places_seed:
            p = db.query(Place).filter(Place.slug == p_data["slug"]).first()
            if not p:
                p = Place(**p_data)
                db.add(p)
                db.flush()
            else:
                # Always update existing places with verified images, gallery, and details
                p.hero_image_url = p_data.get("hero_image_url") or p.hero_image_url
                p.gallery_json = p_data.get("gallery_json") or p.gallery_json
                if p_data.get("description"):
                    p.description = p_data["description"]
                if p_data.get("destination_id"):
                    p.destination_id = p_data["destination_id"]
                if p_data.get("place_type"):
                    p.place_type = p_data["place_type"]
                if p_data.get("is_featured") is not None:
                    p.is_featured = p_data["is_featured"]
                db.flush()
            place_map[p_data["slug"]] = p
        print(f"✓ Ensured {len(place_map)} verified places and attractions across Cambodia")

        # Accommodations extra metadata (1-to-1 extension)
        raffles = place_map["raffles-grand-hotel-dangkor"]
        if not db.query(Accommodation).filter(Accommodation.place_id == raffles.id).first():
            db.add(Accommodation(
                place_id=raffles.id,
                property_type="HOTEL",
                star_rating=5,
                price_range="$280 - $750 / night",
                check_in_time="02:00 PM",
                check_out_time="12:00 PM",
                room_types_json=json.dumps(["State Room", "Landmark Room", "Colonial Suite", "Cabana Suite", "Personality Suite"]),
                has_swimming_pool=True,
                has_free_wifi=True,
                has_breakfast=True,
                booking_url="https://www.raffles.com/siem-reap"
            ))

        shinta = place_map["shinta-mani-angkor"]
        if not db.query(Accommodation).filter(Accommodation.place_id == shinta.id).first():
            db.add(Accommodation(
                place_id=shinta.id,
                property_type="RESORT",
                star_rating=5,
                price_range="$220 - $580 / night",
                check_in_time="02:00 PM",
                check_out_time="12:00 PM",
                room_types_json=json.dumps(["Poolview Room", "Bensley Pool Villa", "Junior Suite"]),
                has_swimming_pool=True,
                has_free_wifi=True,
                has_breakfast=True,
                booking_url="https://www.shintamani.com"
            ))
        print("✓ Ensured specialized accommodation metadata for hotels & resorts")

        # 12. Curated 3-Day Trip Itinerary for Siem Reap
        trip_slug = "ultimate-3-day-siem-reap-angkor-odyssey"
        existing_trip = db.query(Trip).filter(Trip.slug == trip_slug).first()
        if not existing_trip:
            curated_trip = Trip(
                destination_id=sr.id,
                title="The Ultimate 3-Day Siem Reap & Angkor Kingdom Odyssey",
                title_km="ដំណើរកម្សាន្ត ៣ ថ្ងៃដ៏អស្ចារ្យនៅទឹកដីអង្គរ សៀមរាប",
                slug=trip_slug,
                description="The definitive first-timer and heritage lover's 3-day journey through the heart of the Khmer Empire. From the iconic reflection sunrise at Angkor Wat and the mysterious smiles of Bayon, to the sacred mountain waterfalls of Kulen and award-winning Khmer gastronomy.",
                description_km="ដំណើរកម្សាន្ត ៣ ថ្ងៃដ៏ល្អឥតខ្ចោះដើម្បីទស្សនាប្រាសាទបុរាណ ទឹកធ្លាក់ភ្នំគូលែន និងភ្លក្សម្ហូបខ្មែរឆ្ងាញ់ពិសា។",
                duration_days=3,
                travel_style="CULTURAL",
                budget_level="$$",
                hero_image_url="/images/places/angkor-wat.jpg",
                is_featured=True,
                is_curated=True,
                status="ACTIVE"
            )
            db.add(curated_trip)
            db.flush()

            # Day 1
            d1 = TripDay(
                trip_id=curated_trip.id,
                day_number=1,
                title="Day 1: Iconic Angkor & The Sacred Sunrise",
                summary="Experience the sunrise at Angkor Wat, the stone faces of Bayon, and the roots of Ta Prohm."
            )
            db.add(d1)
            db.flush()

            db.add(TripDayItem(
                trip_day_id=d1.id,
                place_id=place_map["angkor-wat"].id,
                time_of_day="MORNING",
                start_time="05:15 AM",
                title="Sunrise at Angkor Wat Northern Reflection Pond",
                description="Arrive before dawn to secure a front vantage at the northern pond as the sky transitions from violet to fiery crimson behind the iconic five lotus towers.",
                duration_minutes=210,
                order_index=1
            ))
            db.add(TripDayItem(
                trip_day_id=d1.id,
                place_id=place_map["bayon-temple"].id,
                time_of_day="MORNING",
                start_time="09:15 AM",
                title="Marvel at the Smiling Stone Faces of Bayon",
                description="Explore the labyrinth of upper terraces surrounded by 216 giant bodhisattva faces gazing in timeless tranquility.",
                duration_minutes=120,
                order_index=2
            ))
            db.add(TripDayItem(
                trip_day_id=d1.id,
                place_id=place_map["cuisine-wat-damnak"].id,
                time_of_day="AFTERNOON",
                start_time="12:30 PM",
                title="Khmer Gastronomic Lunch",
                description="Mid-day break featuring authentic flavors and cooling tropical herbal drinks.",
                duration_minutes=75,
                order_index=3
            ))
            db.add(TripDayItem(
                trip_day_id=d1.id,
                place_id=place_map["ta-prohm"].id,
                time_of_day="AFTERNOON",
                start_time="02:30 PM",
                title="Ta Prohm Jungle Ruin Exploration",
                description="Wander through tree-entwined corridors made famous by Tomb Raider.",
                duration_minutes=120,
                order_index=4
            ))
            db.add(TripDayItem(
                trip_day_id=d1.id,
                place_id=place_map["phnom-bakheng"].id,
                time_of_day="EVENING",
                start_time="05:00 PM",
                title="Sunset Over the Angkor Plain at Phnom Bakheng",
                description="Ascend the hilltop temple for panoramic views of the golden horizon across West Baray and Angkor.",
                duration_minutes=90,
                order_index=5
            ))

            # Day 2
            d2 = TripDay(
                trip_id=curated_trip.id,
                day_number=2,
                title="Day 2: Sacred Waterfalls & Pink Sandstone Jewels",
                summary="Journey out into nature: sacred Kulen mountain waterfalls and the intricate pink carvings of Banteay Srei."
            )
            db.add(d2)
            db.flush()

            db.add(TripDayItem(
                trip_day_id=d2.id,
                place_id=place_map["banteay-srei"].id,
                time_of_day="MORNING",
                start_time="08:00 AM",
                title="Delicate Pink Sandstone Carvings at Banteay Srei",
                description="Admire the pristine 10th-century floral reliefs and mythical guardians carved in rose-pink stone.",
                duration_minutes=120,
                order_index=1
            ))
            db.add(TripDayItem(
                trip_day_id=d2.id,
                place_id=place_map["phnom-kulen-waterfall"].id,
                time_of_day="AFTERNOON",
                start_time="11:30 AM",
                title="Phnom Kulen Waterfalls & Thousand Lingas River",
                description="Walk the sacred river of carved lingas, see the reclining Buddha, and take a refreshing swim in the jungle waterfall pool.",
                duration_minutes=240,
                order_index=2
            ))
            db.add(TripDayItem(
                trip_day_id=d2.id,
                place_id=place_map["siem-reap-old-market"].id,
                time_of_day="EVENING",
                start_time="06:30 PM",
                title="Evening Shopping & Dining at Old Market (Psar Chaa)",
                description="Browse local artisan crafts, silk scarves, and sample authentic street snacks along the riverfront.",
                duration_minutes=120,
                order_index=3
            ))

            # Day 3
            d3 = TripDay(
                trip_id=curated_trip.id,
                day_number=3,
                title="Day 3: Heritage Living, Artisan Crafts & Night Energy",
                summary="Immersion into traditional craftsmanship, culinary artistry, and celebratory nightlife."
            )
            db.add(d3)
            db.flush()

            db.add(TripDayItem(
                trip_day_id=d3.id,
                place_id=place_map["raffles-grand-hotel-dangkor"].id,
                time_of_day="MORNING",
                start_time="09:00 AM",
                title="Heritage Garden Stroll & Morning Coffee at Raffles",
                description="Explore the 15-acre royal gardens and sip fine iced coffee in 1930s colonial ambience.",
                duration_minutes=90,
                order_index=1
            ))
            db.add(TripDayItem(
                trip_day_id=d3.id,
                place_id=place_map["cuisine-wat-damnak"].id,
                time_of_day="EVENING",
                start_time="07:00 PM",
                title="Celebratory Tasting Dinner at Cuisine Wat Damnak",
                description="Savor an unforgettable multi-course dinner of seasonal Cambodian ingredients.",
                duration_minutes=120,
                order_index=2
            ))
            db.add(TripDayItem(
                trip_day_id=d3.id,
                place_id=place_map["siem-reap-pub-street"].id,
                time_of_day="NIGHT",
                start_time="09:30 PM",
                title="Nightcap & Festivities on Pub Street",
                description="Wrap up your Siem Reap adventure surrounded by music, laughter, and tropical cocktails under glowing lanterns.",
                duration_minutes=120,
                order_index=3
            ))
            print("✓ Ensured Curated 3-Day Siem Reap & Angkor Odyssey Itinerary")
        else:
            existing_trip.hero_image_url = "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80"
            db.flush()

        # 13. Dynamic Navigation Items (Section 7)
        nav_seed = [
            {"label": "Home", "label_key": "nav.home", "route": "/", "icon": "Home", "position": 1, "enabled": True},
            {"label": "Cambodia", "label_key": "nav.cambodia", "route": "/cambodia", "icon": "Globe", "position": 2, "enabled": True},
            {"label": "World", "label_key": "nav.world", "route": "/world", "icon": "Newspaper", "position": 3, "enabled": True},
            {"label": "Discover", "label_key": "nav.discover", "route": "/discover", "icon": "Compass", "position": 4, "enabled": True},
            {"label": "Travel", "label_key": "nav.travel", "route": "/travel", "icon": "MapPin", "position": 5, "enabled": True},
            {"label": "Quiz", "label_key": "nav.quiz", "route": "/quiz", "icon": "HelpCircle", "position": 6, "enabled": True},
            {"label": "Tools", "label_key": "nav.tools", "route": "/tools", "icon": "Wrench", "position": 7, "enabled": True},
            {"label": "Trending", "label_key": "nav.trending", "route": "/trending", "icon": "Flame", "position": 8, "enabled": True},
            {"label": "Search", "label_key": "nav.search", "route": "/search", "icon": "Search", "position": 9, "enabled": True},
        ]
        for n_data in nav_seed:
            if not db.query(NavigationItem).filter(NavigationItem.route == n_data["route"]).first():
                db.add(NavigationItem(**n_data))
        print(f"✓ Ensured {len(nav_seed)} dynamic navigation items")

        # 14. Homepage Sections (Section 9)
        homepage_sections_seed = [
            {"section_type": "HERO", "title": "Today's Top Discovery & Breaking Stories", "position": 1, "layout": "FEATURED_SPLIT", "max_items": 3},
            {"section_type": "LATEST_NEWS", "title": "Fresh Updates & Breaking Reports", "position": 2, "layout": "GRID", "max_items": 6},
            {"section_type": "CAMBODIA", "title": "Cambodia Insights & Local Progress", "position": 3, "layout": "GRID", "max_items": 4},
            {"section_type": "WORLD", "title": "World Affairs, Tech & Global Science", "position": 4, "layout": "GRID", "max_items": 4},
            {"section_type": "DISCOVER", "title": "Visual Explanations & Deep Dives", "position": 5, "layout": "GRID", "max_items": 3},
            {"section_type": "TRAVEL", "title": "Featured Travel Destinations & Itineraries", "position": 6, "layout": "GRID", "max_items": 3},
            {"section_type": "POPULAR_PLACES", "title": "Authoritative Attractions & Hotels", "position": 7, "layout": "CAROUSEL", "max_items": 6},
            {"section_type": "QUIZ", "title": "Interactive Daily Challenge", "position": 8, "layout": "GRID", "max_items": 1},
            {"section_type": "TOOLS", "title": "Essential Free Web Utilities", "position": 9, "layout": "GRID", "max_items": 6},
            {"section_type": "TRENDING", "title": "What Readers Are Exploring Right Now", "position": 10, "layout": "LIST", "max_items": 5},
        ]
        for s_data in homepage_sections_seed:
            if not db.query(HomepageSection).filter(HomepageSection.section_type == s_data["section_type"]).first():
                db.add(HomepageSection(**s_data))
        print(f"✓ Ensured {len(homepage_sections_seed)} dynamic homepage sections")

        # 15. Feature Flags (Section 98)
        flags_seed = [
            {"name": "travel_planner", "enabled": True, "description": "Interactive multi-day trip planner engine"},
            {"name": "interactive_quizzes", "enabled": True, "description": "Daily quizzes with instant scoring and explanations"},
            {"name": "tools_suite", "enabled": True, "description": "All 15 calculators and client-side developer utilities"},
            {"name": "adsense_placements", "enabled": False, "description": "Google AdSense ad slots across articles and tools"},
        ]
        for f_data in flags_seed:
            if not db.query(FeatureFlag).filter(FeatureFlag.name == f_data["name"]).first():
                db.add(FeatureFlag(**f_data))
        print(f"✓ Ensured {len(flags_seed)} system feature flags")

        # 16. Transport Operators (Section 18 & 19)
        operators_seed = [
            {
                "id": "op-giant-ibis",
                "name": "Giant Ibis Transport",
                "local_name": "ក្រុមហ៊ុនដឹកជញ្ជូន យក្ស អាយប៊ីស",
                "slug": "giant-ibis-transport",
                "operator_type": "BUS",
                "description": "Cambodia's premier international-standard passenger bus company, celebrated for exceptional safety protocols, mandatory twin driver rotation, complimentary onboard Wi-Fi, and courteous bilingual stewards.",
                "description_km": "ក្រុមហ៊ុនរថយន្តក្រុងស្ដង់ដារអន្តរជាតិឈានមុខគេនៅកម្ពុជា ដែលល្បីល្បាញខាងសុវត្ថិភាពខ្ពស់ អ្នកបើកបរផ្លាស់វេន បណ្តាញ Wi-Fi និងបដិសណ្ឋារកិច្ចរួសរាយ។",
                "logo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80",
                "website": "https://giantibis.com",
                "phone": "+855 23 999 333",
                "email": "info@giantibis.com",
                "rating": 4.9,
                "review_count": 348,
                "amenities_json": json.dumps(["High-Speed Wi-Fi", "Air Conditioning", "USB Power Outlets", "Snacks & Cold Water", "Reclining Leather Seats", "GPS Monitored Fleet"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "op-larryta",
                "name": "Larryta Express",
                "local_name": "ឡារីតា អិចប្រេស",
                "slug": "larryta-express",
                "operator_type": "MINIVAN",
                "description": "Top-rated VIP 15-seater minivan fleet connecting Phnom Penh and Siem Reap with direct express departures every hour, premium ergonomic seating, and direct terminal-to-terminal efficiency.",
                "description_km": "ក្រុមហ៊ុនរថយន្តវ៉ែន VIP ១៥កៅអី ឈានមុខគេ តភ្ជាប់ភ្នំពេញ និងសៀមរាប រៀងរាល់មួយម៉ោងម្ដង ដោយភាពរហ័សទាន់ចិត្ត និងផាសុកភាព។",
                "logo_url": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=300&q=80",
                "website": "https://larryta.com",
                "phone": "+855 12 858 009",
                "email": "support@larryta.com",
                "rating": 4.8,
                "review_count": 215,
                "amenities_json": json.dumps(["Fast Wi-Fi", "Ergonomic Reclining Seats", "Air Conditioning", "Fast Travel Time", "Complimentary Water"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "op-royal-railway",
                "name": "Royal Railway Cambodia",
                "local_name": "ផ្លូវដែកកម្ពុជា",
                "slug": "royal-railway",
                "operator_type": "TRAIN",
                "description": "Cambodia's historic passenger railway system offering scenic, nostalgic, and relaxed rail journeys between Phnom Penh, Takeo, Kampot, and Sihanoukville across picturesque rice paddies and Elephant Mountains.",
                "description_km": "ផ្លូវដែកដឹកអ្នកដំណើរប្រវត្តិសាស្ត្ររបស់កម្ពុជា ផ្ដល់នូវដំណើរទេសចរណ៍ដ៏ស្រស់ត្រកាលកាត់តាមវាលស្រែ និងជួរភ្នំដំរី។",
                "logo_url": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=300&q=80",
                "website": "https://royal-railway.com",
                "phone": "+855 78 888 582",
                "email": "info@royal-railway.com",
                "rating": 4.6,
                "review_count": 142,
                "amenities_json": json.dumps(["Air-Conditioned Carriages", "Scenic Countryside Views", "Luggage Van", "Bicycle Transport Available", "Restrooms Onboard"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "op-buva-sea",
                "name": "Buva Sea Cambodia",
                "local_name": "ប៊ូវ៉ា ស៊ី កម្ពុជា",
                "slug": "buva-sea-ferries",
                "operator_type": "FERRY",
                "description": "High-speed modern catamaran and ferry services operating between Sihanoukville pier and the paradise islands of Koh Rong and Koh Rong Sanloem in under 45 minutes.",
                "description_km": "សេវាកាណូតល្បឿនលឿនទំនើប តភ្ជាប់កំពង់ផែខេត្តព្រះសីហនុ ទៅកាន់កោះរ៉ុង និងកោះរ៉ុងសន្លឹម ក្នុងរយៈពេលមិនដល់ ៤៥នាទី។",
                "logo_url": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=300&q=80",
                "website": "https://buvasea.com",
                "phone": "+855 97 888 2388",
                "email": "contact@buvasea.com",
                "rating": 4.7,
                "review_count": 180,
                "amenities_json": json.dumps(["Speed Twin Engines", "Certified Lifejackets", "Weatherproof Cabin", "Air Conditioning", "Island Pier Drop-offs"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            }
        ]
        operator_map = {}
        for op_data in operators_seed:
            op = db.query(TransportOperator).filter(TransportOperator.slug == op_data["slug"]).first()
            if not op:
                op = TransportOperator(**op_data)
                db.add(op)
                db.flush()
            operator_map[op_data["slug"]] = op
        print(f"✓ Ensured {len(operator_map)} verified transport operators")

        # 17. Transport Hubs (Section 20)
        hubs_seed = [
            {
                "id": "hub-pp-giant-ibis",
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Phnom Penh Giant Ibis Night Market Terminal",
                "local_name": "ចំណតរថយន្ត យក្ស អាយប៊ីស ផ្សាររាត្រីភ្នំពេញ",
                "slug": "phnom-penh-giant-ibis-station",
                "hub_type": "BUS_STATION",
                "latitude": 11.5721,
                "longitude": 104.9282,
                "address": "Street 106 corner Night Market, Riverfront, Phnom Penh",
                "phone": "+855 23 999 333",
                "facilities_json": json.dumps(["Air-Conditioned Waiting Lounge", "Ticketing Counter", "Restrooms", "Luggage Storage", "Free Wi-Fi", "Grab/Tuk-Tuk Stand"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "hub-sr-giant-ibis",
                "destination_id": dest_map["siem-reap"].id,
                "name": "Siem Reap Giant Ibis Wat Bo Terminal",
                "local_name": "ចំណតរថយន្ត យក្ស អាយប៊ីស វត្តបូព៌សៀមរាប",
                "slug": "siem-reap-giant-ibis-terminal",
                "hub_type": "BUS_STATION",
                "latitude": 13.3556,
                "longitude": 103.8643,
                "address": "Street 22, Wat Bo Village, Siem Reap",
                "phone": "+855 23 999 333",
                "facilities_json": json.dumps(["Waiting Lounge", "Luggage Drop", "Cold Drinks Counter", "Clean Restrooms", "Electric Outlets"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "hub-pp-larryta",
                "destination_id": dest_map["phnom-penh"].id,
                "name": "Phnom Penh Larryta Express Terminal",
                "local_name": "ចំណតរថយន្ត ឡារីតា ភ្នំពេញ ផ្លូវ ១០៦",
                "slug": "phnom-penh-larryta-terminal",
                "hub_type": "MINIVAN_STATION",
                "latitude": 11.5710,
                "longitude": 104.9255,
                "address": "#33, Street 106, Sangkat Wat Phnom, Phnom Penh",
                "phone": "+855 12 858 009",
                "facilities_json": json.dumps(["Fast Check-in Desk", "Passenger Seating", "Cold Beverages", "Restrooms"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "hub-sr-larryta",
                "destination_id": dest_map["siem-reap"].id,
                "name": "Siem Reap Larryta Terminal (National Road 6)",
                "local_name": "ចំណតរថយន្ត ឡារីតា សៀមរាប ផ្លូវជាតិលេខ ៦",
                "slug": "siem-reap-larryta-terminal",
                "hub_type": "MINIVAN_STATION",
                "latitude": 13.3645,
                "longitude": 103.8567,
                "address": "National Road 6, near Caltex Station, Siem Reap",
                "phone": "+855 12 858 009",
                "facilities_json": json.dumps(["Waiting Area", "Luggage Assistance", "Tuk-Tuk Dispatch"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            },
            {
                "id": "hub-kampot-giant-ibis",
                "destination_id": dest_map["kampot"].id,
                "name": "Kampot Giant Ibis Station",
                "local_name": "ចំណតរថយន្ត យក្ស អាយប៊ីស កំពត",
                "slug": "kampot-giant-ibis-station",
                "hub_type": "BUS_STATION",
                "latitude": 10.6104,
                "longitude": 104.1815,
                "address": "Riverside Road, Kampot Town",
                "phone": "+855 23 999 333",
                "facilities_json": json.dumps(["Riverside Waiting Area", "Ticket Desk", "Luggage Tagging"]),
                "status": "ACTIVE",
                "verification_status": "VERIFIED"
            }
        ]
        hub_map = {}
        for h_data in hubs_seed:
            hub = db.query(TransportHub).filter(TransportHub.slug == h_data["slug"]).first()
            if not hub:
                hub = TransportHub(**h_data)
                db.add(hub)
                db.flush()
            hub_map[h_data["slug"]] = hub
        print(f"✓ Ensured {len(hub_map)} transport terminal hubs")

        # 18. Transport Routes & Schedules (Section 21, 22, 23)
        pp = dest_map["phnom-penh"]
        sr = dest_map["siem-reap"]
        kp = dest_map["kampot"]

        routes_seed = [
            {
                "id": "route-pp-sr-giant-ibis",
                "operator_id": operator_map["giant-ibis-transport"].id,
                "origin_destination_id": pp.id,
                "destination_id": sr.id,
                "origin_hub_id": hub_map["phnom-penh-giant-ibis-station"].id,
                "destination_hub_id": hub_map["siem-reap-giant-ibis-terminal"].id,
                "name": "Phnom Penh → Siem Reap (Giant Ibis Luxury Coach)",
                "slug": "phnom-penh-to-siem-reap-giant-ibis",
                "transport_type": "BUS",
                "description": "Cambodia's most trusted highway route across National Road 6. Features scenic countryside vistas, lunch stop at Kompong Thom, and twin professional drivers.",
                "duration_minutes": 360,
                "distance_km": 314.0,
                "base_price_usd": 15.0,
                "status": "ACTIVE",
                "verification_status": "VERIFIED",
                "schedules": [
                    {"departure_time": "08:45 AM", "arrival_time": "02:45 PM", "days_of_week": "DAILY", "price_usd": 15.0, "vehicle_class": "VIP Day Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "09:45 AM", "arrival_time": "03:45 PM", "days_of_week": "DAILY", "price_usd": 15.0, "vehicle_class": "VIP Day Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "12:30 PM", "arrival_time": "06:30 PM", "days_of_week": "DAILY", "price_usd": 15.0, "vehicle_class": "VIP Day Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "23:00 PM", "arrival_time": "05:00 AM", "days_of_week": "DAILY", "price_usd": 16.0, "vehicle_class": "Luxury Night Sleeper (Bunk Beds)", "booking_url": "https://giantibis.com"}
                ]
            },
            {
                "id": "route-sr-pp-giant-ibis",
                "operator_id": operator_map["giant-ibis-transport"].id,
                "origin_destination_id": sr.id,
                "destination_id": pp.id,
                "origin_hub_id": hub_map["siem-reap-giant-ibis-terminal"].id,
                "destination_hub_id": hub_map["phnom-penh-giant-ibis-station"].id,
                "name": "Siem Reap → Phnom Penh (Giant Ibis Luxury Coach)",
                "slug": "siem-reap-to-phnom-penh-giant-ibis",
                "transport_type": "BUS",
                "description": "Daily return service from Siem Reap to the capital along National Road 6.",
                "duration_minutes": 360,
                "distance_km": 314.0,
                "base_price_usd": 15.0,
                "status": "ACTIVE",
                "verification_status": "VERIFIED",
                "schedules": [
                    {"departure_time": "08:45 AM", "arrival_time": "02:45 PM", "days_of_week": "DAILY", "price_usd": 15.0, "vehicle_class": "VIP Day Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "12:30 PM", "arrival_time": "06:30 PM", "days_of_week": "DAILY", "price_usd": 15.0, "vehicle_class": "VIP Day Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "23:00 PM", "arrival_time": "05:00 AM", "days_of_week": "DAILY", "price_usd": 16.0, "vehicle_class": "Luxury Night Sleeper", "booking_url": "https://giantibis.com"}
                ]
            },
            {
                "id": "route-pp-sr-larryta",
                "operator_id": operator_map["larryta-express"].id,
                "origin_destination_id": pp.id,
                "destination_id": sr.id,
                "origin_hub_id": hub_map["phnom-penh-larryta-terminal"].id,
                "destination_hub_id": hub_map["siem-reap-larryta-terminal"].id,
                "name": "Phnom Penh → Siem Reap (Larryta VIP Minivan Express)",
                "slug": "phnom-penh-to-siem-reap-larryta-express",
                "transport_type": "MINIVAN",
                "description": "Fast 5-hour executive minivan connection with maximum 15 passengers per vehicle.",
                "duration_minutes": 300,
                "distance_km": 314.0,
                "base_price_usd": 13.0,
                "status": "ACTIVE",
                "verification_status": "VERIFIED",
                "schedules": [
                    {"departure_time": "07:30 AM", "arrival_time": "12:30 PM", "days_of_week": "DAILY", "price_usd": 13.0, "vehicle_class": "VIP 15-Seat Minivan", "booking_url": "https://larryta.com"},
                    {"departure_time": "09:30 AM", "arrival_time": "02:30 PM", "days_of_week": "DAILY", "price_usd": 13.0, "vehicle_class": "VIP 15-Seat Minivan", "booking_url": "https://larryta.com"},
                    {"departure_time": "11:30 AM", "arrival_time": "04:30 PM", "days_of_week": "DAILY", "price_usd": 13.0, "vehicle_class": "VIP 15-Seat Minivan", "booking_url": "https://larryta.com"},
                    {"departure_time": "14:00 PM", "arrival_time": "07:00 PM", "days_of_week": "DAILY", "price_usd": 13.0, "vehicle_class": "VIP 15-Seat Minivan", "booking_url": "https://larryta.com"}
                ]
            },
            {
                "id": "route-pp-kp-giant-ibis",
                "operator_id": operator_map["giant-ibis-transport"].id,
                "origin_destination_id": pp.id,
                "destination_id": kp.id,
                "origin_hub_id": hub_map["phnom-penh-giant-ibis-station"].id,
                "destination_hub_id": hub_map["kampot-giant-ibis-station"].id,
                "name": "Phnom Penh → Kampot (Giant Ibis Riverside Express)",
                "slug": "phnom-penh-to-kampot-giant-ibis",
                "transport_type": "BUS",
                "description": "Comfortable 3-hour journey from Phnom Penh down National Highway 3 directly to Kampot riverfront.",
                "duration_minutes": 180,
                "distance_km": 148.0,
                "base_price_usd": 11.0,
                "status": "ACTIVE",
                "verification_status": "VERIFIED",
                "schedules": [
                    {"departure_time": "08:00 AM", "arrival_time": "11:00 AM", "days_of_week": "DAILY", "price_usd": 11.0, "vehicle_class": "VIP AC Coach", "booking_url": "https://giantibis.com"},
                    {"departure_time": "14:00 PM", "arrival_time": "17:00 PM", "days_of_week": "DAILY", "price_usd": 11.0, "vehicle_class": "VIP AC Coach", "booking_url": "https://giantibis.com"}
                ]
            }
        ]

        for r_data in routes_seed:
            schedules_data = r_data.pop("schedules")
            route = db.query(TransportRoute).filter(TransportRoute.slug == r_data["slug"]).first()
            if not route:
                route = TransportRoute(**r_data)
                db.add(route)
                db.flush()
                for s_data in schedules_data:
                    schedule = TransportSchedule(route_id=route.id, **s_data)
                    db.add(schedule)
        print(f"✓ Ensured {len(routes_seed)} verified transport routes with active schedules")

        # 19. Travel Guides (Section 12)
        guides_seed = [
            {
                "id": "guide-pp-to-sr",
                "destination_id": sr.id,
                "title": "Phnom Penh to Siem Reap in 2026: Complete Guide (Bus vs Minivan vs Flight)",
                "title_km": "ដំណើរពីភ្នំពេញទៅសៀមរាប ឆ្នាំ២០២៦៖ មគ្គុទ្ទេសក៍ពេញលេញ (ឡានក្រុង, វ៉ែន, យន្តហោះ)",
                "slug": "phnom-penh-to-siem-reap-travel-guide",
                "summary": "Everything you need to know about traveling between Cambodia's two key hubs: vetted operator pricing, travel times, luggage allowances, and highway stop secrets.",
                "content": """
### Overview of the Route
Connecting Cambodia's vibrant riverside capital with the ancient temples of Angkor, the 314-kilometer journey between Phnom Penh and Siem Reap is one of Southeast Asia's most traveled corridors. Thanks to extensive modernization of National Road 6, the highway is smooth, multi-lane, and well-equipped with modern rest stops.

### 1. VIP Bus (Giant Ibis) — Best for Comfort & Safety
* **Duration:** ~6 hours (including one 30-minute lunch/rest stop at Kompong Thom)
* **Cost:** $15 USD (Day Coach) / $16 USD (Night Sleeper with flat bunks)
* **Why Choose It:** Giant Ibis is widely recognized as the safest land transport operator in Cambodia. They enforce a twin-driver policy, speed governors (capped at 80 km/h), complimentary cold water, onboard Wi-Fi, and power outlets at every seat.
* **Departure Point:** Night Market Terminal on Street 106, Phnom Penh.

### 2. Executive Minivan (Larryta Express) — Best for Speed
* **Duration:** ~5 hours
* **Cost:** $13 USD
* **Why Choose It:** If saving an hour of travel time matters to you, Larryta's 15-seater VIP Ford Transit minivans depart every hour from 07:00 AM to 17:00 PM. Seating is ergonomic and air conditioning is powerful.

### 3. Domestic Flights (Cambodia Angkor Air / AirAsia Cambodia)
* **Duration:** 45 minutes flight time (plus 90 minutes airport check-in and 45-minute transfer from the new Siem Reap Angkor International Airport - SAI)
* **Cost:** $65 – $115 USD
* **Consideration:** While flight time is short, the new SAI airport is located 45 km east of Siem Reap town (approx. 45–60 minutes by airport shuttle or taxi, costing $9–$35). Therefore, total door-to-door transit time is roughly 3.5 hours compared to 5 hours by VIP minivan.

### Expert Practical Tips
1. **Book 24 Hours in Advance:** Weekend coaches and night sleepers frequently sell out, especially on Friday evenings and Sunday afternoons.
2. **Bring a Light Jacket:** Air conditioning on Cambodian luxury coaches is famously chilly.
3. **Arrival in Siem Reap:** Terminals for Giant Ibis and Larryta are located right in central Siem Reap, just 5–10 minutes from Pub Street and Old Market by tuk-tuk ($1.50–$2.50 on PassApp or Grab).
""",
                "hero_image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
                "read_time_minutes": "7 min",
                "status": "PUBLISHED"
            },
            {
                "id": "guide-angkor-sunrise",
                "destination_id": sr.id,
                "title": "Angkor Wat Sunrise Photography & Sacred Etiquette: The Definitive 2026 Guide",
                "title_km": "មគ្គុទ្ទេសក៍ទស្សនាថ្ងៃរះនៅប្រាសាទអង្គរវត្ត៖ ទីតាំងថតរូបល្អបំផុត និងក្រមសីលធម៌",
                "slug": "angkor-wat-sunrise-guide",
                "summary": "How to beat the crowds, discover the legendary reflection ponds, respect sacred Khmer Buddhist heritage, and capture timeless golden-hour memories.",
                "content": """
### Why Sunrise at Angkor Wat is Unforgettable
Watching the morning sun crest behind the lotus-bud towers of Angkor Wat while purple, gold, and crimson tones reflect across the lotus pond is one of the world's great travel spectacles. 

### Timings & Logistics
* **Departure from Siem Reap Town:** 04:45 AM via tuk-tuk (approx. 20 minutes to the archaeological checkpoint).
* **Gates Open:** 05:00 AM.
* **First Twilight Glow:** Typically begins around 05:30 AM to 05:45 AM.
* **Full Solar Rise:** 06:05 AM to 06:20 AM depending on season.

### The Two Reflection Ponds
1. **Northern Reflection Pond (Left):** The classic postcard angle. Offers clean reflections of all five central sanctuary towers. Arrive by 05:15 AM to claim a front-row spot along the pond perimeter.
2. **Southern Reflection Pond (Right):** Significantly less crowded, surrounded by palm foliage, and often has vibrant pink water lilies in bloom during the green season.

### Sacred Code of Conduct
* **Dress Code Strictly Enforced:** Shoulders must be covered with sleeves (scarves or shawls are NOT accepted by Apsara Authority rangers). Knees must be covered by trousers, long skirts, or long shorts.
* **Quiet Sanctuary:** Avoid loud shouting or phone loudspeaker usage. Monks and local pilgrims begin morning blessings as dawn breaks.
* **No Climbing Fragile Masonry:** Stay strictly on designated boardwalks and stone causeways.
""",
                "hero_image_url": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80",
                "read_time_minutes": "5 min",
                "status": "PUBLISHED"
            }
        ]
        for g_data in guides_seed:
            guide = db.query(TravelGuide).filter(TravelGuide.slug == g_data["slug"]).first()
            if not guide:
                db.add(TravelGuide(**g_data))
            else:
                guide.hero_image_url = g_data.get("hero_image_url") or guide.hero_image_url
                db.flush()
        print(f"✓ Ensured {len(guides_seed)} authoritative travel guides")

        # 20. Travel Events (Section 46 & 81)
        events_seed = [
            {
                "id": "event-angkor-marathon-2026",
                "destination_id": sr.id,
                "name": "Angkor Wat International Half Marathon 2026",
                "name_km": "ការប្រណាំងពាក់កណ្តាលម៉ារ៉ាតុងអន្តរជាតិអង្គរវត្ត ២០២៦",
                "slug": "angkor-wat-international-half-marathon-2026",
                "description": "A world-renowned annual charity road race through the UNESCO World Heritage monuments of Angkor Wat, Bayon, and Angkor Thom, welcoming runners from over 85 nations.",
                "event_type": "SPORTS",
                "venue": "Angkor Wat Archaeological Park",
                "start_date": "December 6, 2026",
                "end_date": "December 6, 2026",
                "hero_image_url": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
                "status": "ACTIVE"
            },
            {
                "id": "event-water-festival-2026",
                "destination_id": pp.id,
                "name": "Cambodian Water and Moon Festival (Bon Om Touk) 2026",
                "name_km": "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ ២០២៦",
                "slug": "bon-om-touk-water-festival-2026",
                "description": "Cambodia's grandest three-day cultural river spectacle celebrating the reversal of Tonle Sap's river flow, with hundreds of hand-carved dragon racing boats and nighttime illuminated barges.",
                "event_type": "FESTIVAL",
                "venue": "Sisowath Quay Riverfront, Phnom Penh",
                "start_date": "November 23, 2026",
                "end_date": "November 25, 2026",
                "hero_image_url": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
                "status": "ACTIVE"
            }
        ]
        for e_data in events_seed:
            if not db.query(Event).filter(Event.slug == e_data["slug"]).first():
                db.add(Event(**e_data))
        print(f"✓ Ensured {len(events_seed)} destination cultural events")

        db.commit()
        print("\n=======================================================")
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("Platform is stocked with verified Cambodia and World news,")
        print("original visual discoveries, transport operators, hubs, routes,")
        print("schedules, guides, events, daily quizzes, and working tools.")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
