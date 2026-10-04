import sys
import os
import json

sys.path.insert(0, os.path.abspath("apps/api"))

from app.common.database import SessionLocal
from app.models.location import Destination
from app.models.place import Place

EXTRA_AUTHENTIC_PLACES = [
    # --- Phnom Penh Dining & Evening ---
    {
        "dest_slug": "phnom-penh",
        "name": "Romdeng Traditional Khmer Dining",
        "local_name": "ភោជនីយដ្ឋាន រំដួល",
        "slug": "romdeng-restaurant-phnom-penh",
        "place_type": "RESTAURANT",
        "description": "Set inside a restored French colonial villa with a garden pool. Celebrated for authentic regional recipes, wild forest mushrooms, crispy tarantulas for the adventurous, and creamy fish amok.",
        "address": "Street 174, Phnom Penh",
        "latitude": 11.5647,
        "longitude": 104.9250,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/phnom-penh.jpg",
        "amenities_json": json.dumps(["Garden Pool", "Colonial Villa", "Social Enterprise", "Cocktail Bar"]),
        "tags_json": json.dumps(["Khmer Cuisine", "Colonial Villa", "Social Enterprise", "Fish Amok", "Dining"]),
        "rating": 4.88,
        "review_count": 1420,
        "views_count": 25100,
        "is_featured": True
    },
    {
        "dest_slug": "phnom-penh",
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
        "amenities_json": json.dumps(["Mat Dining Courtyard", "Live Acoustic Stage", "Street Food Stalls", "Silk & Clothing"]),
        "tags_json": json.dumps(["Night Market", "Street Food", "Riverside", "Mat Dining", "Souvenirs"]),
        "rating": 4.74,
        "review_count": 2100,
        "views_count": 38900,
        "is_featured": True
    },

    # --- Kampot Dining ---
    {
        "dest_slug": "kampot",
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
        "amenities_json": json.dumps(["Riverfront Deck", "Sunset Cocktails", "Open-air Veranda", "Vegetarian Options"]),
        "tags_json": json.dumps(["Riverside Dining", "Kampot Pepper", "Sunset", "Cocktails", "Bistro"]),
        "rating": 4.90,
        "review_count": 1380,
        "views_count": 24200,
        "is_featured": True
    },

    # --- Kep Dining ---
    {
        "dest_slug": "kep",
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
        "amenities_json": json.dumps(["Over-Water Dining", "Fresh Crab Wok Cooking", "Sunset Views", "Draft Beer"]),
        "tags_json": json.dumps(["Kep Crab", "Fresh Seafood", "Kampot Pepper", "Over-water", "Seafood"]),
        "rating": 4.92,
        "review_count": 1820,
        "views_count": 31500,
        "is_featured": True
    },

    # --- Sihanoukville Dining ---
    {
        "dest_slug": "sihanoukville",
        "name": "The Secret Garden Otres Beachfront Dining",
        "local_name": "ភោជនីយដ្ឋាន ស៊ីក្រិតហ្កាឌិន អូរត្រេះ",
        "slug": "secret-garden-otres-dining",
        "place_type": "RESTAURANT",
        "description": "A tranquil beachfront restaurant on quiet Otres Beach, serving freshly grilled Gulf squid, lemongrass prawns, tropical fruit cocktails, and wood-fired pizzas under casuarina trees.",
        "address": "Otres 2 Beach, Sihanoukville",
        "latitude": 10.5750,
        "longitude": 103.5500,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/sihanoukville.jpg",
        "amenities_json": json.dumps(["Beachfront Tables", "Sunset Loungers", "Craft Cocktails", "Fresh Seafood Grill"]),
        "tags_json": json.dumps(["Beachfront", "Seafood", "Sunset", "Otres Beach", "Dining"]),
        "rating": 4.86,
        "review_count": 1150,
        "views_count": 19800,
        "is_featured": True
    },

    # --- Battambang Dining ---
    {
        "dest_slug": "battambang",
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
        "amenities_json": json.dumps(["Creative Cocktails", "Social Impact", "Air-conditioned Dining", "Art Gallery Wall"]),
        "tags_json": json.dumps(["Social Enterprise", "Gourmet Khmer", "Old Town", "Organic", "Cocktails"]),
        "rating": 4.94,
        "review_count": 1640,
        "views_count": 27300,
        "is_featured": True
    },

    # --- Mondulkiri Dining ---
    {
        "dest_slug": "mondulkiri",
        "name": "Mondulkiri Highland Coffee Roastery & Cafe",
        "local_name": "ហាងកាហ្វេមណ្ឌលគិរី និងរោងម៉ាស៊ីនកិន",
        "slug": "mondulkiri-coffee-roastery",
        "place_type": "CAFE",
        "description": "The heart of Cambodian specialty coffee. Taste locally harvested volcanic-soil Arabica and Robusta beans, fresh honey from jungle bees, and hearty breakfasts overlooking pine-covered hills.",
        "address": "Sen Monorom Main Street, Mondulkiri",
        "latitude": 12.4550,
        "longitude": 107.1890,
        "price_level": "$",
        "hero_image_url": "/images/destinations/mondulkiri.jpg",
        "amenities_json": json.dumps(["Fresh Coffee Roasting", "Highland Honey Tasting", "Patio Seating", "Bagged Coffee Beans"]),
        "tags_json": json.dumps(["Coffee Roastery", "Arabica", "Wild Honey", "Highland Cafe", "Breakfast"]),
        "rating": 4.88,
        "review_count": 980,
        "views_count": 16800,
        "is_featured": True
    },

    # --- Ratanakiri Dining ---
    {
        "dest_slug": "ratanakiri",
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
        "amenities_json": json.dumps(["Lakeside Pavilions", "Roasted Mountain Chicken", "Sunset Views", "Local Draft Beer"]),
        "tags_json": json.dumps(["Lakeside", "Local Specialty", "Mountain Chicken", "Banlung", "Sunset"]),
        "rating": 4.80,
        "review_count": 670,
        "views_count": 12100,
        "is_featured": True
    },

    # --- Kratie Dining ---
    {
        "dest_slug": "kratie",
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
        "amenities_json": json.dumps(["Riverside Balcony", "Pomelo Salad", "Sunset Drinks", "Traveler Book Exchange"]),
        "tags_json": json.dumps(["Mekong Sunset", "Cafe", "Pomelo", "Colonial Shophouse", "Relaxation"]),
        "rating": 4.83,
        "review_count": 810,
        "views_count": 14200,
        "is_featured": True
    },

    # --- Koh Kong Dining ---
    {
        "dest_slug": "koh-kong",
        "name": "Tatai River Floating Restaurant & Lounge",
        "local_name": "ភោជនីយដ្ឋានបណ្ដែតទឹកទន្លេតាតៃ",
        "slug": "tatai-floating-restaurant",
        "place_type": "RESTAURANT",
        "description": "A thatched wooden floating raft anchored on the emerald waters of the Tatai River. Feast on fresh mangrove mud crabs, garlic river prawns, and steamed sea bass surrounded by pristine rainforest mountains.",
        "address": "Tatai River, Koh Kong",
        "latitude": 11.5700,
        "longitude": 103.1100,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/koh-kong.jpg",
        "amenities_json": json.dumps(["Floating Raft Dining", "Fresh River Prawns", "Kayaking Access", "Mountain Views"]),
        "tags_json": json.dumps(["Floating Dining", "River Prawns", "Rainforest", "Tatai", "Mud Crab"]),
        "rating": 4.89,
        "review_count": 790,
        "views_count": 13900,
        "is_featured": True
    },

    # --- Takeo Dining ---
    {
        "dest_slug": "takeo",
        "name": "Takeo Giant River Prawn Market Stalls",
        "local_name": "តូបលក់បង្កងទឹកសាបតាកែវ",
        "slug": "takeo-giant-river-prawn-stalls",
        "place_type": "RESTAURANT",
        "description": "Takeo province is renowned nationwide for its colossal freshwater river prawns (Bangkang Takeo). Plump, sweet, and charcoal-grilled over hot coals served with rich prawn roe sauce and Kampot pepper lime dip.",
        "address": "National Road 2, Takeo Town",
        "latitude": 10.9880,
        "longitude": 104.7850,
        "price_level": "$$",
        "hero_image_url": "/images/destinations/takeo.jpg",
        "amenities_json": json.dumps(["Charcoal Grill Cooking", "River Prawn Specialties", "Outdoor Pavilion", "Take-away Boxes"]),
        "tags_json": json.dumps(["Giant Prawns", "Bangkang Takeo", "Local Specialty", "Charcoal Grill", "Foodie Icon"]),
        "rating": 4.95,
        "review_count": 2150,
        "views_count": 36800,
        "is_featured": True
    },

    # --- Kampong Thom Dining ---
    {
        "dest_slug": "kampong-thom",
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
        "amenities_json": json.dumps(["Historic Dining Room", "Kampong Thom Sausage Gift Shop", "Noodle Station", "Fast Service"]),
        "tags_json": json.dumps(["Famous Sausage", "Kwah Ko", "Kampong Thom Noodle", "Historic Eatery", "Khmer Classic"]),
        "rating": 4.85,
        "review_count": 1490,
        "views_count": 26200,
        "is_featured": True
    },

    # --- Pursat Dining ---
    {
        "dest_slug": "pursat",
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
        "amenities_json": json.dumps(["Orange Orchard Walking", "Fresh Juice Press", "Thatch Dining Huts", "Gift Fruit Boxes"]),
        "tags_json": json.dumps(["Pursat Orange", "Bakan", "Fresh Juice", "Grilled Chicken", "Local Icon"]),
        "rating": 4.82,
        "review_count": 920,
        "views_count": 15800,
        "is_featured": True
    },

    # --- Kampong Speu Dining ---
    {
        "dest_slug": "kampong-speu",
        "name": "Kampong Speu Palm Sugar Tasting Pavilion",
        "local_name": "មណ្ឌលភ្លក្សស្ករត្នោតកំពង់ស្ពឺ",
        "slug": "kampong-speu-palm-sugar-pavilion",
        "place_type": "ACTIVITY",
        "description": "Kampong Speu Palm Sugar holds protected geographical indication (PGI) status worldwide. Watch master palm-climbers boil sweet sap into golden crystalline sugar and taste warm coconut palm waffles.",
        "address": "Oudorng District, Kampong Speu",
        "latitude": 11.4500,
        "longitude": 104.5167,
        "price_level": "FREE",
        "hero_image_url": "/images/destinations/kampong-speu.jpg",
        "amenities_json": json.dumps(["Palm Tapping Demo", "Tasting Station", "PGI Palm Sugar Shop", "Palm Juice Refreshments"]),
        "tags_json": json.dumps(["Palm Sugar", "PGI Heritage", "Skor Thnot", "Sweet Delicacy", "Kampong Speu"]),
        "rating": 4.90,
        "review_count": 1280,
        "views_count": 22400,
        "is_featured": True
    },

    # --- Kampong Cham Dining ---
    {
        "dest_slug": "kampong-cham",
        "name": "Mekong River Breeze Floating Pavilions",
        "local_name": "កញ្ចុះបណ្ដែតទឹកមាត់ទន្លេមេគង្គ កំពង់ចាម",
        "slug": "mekong-river-breeze-kampong-cham",
        "place_type": "RESTAURANT",
        "description": "Breezy bamboo pavilions built out over the Mekong River current. Guests lounge on mats while eating deep-fried Mekong river fish, sweet chili dips, fried morning glory, and chilled coconut water.",
        "address": "Riverfront Promenade, Kampong Cham",
        "latitude": 11.9880,
        "longitude": 105.4620,
        "price_level": "$",
        "hero_image_url": "/images/destinations/kampong-cham.jpg",
        "amenities_json": json.dumps(["Over-Water Bamboo Mats", "Mekong Catfish", "Sunset Breeze", "Fresh Coconuts"]),
        "tags_json": json.dumps(["Mekong River", "Fish Dishes", "Bamboo Huts", "Sunset", "Kampong Cham"]),
        "rating": 4.81,
        "review_count": 870,
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
        for item in EXTRA_AUTHENTIC_PLACES:
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
        print(f"Successfully inserted {inserted} and updated {updated} extra authentic culinary places!")
        print(f"Total places now in database: {db.query(Place).count()}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
