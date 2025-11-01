
async function load() {
  const res = await fetch('data.json');
  const data = await res.json();
  const grid = document.getElementById('grid');
  const tpl = document.getElementById('card-tpl');
  const search = document.getElementById('search');
  const category = document.getElementById('category');

  const cats = [...new Set(data.map(x => (x.category||'').trim()).filter(Boolean))].sort();
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    category.appendChild(opt);
  }

  function render() {
    const q = (search.value || '').toLowerCase();
    const cat = category.value;
    grid.innerHTML = '';
    for (const item of data) {
      const text = [item.title,item.category,item.tvg_name].map(x => (x||'').toLowerCase()).join(' ');
      if (q && !text.includes(q)) continue;
      if (cat && (item.category||'') !== cat) continue;

      const node = tpl.content.cloneNode(true);
      const aImg = node.querySelector('.image-link');
      const img = node.querySelector('img');
      const title = node.querySelector('.title');
      const meta = node.querySelector('.meta');
      const open = node.querySelector('.open');
      const copy = node.querySelector('.copy');

      title.textContent = item.title || '(untitled)';
      meta.textContent = [item.category || 'Stream', item.tvg_name || ''].filter(Boolean).join(' • ');

      if (item.url) {
        aImg.href = item.url;
        open.href = item.url;
      } else {
        open.style.display = 'none';
        aImg.removeAttribute('href');
      }

      if (item.image) {
        img.src = item.image;
        img.alt = item.title || '';
      } else {
        img.alt = '';
      }

      copy.addEventListener('click', async () => {
        if (item.url) {
          await navigator.clipboard.writeText(item.url);
          copy.textContent = 'Copied!';
          setTimeout(() => copy.textContent = 'Copy link', 1200);
        }
      });

      grid.appendChild(node);
    }
  }

  search.addEventListener('input', render);
  category.addEventListener('change', render);
  render();
}
load();
