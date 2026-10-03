import urllib.request
import re
import urllib.parse

def scrape_unsplash(query):
    q = urllib.parse.quote(query.replace(' ', '-'))
    url = f'https://unsplash.com/s/photos/{q}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        # match high quality images
        matches = re.findall(r'(https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+[^"\s>]*\?ixid=[^"\s>]+)', html)
        # remove duplicates
        urls = list(dict.fromkeys(matches))
        print(f'{query} -> {urls[:3]}')
    except Exception as e:
        print(f'{query} error -> {e}')

scrape_unsplash('angkor wat')
scrape_unsplash('Banteay Srei')
scrape_unsplash('Wat Phnom')
