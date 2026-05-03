import { useEffect, useRef } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';

const config = {
  particleCount: 78,
  trailSpan: 0.32,
  durationMs: 5400,
  rotationDurationMs: 28000,
  pulseDurationMs: 4600,
  strokeWidth: 4.5,
  roseA: 9.2,
  roseABoost: 0.6,
  roseBreathBase: 0.72,
  roseBreathBoost: 0.28,
  roseK: 5,
  roseScale: 3.25,
};

function point(progress, detailScale) {
  const t = progress * Math.PI * 2;
  const a = config.roseA + detailScale * config.roseABoost;
  const k = Math.round(config.roseK);
  const r = a * (config.roseBreathBase + detailScale * config.roseBreathBoost) * Math.cos(k * t);
  return {
    x: 50 + Math.cos(t) * r * config.roseScale,
    y: 50 + Math.sin(t) * r * config.roseScale,
  };
}

function normalize(p) { return ((p % 1) + 1) % 1; }

function getDetailScale(time) {
  const pulse = (time % config.pulseDurationMs) / config.pulseDurationMs;
  return 0.52 + ((Math.sin(pulse * Math.PI * 2 + 0.55) + 1) / 2) * 0.48;
}

function buildPath(detailScale, steps = 480) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(i / steps, detailScale);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');
}

export default function RoseCurveLoader({ size = 120, color = 'white' }) {
  const svgRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Build DOM once
    const group = document.createElementNS(SVG_NS, 'g');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', String(config.strokeWidth));
    path.setAttribute('opacity', '0.15');
    group.appendChild(path);

    const particles = Array.from({ length: config.particleCount }, () => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('fill', color);
      group.appendChild(c);
      return c;
    });

    svg.appendChild(group);
    const startedAt = performance.now();

    function render(now) {
      const time = now - startedAt;
      const progress = (time % config.durationMs) / config.durationMs;
      const ds = getDetailScale(time);
      const rot = -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;

      group.setAttribute('transform', `rotate(${rot} 50 50)`);
      path.setAttribute('d', buildPath(ds));

      particles.forEach((node, i) => {
        const tail = i / (config.particleCount - 1);
        const p = point(normalize(progress - tail * config.trailSpan), ds);
        const fade = Math.pow(1 - tail, 0.56);
        node.setAttribute('cx', p.x.toFixed(2));
        node.setAttribute('cy', p.y.toFixed(2));
        node.setAttribute('r', (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute('opacity', (0.04 + fade * 0.96).toFixed(3));
      });

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      svg.removeChild(group);
    };
  }, [color]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label="Loading…"
      role="img"
      style={{ display: 'block', overflow: 'visible' }}
    />
  );
}
