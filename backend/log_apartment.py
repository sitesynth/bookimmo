#!/usr/bin/env python3
import json
from datetime import datetime, timezone

apartment_id = 166217791

# Добавляем в apartments_processed.jsonl
processed_entry = {
    "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "id": apartment_id,
    "title": "2,5-Zimmer in Uhlenhorst",
    "address": "Hamburg, Uhlenhorst",
    "price": "€500-600",
    "rooms": 2.5,
    "district": "Uhlenhorst",
    "status": "contacted",
    "reason": None,
    "url": f"https://www.immobilienscout24.de/expose/{apartment_id}"
}

with open('apartments_processed.jsonl', 'a', encoding='utf-8') as f:
    f.write(json.dumps(processed_entry, ensure_ascii=False) + '\n')

print("Added to apartments_processed.jsonl")

# Добавляем в apartments_timeline.jsonl
timeline_entry = {
    "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "apartment_id": apartment_id,
    "event": "found",
    "description": "Found in search"
}

with open('apartments_timeline.jsonl', 'a', encoding='utf-8') as f:
    f.write(json.dumps(timeline_entry, ensure_ascii=False) + '\n')

timeline_entry["event"] = "contact_sent"
timeline_entry["description"] = "Contact sent"
timeline_entry["timestamp"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

with open('apartments_timeline.jsonl', 'a', encoding='utf-8') as f:
    f.write(json.dumps(timeline_entry, ensure_ascii=False) + '\n')

print("Added to apartments_timeline.jsonl")
