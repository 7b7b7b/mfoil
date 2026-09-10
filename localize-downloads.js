import { toEnglish } from './site-english.js';

const key = 'mfoil-language';
const detected = () => /^zh\b/i.test(navigator.languages?.[0] || navigator.language || 'en') ? 'zh' : 'en';
const saved = () => { try { const value = localStorage.getItem(key); return value === 'zh' || value === 'en' ? value : null; } catch { return null; } };
let language = saved() || detected();
const originals = new WeakMap();
const attributes = new WeakMap();
const controls = document.createElement('div');
controls.setAttribute('role', 'group');
controls.style.cssText = 'display:flex;gap:6px;align-items:center';
const buttons = ['zh','en'].map(value => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = value === 'zh' ? 'CN' : 'EN';
  button.style.cssText = 'font:inherit;font-size:16px;padding:5px 12px;border:1px solid currentColor;border-radius:20px;cursor:pointer';
  button.addEventListener('click', () => {
    language = value;
    try { localStorage.setItem(key, value); } catch {}
    apply();
  });
  controls.append(button);
  return button;
});
document.querySelector('.headlinks')?.append(controls);
let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; apply(); });
});
function apply() {
  observer.disconnect();
  const en = language === 'en';
  document.documentElement.lang = en ? 'en' : 'zh-CN';
  document.title = en ? 'Paper PDF Downloads · MFOIL' : '论文 PDF 下载清单 · MFOIL';
  controls.setAttribute('aria-label', en ? 'Language' : '语言');
  buttons.forEach((button,index) => {
    const active = language === (index === 0 ? 'zh' : 'en');
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', en ? (index === 0 ? 'Switch to Chinese' : 'Switch to English') : (index === 0 ? '切换为中文' : '切换为英文'));
    button.style.background = active ? '#22271f' : 'transparent';
    button.style.color = active ? '#fff' : '#22271f';
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script,style,textarea,[contenteditable="true"]') || controls.contains(node)) continue;
    let record = originals.get(node);
    if (!record || node.nodeValue !== record.rendered) record = {original:node.nodeValue};
    const output = en ? toEnglish(record.original) : record.original;
    if (node.nodeValue !== output) node.nodeValue = output;
    record.rendered = output;
    originals.set(node,record);
  }
  for (const element of document.querySelectorAll('[placeholder],[aria-label],[title],[alt]')) {
    if (controls.contains(element) || element === controls) continue;
    const record = attributes.get(element) || {};
    for (const attribute of ['placeholder','aria-label','title','alt']) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute);
      if (!record[attribute] || current !== record[attribute].rendered) record[attribute] = {original:current};
      const output = en ? toEnglish(record[attribute].original) : record[attribute].original;
      if (output !== current) element.setAttribute(attribute,output);
      record[attribute].rendered = output;
    }
    attributes.set(element,record);
  }
  observer.observe(document.body, {subtree:true,childList:true,characterData:true});
}
window.addEventListener('storage', event => { if (event.key === key || event.key === null) { language = saved() || detected(); apply(); } });
window.addEventListener('languagechange', () => { if (!saved()) { language = detected(); apply(); } });
apply();
