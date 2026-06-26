import asyncio
import glob
import os
import json
import sys

sys.path.insert(0, 'C:\\Users\\amanp\\OneDrive\\Desktop\\eco\\backend')
from app.services.ocr import analyze_bill

async def main():
    uploads = sorted(glob.glob('uploads/*.*'), key=os.path.getmtime, reverse=True)
    if not uploads:
        print('No uploads found')
        return

    print(f"Found {len(uploads)} uploads. Testing the latest 3.")
    for path in uploads[:3]:
        filename = os.path.basename(path)
        print("\n" + "="*50)
        print(f"Testing: {filename}")
        try:
            res = await analyze_bill(filename)
            print("  Bill Type:", res.get('bill_type'))
            print("  Currency :", res.get('currency'), f"({res.get('currency_symbol')})")
            print("  Amount   :", res.get('amounts')[0] if res.get('amounts') else 'None')
            print("  Date     :", res.get('extracted_date'))
            print("  Units    :", res.get('units_consumed'))
        except Exception as e:
            print("  Failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
