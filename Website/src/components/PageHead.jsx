import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useBrandColors } from '../lib/ThemeModeContext';

export default function PageHead({ eyebrow, title, lede }) {
  const brand = useBrandColors();
  return (
    <Box sx={{ py: { xs: '38px', md: '58px' }, borderBottom: `1px solid ${brand.rule}`, bgcolor: brand.surface }}>
      <Container maxWidth="lg">
        <Typography
          sx={{
            fontFamily: 'Noto Sans Mono, monospace',
            fontSize: 12.5,
            color: brand.annot,
            letterSpacing: '.04em',
            mb: '14px',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography variant="h1" sx={{ fontSize: 'clamp(32px,4.6vw,50px)' }}>
          {title}
        </Typography>
        <Typography sx={{ mt: '14px', fontSize: 'clamp(18px,1.6vw,21px)', color: brand.steel, maxWidth: '44ch' }}>
          {lede}
        </Typography>
      </Container>
    </Box>
  );
}
