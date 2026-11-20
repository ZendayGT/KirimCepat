(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
  const tgl = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  const URUTAN = ['DIBUAT', 'DIJEMPUT', 'TRANSIT', 'DIANTAR', 'DITERIMA'];

  // Panggilan API; melempar Error dengan pesan dari server
  async function api(url, opts = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Permintaan gagal (${res.status})`);
    return data;
  }
  const msg = (el, text, type) => { el.className = 'note ' + (type || ''); el.textContent = text; };
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  // Tab
  function showTab(name) {
    document.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name));
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = p.id !== name));
    history.replaceState(null, '', '#' + name);
  }
  document.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  const start = location.hash.slice(1);
  if (['lacak', 'kirim', 'kurir'].includes(start)) showTab(start);

  // Lacak resi
  async function lacak(resi) {
    const box = $('#hasil-lacak');
    box.replaceChildren();
    try {
      const d = await api('/api/track/' + encodeURIComponent(resi.trim().toUpperCase()));
      const wrap = el('div', 'result');

      const info = el('div', 'card');
      const dl = el('dl', 'meta');
      [['Nomor resi', d.resi], ['Pengirim', d.pengirim], ['Penerima', d.penerima], ['Tujuan', d.alamat_tujuan]]
        .forEach(([k, v]) => { const g = el('div'); g.append(el('dt', '', k), el('dd', '', v)); dl.append(g); });
      const st = el('div'); st.append(el('dt', '', 'Status saat ini'), el('span', 'badge', d.status));
      dl.append(st); info.append(dl);

      const jalur = el('div', 'card');
      const ol = el('ol', 'route');
      const hist = d.history || [];
      hist.forEach((h, i) => {
        const li = el('li', i === hist.length - 1 ? 'now' : 'done');
        li.append(el('strong', '', h.status), el('small', '', tgl(h.created_at) + (h.catatan ? ' · ' + h.catatan : '')));
        ol.append(li);
      });
      jalur.append(ol);
      wrap.append(info, jalur);
      box.append(wrap);
    } catch (e) {
      const p = el('p', 'note err', e.message.includes('404') || /tidak ditemukan/i.test(e.message)
        ? 'Resi tidak ditemukan. Periksa kembali nomornya.' : e.message);
      box.append(p);
    }
  }
  $('#form-lacak').addEventListener('submit', (e) => { e.preventDefault(); lacak($('#in-resi').value); });

  // Hitung ongkir
  const fk = $('#form-kirim');
  const num = (n) => Number(fk.elements[n].value || 0);
  async function hitung() {
    const d = await api('/api/ongkir', {
      method: 'POST',
      body: { berat: num('berat'), p: num('p'), l: num('l'), t: num('t'), zona: fk.elements.zona.value },
    });
    $('#out-ongkir').textContent = rupiah(d.ongkir);
    $('#out-detail').textContent = d.berat_dihitung ? `Dihitung dari ${d.berat_dihitung} kg` : 'Ongkir berhasil dihitung.';
    return d;
  }
  $('#btn-hitung').addEventListener('click', async () => {
    if (!fk.reportValidity()) return;
    try { await hitung(); } catch (e) { $('#out-detail').textContent = e.message; }
  });

  // Buat pengiriman
  fk.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#out-resi');
    out.replaceChildren();
    try {
      const f = fk.elements;
      const d = await api('/api/shipments', {
        method: 'POST',
        body: {
          pengirim: f.pengirim.value, penerima: f.penerima.value, alamat_tujuan: f.alamat_tujuan.value,
          zona: f.zona.value, berat: num('berat'), p: num('p'), l: num('l'), t: num('t'),
        },
      });
      $('#out-ongkir').textContent = rupiah(d.ongkir);
      $('#out-detail').textContent = 'Pengiriman dibuat. Simpan nomor resi ini:';
      out.append(el('span', 'code', d.resi));
      fk.reset();
    } catch (err) {
      out.append(el('p', 'note err', err.message));
    }
  });

  // Kurir: perbarui status
  const fc = $('#form-kurir');
  fc.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = $('#out-kurir');
    const f = fc.elements;
    try {
      const d = await api(`/api/shipments/${encodeURIComponent(f.resi.value.trim().toUpperCase())}/status`, {
        method: 'PATCH', body: { status: f.status.value, catatan: f.catatan.value },
      });
      msg(out, `Status ${d.resi || f.resi.value} diperbarui menjadi ${d.status || f.status.value}.`, 'ok');
      f.catatan.value = '';
    } catch (err) {
      msg(out, err.message, 'err');
    }
  });
})();
