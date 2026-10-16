import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { keyframes } from '@emotion/react';
import { useLanguage } from '../lib/LanguageContext';
import { useBrandColors } from '../lib/ThemeModeContext';
import CLIENTS from '../data/clients';

/* Two ways of showing the companies we work with (src/data/clients.js):
   · <LogoMarquee />   an endless, two-row sliding strip (pauses on hover)
   · <LogoCloud />     logo cards floating gently over a dark section
   Both fall back to a still layout when the visitor prefers reduced motion. */

const slide = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;
const bob = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--tilt, 0deg)); }
  50%      { transform: translate3d(var(--dx, 6px), var(--dy, -14px), 0) rotate(calc(var(--tilt, 0deg) * -1)); }
`;

function initials(name) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/* the official logo file when there is one, otherwise a neutral wordmark */
function Logo({ client, dark, size = 'md' }) {
  const brand = useBrandColors();
  const { t, lang } = useLanguage();
  const big = size === 'lg';
  if (client.logo) {
    return (
      <Box
        component="img"
        src={`logos/${client.logo}`}
        alt={client.name}
        loading="lazy"
        sx={{
          height: big ? 46 : 38,
          maxWidth: big ? 170 : 150,
          objectFit: 'contain',
          filter: dark ? 'brightness(0) invert(1)' : 'grayscale(1)',
          opacity: dark ? 0.85 : 0.75,
          transition: 'filter .25s, opacity .25s',
          '.logo-card:hover &': { filter: 'none', opacity: 1 },
        }}
      />
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }} aria-label={client.name}>
      <Box
        aria-hidden="true"
        sx={{
          width: big ? 42 : 36,
          height: big ? 42 : 36,
          flex: 'none',
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: big ? 14 : 12.5,
          letterSpacing: '.04em',
          color: dark ? '#12240F' : '#fff',
          background: dark ? brand.green : `linear-gradient(135deg, ${brand.greenDeep}, ${brand.forest})`,
        }}
      >
        {initials(client.name)}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontWeight: 700,
            fontSize: big ? 16.5 : 15.5,
            letterSpacing: '-.01em',
            whiteSpace: 'nowrap',
            color: dark ? '#EAF2E4' : brand.forest,
          }}
        >
          {lang === 'he' && client.he ? client.he : client.name}
        </Typography>
        {client.sector ? (
          <Typography
            component="span"
            sx={{ display: 'block', fontSize: 12, whiteSpace: 'nowrap', color: dark ? '#A9BFA2' : brand.steel }}
          >
            {t(client.sector[0], client.sector[1])}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function MarqueeRow({ items, reverse, seconds }) {
  const brand = useBrandColors();
  /* the list twice, so sliding by half its width loops seamlessly */
  const loop = items.concat(items);
  return (
    <Box
      sx={{
        overflow: 'hidden',
        direction: 'ltr',
        maskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 9%, #000 91%, transparent)',
        '&:hover .track, &:focus-within .track': { animationPlayState: 'paused' },
      }}
    >
      <Box
        className="track"
        sx={{
          display: 'flex',
          width: 'max-content',
          gap: '16px',
          py: '6px',
          animation: `${slide} ${seconds}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', flexWrap: 'wrap', width: 'auto', justifyContent: 'center' },
        }}
      >
        {loop.map((c, i) => (
          <Box
            key={i}
            className="logo-card"
            aria-hidden={i >= items.length ? 'true' : undefined}
            sx={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              px: '20px',
              height: 72,
              borderRadius: '14px',
              border: `1px solid ${brand.rule}`,
              bgcolor: 'background.paper',
              transition: 'transform .25s, border-color .25s, box-shadow .25s',
              '&:hover': { transform: 'translateY(-3px)', borderColor: brand.green, boxShadow: '0 10px 26px rgba(20,48,28,.12)' },
              '@media (prefers-reduced-motion: reduce)': { display: i >= items.length ? 'none' : 'flex' },
            }}
          >
            <Logo client={c} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function LogoMarquee() {
  const { t } = useLanguage();
  const brand = useBrandColors();
  if (!CLIENTS.length) return null;
  const half = Math.ceil(CLIENTS.length / 2);
  /* with few clients both rows show everyone, offset so they don't line up */
  const rowA = CLIENTS.length < 8 ? CLIENTS : CLIENTS.slice(0, half);
  const rowB = CLIENTS.length < 8 ? CLIENTS.slice(half).concat(CLIENTS.slice(0, half)) : CLIENTS.slice(half);
  return (
    <Box component="section" aria-label={t('Companies we work with', 'חברות שאנחנו עובדים איתן')} sx={{ py: { xs: '30px', md: '44px' }, bgcolor: brand.surface, borderTop: `1px solid ${brand.rule}`, borderBottom: `1px solid ${brand.rule}` }}>
      <Typography
        sx={{
          textAlign: 'center',
          fontFamily: 'Noto Sans Mono, monospace',
          fontSize: 12.5,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: brand.annot,
          mb: '20px',
          px: '16px',
        }}
      >
        {t('Trusted by engineering teams across Israeli industry', 'צוותי הנדסה בתעשייה הישראלית סומכים עלינו')}
      </Typography>
      <Box sx={{ display: 'grid', gap: '14px' }}>
        <MarqueeRow items={rowA} seconds={Math.max(28, rowA.length * 6)} />
        <MarqueeRow items={rowB} seconds={Math.max(34, rowB.length * 7)} reverse />
      </Box>
    </Box>
  );
}

/* fixed, hand-placed slots (percent of the cloud box) so the layout is calm, not random */
const SLOTS = [
  { x: 4, y: 6, tilt: -3, d: 9 },
  { x: 52, y: 0, tilt: 2, d: 11 },
  { x: 26, y: 30, tilt: 3, d: 10 },
  { x: 62, y: 40, tilt: -2, d: 12 },
  { x: 0, y: 58, tilt: 2, d: 8.5 },
  { x: 34, y: 74, tilt: -3, d: 10.5 },
  { x: 70, y: 80, tilt: 3, d: 9.5 },
  { x: 14, y: 90, tilt: -2, d: 11.5 },
];

export function LogoCloud() {
  const { t } = useLanguage();
  if (!CLIENTS.length) return null;
  const shown = CLIENTS.slice(0, SLOTS.length);
  return (
    <Box
      role="list"
      aria-label={t('Companies we work with', 'חברות שאנחנו עובדים איתן')}
      sx={{
        position: 'relative',
        minHeight: { xs: 'auto', md: 420 },
        display: { xs: 'grid', md: 'block' },
        gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(220px, 1fr))' },
        gap: { xs: '12px' },
      }}
    >
      {shown.map((c, i) => {
        const s = SLOTS[i];
        return (
          <Box
            key={c.name}
            role="listitem"
            className="logo-card"
            sx={{
              position: { xs: 'static', md: 'absolute' },
              insetInlineStart: { md: `${s.x}%` },
              top: { md: `${s.y * 0.82}%` },
              '--tilt': `${s.tilt}deg`,
              '--dx': `${i % 2 ? -7 : 7}px`,
              '--dy': `${i % 3 ? -12 : -18}px`,
              display: 'inline-flex',
              alignItems: 'center',
              px: '18px',
              py: '14px',
              borderRadius: '16px',
              border: '1px solid #2C4A32',
              bgcolor: 'rgba(26,56,34,.78)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 18px 40px rgba(0,0,0,.28)',
              animation: { md: `${bob} ${s.d}s ease-in-out ${-i * 1.3}s infinite` },
              transition: 'border-color .25s, background-color .25s',
              '&:hover': { borderColor: '#8CC63E', bgcolor: 'rgba(31,61,36,.95)', animationPlayState: 'paused' },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <Logo client={c} dark size="lg" />
          </Box>
        );
      })}
    </Box>
  );
}
