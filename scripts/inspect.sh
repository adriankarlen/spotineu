#!/usr/bin/env bash
# Inspect the live Spotify DOM through CDP to find stable selectors and verify styles.
#   scripts/inspect.sh testids                 # list data-testid values on the current page
#   scripts/inspect.sh tree '<css selector>'   # ancestry of the first match: tag, classes, data-testid, role
#   scripts/inspect.sh at <x> <y>              # same, for the element at a viewport point
#   scripts/inspect.sh style '<css selector>' [prop ...]   # computed styles (default: colours, font)
#   scripts/inspect.sh vars                    # resolved --spice-* and key Encore tokens on <html>
#   scripts/inspect.sh row '<css selector>'    # size, centre line and icon size of every match (alignment check)
#   scripts/inspect.sh clip '<css selector>'   # ancestors that can cut off or paint over its shadow
#   scripts/inspect.sh shadows                 # visible plain black drop shadows (not light/dark pairs) on this page
set -euo pipefail

PORT="${SPOTIFY_CDP_PORT:-9222}"
SESSION="spotineu"
ab() { agent-browser --session "$SESSION" "$@"; }

if ! curl -s --max-time 2 "http://localhost:$PORT/json/list" | grep -q spotify; then
  echo "✖ No Spotify DevTools target on port $PORT. Start: nohup spicetify watch -s > /tmp/spotineu-watch.log 2>&1 &" >&2
  exit 2
fi
# Connect (idempotent) and make sure the main xpui page is the active target.
ab connect "$PORT" >/dev/null
if ! ab get url 2>/dev/null | grep -q xpui; then
  t="$(ab tab 2>/dev/null | grep xpui | grep -o '\[t[0-9]*\]' | tr -d '[]' | head -1)"
  [ -n "$t" ] && ab tab "$t" >/dev/null
fi
if ! ab eval 'typeof Spicetify' 2>/dev/null | grep -q object; then
  echo "✖ Connected, but the page has no Spicetify object. Spotify is running unpatched files:" >&2
  echo "  run 'spicetify backup apply', quit Spotify, then start watch mode again." >&2
  exit 3
fi

json() { node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"; }

DESCRIBE='const d=(e)=>e.tagName.toLowerCase()+(e.id?"#"+e.id:"")+[...e.classList].map(c=>"."+c).join("")+(e.dataset&&e.dataset.testid?`[data-testid="${e.dataset.testid}"]`:"")+(e.getAttribute("role")?`[role="${e.getAttribute("role")}"]`:"")+(e.getAttribute("aria-label")?`  (aria-label="${e.getAttribute("aria-label")}")`:"");const tree=(el)=>{if(!el)return "no match";const o=[];for(let e=el;e&&e!==document.documentElement;e=e.parentElement)o.push(d(e));return o.join("\n  ↑ ");};'

case "${1:-}" in
  testids)
    ab eval '[...new Set([...document.querySelectorAll("[data-testid]")].map(e=>e.dataset.testid))].sort().join("\n")'
    ;;
  tree)
    ab eval "(()=>{${DESCRIBE}return tree(document.querySelector($(json "${2:?selector}")));})()"
    ;;
  at)
    ab eval "(()=>{${DESCRIBE}return tree(document.elementFromPoint(${2:?x},${3:?y}));})()"
    ;;
  style)
    sel="${2:?selector}"; shift 2
    props="${*:-color background-color border-color font-family font-size}"
    ab eval "(()=>{const el=document.querySelector($(json "$sel"));if(!el)return 'no match';const cs=getComputedStyle(el);return $(json "$props").split(' ').map(p=>p+': '+cs.getPropertyValue(p)).join('\n');})()"
    ;;
  vars)
    ab eval '(()=>{const cs=getComputedStyle(document.querySelector(".encore-dark-theme, .encore-light-theme")||document.documentElement);const names=[...new Set([...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return []}}).flatMap(r=>r.style?[...r.style].filter(p=>p.startsWith("--spice-")):[]))].sort();const enc=["--background-base","--background-highlight","--background-elevated-base","--text-base","--text-subdued","--essential-base","--text-bright-accent","--essential-bright-accent"];return [...names,...enc].map(n=>n+": "+cs.getPropertyValue(n).trim()).join("\n");})()'
    ;;
  row)
    ab eval "(()=>{const els=[...document.querySelectorAll($(json "${2:?selector}"))];if(!els.length)return 'no match';const cys=new Set();const out=els.map(e=>{const r=e.getBoundingClientRect();const i=e.querySelector('svg,img');const ir=i?i.getBoundingClientRect():null;const cy=(r.y+r.height/2).toFixed(1);cys.add(cy);return (e.getAttribute('aria-label')||e.dataset.testid||e.tagName).slice(0,24).padEnd(25)+Math.round(r.width)+'x'+Math.round(r.height)+'  centre-y '+cy+(ir?'  icon '+Math.round(ir.width)+'x'+Math.round(ir.height):'')});return out.join('\\n')+'\\n=> '+cys.size+' distinct centre line(s)'})()"
    ;;
  clip)
    ab eval "(()=>{let e=document.querySelector($(json "${2:?selector}"));if(!e)return 'no match';const self=e;const o=[];for(let i=0;e&&e!==document.body;e=e.parentElement,i++){const cs=getComputedStyle(e);const flags=[];if(e!==self&&(cs.overflowX!=='visible'||cs.overflowY!=='visible'))flags.push('CLIPS overflow='+cs.overflowX+'/'+cs.overflowY);if(cs.maskImage!=='none')flags.push('MASK');if(cs.clipPath!=='none')flags.push('CLIP-PATH');if(cs.contain!=='none'&&/paint|strict|content/.test(cs.contain))flags.push('contain='+cs.contain);if(e!==self&&cs.zIndex!=='auto'&&cs.backgroundColor!=='rgba(0, 0, 0, 0)')flags.push('PAINTS z='+cs.zIndex+' bg='+cs.backgroundColor);if(flags.length||i===0)o.push(i+' '+e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.dataset.testid?'[data-testid=\\''+e.dataset.testid+'\\']':'')+'  '+flags.join('  '))}return o.join('\\n')||'nothing clips'})()"
    ;;
  shadows)
    ab eval "(()=>{const m=new Map();for(const e of document.querySelectorAll('body *')){const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.opacity==='0')continue;const sh=cs.boxShadow;const mm=sh.match(/rgba[(]0, 0, 0, ([0-9.]+)[)]/);if(!mm||parseFloat(mm[1])===0||sh.includes('inset'))continue;const chain=[];for(let p=e,i=0;p&&i<4;p=p.parentElement,i++)chain.push(p.tagName.toLowerCase()+(p.id?'#'+p.id:'')+(p.dataset.testid?'[data-testid='+p.dataset.testid+']':'')+(p.dataset.encoreId?'[data-encore-id='+p.dataset.encoreId+']':'')+(p.getAttribute('role')?'[role='+p.getAttribute('role')+']':''));const k=sh.slice(0,40)+'  '+chain.join(' < ');m.set(k,(m.get(k)||0)+1)}return [...m].map(([k,v])=>v+'x '+k).join('\\n')||'none'})()"
    ;;
  *)
    sed -n 2,11p "$0"; exit 1
    ;;
esac
