import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useLanguage } from '../lib/LanguageContext';
import { useBrandColors } from '../lib/ThemeModeContext';
import PageHead from '../components/PageHead';
import { useMailtoForm } from '../lib/useMailtoForm';

const KIND_OPTIONS = [
  ['Technical writing', 'כתיבה טכנית'],
  ['Training', 'הדרכה'],
  ['Implementation', 'הטמעה'],
  ['Not sure yet', 'עדיין לא בטוח'],
];

export default function Contact() {
  const { t } = useLanguage();
  const brand = useBrandColors();

  const fields = [
    { name: 'name', label: t('Your name', 'שם'), check: 'required' },
    { name: 'company', label: t('Company', 'חברה'), check: 'required' },
    { name: 'email', label: t('Work email', 'דוא״ל בעבודה'), check: 'email' },
    { name: 'kind', label: t('What do you need', 'מה נדרש') },
    { name: 'message', label: t('What are you building', 'מה אתם בונים'), check: 'message' },
  ];

  const { values, errors, sent, handleChange, handleSubmit } = useMailtoForm({
    to: 'info@galiltc.co.il',
    subjectTemplate: 'New enquiry from {name} ({company})',
    fields,
    initialValues: { name: '', company: '', email: '', kind: KIND_OPTIONS[0][0], message: '' },
  });

  return (
    <>
      <PageHead
        eyebrow={t('Contact', 'צור קשר')}
        title={t("Tell us what you're building.", 'ספרו לנו מה אתם בונים.')}
        lede={t(
          'A sentence or two is enough to start. We reply within one working day.',
          'משפט או שניים מספיקים כדי להתחיל. אנחנו חוזרים תוך יום עסקים אחד.'
        )}
      />

      <Box sx={{ bgcolor: brand.surface, py: { xs: '56px', md: '104px' } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: '30px', md: '72px' }} alignItems="start">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: '15px' }}>
                <Grid container spacing="15px">
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Your name', 'שם')}
                      value={values.name}
                      onChange={handleChange('name')}
                      error={!!errors.name}
                      helperText={errors.name && t('Add your name so we know who to reply to.', 'הוסיפו שם כדי שנדע למי להשיב.')}
                      autoComplete="name"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Company', 'חברה')}
                      value={values.company}
                      onChange={handleChange('company')}
                      error={!!errors.company}
                      helperText={errors.company && t('Add your company.', 'הוסיפו שם חברה.')}
                      autoComplete="organization"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  type="email"
                  label={t('Work email', 'דוא״ל בעבודה')}
                  value={values.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email && t("That email address doesn't look complete.", 'כתובת הדוא״ל אינה נראית שלמה.')}
                  autoComplete="email"
                />

                <TextField select fullWidth label={t('What do you need', 'מה נדרש')} value={values.kind} onChange={handleChange('kind')}>
                  {KIND_OPTIONS.map((opt) => (
                    <MenuItem key={opt[0]} value={opt[0]}>
                      {t(opt[0], opt[1])}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={t('What are you building', 'מה אתם בונים')}
                  value={values.message}
                  onChange={handleChange('message')}
                  error={!!errors.message}
                  helperText={errors.message && t('Give us a sentence or two about the product.', 'כתבו משפט או שניים על המוצר.')}
                />

                <Button type="submit" variant="contained" disableElevation sx={{ justifySelf: 'start' }}>
                  {t('Send it', 'שליחה')}
                </Button>

                {sent && (
                  <Alert severity="success" variant="outlined" sx={{ borderColor: brand.green }}>
                    {t(
                      "Your email client should now open with your message filled in — send it from there and we'll reply within one working day.",
                      'תוכנת הדוא״ל שלכם אמורה להיפתח כעת עם ההודעה ממולאת — שלחו אותה משם ואנחנו נחזור תוך יום עסקים אחד.'
                    )}
                  </Alert>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" sx={{ fontSize: 24, mb: '12px' }}>
                {t('Or reach us directly', 'או פנו ישירות')}
              </Typography>
              <Box sx={{ display: 'grid', gap: '2px' }}>
                {[
                  { k: t('Email', 'דוא״ל'), v: 'info@galiltc.co.il', href: 'mailto:info@galiltc.co.il' },
                  { k: t('Phone', 'טלפון'), v: '+972 3 999 9999', href: 'tel:+97239999999' },
                  { k: t('Office', 'משרד'), v: t('Rishon LeTsiyyon, Israel', 'ראשון לציון, ישראל'), href: '/' },
                  { k: t('Hours', 'שעות'), v: t('Sun–Thu, 08:00–17:00 IST', 'א׳–ה׳, 08:00–17:00'), href: '/' },
                  { k: t('Careers', 'דרושים'), v: t('See open roles →', 'למשרות הפתוחות ←'), href: '/careers', router: true },
                ].map((row) => (
                  <Box
                    key={row.k}
                    component={row.router ? RouterLink : 'a'}
                    {...(row.router ? { to: row.href } : { href: row.href })}
                    sx={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                      py: '15px',
                      px: '4px',
                      borderBottom: `1px solid ${brand.rule}`,
                      transition: 'padding-inline-start .15s',
                      '&:hover': { paddingInlineStart: '10px' },
                    }}
                  >
                    <Typography sx={{ fontSize: 13.5, color: brand.steel, minWidth: 88 }}>{row.k}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{row.v}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography sx={{ mt: '24px', fontSize: 14.5, color: brand.steel }}>
                {t(
                  "We sign your NDA before the first call if that's how your procurement works. Just say so in the message.",
                  'נחתום על הסכם סודיות עוד לפני השיחה הראשונה, אם כך עובד הרכש שלכם. פשוט ציינו זאת בהודעה.'
                )}
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
