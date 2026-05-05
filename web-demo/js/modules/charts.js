// === SIMPLE CHART LIBRARY (Canvas-based) ===
const SimpleChart = {
  // Bar chart
  bar(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = options.height || 200;
    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.min(40, (w - 60) / data.length - 10);
    const chartH = h - 40;
    const colors = options.colors || ['#00B4D8', '#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#8338EC'];

    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const x = 40 + i * (barWidth + 10);
      const y = chartH - barH + 10;

      // Bar
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Value
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.value, x + barWidth / 2, y - 5);

      // Label
      ctx.fillStyle = '#8899AA';
      ctx.font = '10px Inter, sans-serif';
      ctx.save();
      ctx.translate(x + barWidth / 2, h - 2);
      const label = d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label;
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  },

  // Donut chart
  donut(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    const size = options.size || 180;
    canvas.width = size + 140;
    canvas.height = size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = size / 2, cy = size / 2, r = size / 2 - 10, innerR = r * 0.6;
    const colors = ['#00B4D8', '#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#8338EC'];
    let angle = -Math.PI / 2;

    data.forEach((d, i) => {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.arc(cx, cy, innerR, angle + slice, angle, true);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Legend
      const ly = 15 + i * 22;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(size + 10, ly - 8, 12, 12);
      ctx.fillStyle = '#E8EDF2';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      const pct = total > 0 ? Math.round(d.value / total * 100) : 0;
      ctx.fillText(`${d.label} (${pct}%)`, size + 28, ly + 2);

      angle += slice;
    });

    // Center text
    ctx.fillStyle = '#E8EDF2';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy);
  }
};
