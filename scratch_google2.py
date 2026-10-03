import urllib.request
import re
import urllib.parse
import json

def search_google_images(query):
    q = urllib.parse.quote(query)
    url = f'https://www.google.com/search?tbm=isch&q={q}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # Google images store urls in JS array structures: ["https://example.com/image.jpg", 400, 300]
        # We can find all urls that end with .jpg or .png inside quotes
        urls = re.findall(r'(?i)http[^"]+?\.(?:jpg|jpeg|png)', html)
        
        # Filter out google domains
        valid_urls = []
        for u in urls:
            # Fix escaped unicode and slashes if any
            u = u.replace('\\u003d', '=').replace('\\u0026', '&')
            if 'gstatic.com' not in u and 'google.com' not in u:
                valid_urls.append(u)
                
        # Remove duplicates preserving order
        final_urls = list(dict.fromkeys(valid_urls))
        print(f'{query} -> {final_urls[:5]}')
    except Exception as e:
        print(f'{query} error -> {e}')

search_google_images('Angkor Wat Siem Reap')
search_google_images('Banteay Srei')
