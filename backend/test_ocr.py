import asyncio
import glob
import os
import sys
import json

sys.path.insert(0, r"c:\Users\amanp\OneDrive\Desktop\eco\backend")

from app.services.ocr import analyze_bill

async def main():
    uploads = sorted(glob.glob(r"c:\Users\amanp\OneDrive\Desktop\eco\backend\uploads\*.*"), key=os.path.getmtime, reverse=True)
    if not uploads:
        print("No uploads found")
        return
    
    latest = os.path.basename(uploads[0])
    print(f"Testing with: {latest}")
    result = await analyze_bill(latest)
    print("Result:", json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
