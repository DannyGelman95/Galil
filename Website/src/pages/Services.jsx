import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useLanguage } from '../lib/LanguageContext';
import { useBrandColors } from '../lib/ThemeModeContext';
import PageHead from '../components/PageHead';

const SVC = [
  {
    id: 'tw',
    ref: 'TW / 01',
    title: ['Technical writing', 'כתיבה טכנית'],
    body: [
      'Operator and maintenance manuals, installation guides, software help, standard operating procedures, spare-part catalogues and release notes. Written from the hardware or the build, not from marketing copy.',
      'מדריכי הפעלה ותחזוקה, מדריכי התקנה, עזרה למשתמש בתוכנה, נהלי עבודה, קטלוגי חלפים והערות גרסה. נכתב מול החומרה או מול המערכת עצמה — לא מתוך חומר שיווקי.',
    ],
    tags: [
      ['Hebrew & English', 'עברית ואנגלית'],
      ['S1000D / DITA', 'S1000D / DITA'],
      ['Illustrated parts', 'איורי חלפים'],
      ['Compliance docs', 'מסמכי תאימות'],
    ],
  },
  {
    id: 'tr',
    ref: 'TR / 02',
    title: ['Training', 'הדרכה'],
    body: [
      'Courseware, instructor guides, e-learning and on-site delivery. We build the course from the documentation we already wrote, so the manual and the classroom say the same thing — which is rarer than it sounds.',
      'חומרי לימוד, מדריכים למנחה, לומדות מקוונות והעברת הדרכות באתר הלקוח. אנחנו בונים את הקורס מתוך התיעוד שכתבנו, כך שהמדריך והכיתה אומרים בדיוק את אותו הדבר — וזה נדיר יותר משנדמה.',
    ],
    tags: [
      ['Courseware', 'חומרי לימוד'],
      ['E-learning', 'לומדות'],
      ['On-site delivery', 'הדרכה באתר'],
      ['Train the trainer', 'הכשרת מדריכים'],
    ],
  },
  {
    id: 'im',
    ref: 'IM / 03',
    title: ['Implementation', 'הטמעה'],
    body: [
      'Standing up the documentation practice itself: templates, terminology, style rules, tooling and the review workflow. We can run it for you, or hand it over and train your team to run it.',
      'הקמת מערך התיעוד עצמו: תבניות, מונחון, כללי סגנון, כלים ותהליך אישור. אנחנו יכולים להפעיל אותו עבורכם, או להעביר אתכם לעצמאות ולהכשיר את הצוות שלכם.',
    ],
    tags: [
      ['Style guides', 'מדריכי סגנון'],
      ['Terminology', 'מונחון'],
      ['Tooling & CMS', 'כלים ומערכות'],
      ['Embedded writers', 'כתבים מוטמעים'],
    ],
  },
];

const STEPS = [
  {
    n: '01',
    title: ['Brief', 'אפיון'],
    body: [
      'We meet the product and the people who built it. You get a scope, a word or page count, and a fixed work order.',
      'אנחנו נפגשים עם המוצר ועם מי שבנה אותו. אתם מקבלים היקף, ספירת מילים או עמודים, והזמנת עבודה סגורה.',
    ],
  },
  {
    n: '02',
    title: ['Draft', 'טיוטה'],
    body: [
      'Draft A lands early and deliberately rough, so we correct direction before it is expensive to correct.',
      'טיוטה א׳ מגיעה מוקדם ובכוונה גולמית, כדי לתקן כיוון לפני שהתיקון יקר.',
    ],
  },
  {
    n: '03',
    title: ['Review', 'סבב הערות'],
    body: [
      'Your engineers mark it up. We track every comment to closure and tell you which ones we disagreed with.',
      'המהנדסים שלכם מעירים. אנחנו עוקבים אחרי כל הערה עד לסגירה ומציינים עם אילו לא הסכמנו.',
    ],
  },
  {
    n: '04',
    title: ['Deliver', 'מסירה'],
    body: [
      'Final files in your formats, sources included, plus a maintenance plan for the next revision.',
      'קבצים סופיים בפורמטים שלכם, כולל קבצי מקור, ותוכנית תחזוקה לגרסה הבאה.',
    ],
  },
];

export default function Services() {
  const { t } = useLanguage();
  const brand = useBrandColors();

  return (
    <>
      <PageHead
        eyebrow={t('What we produce', 'מה אנחנו מפיקים')}
        title={t('Three practices, usually bought together.', 'שלושה תחומי פעילות, שנרכשים בדרך כלל יחד.')}
        lede={t(
          'Most engagements start with documentation and grow into training once the material exists.',
          'רוב הפרויקטים מתחילים בתיעוד ומתרחבים להדרכה ברגע שהחומר קיים.'
        )}
      />

      <Box sx={{ py: { xs: '56px', md: '104px' } }}>
        <Container maxWidth="lg">
          <Box sx={{ borderTop: `1px solid ${brand.rule}` }}>
            {SVC.map((s) => (
              <Grid
                key={s.id}
                id={s.id}
                container
                spacing={{ xs: '12px', md: '44px' }}
                sx={{ py: '34px', borderBottom: `1px solid ${brand.rule}`, alignItems: 'start', scrollMarginTop: '96px' }}
              >
                <Grid size={{ xs: 12, md: 'auto' }} sx={{ minWidth: { md: 74 } }}>
                  <Typography sx={{ fontFamily: 'Noto Sans Mono, monospace', fontSize: 13, color: brand.annot, pt: { md: '5px' } }}>
                    {s.ref}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="h3" sx={{ mb: '9px' }}>
                    {t(s.title[0], s.title[1])}
                  </Typography>
                  <Typography sx={{ color: brand.steel, fontSize: 16 }}>{t(s.body[0], s.body[1])}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 'grow' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {s.tags.map((tag) => (
                      <Chip
                        key={tag[0]}
                        label={t(tag[0], tag[1])}
                        size="small"
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: brand.greenDeep,
                          bgcolor: brand.card,
                          border: `1px solid ${brand.rule}`,
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: { xs: '56px', md: '104px' } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: '56ch', mb: { xs: '34px', md: '52px' } }}>
            <Typography variant="h2" sx={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>
              {t('How an engagement runs', 'איך פרויקט מתנהל')}
            </Typography>
            <Typography sx={{ color: brand.steel, mt: '14px', fontSize: 17.5 }}>
              {t(
                'Four stages, priced per work order. You see a draft early and you see it often — no six-week silence followed by a surprise.',
                'ארבעה שלבים, בתמחור לפי הזמנת עבודה. אתם רואים טיוטה מוקדם ורואים אותה שוב ושוב — בלי שישה שבועות של שקט ואז הפתעה.'
              )}
            </Typography>
          </Box>

          <Grid container sx={{ borderTop: `2px solid ${brand.forest}` }}>
            {STEPS.map((step, i) => (
              <Grid
                key={step.n}
                size={{ xs: 12, sm: 6, md: 3 }}
                sx={{
                  p: '26px 26px 30px',
                  borderInlineEnd: { md: i < STEPS.length - 1 ? `1px solid ${brand.rule}` : 0 },
                  borderBottom: { xs: `1px solid ${brand.rule}`, md: 0 },
                }}
              >
                <Typography sx={{ fontFamily: 'Noto Sans Mono, monospace', fontSize: 12.5, color: brand.annot, mb: '14px' }}>
                  {step.n}
                </Typography>
                <Typography variant="h3" sx={{ fontSize: 19, mb: '9px' }}>
                  {t(step.title[0], step.title[1])}
                </Typography>
                <Typography sx={{ fontSize: 15, color: brand.steel }}>{t(step.body[0], step.body[1])}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: brand.surface, py: { xs: '56px', md: '104px' } }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>
            {t('Ready to start?', 'מוכנים להתחיל?')}
          </Typography>
          <Typography sx={{ m: '12px auto 22px', color: brand.steel }}>
            {t("Tell us what you're building — a sentence or two is enough.", 'ספרו לנו מה אתם בונים — משפט או שניים מספיקים.')}
          </Typography>
          <Button component={RouterLink} to="/contact" variant="contained" disableElevation>
            {t('Contact us', 'צרו קשר')}
          </Button>
        </Container>
      </Box>
    </>
  );
}
