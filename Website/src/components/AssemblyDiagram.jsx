import { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { useBrandColors } from '../lib/ThemeModeContext';
import { useLanguage } from '../lib/LanguageContext';

const PARTS = [
  {
    id: '1',
    label: [
      'Name every part, once, consistently.',
      'לתת שם לכל רכיב — פעם אחת, באופן עקבי.',
    ],
  },
  {
    id: '2',
    label: [
      'Write the procedure a technician can follow.',
      'לכתוב נוהל שטכנאי יכול באמת לבצע.',
    ],
  },
  {
    id: '3',
    label: ['Train the people who will use it.', 'להדריך את מי שישתמש במערכת.'],
  },
  {
    id: '4',
    label: [
      'Keep it current as the product changes.',
      'לתחזק את התיעוד ככל שהמוצר משתנה.',
    ],
  },
];

function Bubble({ x, y, n, dim }) {
  const brand = useBrandColors();
  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.25 : 1} style={{ transition: 'opacity .2s' }}>
      <circle cx="14" cy="14" r="14" fill={brand.forest} />
      <text x="14" y="19" textAnchor="middle" fontFamily="Noto Sans Mono, monospace" fontSize="13" fontWeight="600" fill="#fff">
        {n}
      </text>
    </g>
  );
}

export default function AssemblyDiagram() {
  const { t } = useLanguage();
  const brand = useBrandColors();
  const [active, setActive] = useState(null);
  const dim = (id) => active !== null && active !== id;

  return (
    <Box>
      <Box
        sx={{
          bgcolor: brand.surface,
          border: `1px solid ${brand.rule}`,
          borderRadius: '14px',
          p: '14px',
        }}
      >
        <svg
          viewBox="0 0 700 520"
          role="img"
          aria-label="An exploded assembly drawing with four numbered callouts: name every part, write the procedure, train the technician, keep it current."
          style={{ display: 'block', width: '100%', height: 'auto' }}
        >
          <defs>
            <linearGradient id="pl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#A7D95F" />
              <stop offset="1" stopColor="#77B22F" />
            </linearGradient>
            <linearGradient id="pl2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8CC63E" />
              <stop offset="1" stopColor="#5E9424" />
            </linearGradient>
          </defs>

          <path d="M70 430 L640 110" stroke="#C4D6B8" strokeWidth="1" strokeDasharray="7 6" />

          <g
            opacity={dim('1') ? 0.24 : 1}
            style={{ transition: 'opacity .2s', cursor: 'pointer' }}
            onMouseEnter={() => setActive('1')}
            onMouseLeave={() => setActive(null)}
          >
            <g transform="rotate(-30 150 400)">
              <rect x="72" y="372" width="176" height="60" rx="30" fill="url(#pl)" />
              <circle cx="104" cy="402" r="15" fill="#F1F5EC" />
              <circle cx="216" cy="402" r="15" fill="#F1F5EC" />
            </g>
          </g>

          <g
            opacity={dim('2') ? 0.24 : 1}
            style={{ transition: 'opacity .2s', cursor: 'pointer' }}
            onMouseEnter={() => setActive('2')}
            onMouseLeave={() => setActive(null)}
          >
            <g transform="rotate(-30 300 316)">
              <rect x="222" y="288" width="176" height="58" rx="29" fill="url(#pl2)" />
              <circle cx="254" cy="317" r="14" fill="#F1F5EC" />
              <circle cx="366" cy="317" r="14" fill="#F1F5EC" />
            </g>
          </g>

          <g
            opacity={dim('3') ? 0.24 : 1}
            style={{ transition: 'opacity .2s', cursor: 'pointer' }}
            onMouseEnter={() => setActive('3')}
            onMouseLeave={() => setActive(null)}
          >
            <ellipse cx="432" cy="238" rx="40" ry="27" fill="none" stroke={brand.forest} strokeWidth="13" />
            <ellipse cx="500" cy="200" rx="40" ry="27" fill="none" stroke="#3E6B2A" strokeWidth="13" />
          </g>

          <g
            opacity={dim('4') ? 0.24 : 1}
            style={{ transition: 'opacity .2s', cursor: 'pointer' }}
            onMouseEnter={() => setActive('4')}
            onMouseLeave={() => setActive(null)}
          >
            <g transform="rotate(-30 580 148)">
              <rect x="500" y="126" width="164" height="44" rx="22" fill="#5E9424" />
              <rect x="500" y="126" width="52" height="44" rx="22" fill="#8CC63E" />
            </g>
          </g>

          <g strokeLinecap="round">
            <g opacity={dim('1') ? 0.24 : 1} style={{ transition: 'opacity .2s' }}>
              <path d="M172 424 L150 492 L84 492" stroke={brand.annot} strokeWidth="1.4" fill="none" />
              <Bubble x={56} y={478} n="01" />
            </g>
            <g opacity={dim('2') ? 0.24 : 1} style={{ transition: 'opacity .2s' }}>
              <path d="M300 316 L170 244 L100 244" stroke={brand.annot} strokeWidth="1.4" fill="none" />
              <Bubble x={66} y={230} n="02" />
            </g>
            <g opacity={dim('3') ? 0.24 : 1} style={{ transition: 'opacity .2s' }}>
              <path d="M470 252 L520 350 L594 350" stroke={brand.annot} strokeWidth="1.4" fill="none" />
              <Bubble x={600} y={336} n="03" />
            </g>
            <g opacity={dim('4') ? 0.24 : 1} style={{ transition: 'opacity .2s' }}>
              <path d="M566 132 L520 64 L490 64" stroke={brand.annot} strokeWidth="1.4" fill="none" />
              <Bubble x={456} y={50} n="04" />
            </g>
          </g>
        </svg>
      </Box>

      <List
        sx={{
          mt: '18px',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: '10px 20px',
          p: 0,
        }}
      >
        {PARTS.map((part) => (
          <ListItem
            key={part.id}
            disableGutters
            onMouseEnter={() => setActive(part.id)}
            onMouseLeave={() => setActive(null)}
            sx={{
              display: 'flex',
              gap: '11px',
              alignItems: 'flex-start',
              p: 0,
              cursor: 'default',
            }}
          >
            <Box
              sx={{
                flex: '0 0 auto',
                width: 25,
                height: 25,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'Noto Sans Mono, monospace',
                fontSize: 12,
                fontWeight: 600,
                bgcolor: active === part.id ? brand.forest : brand.green,
                color: active === part.id ? '#fff' : '#12240F',
                transition: 'background-color .15s, color .15s',
              }}
            >
              {part.id.padStart(2, '0')}
            </Box>
            <Typography variant="body2" sx={{ fontSize: '14.5px', lineHeight: 1.4 }}>
              {t(part.label[0], part.label[1])}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
