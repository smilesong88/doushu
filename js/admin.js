const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let data=null, curSec='dashboard', curCat=-1, curPal=-1, curStem='甲', dirty=false;

document.addEventListener('DOMContentLoaded', async()=>{
  await load();
  setupNav();
  showSec('dashboard');
});

async function load(){
  try{const r=await fetch('/api/content');data=await r.json();}catch(e){toast('加载失败','err');}
  renderCatNav();
}

async function saveAll(){
  try{const r=await fetch('/api/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const res=await r.json();if(res.success){dirty=false;toast('✅ 已保存','ok');}else toast('保存失败','err');
  }catch(e){toast('保存失败','err');}
}

function markDirty(){dirty=true;}
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

function setupNav(){
  document.querySelectorAll('.nav-item').forEach(n=>{
    n.addEventListener('click',e=>{e.preventDefault();showSec(n.dataset.sec);});
  });
}

function showSec(sec){
  curSec=sec;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.sec===sec));
  document.querySelectorAll('.sec').forEach(s=>s.style.display='none');
  const t=document.getElementById('sec-'+sec);
  if(t)t.style.display='block';
  if(sec==='dashboard')renderDash();
  if(sec==='settings')renderSettings();
  if(sec==='images')renderImages();
  if(sec==='category')renderCatEditor();
  if(sec==='palace')renderPalEditor();
}

function renderCatNav(){
  const el=document.getElementById('cat-nav');
  if(!data||!data.categories)return;
  el.innerHTML=data.categories.map((c,i)=>{
    const pals=c.palaces?c.palaces.map((p,j)=>
      `<a class="pal-nav-item${curCat===i&&curPal===j?' active':''}" onclick="openPal(${i},${j})">${p.name}</a>`
    ).join(''):'';
    return`<a class="cat-nav-item${curCat===i?' active':''}" onclick="openCat(${i})"><span class="cat-nav-icon">⭐</span>${c.name}</a>${pals}`;
  }).join('');
}

function openCat(i){curCat=i;curPal=-1;showSec('category');renderCatNav();}
function openPal(i,j){curCat=i;curPal=j;curStem='甲';showSec('palace');renderCatNav();}

// 仪表盘
function renderDash(){
  if(!data)return;
  let total=0,filled=0;
  data.categories.forEach(c=>{(c.palaces||[]).forEach(p=>{
    STEMS.forEach(s=>{total++;if(p.stems&&p.stems[s]&&p.stems[s].content)filled++;});
  });});
  const pct=total?Math.round(filled/total*100):0;
  document.getElementById('stats').innerHTML=`
    <div class="stat"><div class="stat-num">${data.categories.length}</div><div class="stat-lbl">基础盘分类</div></div>
    <div class="stat"><div class="stat-num">${filled}</div><div class="stat-lbl">已填写内容</div></div>
    <div class="stat"><div class="stat-num">${total-filled}</div><div class="stat-lbl">待填写</div></div>
    <div class="stat"><div class="stat-num">${pct}%</div><div class="stat-lbl">完成进度</div></div>`;
}

// 基本设置
function renderSettings(){
  if(!data)return;
  const m=data.meta||{};
  document.getElementById('s-title').value=m.title||'';
  document.getElementById('s-subtitle').value=m.subtitle||'';
  document.getElementById('s-desc').value=m.description||'';
  const c=m.contact||{};
  document.getElementById('s-email').value=c.email||'';
  document.getElementById('s-wechat').value=c.wechat||'';
  document.getElementById('s-note').value=c.note||'';
  const s=m.display||{};
  document.getElementById('s-fontsize').value=s.fontSize||'16';
  document.getElementById('s-fontfamily').value=s.fontFamily||"'Noto Serif SC','SimSun',serif";
}
function saveSettings(){
  if(!data)return;
  data.meta=data.meta||{};
  data.meta.title=document.getElementById('s-title').value;
  data.meta.subtitle=document.getElementById('s-subtitle').value;
  data.meta.description=document.getElementById('s-desc').value;
  data.meta.contact={
    email:document.getElementById('s-email').value,
    wechat:document.getElementById('s-wechat').value,
    note:document.getElementById('s-note').value
  };
  data.meta.display={
    fontSize:document.getElementById('s-fontsize').value,
    fontFamily:document.getElementById('s-fontfamily').value
  };
  markDirty();saveAll();
}

// 图片管理
async function renderImages(){
  const g=document.getElementById('img-gallery');
  try{const r=await fetch('/api/images');const imgs=await r.json();
  if(!imgs.length){g.innerHTML='<p style="color:#999;text-align:center;padding:32px">暂无图片</p>';return;}
  g.innerHTML=imgs.map(i=>`<div class="img-item"><img src="${i.url}"><div class="img-ft"><span class="img-name">${i.filename}</span><button class="img-del" onclick="delImg('${i.filename}')">🗑️</button></div></div>`).join('');
  }catch{g.innerHTML='<p style="color:red">加载失败</p>';}
}
async function uploadImgs(e){
  for(const f of e.target.files){const fd=new FormData();fd.append('image',f);await fetch('/api/upload',{method:'POST',body:fd});}
  toast('✅ 上传成功','ok');renderImages();e.target.value='';
}
async function delImg(fn){
  if(!confirm('确定删除 '+fn+'？'))return;
  await fetch('/api/upload/'+fn,{method:'DELETE'});toast('已删除','ok');renderImages();
}

// ========== 分类编辑（含批量删除） ==========
function renderCatEditor(){
  if(curCat<0||!data)return;
  const c=data.categories[curCat];
  document.getElementById('cat-edit-title').textContent='编辑 - '+c.name;
  document.getElementById('ce-name').value=c.name||'';
  document.getElementById('ce-loc').value=c.location||'';
  document.getElementById('ce-full').value=c.fullTitle||'';
  document.getElementById('ce-desc').value=c.description||'';

  const pl=document.getElementById('palace-list-editor');
  if(!c.palaces){pl.innerHTML='';return;}
  pl.innerHTML=`
    <div class="batch-bar">
      <label class="chk-all"><input type="checkbox" onchange="toggleAllPal(this)" id="chk-all"> 全选</label>
      <button class="btn-del-sm" onclick="batchDelPal()">🗑️ 批量删除选中</button>
    </div>
    `+c.palaces.map((p,i)=>`
    <div class="palace-edit-item" onclick="openPal(${curCat},${i})">
      <input type="checkbox" class="pal-chk" data-idx="${i}" onclick="event.stopPropagation()" style="flex-shrink:0">
      <span class="pal-name">${p.name}</span>
      <span class="pal-full">${p.fullTitle||''}</span>
      <div class="pal-btns">
        <button onclick="event.stopPropagation();delPalace(${i})" title="删除">🗑️</button>
        <button onclick="event.stopPropagation();dupPalace(${i})" title="复制">📋</button>
      </div>
    </div>
  `).join('');
}

function toggleAllPal(cb){
  document.querySelectorAll('.pal-chk').forEach(c=>c.checked=cb.checked);
}

function batchDelPal(){
  const chks=[...document.querySelectorAll('.pal-chk:checked')];
  if(!chks.length){toast('请先勾选要删除的宫位','err');return;}
  if(!confirm('确定删除选中的 '+chks.length+' 个宫位及所有内容？此操作不可恢复！'))return;
  const idxs=chks.map(c=>parseInt(c.dataset.idx)).sort((a,b)=>b-a);
  idxs.forEach(i=>data.categories[curCat].palaces.splice(i,1));
  renderCatEditor();renderCatNav();markDirty();toast('✅ 已删除 '+idxs.length+' 个宫位','ok');
}

function delPalace(i){
  if(!confirm('确定删除「'+data.categories[curCat].palaces[i].name+'」及其所有天干内容？'))return;
  data.categories[curCat].palaces.splice(i,1);
  renderCatEditor();renderCatNav();markDirty();
}

function dupPalace(i){
  const p=data.categories[curCat].palaces[i];
  const clone=JSON.parse(JSON.stringify(p));
  clone.name+='(副本)';
  clone.fullTitle+='(副本)';
  data.categories[curCat].palaces.splice(i+1,0,clone);
  renderCatEditor();renderCatNav();markDirty();toast('📋 已复制','ok');
}

function saveCatInfo(){
  if(curCat<0||!data)return;
  const c=data.categories[curCat];
  c.name=document.getElementById('ce-name').value;
  c.location=document.getElementById('ce-loc').value;
  c.fullTitle=document.getElementById('ce-full').value;
  c.description=document.getElementById('ce-desc').value;
  renderCatNav();markDirty();saveAll();
}

function deleteCat(){
  if(!confirm('确定删除此分类及其所有宫位和内容？'))return;
  data.categories.splice(curCat,1);curCat=-1;showSec('dashboard');renderCatNav();markDirty();saveAll();
}

function addPalace(){
  if(curCat<0||!data)return;
  const nm=document.getElementById('new-palace-name').value.trim();
  const fl=document.getElementById('new-palace-full').value.trim();
  if(!nm){toast('请输入宫位名称','err');return;}
  if(!data.categories[curCat].palaces)data.categories[curCat].palaces=[];
  const stems={};STEMS.forEach(s=>{stems[s]={title:s+'年生人命盘解读',content:''};});
  data.categories[curCat].palaces.push({id:nm,name:nm,fullTitle:fl||nm,description:'',stems});
  document.getElementById('new-palace-name').value='';
  document.getElementById('new-palace-full').value='';
  renderCatEditor();renderCatNav();markDirty();toast('✅ 宫位已添加','ok');
}

// ========== 宫位编辑（含AI排版） ==========
function renderPalEditor(){
  if(curCat<0||curPal<0||!data)return;
  const p=data.categories[curCat].palaces[curPal];
  document.getElementById('pal-edit-title').textContent='编辑 - '+p.name;
  document.getElementById('pe-name').value=p.name||'';
  document.getElementById('pe-full').value=p.fullTitle||'';
  document.getElementById('pe-desc').value=p.description||'';

  document.getElementById('stem-tabs').innerHTML=STEMS.map(s=>
    `<button class="stem-tab-btn${s===curStem?' active':''}" onclick="switchStem('${s}')">${s}</button>`
  ).join('');
  renderStemEditor();
}

function switchStem(s){curStem=s;
  document.querySelectorAll('.stem-tab-btn').forEach(b=>b.classList.toggle('active',b.textContent===s));
  renderStemEditor();
}

function renderStemEditor(){
  if(curCat<0||curPal<0||!data)return;
  const p=data.categories[curCat].palaces[curPal];
  if(!p.stems)p.stems={};
  if(!p.stems[curStem])p.stems[curStem]={title:curStem+'年生人命盘解读',content:''};
  const sd=p.stems[curStem];
  document.getElementById('stem-editor').innerHTML=`
    <div class="stem-editor-box">
      <div class="fg"><label>标题</label><input id="se-title" class="fi" value="${sd.title||''}"></div>
      <div class="fg">
        <div class="fg-label-row">
          <label>内容（Markdown 格式）</label>
          <div class="md-btns">
            <label class="md-upload-label" title="上传 .md 文件">
              📎 上传 .md
              <input type="file" accept=".md,.markdown" onchange="uploadMd(event)" hidden>
            </label>
            <button class="ai-format-btn" onclick="aiFormat()" title="按截图风格自动排版">🤖 AI 排版</button>
          </div>
        </div>
        <textarea id="se-content" class="ft" rows="14" placeholder="在此编辑 Markdown 内容，或上传 .md 文件，或点击 🤖 AI 排版 生成模板">${sd.content||''}</textarea>
      </div>
    </div>`;
}

function saveStem(){
  if(curCat<0||curPal<0||!data)return;
  const p=data.categories[curCat].palaces[curPal];
  if(!p.stems)p.stems={};
  p.stems[curStem]={
    title:document.getElementById('se-title').value,
    content:document.getElementById('se-content').value
  };
  markDirty();saveAll();
}

function savePalInfo(){
  if(curCat<0||curPal<0||!data)return;
  const p=data.categories[curCat].palaces[curPal];
  p.name=document.getElementById('pe-name').value;
  p.fullTitle=document.getElementById('pe-full').value;
  p.description=document.getElementById('pe-desc').value;
  renderCatNav();markDirty();saveAll();
}

function deletePal(){
  if(!confirm('确定删除此宫位？'))return;
  data.categories[curCat].palaces.splice(curPal,1);
  curPal=-1;showSec('category');renderCatNav();markDirty();saveAll();
}

// ========== AI 排版 ==========
function aiFormat(){
  if(curCat<0||curPal<0||!data)return;
  const cat=data.categories[curCat];
  const pal=cat.palaces[curPal];
  const starName=cat.name;
  const loc=cat.location||'';
  const palName=pal.name;
  const stem=curStem;

  const template=`## ${starName}坐${loc} · ${stem}年四化：${palName}篇

### 一、${palName}（主星化四化）
> 此处写此宫位${starName}配合${stem}干四化的核心解读

**${starName}在${palName}的特性：**
此处分析${starName}落入${palName}时的基本特质，包括：
- 星曜本身的庙旺利陷状态
- 是否与其他辅星同宫
- 三方四正的对照关系

**${stem}干四化对本宫的影响：**
此处详细解读${stem}年的化禄、化权、化科、化忌如何影响${palName}：
- **化禄入某宫：** 带来什么样的福气和机遇
- **化权入某宫：** 带来什么样的掌控力和行动力
- **化科入某宫：** 带来什么样的名声和贵人运
- **化忌入某宫：** 带来什么样的挑战和需要注意的地方

### 二、对宫与三方的影响
> 此处写四化对其他相关宫位的连锁反应

---

💡 **核心要点：**

- 要点一：此处总结${palName}在${stem}年最重要的特征
- 要点二：此处总结对命主性格或运势的关键影响
- 要点三：此处总结需要特别注意的事项或机遇
- 要点四：此处总结与其他宫位的联动关系

---

> ⚠️ 以上为${starName}在${loc}的${stem}年生年四化${palName}解读模板，请根据实际命理知识替换具体内容。`;

  const ta=document.getElementById('se-content');
  if(ta.value.trim()){
    if(!confirm('当前编辑区已有内容，覆盖将丢失。是否继续？'))return;
  }
  ta.value=template;
  markDirty();
  toast('✅ AI 排版模板已生成，请根据实际内容修改','ok');
}

// ========== 导入导出 ==========
function exportData(){
  const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='紫微斗数_'+new Date().toISOString().slice(0,10)+'.json';a.click();
  toast('✅ 已导出','ok');
}

function importData(e){
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=ev=>{
    try{const d=JSON.parse(ev.target.result);if(d.categories){data=d;renderCatNav();showSec('dashboard');toast('✅ 已导入','ok');}else toast('格式不对','err');
    }catch{toast('解析失败','err');}
  };rd.readAsText(f);e.target.value='';
}

function uploadMd(e){
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=ev=>{
    const ta=document.getElementById('se-content');
    if(ta){ta.value=ev.target.result;markDirty();toast('✅ 已加载：'+f.name,'ok');}
  };rd.readAsText(f);e.target.value='';
}

function toast(msg,type='ok'){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast '+type+' show';
  setTimeout(()=>t.className='toast',2500);
}
