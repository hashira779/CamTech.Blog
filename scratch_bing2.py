import urllib.request
import re
import urllib.parse
req = urllib.request.Request('https://www.bing.com/images/search?q=Banteay+Srei+temple+cambodia', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'murl&quot;:&quot;(.*?)&quot;', html)
if not matches:
    matches = re.findall(r'"murl":"(.*?)"', html)
print(matches[:5])
