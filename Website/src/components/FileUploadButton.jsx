import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { styled } from '@mui/material/styles';
import { useBrandColors } from '../lib/ThemeModeContext';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

// MUI has no styled variant for a native file input, so this follows MUI's
// own documented pattern: a real <input type="file"> visually hidden behind
// a normal Button, triggered via a <label>.
export default function FileUploadButton({ label, accept, fileName, chooseLabel, onChange }) {
  const brand = useBrandColors();
  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: '6px' }}>{label}</Typography>
      <Button
        component="label"
        variant="outlined"
        startIcon={<UploadFileIcon />}
        sx={{
          bgcolor: brand.card,
          borderColor: brand.rule,
          color: brand.forest,
          justifyContent: 'flex-start',
          '&:hover': { borderColor: brand.forest, bgcolor: brand.card },
        }}
      >
        {fileName || chooseLabel}
        <VisuallyHiddenInput type="file" accept={accept} onChange={onChange} />
      </Button>
    </Box>
  );
}
