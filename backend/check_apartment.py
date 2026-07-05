#!/usr/bin/env python3
import requests

HAMBURG_GEOCODES = ["0200000005056","0200000006057","0200000006058","0200000006059","0200000005048"]

headers = {
    "User-Agent": "ImmoScout_27.12_26.2_._",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

params = {
    "searchType": "region",
    "realestatetype": "apartmentrent",
    "pricetype": "calculatedtotalrent",
    "geocodes": ",".join(HAMBURG_GEOCODES),
    "numberofrooms": "3.0-4.5",
    "pagenumber": 1
}

body = {"supportedResultListTypes": [], "userData": {}}

response = requests.post(
    "https://api.mobile.immobilienscout24.de/search/list",
    params=params,
    json=body,
    headers=headers,
    timeout=30
)

data = response.json()
results = data.get("resultListItems", [])

print("Found {} results".format(len(results)))

found = False
for item in results:
    if item.get("type") == "EXPOSE_RESULT":
        expose = item.get("item", {})
        if expose.get("id") == 166217791:
            found = True
            print("\nFOUND IN SEARCH!")
            print("ID: {}".format(expose.get('id')))
            print("Title: {}".format(expose.get('title')))
            print("Address: {}".format(expose.get('address', {}).get('line')))
            print("Marketing: {}".format(expose.get('marketingType')))
            attrs = expose.get('attributes', [])
            print("Attributes: {}".format(attrs))
            if len(attrs) >= 3:
                print("  Price: {}".format(attrs[0].get('value')))
                print("  Size: {}".format(attrs[1].get('value')))
                print("  Rooms: {}".format(attrs[2].get('value')))
            break

if not found:
    print("\nNOT FOUND IN SEARCH")
    print("\nChecking all Uhlenhorst apartments...")
    uhlenhorst_count = 0
    for item in results:
        if item.get("type") == "EXPOSE_RESULT":
            expose = item.get("item", {})
            address = expose.get('address', {}).get('line', '')
            if "Uhlenhorst" in address:
                uhlenhorst_count += 1
                if uhlenhorst_count <= 5:
                    print("  ID {}: {} rooms - {}".format(
                        expose.get('id'),
                        expose.get('attributes', [{}])[2].get('value', '?'),
                        address[:50]
                    ))
    
    print("\nTotal Uhlenhorst: {} apartments".format(uhlenhorst_count))
