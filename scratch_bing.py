import urllib.request
import re
import urllib.parse

def scrape_bing(query):
    q = urllib.parse.quote(query)
    url = f'https://www.bing.com/images/search?q={q}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find any direct url ending in jpg
    matches = re.findall(r'https?://[^\s"\'<>&]+(?:jpg|jpeg|png)', html, re.IGNORECASE)
    
    # Filter out thumbnails or tracking URLs (bing.com or th.bing.com)
    urls = []
    for m in matches:
        if 'bing.com' not in m and 'microsoft' not in m:
            urls.append(m)
            
    print(f'{query} -> {urls[:3]}')

scrape_bing('Banteay Srei')
scrape_bing('Wat Phnom')
