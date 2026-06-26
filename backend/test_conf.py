import requests

def test_user(email):
    print(f"\n--- Testing User: {email} ---")
    token = requests.post('http://localhost:8001/api/v1/auth/login', json={'email':email,'password':'password123'}).json().get('access_token')
    if not token:
        print("Login failed")
        return
        
    for days in [7, 30, 180, 365]:
        r = requests.get(f'http://localhost:8001/api/v1/prediction/forecast?days={days}', headers={'Authorization': 'Bearer ' + token})
        data = r.json()
        print(f"{days} days:")
        print(f"  Overall Confidence: {data.get('overall_confidence'):.2f}%")
        print(f"  Label: {data.get('confidence_label')}")
        # Print breakdown from day 1 for insight
        if data.get('predictions'):
            brk = data['predictions'][0].get('confidence_breakdown', {})
            print(f"  Breakdown (Day 1): suff={brk.get('data_sufficiency'):.2f}, cons={brk.get('historical_consistency'):.2f}, override={brk.get('override_magnitude'):.2f}, decay={brk.get('horizon_decay'):.2f}")

test_user('testuser_e2e@example.com')
test_user('rich_user@example.com')
