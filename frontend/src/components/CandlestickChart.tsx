import { useRef, useEffect, useCallback } from 'react';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  candles: Candle[];
  width?: number;
  height?: number;
  entryLines?: { price: number; color: string; label: string }[];
  liqLines?: { price: number; label: string }[];
  livePrice?: number;
  pairColor?: string;
}

const PRICE_AXIS_W = 72;
const TIME_AXIS_H = 24;
const PADDING_TOP = 12;
const PADDING_LEFT = 4;

function formatPrice(v: number) {
  if (v >= 10000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 1000)  return `$${v.toFixed(0)}`;
  if (v >= 1)     return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function CandlestickChart({
  candles, height = 320, entryLines = [], liqLines = [], livePrice = 0, pairColor = '#6366f1'
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const H = height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Dimensions
    const chartW = W - PRICE_AXIS_W - PADDING_LEFT;
    const chartH = H - TIME_AXIS_H - PADDING_TOP;

    // Price range
    const visibleCandles = candles.slice(-Math.min(candles.length, 120));
    const allHighs = visibleCandles.map(c => c.high);
    const allLows  = visibleCandles.map(c => c.low);
    let priceMax = Math.max(...allHighs);
    let priceMin = Math.min(...allLows);
    // include reference lines in range
    [...entryLines, ...liqLines].forEach(l => {
      if (l.price > priceMax) priceMax = l.price;
      if (l.price < priceMin) priceMin = l.price;
    });
    if (livePrice) {
      if (livePrice > priceMax) priceMax = livePrice;
      if (livePrice < priceMin) priceMin = livePrice;
    }
    const priceRange = priceMax - priceMin || 1;
    const paddedMin = priceMin - priceRange * 0.04;
    const paddedMax = priceMax + priceRange * 0.04;
    const paddedRange = paddedMax - paddedMin;

    const toY = (price: number) =>
      PADDING_TOP + chartH - ((price - paddedMin) / paddedRange) * chartH;

    // Candle sizing
    const n = visibleCandles.length;
    const candleW = Math.max(2, Math.floor((chartW / n) * 0.72));
    const gap = chartW / n;

    // ── Background
    ctx.fillStyle = 'transparent';
    ctx.clearRect(0, 0, W, H);

    // ── Grid lines
    const gridCount = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
      const y = PADDING_TOP + (chartH / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(PADDING_LEFT, y);
      ctx.lineTo(PADDING_LEFT + chartW, y);
      ctx.stroke();
    }

    // ── Price axis labels
    ctx.fillStyle = 'rgba(145,145,168,0.8)';
    ctx.font = `500 9px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    for (let i = 0; i <= gridCount; i++) {
      const price = paddedMax - (paddedRange / gridCount) * i;
      const y = PADDING_TOP + (chartH / gridCount) * i;
      ctx.fillText(formatPrice(price), PADDING_LEFT + chartW + 4, y + 3);
    }

    // ── Candles
    visibleCandles.forEach((c, i) => {
      const x = PADDING_LEFT + gap * i + gap / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? '#10b981' : '#f43f5e';

      const openY  = toY(c.open);
      const closeY = toY(c.close);
      const highY  = toY(c.high);
      const lowY   = toY(c.low);

      const bodyTop    = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      const halfW      = candleW / 2;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      if (isUp) {
        ctx.fillRect(x - halfW, bodyTop, candleW, bodyHeight);
      } else {
        ctx.fillRect(x - halfW, bodyTop, candleW, bodyHeight);
      }
    });

    // ── Time axis labels
    const labelEvery = Math.max(1, Math.floor(n / 8));
    ctx.fillStyle = 'rgba(145,145,168,0.7)';
    ctx.font = `500 9px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    visibleCandles.forEach((c, i) => {
      if (i % labelEvery === 0 || i === n - 1) {
        const x = PADDING_LEFT + gap * i + gap / 2;
        ctx.fillText(formatTime(c.time), x, H - 6);
      }
    });

    // ── Reference lines
    const drawRefLine = (price: number, color: string, dash: number[], label: string, labelRight = true) => {
      const y = toY(price);
      if (y < PADDING_TOP - 5 || y > PADDING_TOP + chartH + 5) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(PADDING_LEFT, y);
      ctx.lineTo(PADDING_LEFT + chartW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (label) {
        ctx.fillStyle = color;
        ctx.font = `bold 9px "Inter", sans-serif`;
        ctx.textAlign = labelRight ? 'right' : 'left';
        ctx.fillText(label, labelRight ? PADDING_LEFT + chartW - 4 : PADDING_LEFT + 4, y - 3);
      }
    };

    // Entry lines
    entryLines.forEach(l => drawRefLine(l.price, l.color, [4, 3], l.label, false));
    // Liq lines
    liqLines.forEach(l => drawRefLine(l.price, 'rgba(244,63,94,0.6)', [2, 3], l.label, false));
    // Live price
    if (livePrice > 0) {
      drawRefLine(livePrice, 'rgba(255,255,255,0.35)', [4, 4], `${formatPrice(livePrice)}`, true);
    }
  }, [candles, height, entryLines, liqLines, livePrice, pairColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const obs = new ResizeObserver(() => draw());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ width: '100%', height, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
    </div>
  );
}
