/* Companies shown in the client-logo strip (Home page).

   Each entry: name (English), he (Hebrew, optional), sector, and logo — the
   file name of an official logo placed in public/logos/ (SVG or PNG, ideally
   on a transparent background). Without a logo file the name is drawn as a
   neutral wordmark, so the strip looks complete before the files arrive.

   Before publishing a client here, make sure the client agrees to having
   their name and logo shown (most of our work is under NDA). Add, remove
   or reorder entries freely — the strip and the floating cloud adapt. */
const CLIENTS = [
  { name: 'IAI', he: 'התעשייה האווירית', sector: ['Aerospace & Defence', 'תעופה וביטחון'], logo: '' },
  { name: 'Elbit Systems', he: 'אלביט מערכות', sector: ['Defence Electronics', 'אלקטרוניקה ביטחונית'], logo: '' },
  { name: 'Mobileye', he: 'מובילאיי', sector: ['Automotive', 'רכב'], logo: '' },
  { name: 'Carmel Medical Devices', he: 'כרמל מכשור רפואי', sector: ['Medical Devices', 'מכשור רפואי'], logo: '' },
  { name: 'Galilee Water Systems', he: 'מערכות מים גליל', sector: ['Agritech', 'אגרוטק'], logo: '' },
  { name: 'Haifa FinTech', he: 'חיפה פינטק', sector: ['Financial Services', 'שירותים פיננסיים'], logo: '' },
];

export default CLIENTS;
