import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import GalilLogo from './GalilLogo';
import { useLanguage } from '../lib/LanguageContext';
import { useThemeMode, useBrandColors } from '../lib/ThemeModeContext';

const NAV = [
  { to: '/', en: 'Home', he: 'בית' },
  { to: '/services', en: 'What we do', he: 'מה אנחנו עושים' },
  { to: '/careers', en: 'Careers', he: 'דרושים' },
  { to: '/contact', en: 'Contact', he: 'צור קשר' },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { mode, toggleMode } = useThemeMode();
  const brand = useBrandColors();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLink = (item) => (
    <Button
      key={item.to}
      component={RouterLink}
      to={item.to}
      onClick={() => setOpen(false)}
      sx={{
        color: location.pathname === item.to ? brand.forest : brand.steel,
        fontWeight: 500,
        fontSize: 15,
        px: 0,
        py: '6px',
        minWidth: 0,
        borderRadius: 0,
        borderBottom: '2px solid',
        borderColor: location.pathname === item.to ? brand.green : 'transparent',
        '&:hover': { color: brand.forest, backgroundColor: 'transparent', borderColor: brand.green },
      }}
    >
      {t(item.en, item.he)}
    </Button>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha(brand.paper, 0.88),
        backdropFilter: 'saturate(1.4) blur(10px)',
        borderBottom: `1px solid ${brand.rule}`,
        color: brand.forest,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ minHeight: 74, py: '10px', gap: '14px 20px', flexWrap: 'wrap' }}
        >
          <Box
            component={RouterLink}
            to="/"
            aria-label="GALIL home"
            sx={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', flex: '0 0 auto' }}
          >
            <GalilLogo />
            <Typography component="b" sx={{ fontSize: 23, fontWeight: 700, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
              GALIL
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: '26px', ml: 'auto', flexShrink: 0 }}>
            {NAV.map(navLink)}
          </Box>


          <IconButton
            aria-label={mode === 'dark' ? t('Switch to the light theme', 'עברו לערכת נושא בהירה') : t('Switch to the dark theme', 'עברו לערכת נושא כהה')}
            onClick={toggleMode}
            sx={{ ml: { xs: 'auto', md: 0 }, flexShrink: 0, border: `1px solid ${brand.rule}`, width: 38, height: 38, color: brand.forest }}
          >
            {mode === 'dark' ? <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>

          <ToggleButtonGroup
            value={lang}
            exclusive
            size="small"
            onChange={(_, v) => v && setLang(v)}
            sx={{
              flexShrink: 0,
              border: `1px solid ${brand.rule}`,
              borderRadius: '999px',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                border: 0,
                fontSize: 13,
                fontWeight: 600,
                color: brand.steel,
                px: '13px',
                py: '7px',
                whiteSpace: 'nowrap',
                '&.Mui-selected': { bgcolor: brand.green, color: '#fff' },
                '&.Mui-selected:hover': { bgcolor: brand.greenDeep },
              },
            }}
          >
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="he">עב</ToggleButton>
          </ToggleButtonGroup>

          <Button
            component={RouterLink}
            to="/contact"
            variant="contained"
            disableElevation
            sx={{ display: { xs: 'none', md: 'inline-flex' }, flexShrink: 0, whiteSpace: 'nowrap', py: '10px', px: '18px', fontSize: '14.5px' }}
          >
            {t('Start a project', 'התחילו פרויקט')}
          </Button>

          <IconButton
            aria-label="Menu"
            onClick={() => setOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, flexShrink: 0, color: brand.forest }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer anchor="top" open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' } }}>
        <Box sx={{ pt: '90px', pb: '20px', px: 'var(--gutter,20px)', bgcolor: brand.paper }}>
          <List>
            {NAV.map((item) => (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={() => setOpen(false)}
                sx={{ fontSize: 17, borderBottom: `1px solid ${brand.rule}`, py: '14px' }}
              >
                {t(item.en, item.he)}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
