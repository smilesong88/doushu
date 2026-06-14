let data = null, catIdx = 0;
function getParam(n) { return new URLSearchParams(window.location.search).get(n); }

async function load() {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const url = isLocal ? '/api/content' : './content.json';
  try {
    const r = await fetch(url);
    data = await r.json();
    catIdx = parseInt(getParam('id')) || 0;
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
  if (!cat) return;
  document.title = cat.fullTitle + ' - 紫微斗数';
  document.getElementById('cat-name').textContent = cat.fullTitle || cat.name;
  document.getElementById('cat-desc').textContent = cat.description || '';

  const list = document.getElementById('palaces-list');
  if (cat.palaces) {
    list.innerHTML = cat.palaces.map((p, i) => `
      <a href="palace.html?cat=${catIdx}&pal=${i}" class="palace-item">
        <div class="palace-item-name">${p.name}</div>
        <div class="palace-item-desc">${p.description || ''}</div>
        <div class="palace-item-arrow">查看十天干解读 →</div>
      </a>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', load);
