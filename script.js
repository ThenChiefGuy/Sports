
async function main(){
  const grid = document.getElementById('grid');
  const tpl = document.getElementById('card-tpl');
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  const sort = document.getElementById('sort');

  const res = await fetch('data.json');
  let data = await res.json();

  // Normalize
  data = data.map(x => ({
    title: (x.title || x.tvg_name || 'Untitled').trim(),
    url: (x.url || '').trim(),
    image: x.image || '',
    category: (x.category || 'Streams').trim(),
    tvg_name: x.tvg_name || ''
  })).filter(x => x.url);

  // Categories
  const cats = [...new Set(data.map(x => x.category).filter(Boolean))].sort();
  for(const c of cats){
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    category.appendChild(opt);
  }

  function sorted(arr){
    const by = sort.value;
    if(by === 'group'){
      return [...arr].sort((a,b) => (a.category||'').localeCompare(b.category||'') || a.title.localeCompare(b.title));
    }
    return [...arr].sort((a,b) => a.title.localeCompare(b.title));
  }

  function render(){
    const q = (search.value || '').toLowerCase();
    const cat = category.value;
    const filtered = sorted(data).filter(item => {
      const blob = [item.title,item.category,item.tvg_name].join(' ').toLowerCase();
      return (!q || blob.includes(q)) && (!cat || item.category === cat);
    });

    grid.innerHTML='';
    if(!filtered.length){
      const p = document.createElement('p');
      p.textContent = 'No matches.';
      p.style.color = 'var(--muted)';
      grid.appendChild(p);
      return;
    }

    for(const item of filtered){
      const node = tpl.content.cloneNode(true);
      const img = node.querySelector('.thumb');
      const title = node.querySelector('.title');
      const meta = node.querySelector('.meta');
      const btnOpen = node.querySelector('.open-app');
      const btnCopy = node.querySelector('.copy');
      const btnMore = node.querySelector('.more');
      const btnTest = node.querySelector('.test');

      title.textContent = item.title;
      meta.textContent = [item.category, item.tvg_name].filter(Boolean).join(' • ');
      if(item.image){ img.src = item.image; img.alt = item.title; }

      // Generate and download a tiny M3U file on click
      btnOpen.addEventListener('click', () => {
        const text = '#EXTM3U\n#EXTINF:-1 group-title="' + (item.category||'Streams') + '",' + (item.title||'Stream') + '\n' + item.url + '\n';
        const blob = new Blob([text], {type: 'audio/x-mpegurl'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (item.title || 'stream').replace(/[^\w\-]+/g,'_').slice(0,60) + '.m3u';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 100);
      });

      btnCopy.addEventListener('click', async () => {
        try{
          await navigator.clipboard.writeText(item.url);
          btnCopy.textContent = 'Copied!';
          setTimeout(()=> btnCopy.textContent = 'Copy URL', 1200);
        }catch(e){ btnCopy.textContent = 'Copy failed'; setTimeout(()=> btnCopy.textContent = 'Copy URL', 1200); }
      });

      btnMore.addEventListener('click', () => {
        const det = node.querySelector('.advanced');
        det.open = !det.open;
      });

      // Optional test (may fail due to CORS/geo/token)
      btnTest.addEventListener('click', () => {
        window.open(item.url, '_blank', 'noopener');
      });

      grid.appendChild(node);
    }
  }

  search.addEventListener('input', render);
  category.addEventListener('change', render);
  sort.addEventListener('change', render);
  render();
}
main();
