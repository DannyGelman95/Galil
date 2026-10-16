import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useLanguage } from '../lib/LanguageContext';

const NAV = [
  { to: '/', en: 'Home', he: 'בית' },
  { to: '/services', en: 'What we do', he: 'מה אנחנו עושים' },
  { to: '/careers', en: 'Careers', he: 'דרושים' },
  { to: '/contact', en: 'Contact', he: 'צור קשר' },
];

function SocialIcon({ href, label, path, viewBox = '0 0 24 24' }) {
  return (
    <IconButton
      component="a"
      href={href}
      aria-label={label}
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: '#1A3822',
        border: '1px solid #2C4A32',
        '&:hover': { bgcolor: 'primary.main', '& svg': { fill: '#12240F' } },
      }}
    >
      <svg viewBox={viewBox} width={16} height={16}>
        <path d={path} fill="#C6DABE" />
      </svg>
    </IconButton>
  );
}

export default function Footer() {
  const { t } = useLanguage();
  return (
    <Box component="footer" sx={{ bgcolor: '#14301C', color: '#96AE8E', py: '46px', fontSize: '14.5px' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '22px', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, letterSpacing: '.06em', fontSize: 19, mb: '4px' }}>
              GALIL
            </Typography>
            <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
              {t('Technical writing · Training · Implementation', 'כתיבה טכנית · הדרכה · הטמעה')}
            </Typography>
          </Box>

          <Box component="nav" sx={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {NAV.map((item) => (
              <Box
                key={item.to}
                component={RouterLink}
                to={item.to}
                sx={{ color: '#C6DABE', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {t(item.en, item.he)}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: '9px' }}>
            <SocialIcon
              href="/"
              label="LinkedIn"
              path="M4.98 3.5a2.5 2.5 0 11.02 5 2.5 2.5 0 01-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21h-4z"
            />
            <SocialIcon
              href="/"
              label="YouTube"
              path="M23 12s0-3.5-.45-5.17a2.7 2.7 0 00-1.9-1.9C18.98 4.5 12 4.5 12 4.5s-6.98 0-8.65.43a2.7 2.7 0 00-1.9 1.9C1 8.5 1 12 1 12s0 3.5.45 5.17a2.7 2.7 0 001.9 1.9c1.67.43 8.65.43 8.65.43s6.98 0 8.65-.43a2.7 2.7 0 001.9-1.9C23 15.5 23 12 23 12zM9.8 15.4V8.6l5.8 3.4z"
            />
            <SocialIcon href="mailto:info@galiltc.co.il" label="Email" path="M2 5h20v14H2zm2 2v.5l8 5 8-5V7z" />
          </Box>

          <Box sx={{ width: '100%', borderTop: '1px solid #2C4A32', pt: '18px', fontSize: 13, color: '#7C9575' }}>
            {t('© 2026 GALIL Technical Writing Ltd.', '© 2026 גליל כתיבה טכנית בע״מ.')}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
