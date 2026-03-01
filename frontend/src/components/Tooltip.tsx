import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

export default function Tooltip({ content, children, position = 'top', delay = 300, maxWidth = 220 }: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timer.current = setTimeout(() => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const GAP = 8;
      let top = 0, left = 0;
      if (position === 'top')    { top = r.top - GAP;        left = r.left + r.width / 2; }
      if (position === 'bottom') { top = r.bottom + GAP;     left = r.left + r.width / 2; }
      if (position === 'left')   { top = r.top + r.height / 2; left = r.left - GAP; }
      if (position === 'right')  { top = r.top + r.height / 2; left = r.right + GAP; }
      setCoords({ top, left });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const transformMap: Record<string, string> = {
    top:    'translateX(-50%) translateY(-100%)',
    bottom: 'translateX(-50%)',
    left:   'translateX(-100%) translateY(-50%)',
    right:  'translateY(-50%)',
  };

  return (
    <span ref={wrapRef} style={{ display: 'contents' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && content && createPortal(
        <span
          className="pointer-events-none z-[9999]"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: transformMap[position],
            maxWidth,
          }}>
          <span
            className="block px-2.5 py-1.5 rounded-lg text-xs leading-relaxed shadow-2xl"
            style={{
              background: '#1e2329',
              border: '1px solid #2b3139',
              color: '#eaecef',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}>
            {content}
          </span>
        </span>,
        document.body
      )}
    </span>
  );
}
