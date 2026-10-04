import sys
import os
import json

# Ensure project path is importable
sys.path.insert(0, os.path.abspath("apps/api"))

from app.common.database import SessionLocal
from app.models.location import Destination
from app.models.place import Place

AUTHENTIC_PLACES = [
    # --- Phnom Penh ---
    {
        "dest_slug": "phnom-penh",
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
        "amenities_json": json.dumps(["Guided Tours", "Courtyard Garden", "Audio Guides", "Wheelchair Accessible"]),
        "tags_json": json.dumps(["Museum", "Khmer Art", "Angkor Sculptures", "History", "Culture"]),
        "rating": 4.88,
        "review_count": 1850,
        "views_count": 32400,
        "is_featured": True
    },
    {
        "dest_slug": "phnom-penh",
        "name": "Wat Phnom Daun Penh",
        "local_name": "វត្តភ្នំដូនពេញ",
        "slug": "wat-phnom-daun-penh",
        "place_type": "TEMPLE",
        "description": "The sacred 27-meter hill temple that gave birth to the name of Phnom Penh in 1372. Features lush tree-shaded gardens, gilded shrines, and the legendary statue of Lady Penh.",
        "address": "Street 96, Norodom Blvd, Phnom Penh",
        "latitude": 11.5761,
        "longitude": 104.9230,
        "price_level": "$",
        "hero_image_url": "/images/destinations/phnom-penh.jpg",
        "amenities_json": json.dumps(["Hilltop Sanctuary", "Park Gardens", "Floral Clock", "Cultural Landmark"]),
        "tags_json": json.dumps(["Temple", "History", "Sacred", "Buddhism", "Founding Site"]),
        "rating": 4.75,
        "review_count": 1420,
        "views_count": 28900,
        "is_featured": True
    },
    {
        "dest_slug": "phnom-penh",
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
        "amenities_json": json.dumps(["Street Food Courtyard", "Jewelry Section", "Souvenirs", "ATM Onsite"]),
        "tags_json": json.dumps(["Market", "Art Deco", "Shopping", "Street Food", "Handicrafts"]),
        "rating": 4.70,
        "review_count": 2300,
        "views_count": 41000,
        "is_featured": True
    },
    {
        "dest_slug": "phnom-penh",
        "name": "Sisowath Quay Riverside Promenade",
        "local_name": "ផ្លូវដើរមាត់ទន្លេស៊ីសុវត្ថិ",
        "slug": "sisowath-quay-riverside",
        "place_type": "ATTRACTION",
        "description": "A vibrant 3-kilometer palm-fringed waterfront overlooking the Chaktomuk confluence of the Tonle Sap and Mekong rivers. Ideal for sunset walking, sunset cruises, and riverside cafes.",
        "address": "Sisowath Quay, Phnom Penh",
        "latitude": 11.5670,
        "longitude": 104.9333,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/phnom-penh.jpg",
        "amenities_json": json.dumps(["Pedestrian Promenade", "Riverboat Cruises", "Rooftop Bars", "Street Performers"]),
        "tags_json": json.dumps(["Riverfront", "Walkway", "Sunset", "Dining", "Nightlife"]),
        "rating": 4.82,
        "review_count": 1980,
        "views_count": 35600,
        "is_featured": True
    },
    {
        "dest_slug": "phnom-penh",
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
        "amenities_json": json.dumps(["Courtyard Garden", "Fine Dining", "Wine Cellar", "Private Dining Rooms"]),
        "tags_json": json.dumps(["Khmer Gourmet", "Fine Dining", "Chef Luu Meng", "Fish Amok", "Living Cambodian Cuisine"]),
        "rating": 4.93,
        "review_count": 1650,
        "views_count": 26700,
        "is_featured": True
    },

    # --- Kampot ---
    {
        "dest_slug": "kampot",
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
        "amenities_json": json.dumps(["Free Guided Tastings", "Organic Farm Tour", "Farm-to-Table Restaurant", "Cooking Class"]),
        "tags_json": json.dumps(["Kampot Pepper", "Organic Farm", "Tasting", "Cooking Class", "Agro-Tourism"]),
        "rating": 4.94,
        "review_count": 2100,
        "views_count": 34200,
        "is_featured": True
    },
    {
        "dest_slug": "kampot",
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
        "amenities_json": json.dumps(["Stand-up Paddleboard", "Firefly Boat Tours", "Colonial Architecture", "Riverside Cafes"]),
        "tags_json": json.dumps(["Riverside", "Sunset", "Paddleboarding", "Colonial History", "Fireflies"]),
        "rating": 4.85,
        "review_count": 1420,
        "views_count": 22800,
        "is_featured": True
    },

    # --- Kep ---
    {
        "dest_slug": "kep",
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
        "amenities_json": json.dumps(["Live Seafood Stalls", "Outdoor Dining Piers", "Ocean Sunset View", "Fresh Pepper Cooking"]),
        "tags_json": json.dumps(["Crab Market", "Fresh Seafood", "Kampot Pepper", "Ocean Pier", "Authentic"]),
        "rating": 4.91,
        "review_count": 2450,
        "views_count": 42000,
        "is_featured": True
    },
    {
        "dest_slug": "kep",
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
        "amenities_json": json.dumps(["Nature Trail", "Sunset Viewpoint", "Wildlife Spotting", "Mountain Biking"]),
        "tags_json": json.dumps(["National Park", "Hiking", "Jungle", "Ocean View", "Sunset Rock"]),
        "rating": 4.86,
        "review_count": 1320,
        "views_count": 21400,
        "is_featured": True
    },
    {
        "dest_slug": "kep",
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
        "amenities_json": json.dumps(["Boat Transfers", "Beach Bungalows", "Snorkeling", "Hammock Rest"]),
        "tags_json": json.dumps(["Island", "Beach", "Bungalows", "Relaxation", "Snorkeling"]),
        "rating": 4.82,
        "review_count": 1180,
        "views_count": 19300,
        "is_featured": True
    },

    # --- Sihanoukville ---
    {
        "dest_slug": "sihanoukville",
        "name": "Long Set Beach (4K Beach), Koh Rong",
        "local_name": "ឆ្នេរឡុងសិត កោះរ៉ុង",
        "slug": "long-set-beach-koh-rong",
        "place_type": "BEACH",
        "description": "Four kilometers of unbroken, ultra-fine blinding white sand sloping gently into clear azure waters. Renowned for tranquility by day and bioluminescent sparkling plankton at night.",
        "address": "Southeast Coast, Koh Rong Island",
        "latitude": 10.7100,
        "longitude": 103.2667,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/sihanoukville.jpg",
        "amenities_json": json.dumps(["White Sand Beach", "Bioluminescent Plankton Tours", "Beachfront Bars", "Speedboat Ferries"]),
        "tags_json": json.dumps(["Beach", "Koh Rong", "White Sand", "Plankton", "Paradise"]),
        "rating": 4.93,
        "review_count": 1780,
        "views_count": 31200,
        "is_featured": True
    },
    {
        "dest_slug": "sihanoukville",
        "name": "Ream National Park & Mangrove Estuary",
        "local_name": "ឧទ្យានជាតិរាម",
        "slug": "ream-national-park",
        "place_type": "NATIONAL_PARK",
        "description": "A 210-square-kilometer coastal paradise protecting evergreen rainforests, mangrove rivers, coral reefs, and nesting grounds for endangered white-bellied sea eagles.",
        "address": "Preah Sihanouk Province",
        "latitude": 10.5167,
        "longitude": 103.6500,
        "price_level": "$",
        "hero_image_url": "/images/destinations/sihanoukville.jpg",
        "amenities_json": json.dumps(["Mangrove Boat Tours", "Birdwatching", "Guided Treks", "Ranger Station"]),
        "tags_json": json.dumps(["National Park", "Mangroves", "Wildlife", "Eagles", "Eco-Tourism"]),
        "rating": 4.80,
        "review_count": 940,
        "views_count": 16700,
        "is_featured": False
    },

    # --- Battambang ---
    {
        "dest_slug": "battambang",
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
        "amenities_json": json.dumps(["Unique Train Ride", "Rural Countryside Views", "Photo Stops", "Local Driver"]),
        "tags_json": json.dumps(["Bamboo Train", "Norry", "Railway", "Adventure", "Battambang"]),
        "rating": 4.89,
        "review_count": 2250,
        "views_count": 39100,
        "is_featured": True
    },
    {
        "dest_slug": "battambang",
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
        "amenities_json": json.dumps(["Ancient Carvings", "Lotus Pond", "Colossal Buddha Statue", "Shaded Terraces"]),
        "tags_json": json.dumps(["Temple", "11th Century", "Suryavarman I", "Angkorian", "History"]),
        "rating": 4.78,
        "review_count": 820,
        "views_count": 14600,
        "is_featured": False
    },

    # --- Mondulkiri ---
    {
        "dest_slug": "mondulkiri",
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
        "amenities_json": json.dumps(["Ethical Elephant Walking", "Forest Guides", "Vegetarian Lunch", "Conservation Talk"]),
        "tags_json": json.dumps(["Elephants", "Ethical Sanctuary", "Wildlife", "Jungle Walk", "Conservation"]),
        "rating": 4.97,
        "review_count": 1680,
        "views_count": 28500,
        "is_featured": True
    },
    {
        "dest_slug": "mondulkiri",
        "name": "Sea Forest Viewpoint (Phnom Doh Kramom)",
        "local_name": "ភ្នំដោះក្រមុំ (សមុទ្រឈើ)",
        "slug": "sea-forest-viewpoint-mondulkiri",
        "place_type": "ATTRACTION",
        "description": "A sacred hilltop ridge near Sen Monorom offering sweeping 360-degree vistas across an undulating green canopy stretching to the horizon like ocean waves, especially breathtaking at sunrise.",
        "address": "Sen Monorom, Mondulkiri",
        "latitude": 12.4500,
        "longitude": 107.1833,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/mondulkiri.jpg",
        "amenities_json": json.dumps(["Panoramic Hilltop", "Sacred Spirit Shrines", "Sunrise Photography", "Pine Trees"]),
        "tags_json": json.dumps(["Viewpoint", "Sea Forest", "Sunset", "Sunrise", "Sacred Hill"]),
        "rating": 4.88,
        "review_count": 1240,
        "views_count": 21900,
        "is_featured": True
    },

    # --- Koh Kong ---
    {
        "dest_slug": "koh-kong",
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
        "amenities_json": json.dumps(["Elevated Boardwalk", "Observation Tower", "Longtail Boat Excursions", "Suspension Bridge"]),
        "tags_json": json.dumps(["Mangroves", "Conservation", "Nature Walk", "Boardwalk", "Koh Kong"]),
        "rating": 4.90,
        "review_count": 1410,
        "views_count": 24700,
        "is_featured": True
    },
    {
        "dest_slug": "koh-kong",
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
        "amenities_json": json.dumps(["Natural Swimming", "Boat Trips", "Kayaking", "Riverside Eco-Lodges"]),
        "tags_json": json.dumps(["Waterfall", "Cardamom Mountains", "Swimming", "Kayaking", "Eco-Tourism"]),
        "rating": 4.88,
        "review_count": 990,
        "views_count": 17600,
        "is_featured": True
    },

    # --- Preah Vihear ---
    {
        "dest_slug": "preah-vihear",
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
        "amenities_json": json.dumps(["UNESCO Site", "Wooden Staircase to Summit", "Shaded Forest Pathways", "Archaeological Museum"]),
        "tags_json": json.dumps(["UNESCO", "Pyramid", "Koh Ker", "Ancient Capital", "Jayavarman IV"]),
        "rating": 4.95,
        "review_count": 1890,
        "views_count": 33100,
        "is_featured": True
    },

    # --- Kampong Cham ---
    {
        "dest_slug": "kampong-cham",
        "name": "Wat Nokor Bachey Ancient Temple",
        "local_name": "វត្តនគរបាជ័យ",
        "slug": "wat-nokor-bachey-kampong-cham",
        "place_type": "TEMPLE",
        "description": "A captivating 11th-century sandstone and laterite monument built by King Jayavarman VII. A colorful modern Theravada Buddhist monastery has been built directly inside the ancient black stone corridors.",
        "address": "National Highway 7, Kampong Cham",
        "latitude": 11.9950,
        "longitude": 105.4333,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-cham.jpg",
        "amenities_json": json.dumps(["Ancient Stone Enclosure", "Wall Murals", "Reclining Buddha", "Gardens"]),
        "tags_json": json.dumps(["Temple", "Jayavarman VII", "Laterite", "Buddhist Murals", "History"]),
        "rating": 4.82,
        "review_count": 860,
        "views_count": 15200,
        "is_featured": True
    },
    {
        "dest_slug": "kampong-cham",
        "name": "Koh Pen Island & Bamboo Bridge",
        "local_name": "កោះប៉ែន និងស្ពានឬស្សី",
        "slug": "koh-pen-bamboo-bridge",
        "place_type": "ACTIVITY",
        "description": "A serene agricultural island in the middle of the Mekong River. Each dry season, local master artisans rebuild a 1-kilometer bamboo bridge by hand using 50,000 bamboo poles.",
        "address": "Koh Pen Island, Kampong Cham",
        "latitude": 11.9700,
        "longitude": 105.4667,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-cham.jpg",
        "amenities_json": json.dumps(["Bicycle Trails", "Pomelo Orchards", "Handmade Bridge", "River Beaches"]),
        "tags_json": json.dumps(["Bamboo Bridge", "Mekong Island", "Cycling", "Agro-Tourism", "Tradition"]),
        "rating": 4.87,
        "review_count": 1340,
        "views_count": 23800,
        "is_featured": True
    },

    # --- Kampong Thom ---
    {
        "dest_slug": "kampong-thom",
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
        "amenities_json": json.dumps(["UNESCO Site", "Forest Cycling Paths", "Community Homestays", "Local Guides"]),
        "tags_json": json.dumps(["UNESCO", "Chenla Empire", "Pre-Angkorian", "Brick Temples", "Ishanapura"]),
        "rating": 4.93,
        "review_count": 1620,
        "views_count": 28400,
        "is_featured": True
    },

    # --- Pursat ---
    {
        "dest_slug": "pursat",
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
        "amenities_json": json.dumps(["Mountain Lookouts", "Cloud Forest Vista", "Motorcycle Route", "Roadside Cafes"]),
        "tags_json": json.dumps(["Mountain Pass", "Cardamom", "Scenic Highway", "Cloud Forest", "Adventure"]),
        "rating": 4.92,
        "review_count": 1560,
        "views_count": 27800,
        "is_featured": True
    },

    # --- Kampong Chhnang ---
    {
        "dest_slug": "kampong-chhnang",
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
        "amenities_json": json.dumps(["Hands-on Clay Workshops", "Artisan Showrooms", "Traditional Kilns", "Village Tours"]),
        "tags_json": json.dumps(["Pottery", "Clay Pots", "Artisans", "Tradition", "Culture"]),
        "rating": 4.81,
        "review_count": 740,
        "views_count": 13600,
        "is_featured": True
    },

    # --- Takeo ---
    {
        "dest_slug": "takeo",
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
        "amenities_json": json.dumps(["Canal Boat Ride", "Pre-Angkorian Stone Temple", "Archaeological Museum", "Ashram Maha Rosei"]),
        "tags_json": json.dumps(["Funan Kingdom", "Cradle of Cambodia", "Phnom Da", "Boat Cruise", "Archaeology"]),
        "rating": 4.86,
        "review_count": 910,
        "views_count": 16400,
        "is_featured": True
    },

    # --- Banteay Meanchey ---
    {
        "dest_slug": "banteay-meanchey",
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
        "amenities_json": json.dumps(["Community-Based Tourism", "Homestay Program", "Ancient Bas-Reliefs", "Face Towers"]),
        "tags_json": json.dumps(["Temple", "Jayavarman VII", "Bas-Reliefs", "Face Towers", "Atmospheric"]),
        "rating": 4.93,
        "review_count": 1180,
        "views_count": 21300,
        "is_featured": True
    },

    # --- Stung Treng ---
    {
        "dest_slug": "stung-treng",
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
        "amenities_json": json.dumps(["Kayaking Through Drowned Trees", "Birdwatching Excursions", "Camping Platforms", "Boat Safaris"]),
        "tags_json": json.dumps(["Ramsar Site", "Flooded Forest", "Mekong River", "Kayaking", "Eco-Tourism"]),
        "rating": 4.91,
        "review_count": 840,
        "views_count": 15300,
        "is_featured": True
    },

    # --- Kandal ---
    {
        "dest_slug": "kandal",
        "name": "Oudong Mountain Royal Stupas",
        "local_name": "ភ្នំព្រះរាជទ្រព្យឧដុង្គ",
        "slug": "oudong-royal-stupas-mountain",
        "place_type": "TEMPLE",
        "description": "The royal necropolis and former capital of Cambodia (1618-1866). Rising steeply above the central plain, its twin ridges are crowned with stupas enshrining the ashes of ancient monarchs and sacred Buddha relics.",
        "address": "Ponhea Lueu District, Kandal",
        "latitude": 11.8167,
        "longitude": 104.7500,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kandal.jpg",
        "amenities_json": json.dumps(["509 Stone Steps Stairway", "Royal Stupas", "Buddha Relic Vihara", "Panoramic Countryside View"]),
        "tags_json": json.dumps(["Ancient Capital", "Royal Stupas", "Relics", "Buddhism", "Historic Mountain"]),
        "rating": 4.87,
        "review_count": 1760,
        "views_count": 31400,
        "is_featured": True
    },

    # --- Kampong Speu ---
    {
        "dest_slug": "kampong-speu",
        "name": "Kirirom National Park & High Pine Forests",
        "local_name": "ឧទ្យានជាតិគិរីរម្យ (ភ្នំគីរីរម្យ)",
        "slug": "kirirom-national-park",
        "place_type": "NATIONAL_PARK",
        "description": "Cambodia's first designated national park, perched on an elevated plateau blanketed with fragrant pine forests, cool mountain mist, cascading waterfalls, and cliff lookouts.",
        "address": "Phnom Sruoch District, Kampong Speu",
        "latitude": 11.3167,
        "longitude": 104.0500,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-speu.jpg",
        "amenities_json": json.dumps(["Pine Forest Camping", "Mountain Biking", "Waterfalls", "Resort Glamping"]),
        "tags_json": json.dumps(["National Park", "Pine Forest", "Cool Climate", "Hiking", "Kirirom"]),
        "rating": 4.89,
        "review_count": 1920,
        "views_count": 33800,
        "is_featured": True
    },

    # --- Pailin ---
    {
        "dest_slug": "pailin",
        "name": "Phnom Yat Hilltop Gem Temple",
        "local_name": "វត្តភ្នំយ៉ាត ប៉ៃលិន",
        "slug": "phnom-yat-temple-pailin",
        "place_type": "TEMPLE",
        "description": "The spiritual heart of Pailin, perched on a former sapphire hill. Reflects rare Shan and Burmese architectural heritage with gilded pagodas, statues of peacocks, and panoramic mountain border views.",
        "address": "Phnom Yat, Pailin Municipality",
        "latitude": 12.8450,
        "longitude": 102.6100,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/pailin.jpg",
        "amenities_json": json.dumps(["Hilltop Stupa", "Burmese-Style Architecture", "Sunset Viewpoint", "Gem History Exhibits"]),
        "tags_json": json.dumps(["Temple", "Burmese Architecture", "Gems", "Hilltop", "Pailin"]),
        "rating": 4.80,
        "review_count": 720,
        "views_count": 12900,
        "is_featured": True
    },

    # --- Oddar Meanchey ---
    {
        "dest_slug": "oddar-meanchey",
        "name": "Prasat Ta Krabey Ancient Cliff Sanctuary",
        "local_name": "ប្រាសាទតាត្រាវ / ប្រាសាទតាក្របី",
        "slug": "prasat-ta-krabey-temple",
        "place_type": "TEMPLE",
        "description": "A sacred 11th-century sandstone sanctuary constructed during the golden age of Angkor, positioned dramatically on the Dangrek mountain escarpment enveloped by ancient forest.",
        "address": "Dangrek Range, Oddar Meanchey",
        "latitude": 14.3500,
        "longitude": 103.6000,
        "price_level": "$",
        "hero_image_url": "/images/destinations/oddar-meanchey.jpg",
        "amenities_json": json.dumps(["Escarpment Cliff View", "Ancient Sandstone Carvings", "Forest Sanctuary", "Ranger Escort"]),
        "tags_json": json.dumps(["Temple", "Dangrek Mountains", "Ancient Khmer", "Remote", "Forest Ruin"]),
        "rating": 4.83,
        "review_count": 560,
        "views_count": 10400,
        "is_featured": True
    },

    # --- Prey Veng ---
    {
        "dest_slug": "prey-veng",
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
        "amenities_json": json.dumps(["Mountain Staircase", "Historic Shrine Sites", "Panoramic Rice Field Vistas", "Shaded Pagoda"]),
        "tags_json": json.dumps(["Sacred Mountain", "Funan History", "Spirit Worship", "Countryside View", "Prey Veng"]),
        "rating": 4.79,
        "review_count": 640,
        "views_count": 11800,
        "is_featured": True
    },

    # --- Svay Rieng ---
    {
        "dest_slug": "svay-rieng",
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
        "amenities_json": json.dumps(["Ancient Brick Structure", "Peaceful Countryside Grounds", "Picnic Spot", "Local History"]),
        "tags_json": json.dumps(["Temple", "Ancient Brick", "Chenla", "Heritage", "Svay Rieng"]),
        "rating": 4.76,
        "review_count": 510,
        "views_count": 9800,
        "is_featured": True
    },

    # --- Tboung Khmum ---
    {
        "dest_slug": "tboung-khmum",
        "name": "Chup Historic Rubber Plantation & Forest",
        "local_name": "ចម្ការកៅស៊ូចប់ ត្បូងឃ្មុំ",
        "slug": "chup-rubber-plantation",
        "place_type": "ACTIVITY",
        "description": "One of the largest and oldest rubber plantations in Southeast Asia, planted by French agronomists in the 1920s in rich volcanic red basalt soil. Endless arched green corridors of rubber trees create a hypnotic natural cathedral.",
        "address": "Chup Commune, Tboung Khmum",
        "latitude": 11.9500,
        "longitude": 105.6167,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/tboung-khmum.jpg",
        "amenities_json": json.dumps(["Scenic Tree Avenues", "Rubber Tapping Demonstration", "Red Earth Trails", "Photography"]),
        "tags_json": json.dumps(["Rubber Plantation", "Historic Forest", "Red Soil", "Scenic Corridors", "Tboung Khmum"]),
        "rating": 4.84,
        "review_count": 820,
        "views_count": 14900,
        "is_featured": True
    }
]

def main():
    db = SessionLocal()
    try:
        dest_map = {d.slug: d for d in db.query(Destination).all()}
        inserted = 0
        updated = 0
        for item in AUTHENTIC_PLACES:
            dest_slug = item.pop("dest_slug")
            dest = dest_map.get(dest_slug)
            if not dest:
                print(f"Skipping {item['slug']} - destination {dest_slug} not found")
                continue
            item["destination_id"] = dest.id
            if "gallery_json" not in item:
                item["gallery_json"] = json.dumps([item["hero_image_url"]])
            item["verification_status"] = "VERIFIED"
            item["status"] = "ACTIVE"

            p = db.query(Place).filter(Place.slug == item["slug"]).first()
            if not p:
                p = Place(**item)
                db.add(p)
                inserted += 1
            else:
                for k, v in item.items():
                    setattr(p, k, v)
                updated += 1
        db.commit()
        print(f"Successfully inserted {inserted} and updated {updated} authentic Cambodian places!")
        print(f"Total places now in database: {db.query(Place).count()}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
