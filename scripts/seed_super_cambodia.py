import sys
import os
import json
import uuid
import re

# Ensure apps/api path is in sys.path
sys.path.insert(0, os.path.abspath("apps/api"))

from app.common.database import SessionLocal
from app.models.location import Country, Destination
from app.models.place import Place

SUPER_PLACES = [
    # ━━━ 1. ODDAR MEANCHEY (ខេត្តឧត្តរមានជ័យ) ━━━
    {
        "dest_slug": "oddar-meanchey",
        "name": "Chong Sa-Ngam Border Market & Pass",
        "local_name": "ផ្សារច្រកទ្វារអន្តរជាតិជាំសាង៉ាំ",
        "slug": "chong-sa-ngam-border-market",
        "place_type": "MARKET",
        "description": "A bustling cross-border trading bazaar high on the Dângrêk escarpment. Famous for authentic northeastern Cambodian wild honey, handwoven silk kramas, tropical fruits, and scenic ridge vistas looking out toward the northern plains.",
        "address": "Choam Sangam Border Crossing, Anlong Veng, Oddar Meanchey",
        "latitude": 14.4170,
        "longitude": 103.9210,
        "price_level": "$",
        "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
        "rating": 4.65,
        "review_count": 310,
        "views_count": 6800,
        "is_featured": True
    },
    {
        "dest_slug": "oddar-meanchey",
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
        "rating": 4.70,
        "review_count": 280,
        "views_count": 5400,
        "is_featured": True
    },
    {
        "dest_slug": "oddar-meanchey",
        "name": "Pka Romdoul Country Restaurant",
        "local_name": "ភោជនីយដ្ឋាន ផ្ការំដួល សំរោង",
        "slug": "pka-romdoul-country-restaurant",
        "place_type": "RESTAURANT",
        "description": "A beloved local culinary landmark in Samraong serving authentic northern Khmer home cooking. Signature dishes include wood-charcoal roasted organic chicken, spicy river crab salad, and sour morning glory fish soup.",
        "address": "National Road 68, Samraong, Oddar Meanchey",
        "latitude": 14.1812,
        "longitude": 103.5140,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
        "rating": 4.80,
        "review_count": 420,
        "views_count": 8900,
        "is_featured": True
    },

    # ━━━ 2. PAILIN (ខេត្តប៉ៃលិន) ━━━
    {
        "dest_slug": "pailin",
        "name": "Goh-Ai Waterfall (O'Tavao Rapids)",
        "local_name": "ទឹកធ្លាក់អូរតាវ៉ៅ ប៉ៃលិន",
        "slug": "otavao-rapids-waterfall-pailin",
        "place_type": "WATERFALL",
        "description": "A cascading mountain stream and swimming oasis fed by the high peaks of the Cardamom Mountains. Surrounded by lush longan orchards, bamboo groves, and crystal-clear swimming pools with rustic riverside picnic huts.",
        "address": "Otavao Village, Pailin Municipality",
        "latitude": 12.8350,
        "longitude": 102.6350,
        "price_level": "$",
        "hero_image_url": "/images/destinations/pailin.jpg",
        "rating": 4.78,
        "review_count": 490,
        "views_count": 11200,
        "is_featured": True
    },
    {
        "dest_slug": "pailin",
        "name": "Pailin Ruby & Gemstone Bazaar",
        "local_name": "ផ្សារត្បូងទទឹមប៉ៃលិន",
        "slug": "pailin-gemstone-market",
        "place_type": "MARKET",
        "description": "Historic trade center famous across Southeast Asia for Pailin blue sapphires, rubies, and local minerals. Also features stalls selling sweet dried Pailin longans, forest cardamom, wild honeycomb, and Kola ethnic snacks.",
        "address": "Downtown Pailin Market Square",
        "latitude": 12.8510,
        "longitude": 102.6080,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/pailin.jpg",
        "rating": 4.72,
        "review_count": 610,
        "views_count": 14500,
        "is_featured": True
    },
    {
        "dest_slug": "pailin",
        "name": "Bamboo River Garden Restaurant",
        "local_name": "ភោជនីយដ្ឋាន សួនឬស្សីមាត់ស្ទឹងប៉ៃលិន",
        "slug": "bamboo-river-garden-pailin",
        "place_type": "RESTAURANT",
        "description": "An open-air garden eatery shaded by towering green bamboo along the cool Pailin river. Celebrated for Kola ethnic specialties, crispy whole river fish with tamarind dipping sauce, and stir-fried mountain shoots.",
        "address": "Stung Pailin Riverbank Road, Pailin",
        "latitude": 12.8480,
        "longitude": 102.6150,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/pailin.jpg",
        "rating": 4.82,
        "review_count": 520,
        "views_count": 9700,
        "is_featured": True
    },

    # ━━━ 3. PREAH VIHEAR (ខេត្តព្រះវិហារ) ━━━
    {
        "dest_slug": "preah-vihear",
        "name": "Tbeng Meanchey City Park & Night Market",
        "local_name": "សួនច្បារត្បែងមានជ័យ និងផ្សាររាត្រី",
        "slug": "tbeng-meanchey-night-market",
        "place_type": "MARKET",
        "description": "The lively evening social heart of Preah Vihear province. Features night food vendors, outdoor seating, traditional roasted duck, tropical sugarcane press carts, and welcoming northern hospitality.",
        "address": "Independence Boulevard, Tbeng Meanchey",
        "latitude": 13.8050,
        "longitude": 104.9810,
        "price_level": "$",
        "hero_image_url": "/images/destinations/preah-vihear.jpg",
        "rating": 4.68,
        "review_count": 390,
        "views_count": 7800,
        "is_featured": True
    },
    {
        "dest_slug": "preah-vihear",
        "name": "Green Mountain Terrace Restaurant",
        "local_name": "ភោជនីយដ្ឋាន ភ្នំបៃតង ព្រះវិហារ",
        "slug": "green-mountain-terrace-preah-vihear",
        "place_type": "RESTAURANT",
        "description": "Panoramic country restaurant with scenic mountain vistas serving hearty Cambodian dishes. Renowned for roasted farm chicken with spicy lime dip, wild pepper beef stir-fry, and lemongrass soup.",
        "address": "National Road 62, Tbeng Meanchey, Preah Vihear",
        "latitude": 13.8090,
        "longitude": 104.9750,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/preah-vihear.jpg",
        "rating": 4.81,
        "review_count": 480,
        "views_count": 9100,
        "is_featured": True
    },

    # ━━━ 4. PREY VENG (ខេត្តព្រៃវែង) ━━━
    {
        "dest_slug": "prey-veng",
        "name": "Prey Veng Lake & Promenade",
        "local_name": "ផ្លូវដើរមាត់បឹងស្នេហ៍ ព្រៃវែង",
        "slug": "prey-veng-lake-promenade",
        "place_type": "ATTRACTION",
        "description": "A picturesque waterfront promenade hugging Boeung Snae marshland sanctuary. Beloved for serene sunset walks, jogging paths, bird watching, and fresh evening breezes over the vast wetland.",
        "address": "Lakeside Boulevard, Prey Veng City",
        "latitude": 11.4850,
        "longitude": 105.3280,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/prey-veng.jpg",
        "rating": 4.75,
        "review_count": 360,
        "views_count": 6900,
        "is_featured": True
    },
    {
        "dest_slug": "prey-veng",
        "name": "Phsar Thom Prey Veng Central Market",
        "local_name": "ផ្សារធំខេត្តព្រៃវែង",
        "slug": "phsar-thom-prey-veng-market",
        "place_type": "MARKET",
        "description": "A bustling provincial market renowned across Cambodia for authentic Prey Veng crispy rice pancakes (Banh Chhav), freshwater dried fish, artisanal wicker basketry, and sweet coconut milk puddings.",
        "address": "Street 10, Prey Veng City",
        "latitude": 11.4865,
        "longitude": 105.3260,
        "price_level": "$",
        "hero_image_url": "/images/destinations/prey-veng.jpg",
        "rating": 4.70,
        "review_count": 410,
        "views_count": 8200,
        "is_featured": True
    },
    {
        "dest_slug": "prey-veng",
        "name": "Boeung Snae Community Floating Eatery",
        "local_name": "ភោជនីយដ្ឋានសហគមន៍បឹងស្នេហ៍",
        "slug": "boeung-snae-floating-eatery",
        "place_type": "RESTAURANT",
        "description": "Overwater dining pavilions built on wooden boardwalks over Boeung Snae lake. Specializes in sour fish head soup with tamarind leaves, whole grilled snakehead fish, and organic lotus root salads.",
        "address": "Boeung Snae Nature Reserve, Prey Veng",
        "latitude": 11.4520,
        "longitude": 105.3610,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/prey-veng.jpg",
        "rating": 4.83,
        "review_count": 520,
        "views_count": 10400,
        "is_featured": True
    },

    # ━━━ 5. PURSAT (ខេត្តពោធិ៍សាត់) ━━━
    {
        "dest_slug": "pursat",
        "name": "Kompong Luong Floating Village",
        "local_name": "ភូមិបណ្ដែតទឹកកំពង់ហ្លួង",
        "slug": "kompong-luong-floating-village",
        "place_type": "ATTRACTION",
        "description": "A remarkable floating community on the Tonle Sap lake home to thousands of residents. Features floating schools, pagoda temples, grocery boats, repair shops, and peaceful boat tours through the watery avenues.",
        "address": "Krakor District, Tonle Sap Lake, Pursat",
        "latitude": 12.5930,
        "longitude": 104.2050,
        "price_level": "$",
        "hero_image_url": "/images/destinations/pursat.jpg",
        "rating": 4.85,
        "review_count": 680,
        "views_count": 16200,
        "is_featured": True
    },
    {
        "dest_slug": "pursat",
        "name": "Pursat Riverfront & Marble Carving Center",
        "local_name": "ផ្សារចម្លាក់ថ្មម៉ាប និងមាត់ស្ទឹងពោធិ៍សាត់",
        "slug": "pursat-marble-carving-center",
        "place_type": "MARKET",
        "description": "Cambodia's capital of marble sculpting. Watch master carvers sculpt Buddha statues and apsaras from Cardamom Mountain soapstone and marble, alongside relaxed riverfront street food stalls.",
        "address": "Pursat River Embankment Road, Pursat City",
        "latitude": 12.5350,
        "longitude": 103.9180,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/pursat.jpg",
        "rating": 4.77,
        "review_count": 510,
        "views_count": 9800,
        "is_featured": True
    },

    # ━━━ 6. RATANAKIRI (ខេត្តរតនគិរី) ━━━
    {
        "dest_slug": "ratanakiri",
        "name": "Ka Chanh Waterfall",
        "local_name": "ទឹកធ្លាក់កាចាញ",
        "slug": "ka-chanh-waterfall-ratanakiri",
        "place_type": "WATERFALL",
        "description": "A magnificent 12-meter waterfall cascading over basalt volcanic columns into a crystal-clear jungle pool. Features a suspension bridge over the gorge, lush rubber groves, and breezy nature walkways.",
        "address": "Ka Chanh Commune, Banlung, Ratanakiri",
        "latitude": 13.7050,
        "longitude": 106.9850,
        "price_level": "$",
        "hero_image_url": "/images/destinations/ratanakiri.jpg",
        "rating": 4.80,
        "review_count": 620,
        "views_count": 13800,
        "is_featured": True
    },
    {
        "dest_slug": "ratanakiri",
        "name": "Banlung Central Market (Phsar Banlung)",
        "local_name": "ផ្សារបានលុង",
        "slug": "banlung-central-market",
        "place_type": "MARKET",
        "description": "A cultural crossroads where indigenous Tampuan, Kreung, and Jarai communities trade wild volcanic honey, hand-harvested robusta coffee beans, woven bamboo baskets, and local gemstones.",
        "address": "Center of Banlung City, Ratanakiri",
        "latitude": 13.7430,
        "longitude": 106.9870,
        "price_level": "$",
        "hero_image_url": "/images/destinations/ratanakiri.jpg",
        "rating": 4.72,
        "review_count": 540,
        "views_count": 11500,
        "is_featured": True
    },

    # ━━━ 7. STUNG TRENG (ខេត្តស្ទឹងត្រែង) ━━━
    {
        "dest_slug": "stung-treng",
        "name": "Thala Barivat Ancient Pre-Angkorian Shrines",
        "local_name": "រមណីយដ្ឋានប្រាសាទថាឡាបារីវ៉ាត់",
        "slug": "thala-barivat-ancient-temples",
        "place_type": "TEMPLE",
        "description": "Pre-Angkorian 7th-century Chenla brick temples shaded by ancient tropical teak trees near where the Sekong and Mekong rivers converge. Peaceful, spiritual, and rich in ancient archaeological history.",
        "address": "Thala Barivat District, Stung Treng",
        "latitude": 13.5410,
        "longitude": 105.9550,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/stung-treng.jpg",
        "rating": 4.76,
        "review_count": 310,
        "views_count": 7200,
        "is_featured": True
    },
    {
        "dest_slug": "stung-treng",
        "name": "Sekong Riverfront Promenade & Night Food",
        "local_name": "ផ្លូវមាត់ទន្លេសេកុង និងតូបអាហាររាត្រី",
        "slug": "sekong-riverfront-promenade",
        "place_type": "MARKET",
        "description": "A panoramic palm-lined promenade along the Sekong river. Gather with friendly locals in the late afternoon for barbecued fresh river fish, cold sugarcane juice, and stunning golden sunsets over the water.",
        "address": "Riverside Boulevard, Stung Treng City",
        "latitude": 13.5260,
        "longitude": 105.9720,
        "price_level": "$",
        "hero_image_url": "/images/destinations/stung-treng.jpg",
        "rating": 4.74,
        "review_count": 420,
        "views_count": 8900,
        "is_featured": True
    },
    {
        "dest_slug": "stung-treng",
        "name": "Mekong River Fish Delight Restaurant",
        "local_name": "ភោជនីយដ្ឋាន ត្រីទន្លេមេគង្គ ស្ទឹងត្រែង",
        "slug": "mekong-river-fish-delight",
        "place_type": "RESTAURANT",
        "description": "The premier culinary destination in Stung Treng for authentic Mekong river dining. Renowned for sour soup with fresh river catfish, steamed river fish with ginger, and crisp wild greens.",
        "address": "Riverside Road, Stung Treng Town",
        "latitude": 13.5240,
        "longitude": 105.9690,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/stung-treng.jpg",
        "rating": 4.84,
        "review_count": 490,
        "views_count": 9600,
        "is_featured": True
    },

    # ━━━ 8. SVAY RIENG (ខេត្តស្វាយរៀង) ━━━
    {
        "dest_slug": "svay-rieng",
        "name": "Waiko River Park & Esplanade",
        "local_name": "សួនច្បារមាត់ព្រែកវ៉ៃគោ ស្វាយរៀង",
        "slug": "waiko-river-park-esplanade",
        "place_type": "ATTRACTION",
        "description": "A scenic modern riverfront park with dancing water fountains, walking paths, lotus ponds, and riverboat cruises in the heart of Svay Rieng city. Popular for morning jogging and evening sunset socializing.",
        "address": "Waiko Riverbank, Svay Rieng City",
        "latitude": 11.0870,
        "longitude": 105.8010,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/svay-rieng.jpg",
        "rating": 4.71,
        "review_count": 340,
        "views_count": 6500,
        "is_featured": True
    },
    {
        "dest_slug": "svay-rieng",
        "name": "Bavet International Border Market",
        "local_name": "ផ្សារព្រំដែនបាវិត",
        "slug": "bavet-border-market",
        "place_type": "MARKET",
        "description": "A bustling cross-border trading zone and commercial bazaar near the Vietnam international border. Packed with regional food, fashion, tropical dried fruits, and vibrant street life.",
        "address": "National Highway 1, Bavet, Svay Rieng",
        "latitude": 11.0770,
        "longitude": 106.1480,
        "price_level": "$",
        "hero_image_url": "/images/destinations/svay-rieng.jpg",
        "rating": 4.67,
        "review_count": 450,
        "views_count": 10200,
        "is_featured": True
    },
    {
        "dest_slug": "svay-rieng",
        "name": "Mlob Dong River View Restaurant",
        "local_name": "ភោជនីយដ្ឋាន ម្លប់ដូងមាត់ព្រែក",
        "slug": "mlob-dong-river-restaurant-svay-rieng",
        "place_type": "RESTAURANT",
        "description": "Thatched riverside dining huts along the tranquil Waiko river. Famous for Svay Rieng crispy pork belly, grilled giant freshwater prawns with lime pepper sauce, and sour morning glory fish soup.",
        "address": "Waiko River Promenade, Svay Rieng",
        "latitude": 11.0890,
        "longitude": 105.7980,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/svay-rieng.jpg",
        "rating": 4.80,
        "review_count": 380,
        "views_count": 7800,
        "is_featured": True
    },

    # ━━━ 9. TAKEO (ខេត្តតាកែវ) ━━━
    {
        "dest_slug": "takeo",
        "name": "Phnom Chisor Ancient Mountain Temple",
        "local_name": "ប្រាសាទភ្នំជីសូរ",
        "slug": "phnom-chisor-temple",
        "place_type": "TEMPLE",
        "description": "An 11th-century Angkorian hilltop sanctuary built by King Suryavarman I atop a 130-meter limestone hill. The 412 stone steps lead to remarkably preserved carved lintels and a breathtaking 360-degree vista over Takeo's rice paddies.",
        "address": "Samraong District, Takeo Province",
        "latitude": 11.0370,
        "longitude": 104.8580,
        "price_level": "$",
        "hero_image_url": "/images/destinations/takeo.jpg",
        "rating": 4.88,
        "review_count": 890,
        "views_count": 21500,
        "is_featured": True
    },
    {
        "dest_slug": "takeo",
        "name": "Tonle Bati & Ta Prohm of Takeo",
        "local_name": "ទន្លេបាទី និងប្រាសាទតាព្រហ្មតាកែវ",
        "slug": "tonle-bati-ta-prohm-takeo",
        "place_type": "ATTRACTION",
        "description": "A beloved weekend lakeside getaway featuring overwater wooden picnic cabanas alongside the atmospheric 12th-century laterite temple of Ta Prohm built by King Jayavarman VII.",
        "address": "Bati District, Takeo Province",
        "latitude": 11.3320,
        "longitude": 104.8390,
        "price_level": "$",
        "hero_image_url": "/images/destinations/takeo.jpg",
        "rating": 4.79,
        "review_count": 760,
        "views_count": 18400,
        "is_featured": True
    },

    # ━━━ 10. TBOUNG KHMUM (ខេត្តត្បូងឃ្មុំ) ━━━
    {
        "dest_slug": "tboung-khmum",
        "name": "Preah Theat Teuk Chhar Ancient Springs & Sanctuary",
        "local_name": "រមណីយដ្ឋានប្រាសាទព្រះធាតុទឹកឆា",
        "slug": "preah-theat-teuk-chhar-springs",
        "place_type": "TEMPLE",
        "description": "An ancient 11th-century temple complex constructed beside natural bubbling freshwater springs and cool swimming canals. Shaded by sacred trees, it is a treasured heritage and recreation site.",
        "address": "Krouch Chhmar District, Tboung Khmum",
        "latitude": 12.1850,
        "longitude": 105.4210,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/tboung-khmum.jpg",
        "rating": 4.78,
        "review_count": 390,
        "views_count": 8400,
        "is_featured": True
    },
    {
        "dest_slug": "tboung-khmum",
        "name": "Suong Central Trade Bazaar & Food Stalls",
        "local_name": "ផ្សារក្រុងសួង",
        "slug": "suong-central-market",
        "place_type": "MARKET",
        "description": "The bustling commercial nerve center of Tboung Khmum. Renowned for roasted organic cashews, sweet Koh Sotin pomelos, fresh durians, and authentic Cambodian rice noodles (Nom Banh Chok).",
        "address": "Suong City Center, Tboung Khmum",
        "latitude": 11.9160,
        "longitude": 105.6580,
        "price_level": "$",
        "hero_image_url": "/images/destinations/tboung-khmum.jpg",
        "rating": 4.71,
        "review_count": 480,
        "views_count": 9200,
        "is_featured": True
    },
    {
        "dest_slug": "tboung-khmum",
        "name": "Green Canopy Rubber Garden Restaurant",
        "local_name": "ភោជនីយដ្ឋាន ម្លប់កៅស៊ូ ត្បូងឃ្មុំ",
        "slug": "green-canopy-rubber-restaurant",
        "place_type": "RESTAURANT",
        "description": "A tranquil restaurant nestled under high rubber tree canopies near Suong. Specializes in country field duck claypot, green peppercorn beef, and sour bamboo shoot soup with local herbs.",
        "address": "National Road 7, near Suong, Tboung Khmum",
        "latitude": 11.9210,
        "longitude": 105.6450,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/tboung-khmum.jpg",
        "rating": 4.83,
        "review_count": 410,
        "views_count": 8700,
        "is_featured": True
    },

    # ━━━ 11. BANTEAY MEANCHEY (ខេត្តបន្ទាយមានជ័យ) ━━━
    {
        "dest_slug": "banteay-meanchey",
        "name": "Sisophon Hilltop Lookout & Cave Shrines",
        "local_name": "ភ្នំសិរីសោភ័ណ",
        "slug": "sisophon-hilltop-lookout",
        "place_type": "ATTRACTION",
        "description": "Limestone karst hill rising directly beside Sisophon town with cave hermitages, monkey sanctuaries, Buddhist shrines, and sweeping panoramic views across the rice plains to the Thai border.",
        "address": "Sisophon Municipality, Banteay Meanchey",
        "latitude": 13.5850,
        "longitude": 102.9730,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
        "rating": 4.73,
        "review_count": 420,
        "views_count": 9100,
        "is_featured": True
    },
    {
        "dest_slug": "banteay-meanchey",
        "name": "Sisophon Night Market & Street Food Square",
        "local_name": "ផ្សាររាត្រីសិរីសោភ័ណ",
        "slug": "sisophon-night-market",
        "place_type": "MARKET",
        "description": "The energetic evening gathering point for locals and travelers. Savor authentic northwest Cambodian street cuisine including grilled pork skewers, papaya salads, beef lok lak, and fruit shakes.",
        "address": "Downtown Sisophon Square, Banteay Meanchey",
        "latitude": 13.5880,
        "longitude": 102.9760,
        "price_level": "$",
        "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
        "rating": 4.70,
        "review_count": 510,
        "views_count": 10400,
        "is_featured": True
    },
    {
        "dest_slug": "banteay-meanchey",
        "name": "Ban Teay Cuisine & Garden Eatery",
        "local_name": "ភោជនីយដ្ឋាន បន្ទាយមានជ័យ",
        "slug": "banteay-cuisine-garden-eatery",
        "place_type": "RESTAURANT",
        "description": "Renowned provincial dining establishment with garden seating. Famous for crispy fried snakehead fish with green mango dip, authentic Cambodian sweet-and-sour soup, and roasted chicken.",
        "address": "National Highway 5, Sisophon, Banteay Meanchey",
        "latitude": 13.5910,
        "longitude": 102.9800,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/banteay-meanchey.jpg",
        "rating": 4.82,
        "review_count": 460,
        "views_count": 9700,
        "is_featured": True
    },

    # ━━━ 12. KAMPONG CHHNANG (ខេត្តកំពង់ឆ្នាំង) ━━━
    {
        "dest_slug": "kampong-chhnang",
        "name": "Phnom Neang Kang Rei Mountain",
        "local_name": "ភ្នំនាងកង្រី",
        "slug": "phnom-neang-kang-rei-mountain",
        "place_type": "ATTRACTION",
        "description": "A legendary mountain steeped in ancient Cambodian folklore, whose silhouette resembles a sleeping princess. Features scenic walking trails, hillside stupas, and grand lookouts over the Tonle Sap floodplains.",
        "address": "Kampong Tralach District, Kampong Chhnang",
        "latitude": 12.2680,
        "longitude": 104.6680,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
        "rating": 4.77,
        "review_count": 480,
        "views_count": 11300,
        "is_featured": True
    },
    {
        "dest_slug": "kampong-chhnang",
        "name": "Kampong Chhnang Waterfront Port & Market",
        "local_name": "កំពង់ផែក្រុងកំពង់ឆ្នាំង និងផ្សារមាត់ទឹក",
        "slug": "kampong-chhnang-waterfront-market",
        "place_type": "MARKET",
        "description": "Vibrant river trading port on the Tonle Sap. Wooden longboats arrive daily loaded with handmade earthenware pots, fresh river fish, lotus roots, and traditional sticky rice bamboo (Kralan).",
        "address": "Portside Esplanade, Kampong Chhnang City",
        "latitude": 12.2530,
        "longitude": 104.6720,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
        "rating": 4.74,
        "review_count": 520,
        "views_count": 12100,
        "is_featured": True
    },
    {
        "dest_slug": "kampong-chhnang",
        "name": "Sovann Phoum Claypot Kitchen",
        "local_name": "ភោជនីយដ្ឋាន សុវណ្ណភូមិឆ្នាំងដី",
        "slug": "sovann-phoum-claypot-kitchen",
        "place_type": "RESTAURANT",
        "description": "Authentic dining experience celebrating the province's claypot heritage. Traditional Khmer curries, fish amok, and braised pork ribs are slow-cooked in locally crafted earthenware pots over charcoal.",
        "address": "Riverside Road, Kampong Chhnang Town",
        "latitude": 12.2510,
        "longitude": 104.6650,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/kampong-chhnang.jpg",
        "rating": 4.85,
        "review_count": 580,
        "views_count": 13400,
        "is_featured": True
    },

    # ━━━ 13. KAMPONG SPEU (ខេត្តកំពង់ស្ពឺ) ━━━
    {
        "dest_slug": "kampong-speu",
        "name": "Phnom Aural Mountain Sanctuary",
        "local_name": "ដែនជម្រកសត្វព្រៃភ្នំឱរ៉ាល់",
        "slug": "phnom-aural-mountain-sanctuary",
        "place_type": "NATIONAL_PARK",
        "description": "Cambodia's highest peak reaching 1,813 meters above sea level. A haven of pristine biodiversity, evergreen moss-covered cloud forests, mountain streams, and multi-day eco-trekking expeditions.",
        "address": "Aural Wildlife Sanctuary, Kampong Speu",
        "latitude": 11.9830,
        "longitude": 104.1330,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-speu.jpg",
        "rating": 4.90,
        "review_count": 420,
        "views_count": 14500,
        "is_featured": True
    },
    {
        "dest_slug": "kampong-speu",
        "name": "Palm Sugar Village & Countryside Kitchen",
        "local_name": "ភូមិស្ករត្នោតកំពង់ស្ពឺ និងភោជនីយដ្ឋានស្រែ",
        "slug": "kampong-speu-palm-sugar-kitchen",
        "place_type": "RESTAURANT",
        "description": "Located in the heart of Cambodia's GI-certified palm sugar orchards. Watch traditional palm nectar boiling and taste mouthwatering country dishes glazed with pure golden palm sugar.",
        "address": "National Road 4, Kampong Speu",
        "latitude": 11.4550,
        "longitude": 104.5210,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/kampong-speu.jpg",
        "rating": 4.86,
        "review_count": 640,
        "views_count": 15200,
        "is_featured": True
    },

    # ━━━ 14. KAMPONG THOM (ខេត្តកំពង់ធំ) ━━━
    {
        "dest_slug": "kampong-thom",
        "name": "Phnom Santuk Holy Mountain & Reclining Buddhas",
        "local_name": "រមណីយដ្ឋានភ្នំសន្ទុក",
        "slug": "phnom-santuk-holy-mountain",
        "place_type": "TEMPLE",
        "description": "Sacred mountain ascended via 809 stone steps shaded by tropical forest. Features ancient sandstone reclining Buddha sculptures carved directly into living bedrock, pagoda stupas, and playful wild monkeys.",
        "address": "Santuk District, Kampong Thom",
        "latitude": 12.7980,
        "longitude": 105.0210,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-thom.jpg",
        "rating": 4.82,
        "review_count": 780,
        "views_count": 17900,
        "is_featured": True
    },
    {
        "dest_slug": "kampong-thom",
        "name": "Kampong Thom Riverfront Garden & Night Market",
        "local_name": "មាត់ស្ទឹងសែន និងផ្សាររាត្រីកំពង់ធំ",
        "slug": "kampong-thom-night-market",
        "place_type": "MARKET",
        "description": "Charming riverside esplanade along the Stung Sen river. Lined with evening food carts serving grilled dried beef, roasted river fish, crispy insect snacks, and fresh tropical fruit juices.",
        "address": "Stung Sen River Boulevard, Kampong Thom Town",
        "latitude": 12.7120,
        "longitude": 104.8870,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-thom.jpg",
        "rating": 4.73,
        "review_count": 510,
        "views_count": 11200,
        "is_featured": True
    },

    # ━━━ 15. KANDAL (ខេត្តកណ្តាល) ━━━
    {
        "dest_slug": "kandal",
        "name": "Oudong Mountain Ancient Royal Necropolis",
        "local_name": "ភ្នំព្រះរាជទ្រព្យ ឧដុង្គ",
        "slug": "oudong-mountain-royal-necropolis",
        "place_type": "TEMPLE",
        "description": "Historic royal capital of Cambodia from 1618 to 1866. A dramatic ridge crowned with monumental golden stupas preserving the sacred relics of ancient Khmer monarchs, surrounded by vast green floodplains.",
        "address": "Ponhea Leu District, Kandal Province",
        "latitude": 11.8190,
        "longitude": 104.7520,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kandal.jpg",
        "rating": 4.89,
        "review_count": 1340,
        "views_count": 29800,
        "is_featured": True
    },
    {
        "dest_slug": "kandal",
        "name": "Phnom Prasith Sacred Hill & Pagoda",
        "local_name": "ភ្នំប្រសិទ្ធិ",
        "slug": "phnom-prasith-sacred-hill",
        "place_type": "ATTRACTION",
        "description": "A picturesque dual-peak sacred hill with an ancient pre-Angkorian temple ruin on the southern peak and a vibrant Buddhist monastery on the northern peak, offering sweeping views over Kandal's lotus fields.",
        "address": "Chhvang Commune, Ponhea Leu, Kandal",
        "latitude": 11.6980,
        "longitude": 104.7920,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/kandal.jpg",
        "rating": 4.74,
        "review_count": 480,
        "views_count": 11500,
        "is_featured": True
    },
    {
        "dest_slug": "kandal",
        "name": "Oudong Royal Roasted Chicken & River Prawn Pavilions",
        "local_name": "តូបមាន់ដុត និងបង្កងទន្លេជើងភ្នំឧដុង្គ",
        "slug": "oudong-royal-roasted-chicken",
        "place_type": "RESTAURANT",
        "description": "The legendary roadside open-air dining pavilions at the foot of Oudong mountain. Renowned across the country for crispy wood-fired roasted free-range chicken, giant river prawns, and fragrant jasmine rice.",
        "address": "At the base of Phnom Oudong, National Road 5, Kandal",
        "latitude": 11.8150,
        "longitude": 104.7550,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/kandal.jpg",
        "rating": 4.88,
        "review_count": 1150,
        "views_count": 26400,
        "is_featured": True
    },

    # ━━━ 16. KRATIE (ខេត្តក្រចេះ) ━━━
    {
        "dest_slug": "kratie",
        "name": "Koh Trong Peaceful Sandbar Island",
        "local_name": "កោះទ្រង់ ក្រចេះ",
        "slug": "koh-trong-island-kratie",
        "place_type": "ATTRACTION",
        "description": "An idyllic motor-free island in the center of the Mekong river reached by wooden ferry. Rent a bicycle to ride the 9km shaded perimeter trail past organic pomelo groves, floating villages, and traditional wooden stilt houses.",
        "address": "Koh Trong Island, Kratie Province",
        "latitude": 12.4880,
        "longitude": 106.0120,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kratie.jpg",
        "rating": 4.86,
        "review_count": 720,
        "views_count": 17600,
        "is_featured": True
    },
    {
        "dest_slug": "kratie",
        "name": "Kratie Central Riverfront Night Bazaar",
        "local_name": "ផ្សាររាត្រីមាត់ទន្លេក្រចេះ",
        "slug": "kratie-riverfront-night-bazaar",
        "place_type": "MARKET",
        "description": "Atmospheric evening gathering on the Mekong riverbank. Famous for sweet Kratie pomelos, skewered grilled beef wrapped in betel leaves, sugarcane juice, and gorgeous sunsets over the Mekong.",
        "address": "Riverfront Walk, Kratie Town",
        "latitude": 12.4830,
        "longitude": 106.0170,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kratie.jpg",
        "rating": 4.75,
        "review_count": 490,
        "views_count": 10800,
        "is_featured": True
    },

    # ━━━ 17. KAMPOT (ខេត្តកំពត) ━━━
    {
        "dest_slug": "kampot",
        "name": "Kampot Night Market & Salt Worker Plaza",
        "local_name": "ផ្សាររាត្រីកំពត",
        "slug": "kampot-night-market",
        "place_type": "MARKET",
        "description": "A vibrant evening bazaar in central Kampot near the giant Durian statue. Discover locally produced Kampot black pepper, sea salt crystals, handmade linen clothing, artisan ice cream, and lively street food.",
        "address": "Near Durian Roundabout, Kampot City",
        "latitude": 10.6080,
        "longitude": 104.1790,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampot.jpg",
        "rating": 4.76,
        "review_count": 820,
        "views_count": 21300,
        "is_featured": True
    },

    # ━━━ 18. BATTAMBANG (ខេត្តបាត់ដំបង) ━━━
    {
        "dest_slug": "battambang",
        "name": "Psar Nat Art Deco Central Market",
        "local_name": "ផ្សារណាត់ បាត់ដំបង",
        "slug": "psar-nat-battambang-market",
        "place_type": "MARKET",
        "description": "Battambang's iconic 1930s French colonial Art Deco market in the heart of the heritage quarter. Packed with morning vendors selling Battambang rice noodles, sweet sticky corn cakes, fresh oranges, and aromatic coffee.",
        "address": "Street 1, Sangkat Svay Pao, Battambang",
        "latitude": 13.1020,
        "longitude": 103.1990,
        "price_level": "$",
        "hero_image_url": "/images/destinations/battambang.jpg",
        "rating": 4.78,
        "review_count": 940,
        "views_count": 23500,
        "is_featured": True
    },

    # ━━━ 19. KOH KONG (ខេត្តកោះកុង) ━━━
    {
        "dest_slug": "koh-kong",
        "name": "Koh Kong City Night Market & Waterfront",
        "local_name": "ផ្សាររាត្រីក្រុងខេមរភូមិន្ទ កោះកុង",
        "slug": "koh-kong-city-night-market",
        "place_type": "MARKET",
        "description": "A lively open-air market along the estuary waterfront looking toward Thai hills. Savor fresh Gulf of Thailand seafood, grilled mud crab with Kampot pepper, squid skewers, and refreshing coconut water.",
        "address": "Riverside Promenade, Khemarak Phoumin, Koh Kong",
        "latitude": 11.6160,
        "longitude": 102.9830,
        "price_level": "$",
        "hero_image_url": "/images/destinations/koh-kong.jpg",
        "rating": 4.72,
        "review_count": 520,
        "views_count": 12400,
        "is_featured": True
    }
]

def seed_super_places():
    db = SessionLocal()
    try:
        inserted = 0
        updated = 0
        
        # Build map of destinations
        dest_map = {d.slug: d for d in db.query(Destination).all()}
        
        for pdata in SUPER_PLACES:
            dest_slug = pdata["dest_slug"]
            destination = dest_map.get(dest_slug)
            if not destination:
                print(f"[WARN] Destination not found for slug: {dest_slug}")
                continue
                
            existing = db.query(Place).filter(Place.slug == pdata["slug"]).first()
            if existing:
                existing.name = pdata["name"]
                existing.local_name = pdata["local_name"]
                existing.place_type = pdata["place_type"]
                existing.description = pdata["description"]
                existing.address = pdata["address"]
                existing.latitude = pdata["latitude"]
                existing.longitude = pdata["longitude"]
                existing.price_level = pdata["price_level"]
                existing.hero_image_url = pdata["hero_image_url"]
                existing.rating = pdata["rating"]
                existing.review_count = pdata["review_count"]
                existing.views_count = pdata["views_count"]
                existing.status = "ACTIVE"
                updated += 1
            else:
                new_place = Place(
                    id=uuid.uuid4().hex,
                    destination_id=destination.id,
                    name=pdata["name"],
                    local_name=pdata["local_name"],
                    slug=pdata["slug"],
                    place_type=pdata["place_type"],
                    description=pdata["description"],
                    address=pdata["address"],
                    latitude=pdata["latitude"],
                    longitude=pdata["longitude"],
                    price_level=pdata["price_level"],
                    hero_image_url=pdata["hero_image_url"],
                    rating=pdata["rating"],
                    review_count=pdata["review_count"],
                    views_count=pdata["views_count"],
                    verification_status="GROUND_VERIFIED",
                    status="ACTIVE",
                    is_featured=pdata.get("is_featured", False)
                )
                db.add(new_place)
                inserted += 1
                
        db.commit()
        print(f"Super Places Seed Complete: {inserted} inserted, {updated} updated.")
        
        # Check distribution
        print("\n=== Current Place Distribution across all 25 Provinces ===")
        all_dests = db.query(Destination).order_by(Destination.name).all()
        for d in all_dests:
            places = db.query(Place).filter(Place.destination_id == d.id).all()
            print(f"{d.name} ({d.slug}): {len(places)} places -> {[p.place_type for p in places]}")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding super places: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_super_places()
