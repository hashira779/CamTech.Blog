import urllib.request
import re
import urllib.parse
req = urllib.request.Request('https://www.google.com/search?tbm=isch&q=Banteay+Srei+temple+cambodia', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'\["([^"]+?\.(?:jpg|png|jpeg))",\d+,\d+\]', html)
print(matches[:5])
