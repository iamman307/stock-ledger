#!/usr/bin/env python3
import json, urllib.request, urllib.parse, time
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
specs=[]
for raw in (ROOT/'symbols.txt').read_text(encoding='utf-8').splitlines():
    line=raw.strip()
    if not line or line.startswith('#'):
        continue
    if '|' in line:
        app_symbol,yahoo_symbol=[x.strip().upper() for x in line.split('|',1)]
    else:
        app_symbol=yahoo_symbol=line.upper()
    specs.append((app_symbol,yahoo_symbol))
UA={'User-Agent':'Mozilla/5.0 (GitHub Actions Stock Ledger Quote Snapshot)','Accept':'application/json'}

def get_json(url, timeout=15):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))

quotes={}
errors=[]
for app_symbol,yahoo_symbol in specs:
    try:
        url='https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(yahoo_symbol)+'?interval=1d&range=5d&includePrePost=true'
        j=get_json(url)
        meta=((j.get('chart') or {}).get('result') or [{}])[0].get('meta') or {}
        price=meta.get('regularMarketPrice')
        if price is None:
            price=meta.get('postMarketPrice') or meta.get('preMarketPrice')
        price=float(price)
        if not (price>0): raise ValueError('NO_PRICE')
        quotes[app_symbol]={
            'symbol':app_symbol,
            'yahooSymbol':yahoo_symbol,
            'price':price,
            'currency':meta.get('currency',''),
            'exchange':meta.get('exchangeName',''),
            'marketState':meta.get('marketState',''),
            'previousClose':meta.get('chartPreviousClose',meta.get('previousClose')),
            'updated':datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        errors.append({'symbol':app_symbol,'yahooSymbol':yahoo_symbol,'reason':str(e)})
    time.sleep(0.15)

usd_twd=None
fx_date=''
try:
    j=get_json('https://api.frankfurter.dev/v2/rate/USD/TWD')
    usd_twd=float(j['rate'])
    fx_date=j.get('date','')
except Exception as e:
    errors.append({'symbol':'USD/TWD','reason':str(e)})

out={
    'updated':datetime.now(timezone.utc).isoformat(),
    'source':'Yahoo Finance via GitHub Actions',
    'usdTwd':usd_twd,
    'fxUpdated':fx_date,
    'fxSource':'Frankfurter',
    'quotes':quotes,
    'errors':errors
}
Path('/tmp/quotes.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'quotes':len(quotes),'errors':errors},ensure_ascii=False))
