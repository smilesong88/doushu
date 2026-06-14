let data = null;

async function loadContent() {
  // 自动判断：本地用 API，GitHub Pages 读静态 JSON
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const url = isLocal ? '/api/content' : './content.json';
  try {
    const r = await fetch(url);
    data = await r.json();
    if (isLocal) applyDisplay(data.meta);
    else {
      // 静态模式：直接应用显示设置到 CSS 变量
      const d = (data.meta || {}).display || {};
      if (d.fontSize) document.documentElement.style.setProperty('--font-size', d.fontSize + 'px');
      if (d.fontFamily) document.documentElement.style.setProperty('--font-body', d.fontFamily);
    }
    renderIndex();
  } catch(e) { console.error('加载失败', e); }
}

function renderIndex() {
  if (!data) return;
  const m = data.meta || {};
  if (m.title) document.getElementById('hero-title').textContent = m.title;
  if (m.subtitle) document.getElementById('hero-subtitle').textContent = m.subtitle;
  if (m.description) document.getElementById('hero-desc').textContent = m.description;

  const grid = document.getElementById('categories-grid');
  if (data.categories) {
    grid.innerHTML = data.categories.map((c, i) => `
      <a href="category.html?id=${i}" class="cat-card">
        <div class="cat-card-icon">⭐</div>
        <div class="cat-card-name">${c.name}</div>
        <div class="cat-card-loc">${c.location || ''}</div>
        <div class="cat-card-desc">${c.description || ''}</div>
      </a>
    `).join('');
  }

  if (m.contact) {
    const c = m.contact;
    if (c.email || c.wechat) {
      document.getElementById('contact-section').style.display = 'block';
      let h = '';
      if (c.email) h += `<div class="info-item"><span class="info-label">📧 邮箱：</span><span class="info-value">${c.email}</span></div>`;
      if (c.wechat) h += `<div class="info-item"><span class="info-label">💬 微信：</span><span class="info-value">${c.wechat}</span></div>`;
      document.getElementById('contact-info').innerHTML = h;
      document.getElementById('contact-note').textContent = c.note || '';
    }
  }
}

document.addEventListener('DOMContentLoaded', loadContent);
