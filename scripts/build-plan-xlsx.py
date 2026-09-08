#!/usr/bin/env python3
"""Regenerate public/plan/bookimmo_business_plan_v2.xlsx from public/plan/plan-data-v3.json.

Single source of truth: plan-data-v3.json. Edit that file, then run this script.
The deck and plan HTML pages fetch the same JSON at runtime, so all three
(xlsx, /plan page, /plan/deck) stay in sync from one edit.

Usage: python3 scripts/build-plan-xlsx.py
"""
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / 'public' / 'plan' / 'plan-data-v3.json'
OUT_PATH = ROOT / 'public' / 'plan' / 'bookimmo_business_plan_v2.xlsx'

data = json.loads(DATA_PATH.read_text())

wb = Workbook()
hdr = Font(bold=True, size=11)
title_f = Font(bold=True, size=14)
sub_f = Font(italic=True, size=10, color='666666')
sec_fill = PatternFill('solid', fgColor='E8F0E8')
tot_fill = PatternFill('solid', fgColor='D9E8D9')

def style_header_row(ws, row, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=row, column=c)
        cell.font = hdr
        cell.fill = PatternFill('solid', fgColor='DDE8F0')

# ============ SHEET 1: Business Model (static narrative) ============
ws = wb.active
ws.title = 'Business Model'
ws.column_dimensions['A'].width = 32
ws.column_dimensions['B'].width = 95

model_rows = [
    ('book.immo — Business Model v2', ''),
    ('', ''),
    ('MISSION', 'Отнять долю рынка у европейских агрегаторов (ImmoScout24, Immowelt), старт — Германия.'),
    ('', ''),
    ('=== FLYWHEEL ===', ''),
    ('1. Supply (агентства)', 'Локальные агентства подключают свои CRM к book.immo. Размещение БЕСПЛАТНО. Взамен — сплит комиссии при сделке.'),
    ('2. Эксклюзивы', 'Объекты попадают к нам из CRM ДО публикации на агрегаторах. Эксклюзивы — в топе выдачи по гео.'),
    ('3. Насыщение базы', 'Парсинг витрин ImmoScout24/Immowelt — бесплатное наполнение. Неэксклюзивно, но даёт полноту каталога и SEO-трафик.'),
    ('4. Demand (B2C)', 'Арендаторы/покупатели получают умный подбор + ИИ-автоматизацию: заявки, мониторинг, документы.'),
    ('5. Монетизация', 'Сделку закрывает агентство → комиссия делится между book.immo и маклером. Плюс pay-per-result ИИ-сервисы.'),
    ('6. Доп. ценность агентствам', 'Zolak.tech (virtual staging), ИИ-экспозе, квалифицированные лиды из B2C-базы.'),
    ('', ''),
    ('=== LEGAL ===', ''),
    ('Wohnungsvermittlungsgesetz', 'Нельзя брать с арендатора комиссию за посредничество аренды. B2C fee — плата за софт, не за посредничество.'),
    ('Bestellerprinzip', 'Комиссию платит собственник маклеру. Сплит book.immo — из B2B-агентского договора. Легально.'),
    ('GDPR', 'DPA-договоры с агентствами; consent B2C-клиентов на передачу заявки.'),
    ('Парсинг', 'Публичные витрины; соблюдать ToS-риски. Эксклюзивы снижают зависимость от парсинга.'),
]
for i, (a, b) in enumerate(model_rows, 1):
    ws.cell(row=i, column=1, value=a)
    ws.cell(row=i, column=2, value=b)
    ws.cell(row=i, column=2).alignment = Alignment(wrap_text=True, vertical='top')
    if a.startswith('==='):
        ws.cell(row=i, column=1).font = hdr
        ws.cell(row=i, column=1).fill = sec_fill
    elif i == 1:
        ws.cell(row=i, column=1).font = title_f

# ============ SHEET 2: Budget (from JSON) ============
ws2 = wb.create_sheet('Budget Apr-Aug (USD)')
ws2.column_dimensions['A'].width = 46
for c in 'BCDEFG':
    ws2.column_dimensions[c].width = 11

meta = data['meta']
ws2['A1'] = f"book.immo — Pre-Launch Budget ({data['budget']['months'][0]}-{data['budget']['months'][-1]} 2026, USD)"
ws2['A1'].font = title_f
ws2['A2'] = f"Инвестиция: ${meta['investmentUSD']:,}. Потрачено на запуск: ${meta['spentUSD']:,}. Резерв: ${meta['reserveUSD']:,}."
ws2['A2'].font = sub_f

months_b = data['budget']['months']
ws2.cell(row=4, column=1, value='Category')
for i, m in enumerate(months_b):
    ws2.cell(row=4, column=2 + i, value=m)
ws2.cell(row=4, column=len(months_b) + 2, value='TOTAL')
style_header_row(ws2, 4, len(months_b) + 2)

r = 5
for row in data['budget']['rows']:
    ws2.cell(row=r, column=1, value=row['name'])
    for i, v in enumerate(row['vals']):
        ws2.cell(row=r, column=2 + i, value=v)
    last_col = get_column_letter(1 + len(row['vals']))
    ws2.cell(row=r, column=len(row['vals']) + 2, value=f'=SUM(B{r}:{last_col}{r})')
    r += 1

total_row = r
ws2.cell(row=r, column=1, value='TOTAL')
for c in range(2, len(months_b) + 2):
    L = get_column_letter(c)
    ws2.cell(row=r, column=c, value=f'=SUM({L}5:{L}{r - 1})')
last_col = get_column_letter(len(months_b) + 2)
ws2.cell(row=r, column=len(months_b) + 2, value=f'=SUM({last_col}5:{last_col}{r - 1})')
for c in range(1, len(months_b) + 3):
    ws2.cell(row=r, column=c).font = hdr
    ws2.cell(row=r, column=c).fill = tot_fill

r += 2
ws2.cell(row=r, column=1, value='Что построено:').font = hdr
for b in data['budget']['built']:
    r += 1
    ws2.cell(row=r, column=1, value='• ' + b)

# ============ SHEET 3: Revenue Plan (computed from drivers) ============
ws3 = wb.create_sheet('Revenue Plan Sep+12M')
ws3.column_dimensions['A'].width = 42
for i in range(2, 16):
    ws3.column_dimensions[get_column_letter(i)].width = 10

rev = data['revenue']
mnames = rev['months']
ws3['A1'] = f"book.immo — Revenue Plan, Launch {meta['launchMonth']} (EUR, BASE case)"
ws3['A1'].font = title_f
ws3['A2'] = 'Модель: комиссионный сплит с агентствами + B2C pay-per-result.'
ws3['A2'].font = sub_f

ws3.cell(row=4, column=1, value='')
for i, m in enumerate(mnames):
    ws3.cell(row=4, column=2 + i, value=m)
ws3.cell(row=4, column=14, value='YEAR')
style_header_row(ws3, 4, 14)

d = rev['drivers']
r = 5
ws3.cell(row=r, column=1, value='DRIVERS').font = hdr
ws3.cell(row=r, column=1).fill = sec_fill
r += 1; ag_r = r; ws3.cell(row=r, column=1, value='Active agencies (cum.)')
for i, v in enumerate(d['activeAgencies']): ws3.cell(row=r, column=2 + i, value=v)
r += 1; dpa_r = r; ws3.cell(row=r, column=1, value='Deals per agency / month')
for i, v in enumerate(d['dealsPerAgency']): ws3.cell(row=r, column=2 + i, value=v)
r += 1; cd_r = r; ws3.cell(row=r, column=1, value='  → Closed deals')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'=ROUND({L}{ag_r}*{L}{dpa_r},0)')
r += 1; pr_r = r; ws3.cell(row=r, column=1, value='  % rentals (vs sales)')
for i in range(12): ws3.cell(row=r, column=2 + i, value=d['pctRental'])
r += 1; b2c_r = r; ws3.cell(row=r, column=1, value='B2C AI success-fee deals')
for i, v in enumerate(d['b2cDeals']): ws3.cell(row=r, column=2 + i, value=v)

ue = rev['unitEconomics']
r += 2
ws3.cell(row=r, column=1, value='UNIT ECONOMICS (per deal)').font = hdr
ws3.cell(row=r, column=1).fill = sec_fill
r += 1; ws3.cell(row=r, column=1, value='Rental: agent fee x 27.5% share'); ws3.cell(row=r, column=2, value=ue['rentalSplitEUR']); rent_u = r
r += 1; ws3.cell(row=r, column=1, value='Sale: agent fee x 20% share'); ws3.cell(row=r, column=2, value=ue['saleSplitEUR']); sale_u = r
r += 1; ws3.cell(row=r, column=1, value='B2C AI success fee'); ws3.cell(row=r, column=2, value=ue['b2cFeeEUR']); b2c_u = r

r += 2
ws3.cell(row=r, column=1, value='REVENUE').font = hdr
ws3.cell(row=r, column=1).fill = sec_fill
r += 1; rev_rent = r; ws3.cell(row=r, column=1, value='R1 Rental commission split')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'=ROUND({L}{cd_r}*{L}{pr_r}*$B${rent_u},0)')
r += 1; rev_sale = r; ws3.cell(row=r, column=1, value='R2 Sales referral split')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'=ROUND({L}{cd_r}*(1-{L}{pr_r})*$B${sale_u},0)')
r += 1; rev_b2c = r; ws3.cell(row=r, column=1, value='R3 B2C AI success fees')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'={L}{b2c_r}*$B${b2c_u}')
r += 1; rev_ups = r; ws3.cell(row=r, column=1, value='R4 Agency upsells (Zolak, AI-exposé, from M6)')
for i, v in enumerate(d['upsells']): ws3.cell(row=r, column=2 + i, value=v)
r += 1; rev_tot = r; ws3.cell(row=r, column=1, value='TOTAL REVENUE')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'=SUM({L}{rev_rent}:{L}{rev_ups})')
ws3.cell(row=r, column=14, value=f'=SUM(B{r}:M{r})')
for c in range(1, 15):
    ws3.cell(row=r, column=c).font = hdr
    ws3.cell(row=r, column=c).fill = tot_fill

r += 2
ws3.cell(row=r, column=1, value='COSTS').font = hdr
ws3.cell(row=r, column=1).fill = sec_fill
cost_start = r + 1
for row in rev['costs']['rows']:
    r += 1
    ws3.cell(row=r, column=1, value=row['name'])
    for i, v in enumerate(row['vals']):
        ws3.cell(row=r, column=2 + i, value=v)
r += 1; cost_tot = r; ws3.cell(row=r, column=1, value='TOTAL COSTS')
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'=SUM({L}{cost_start}:{L}{r - 1})')
ws3.cell(row=r, column=14, value=f'=SUM(B{r}:M{r})')
for c in range(1, 15):
    ws3.cell(row=r, column=c).font = hdr
    ws3.cell(row=r, column=c).fill = tot_fill

r += 2; ebitda_r = r
ws3.cell(row=r, column=1, value='EBITDA').font = hdr
for i in range(12):
    L = get_column_letter(2 + i)
    ws3.cell(row=r, column=2 + i, value=f'={L}{rev_tot}-{L}{cost_tot}')
ws3.cell(row=r, column=14, value=f'=SUM(B{r}:M{r})')
r += 1
ws3.cell(row=r, column=1, value=f"CUMULATIVE (incl. €{meta['reserveEUR']:,} reserve)")
ws3.cell(row=r, column=2, value=f"={meta['reserveEUR']}+B{ebitda_r}")
for i in range(1, 12):
    L = get_column_letter(2 + i); P = get_column_letter(1 + i)
    ws3.cell(row=r, column=2 + i, value=f'={P}{r}+{L}{ebitda_r}')

r += 2
ws3.cell(row=r, column=1, value='Note: R3 оформлен как оплата ИИ-сервиса (не Vermittlung) — см. лист Business Model.').font = sub_f

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUT_PATH)
print(f'Saved {OUT_PATH.relative_to(ROOT)}')
