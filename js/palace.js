const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let data = null, catIdx = 0, palIdx = 0, curStem = '甲';
function getParam(n) { return new URLSearchParams(window.location.search).get(n); }

async function load() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const url = isLocal ? '/api/content' : './content.json';
  try {
    const r = await fetch(url);
    data = await r.json();
    catIdx = parseInt(getParam('cat')) || 0;
    palIdx = parseInt(getParam('pal')) || 0;
    if (data.meta && data.meta.display) {
      const d = data.meta.display;
      if (d.fontSize) document.documentElement.style.setProperty('--font-size', d.fontSize + 'px');
      if (d.fontFamily) document.documentElement.style.setProperty('--font-body', d.fontFamily);
    }
    render();
  } catch(e) { console.error('加载失败', e); }
}

function render() {
  if (!data || !data.categories) return;
  const cat = data.categories[catIdx];
  const pal = cat ? cat.palaces[palIdx] : null;
  if (!pal) return;
  document.title = pal.fullTitle + ' - 紫微斗数';
  document.getElementById('palace-title').textContent = pal.fullTitle || pal.name;
  document.getElementById('palace-desc').textContent = pal.description || '';
  const bc = document.getElementById('back-cat');
  bc.textContent = cat.fullTitle || cat.name;
  bc.href = 'category.html?id=' + catIdx;

  document.getElementById('stems-nav').innerHTML = STEMS.map(s =>
    `<button class="stem-tab${s===curStem?' active':''}" onclick="switchStem('${s}')">${s}</button>`
  ).join('');
  renderStem();
}

function switchStem(s) {
  curStem = s;
  document.querySelectorAll('.stem-tab').forEach(t => t.classList.toggle('active', t.textContent===s));
  renderStem();
}

function renderStem() {
  const pal = data.categories[catIdx].palaces[palIdx];
  const sd = pal.stems ? pal.stems[curStem] : null;
  const el = document.getElementById('stem-content');
  if (!sd || !sd.content) { el.innerHTML = '<div class="stem-card"><div class="stem-card-title">' + (sd ? (sd.title || curStem+'年生人命盘解读') : curStem+'年生人') + '</div><div class="stem-card-body"><p style="color:#aaa;font-style:italic">暂无内容</p></div></div>'; return; }
  el.innerHTML = `<div class="stem-card"><div class="stem-card-title">${sd.title || curStem+'年生人命盘解读'}</div><div class="stem-card-body">${markdownToHtml(sd.content)}</div></div>`;
}

function markdownToHtml(md) {
  try {
    if (typeof marked !== 'undefined') {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(md);
    }
  } catch(e) {}
  return md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

document.addEventListener('DOMContentLoaded', load);
