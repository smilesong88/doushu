/* 字号控制 */
(function(){
  const KEY='zw-font-size';
  const sizes=[14,15,16,17,18,19,20,22,24];
  let idx=2; // 默认16px

  function apply(){
    document.documentElement.style.setProperty('--font-size',sizes[idx]+'px');
    const lbl=document.getElementById('font-size-label');
    if(lbl)lbl.textContent=sizes[idx];
  }

  function load(){
    const s=localStorage.getItem(KEY);
    if(s!==null){const i=parseInt(s);if(i>=0&&i<sizes.length)idx=i;}
    apply();
  }

  function change(d){
    idx=Math.max(0,Math.min(sizes.length-1,idx+d));
    localStorage.setItem(KEY,idx);
    apply();
  }

  // 创建控件
  function create(){
    const el=document.createElement('div');
    el.className='font-ctrl';
    el.innerHTML='<button onclick="zwFontSize(-1)" title="缩小字号">A-</button><span id="font-size-label">16</span><button onclick="zwFontSize(1)" title="放大字号">A+</button>';
    document.body.appendChild(el);
  }

  window.zwFontSize=change;
  document.addEventListener('DOMContentLoaded',()=>{create();load();});
})();
