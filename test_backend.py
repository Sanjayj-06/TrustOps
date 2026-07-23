import urllib.request
import json

try:
    req = urllib.request.Request("https://trustpatch-1.onrender.com/health", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as response:
        print("STATUS:", response.status)
        print("DATA:", response.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
