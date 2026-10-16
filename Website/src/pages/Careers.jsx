import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { useLanguage } from '../lib/LanguageContext';
import { useBrandColors } from '../lib/ThemeModeContext';
import PageHead from '../components/PageHead';
import FileUploadButton from '../components/FileUploadButton';
import { useMailtoForm } from '../lib/useMailtoForm';

const ROLES = [
  {
    id: 'writer',
    tags: [
      ['Full-time', 'משרה מלאה'],
      ['Rishon LeTsiyyon', 'ראשון לציון'],
      ['Hebrew & English', 'עברית ואנגלית'],
    ],
    title: ['Technical Writer', 'כותב/ת טכני/ת'],
    body: [
      'Write operator, maintenance and installation manuals directly from hardware, drawings and engineer interviews — for defence, aerospace, medical and industrial clients.',
      'כתיבת מדריכי הפעלה, תחזוקה והתקנה ישירות מול חומרה, שרטוטים וראיונות עם מהנדסים — עבור לקוחות בתחומי הביטחון, התעופה, הרפואה והתעשייה.',
    ],
    duties: [
      ['Turn engineering drawings and SME interviews into manuals a technician can actually follow', 'להפוך שרטוטים וראיונות עם מומחי תוכן למדריכים שטכנאי יכול לבצע בפועל'],
      ['Maintain terminology and style consistency across a document set', 'לשמור על עקביות מונחים וסגנון לאורך סט מסמכים'],
      ['Track review comments to closure with client engineers', 'לעקוב אחרי הערות סקירה עד לסגירה מול המהנדסים אצל הלקוח'],
    ],
    reqs: [
      ['2+ years writing technical/procedural documentation', '2+ שנות ניסיון בכתיבת תיעוד טכני/נהלים'],
      ['Comfortable reading engineering or software specs', 'נוחות בקריאת מפרטים הנדסיים או תוכנה'],
      ['DITA/S1000D or structured authoring — an advantage', 'DITA/S1000D או כתיבה מובנית — יתרון'],
    ],
  },
  {
    id: 'instructor',
    tags: [
      ['Full-time', 'משרה מלאה'],
      ['On-site delivery', 'הדרכה באתר'],
      ['Travel required', 'נדרשת ניידות'],
    ],
    title: ['Instructor', 'מדריך/ה'],
    body: [
      'Deliver training built from our own documentation — courseware, e-learning and on-site sessions for operators, technicians and new engineers.',
      'העברת הדרכות הבנויות מתוך התיעוד שלנו — חומרי לימוד, לומדות והדרכות באתר הלקוח עבור מפעילים, טכנאים ומהנדסים חדשים.',
    ],
    duties: [
      ['Deliver classroom and on-site training sessions', 'להעביר הדרכות בכיתה ובאתר הלקוח'],
      ['Build instructor guides and courseware from existing manuals', 'לבנות מדריכי מנחה וחומרי לימוד מתוך מדריכים קיימים'],
      ['Run train-the-trainer sessions for client staff', 'להעביר הדרכות מכשירות מדריכים לצוותי הלקוח'],
    ],
    reqs: [
      ['Experience training adults in a technical or industrial setting', 'ניסיון בהדרכת מבוגרים בסביבה טכנית או תעשייתית'],
      ['Confident, clear presenter in both Hebrew and English', 'מנחה בטוח וברור בעברית ובאנגלית'],
      ['Willing to travel to client sites', 'נכונות לנסיעות לאתרי לקוחות'],
    ],
  },
  {
    id: 'office',
    tags: [
      ['Full-time', 'משרה מלאה'],
      ['Rishon LeTsiyyon', 'ראשון לציון'],
      ['Office-based', 'מהמשרד'],
    ],
    title: ['Office Manager', 'מנהל/ת משרד'],
    body: [
      'Keep the office running: day-to-day operations, scheduling, supplier and vendor relations, and administrative support for finance and HR.',
      'לתפעל את המשרד: ניהול שוטף, תיאום לוחות זמנים, קשר עם ספקים, ותמיכה מנהלית לכספים ומשאבי אנוש.',
    ],
    duties: [
      ['Run day-to-day office operations and logistics', 'לנהל את הפעילות השוטפת והלוגיסטיקה של המשרד'],
      ['Coordinate schedules, travel and supplier relationships', 'לתאם לוחות זמנים, נסיעות וקשרי ספקים'],
      ['Support finance and HR with administrative tasks', 'לתמוך בכספים ובמשאבי אנוש במשימות מנהליות'],
    ],
    reqs: [
      ['2+ years in office management or administration', '2+ שנות ניסיון בניהול משרד או מנהלה'],
      ['Highly organized, comfortable juggling priorities', 'מאורגן/ת מאוד, נוח/ה בניהול מספר משימות במקביל'],
      ['Strong Office/Excel skills', 'שליטה טובה ב-Office/Excel'],
    ],
  },
];

// Not open yet. To activate one, move it into ROLES with a full
// description/duties/requirements list, matching the shape above.
const PLACEHOLDER_ROLES = [
  {
    title: ['Documentation Specialist', 'מומחה/ית תיעוד'],
    body: [
      'A future role focused on maintaining and revising existing document sets as products evolve. Check back, or send us your CV below.',
      'משרה עתידית שתתמקד בתחזוקה ועדכון של סטי תיעוד קיימים ככל שהמוצרים מתפתחים. חזרו לבדוק, או שלחו לנו קורות חיים למטה.',
    ],
  },
  {
    title: ['Training Coordinator', 'רכז/ת הדרכה'],
    body: [
      'A future role scheduling and coordinating on-site and e-learning delivery across clients. Check back, or send us your CV below.',
      'משרה עתידית שתתאם ותתזמן הדרכות באתר הלקוח ולומדות מול לקוחות שונים. חזרו לבדוק, או שלחו לנו קורות חיים למטה.',
    ],
  },
  {
    title: ['QA / Localization Reviewer', 'בודק/ת איכות ותרגום'],
    body: [
      'A future role reviewing manuals and courseware for accuracy and Hebrew/English consistency before delivery. Check back, or send us your CV below.',
      'משרה עתידית שתבדוק מדריכים וחומרי הדרכה לדיוק ולעקביות בין עברית לאנגלית לפני המסירה. חזרו לבדוק, או שלחו לנו קורות חיים למטה.',
    ],
  },
];

const GENERAL_APPLICATION = ['General application — no specific role', 'מועמדות כללית — ללא תפקיד ספציפי'];

export default function Careers() {
  const { t } = useLanguage();
  const brand = useBrandColors();

  const fields = [
    { name: 'name', label: t('Your name', 'שם'), check: 'required' },
    { name: 'phone', label: t('Phone', 'טלפון') },
    { name: 'email', label: t('Email', 'דוא״ל'), check: 'email' },
    { name: 'role', label: t('Role you’re interested in', 'תפקיד המעניין אתכם') },
    { name: 'message', label: t('A few words about yourself', 'כמה מילים על עצמכם'), check: 'message' },
    { name: 'cv', label: t('CV / resume', 'קורות חיים'), type: 'file' },
  ];

  const { values, errors, sent, handleChange, setValue, handleSubmit } = useMailtoForm({
    to: 'careers@galiltc.co.il',
    subjectTemplate: 'CV submission — {role}',
    fields,
    initialValues: { name: '', phone: '', email: '', role: t(GENERAL_APPLICATION[0], GENERAL_APPLICATION[1]), message: '', cv: '' },
  });

  const roleOptions = [...ROLES.map((r) => r.title), GENERAL_APPLICATION];

  return (
    <>
      <PageHead
        eyebrow={t('Careers at GALIL', 'דרושים בגליל')}
        title={t('Help us explain the machine.', 'עזרו לנו להסביר את המכונה.')}
        lede={t(
          "We're a small team of writers, trainers and editors working on defence, aerospace, medical and industrial products. Open roles below — and a place to send your CV even if none of them fit yet.",
          'אנחנו צוות קטן של כותבים, מדריכים ועורכים שעובד על מוצרים בתחומי הביטחון, התעופה, הרפואה והתעשייה. המשרות הפתוחות למטה — ומקום לשלוח קורות חיים גם אם אף אחת מהן לא מתאימה כרגע.'
        )}
      />

      <Box sx={{ py: { xs: '56px', md: '104px' } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: '56ch', mb: { xs: '34px', md: '52px' } }}>
            <Typography variant="h2" sx={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>
              {t('Open roles', 'משרות פתוחות')}
            </Typography>
            <Typography sx={{ color: brand.steel, mt: '14px', fontSize: 17.5 }}>
              {t(
                'Rishon LeTsiyyon, Israel · Sun–Thu · Hebrew & English required unless noted.',
                'ראשון לציון · א׳–ה׳ · נדרשת עברית ואנגלית, אלא אם צוין אחרת.'
              )}
            </Typography>
          </Box>

          <Grid container spacing="22px">
            {ROLES.map((role) => (
              <Grid key={role.id} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ borderColor: brand.rule, borderRadius: '14px', height: '100%', display: 'flex' }}>
                  <CardContent sx={{ p: '28px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '7px', mb: '14px' }}>
                      {role.tags.map((tag) => (
                        <Chip
                          key={tag[0]}
                          label={t(tag[0], tag[1])}
                          size="small"
                          sx={{ fontSize: 12.5, fontWeight: 600, color: brand.greenDeep, bgcolor: brand.surface, border: `1px solid ${brand.rule}` }}
                        />
                      ))}
                    </Box>
                    <Typography variant="h3" sx={{ mb: '10px' }}>
                      {t(role.title[0], role.title[1])}
                    </Typography>
                    <Typography sx={{ color: brand.steel, fontSize: 15.5 }}>{t(role.body[0], role.body[1])}</Typography>

                    <Typography variant="h4" sx={{ mt: '16px', mb: '8px' }}>
                      {t("What you'll do", 'מה תעשו')}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, paddingInlineStart: '20px', fontSize: 15 }}>
                      {role.duties.map((d) => (
                        <li key={d[0]} style={{ marginBottom: 5 }}>
                          {t(d[0], d[1])}
                        </li>
                      ))}
                    </Box>

                    <Typography variant="h4" sx={{ mt: '16px', mb: '8px' }}>
                      {t("What we're looking for", 'מה אנחנו מחפשים')}
                    </Typography>
                    <Box component="ul" sx={{ m: 0, paddingInlineStart: '20px', fontSize: 15 }}>
                      {role.reqs.map((r) => (
                        <li key={r[0]} style={{ marginBottom: 5 }}>
                          {t(r[0], r[1])}
                        </li>
                      ))}
                    </Box>

                    <Box sx={{ mt: 'auto', pt: '18px' }}>
                      <Button
                        variant="contained"
                        disableElevation
                        onClick={() => {
                          setValue('role', t(role.title[0], role.title[1]));
                          document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {t('Apply for this role', 'הגישו מועמדות')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {PLACEHOLDER_ROLES.map((role) => (
              <Grid key={role.title[0]} size={{ xs: 12, md: 6 }}>
                <Card
                  variant="outlined"
                  sx={{ borderColor: brand.rule, borderStyle: 'dashed', bgcolor: brand.surface, borderRadius: '14px', height: '100%' }}
                >
                  <CardContent sx={{ p: '28px' }}>
                    <Chip
                      label={t('Not open yet', 'עדיין לא פתוח')}
                      size="small"
                      sx={{ fontSize: 12.5, fontWeight: 700, color: '#8A6410', bgcolor: '#FBF1D6', border: '1px solid #EBDBA0', mb: '14px' }}
                    />
                    <Typography variant="h3" sx={{ mb: '10px', color: brand.steel }}>
                      {t(role.title[0], role.title[1])}
                    </Typography>
                    <Typography sx={{ color: brand.steel, fontSize: 14.5 }}>{t(role.body[0], role.body[1])}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ===================== DIDN'T FIND YOUR ROLE? ===================== */}
      <Box id="apply" sx={{ bgcolor: brand.surface, py: { xs: '56px', md: '104px' }, scrollMarginTop: '96px' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: '30px', md: '72px' }} alignItems="start">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" sx={{ fontSize: 'clamp(28px,3.4vw,44px)', mb: '10px' }}>
                {t("Didn't find your role?", 'לא מצאתם את התפקיד שלכם?')}
              </Typography>
              <Typography sx={{ color: brand.steel, mb: '24px' }}>
                {t(
                  'Send us your CV. We keep a file of good people and reach out the moment a fitting role opens.',
                  'שלחו לנו קורות חיים. אנחנו שומרים תיק של אנשים טובים ופונים אליהם ברגע שנפתח תפקיד מתאים.'
                )}
              </Typography>

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
                    <TextField fullWidth label={t('Phone', 'טלפון')} value={values.phone} onChange={handleChange('phone')} type="tel" autoComplete="tel" />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  type="email"
                  label={t('Email', 'דוא״ל')}
                  value={values.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email && t("That email address doesn't look complete.", 'כתובת הדוא״ל אינה נראית שלמה.')}
                  autoComplete="email"
                />

                <TextField select fullWidth label={t('Role you’re interested in', 'תפקיד המעניין אתכם')} value={values.role} onChange={handleChange('role')}>
                  {roleOptions.map((opt) => (
                    <MenuItem key={opt[0]} value={t(opt[0], opt[1])}>
                      {t(opt[0], opt[1])}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label={t('A few words about yourself', 'כמה מילים על עצמכם')}
                  value={values.message}
                  onChange={handleChange('message')}
                  error={!!errors.message}
                  helperText={errors.message && t('Tell us a sentence or two about your background.', 'ספרו לנו משפט או שניים על הרקע שלכם.')}
                />

                <Box>
                  <FileUploadButton
                    label={t('CV / resume', 'קורות חיים')}
                    accept=".pdf,.doc,.docx"
                    chooseLabel={t('Choose file', 'בחירת קובץ')}
                    fileName={values.cv ? values.cv.split(/[/\\]/).pop() : ''}
                    onChange={handleChange('cv')}
                  />
                  <Typography sx={{ fontSize: 13.5, color: brand.steel, mt: '6px' }}>
                    {t(
                      "This site can't upload a file yet — choosing one here just reminds you to attach it. We'll open your email client to send everything else; please attach your CV there before sending.",
                      'האתר עדיין לא תומך בהעלאת קובץ — בחירת קובץ כאן היא רק תזכורת לצרף אותו. ניפתח עבורכם את תוכנת הדוא״ל לשליחת שאר הפרטים; אנא צרפו את קורות החיים שם לפני השליחה.'
                    )}
                  </Typography>
                </Box>

                <Button type="submit" variant="contained" disableElevation sx={{ justifySelf: 'start' }}>
                  {t('Send my details', 'שליחת הפרטים')}
                </Button>

                {sent && (
                  <Alert severity="success" variant="outlined" sx={{ borderColor: brand.green }}>
                    {t(
                      'Your email client should now open with your details filled in — please attach your CV before sending.',
                      'תוכנת הדוא״ל שלכם אמורה להיפתח כעת עם הפרטים שלכם ממולאים — אנא צרפו את קורות החיים לפני השליחה.'
                    )}
                  </Alert>
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" sx={{ fontSize: 24, mb: '12px' }}>
                {t('Or email us directly', 'או שלחו דוא״ל ישירות')}
              </Typography>
              <Box sx={{ display: 'grid', gap: '2px' }}>
                {[
                  { k: t('Careers', 'דרושים'), v: 'careers@galiltc.co.il', href: 'mailto:careers@galiltc.co.il' },
                  { k: t('Phone', 'טלפון'), v: '+972 3 999 9999', href: 'tel:+97239999999' },
                ].map((row) => (
                  <Box
                    key={row.k}
                    component="a"
                    href={row.href}
                    sx={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                      py: '15px',
                      px: '4px',
                      borderBottom: `1px solid ${brand.rule}`,
                      '&:hover': { paddingInlineStart: '10px' },
                    }}
                  >
                    <Typography sx={{ fontSize: 13.5, color: brand.steel, minWidth: 88 }}>{row.k}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{row.v}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography sx={{ mt: '24px', fontSize: 14.5, color: brand.steel }}>
                {t("Attach your CV to the email directly — this form doesn't upload files yet.", 'צרפו את קורות החיים ישירות לדוא״ל — הטופס עדיין לא מעלה קבצים.')}
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
