
async function main(){
  const grid = document.getElementById('grid');
  const tpl = document.getElementById('card-tpl');
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  const sort = document.getElementById('sort');
  const modal = document.getElementById('modal');
  const player = document.getElementById('player');
  const status = document.getElementById('status');
  const btnClose = modal.querySelector('.close');

  const res = await fetch('data.json');
  let data = await res.json();

  // Normalize and clean
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

  function sortData(arr){
    if(sort.value === 'group'){
      return [...arr].sort((a,b) => (a.category||'').localeCompare(b.category||'') || a.title.localeCompare(b.title));
    }
    return [...arr].sort((a,b) => a.title.localeCompare(b.title));
  }

  function render(){
    const q = (search.value || '').toLowerCase();
    const cat = category.value;
    const filtered = sortData(data).filter(item => {
      const blob = [item.title,item.category,item.tvg_name].join(' ').toLowerCase();
      return (!q || blob.includes(q)) && (!cat || item.category === cat);
    });

    grid.innerHTML = '';
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
      const open = node.querySelector('.open');
      const copy = node.querySelector('.copy');
      const play = node.querySelector('.play');
      const playBtn = node.querySelector('.play-btn');

      title.textContent = item.title;
      meta.textContent = [item.category, item.tvg_name].filter(Boolean).join(' • ');
      open.href = item.url;

      if(item.image){ img.src = item.image; img.alt = item.title; } else { img.removeAttribute('src'); }

      function openPlayer(){
        status.textContent = '';
        modal.setAttribute('aria-hidden','false');
        // Reset player
        player.pause();
        player.removeAttribute('src');
        player.load();

        const isHls = /\.m3u8(\?|$)/i.test(item.url);
        if(player.canPlayType('application/vnd.apple.mpegurl') && isHls){
          player.src = item.url;
          player.play().catch(e => status.textContent = 'Autoplay blocked: press play.');
        } else if(window.Hls && isHls){
          const hls = new Hls();
          hls.loadSource(item.url);
          hls.attachMedia(player);
          hls.on(Hls.Events.ERROR, function (event, data) {
            status.textContent = 'Playback error: ' + (data && data.details ? data.details : 'Unknown');
          });
          player.play().catch(e => status.textContent = 'Autoplay blocked: press play.');
        } else {
          // Non-HLS or unsupported: fall back to direct URL
          player.src = item.url;
          player.play().catch(e => status.textContent = 'If this does not play in the browser, copy the link and open it in VLC.');
        }
      }

      play.addEventListener('click', openPlayer);
      playBtn.addEventListener('click', openPlayer);

      copy.addEventListener('click', async () => {
        try{
          await navigator.clipboard.writeText(item.url);
          copy.textContent = 'Copied!';
          setTimeout(() => copy.textContent = 'Copy Link', 1200);
        }catch(e){
          status.textContent = 'Copy failed: ' + e.message;
        }
      });

      grid.appendChild(node);
    }
  }

  btnClose.addEventListener('click', () => {
    modal.setAttribute('aria-hidden','true');
    player.pause();
  });
  search.addEventListener('input', render);
  category.addEventListener('change', render);
  sort.addEventListener('change', render);
  render();
}
main();
