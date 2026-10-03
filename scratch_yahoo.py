import urllib.request
import re
import urllib.parse
import json
req = urllib.request.Request('https://images.search.yahoo.com/search/images?p=Banteay+Srei+temple+cambodia', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
matches = re.findall(r'imgurl=&quot;(.*?)&quot;', html)
if not matches:
    matches = re.findall(r'"imgurl":"(.*?)"', html)
print(matches[:5])
