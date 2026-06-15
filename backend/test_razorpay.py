from dotenv import load_dotenv
load_dotenv(r'C:\Users\Hariom\SC\backend\.env')
import os, razorpay

key_id = os.getenv('RAZORPAY_KEY_ID')
key_secret = os.getenv('RAZORPAY_KEY_SECRET')
print('KEY_ID:', key_id)
print('KEY_SECRET:', key_secret[:6] + '...')

try:
    client = razorpay.Client(auth=(key_id, key_secret))
    order = client.order.create({'amount': 5000, 'currency': 'INR', 'receipt': 'test_001'})
    print('SUCCESS:', order)
except Exception as e:
    print('RAZORPAY ERROR:', type(e).__name__, str(e))
