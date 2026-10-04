import os
import sys
import json
import re

sys.path.insert(0, ".")
from scripts.seed_more_culinary_places import EXTRA_AUTHENTIC_PLACES

for seed_path in ['apps/api/seed_data.py', 'database/seed_data.py']:
    with open(seed_path, 'r', encoding='utf-8') as sf:
        s_content = sf.read()
    
    transformed_places = []
    for p in EXTRA_AUTHENTIC_PLACES:
        dest_slug = p['dest_slug']
        code_block = f'''            {{
                "destination_id": dest_map["{dest_slug}"].id,
                "name": "{p['name']}",
                "local_name": "{p['local_name']}",
                "slug": "{p['slug']}",
                "place_type": "{p['place_type']}",
                "description": "{p['description']}",
                "address": "{p['address']}",
                "latitude": {p['latitude']},
                "longitude": {p['longitude']},
                "price_level": "{p['price_level']}",
                "hero_image_url": "{p['hero_image_url']}",
                "gallery_json": json.dumps(["{p['hero_image_url']}"]),
                "amenities_json": {repr(p['amenities_json'])},
                "tags_json": {repr(p['tags_json'])},
                "rating": {p['rating']},
                "review_count": {p['review_count']},
                "views_count": {p['views_count']},
                "is_featured": {p['is_featured']},
                "verification_status": "VERIFIED",
                "status": "ACTIVE"
            }}'''
        transformed_places.append(code_block)
        
    full_insertion = ',\n' + ',\n'.join(transformed_places)
    
    # Insert after chup-rubber-plantation
    chup_pos = s_content.find('"slug": "chup-rubber-plantation"')
    if chup_pos != -1:
        closing_brace = s_content.find('            }', chup_pos)
        if closing_brace != -1:
            end_pos = closing_brace + len('            }')
            new_s_content = s_content[:end_pos] + full_insertion + s_content[end_pos:]
            with open(seed_path, 'w', encoding='utf-8') as out_f:
                out_f.write(new_s_content)
            print(f'Successfully appended culinary places to {seed_path}!')
        else:
            print(f'Could not find closing brace after chup in {seed_path}')
    else:
        print(f'Could not find chup in {seed_path}')
