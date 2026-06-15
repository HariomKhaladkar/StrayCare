import urllib.request
import sys

url = "http://127.0.0.1:8000/uploads/0458e337-6ef1-44df-80db-5da53272d8c1_injuredDog.jpg"
try:
    req = urllib.request.urlopen(url)
    print("SUCCESS! Status:", req.getcode())
except Exception as e:
    print("FAILED:", str(e))
