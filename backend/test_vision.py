import google.genai as genai
import PIL.Image, json, glob, os, sys
sys.path.insert(0, 'C:\\Users\\amanp\\OneDrive\\Desktop\\eco\\backend')
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
uploads = sorted(glob.glob('uploads/*.*'), key=os.path.getmtime, reverse=True)
if not uploads:
    print('No uploads found')
    exit()

latest = uploads[0]
print(f'Testing with: {latest}')
img = PIL.Image.open(latest)

prompt = (
    "Analyze this electricity bill image and return ONLY valid JSON with this structure: "
    '{"bill_type":"Electricity","provider":"","consumer_name":"","units_consumed":{"value":null,"unit":"kWh"},"amount":{"due_amount":null},"bill_date":"","confidence":0.0}. '
    "Extract units_consumed from the field labeled Units Consumed, Consumption, or Consumption Units, or the vaapar/vapar column (Marathi word for usage). "
    "The value is a number of kWh/units, typically between 50-500. "
    "Return ONLY JSON, no markdown, no explanation."
)

response = client.models.generate_content(model='gemini-2.5-flash', contents=[prompt, img])
print('RAW RESPONSE:')
# Write response to file to avoid Windows encoding issues
with open('vision_output.txt', 'w', encoding='utf-8') as f:
    f.write(response.text)
print('Response written to vision_output.txt')
print('Length:', len(response.text))
