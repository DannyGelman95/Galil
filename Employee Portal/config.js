/* =====================================================================
   GALIL Employee Portal — deployment settings (the same for everyone).

   One file for the whole portal: WorkDesk, Taskana and HR read their
   settings from here (WORKDESK_CONFIG, TASKANA_CONFIG and HR_CONFIG below
   are built from it).

   storage   where the shared data lives:
     "local"     this browser only — the standalone demo
     "github"    data files in a GitHub repository (the testing setup);
                 each device pastes one GitHub access token, once
     "onedrive"  the company OneDrive (needs entra.clientId)
   entra     fill in clientId and sign-in goes through Microsoft Entra ID;
             leave it empty for email + demo password (GalilWorkdesk1).

   Setting it up: the administrator section of install/index.html.
   ===================================================================== */
var PORTAL_CONFIG = {
  domain: "@galiltc.co.il",

  storage: "github",

  github: {
    owner: "DannyGelman95",
    repo: "Galil"
  },

  entra: {
    clientId: "",                 // Application (client) ID — one app registration for the whole portal
    tenantId: ""                  // Directory (tenant) ID of galiltc.co.il
  },

  workdesk: {
    branch: "workdesk-data",      // GitHub: created on first use; every save is a commit on this branch
    path: "workdesk",             // GitHub: folder for workdesk-data.json
    folderLink: "",               // OneDrive: sharing link to the WorkDesk folder ("People in GALIL", Can edit)
    folderName: "WorkDesk",
    fileName: "workdesk-data.json"
  },

  taskana: {
    branch: "taskana-data",
    path: "taskana",
    folderLink: "",               // OneDrive: sharing link to the Taskana folder
    folderName: "Taskana",
    fileName: "taskana-data.json"
  },

  hr: {
    branch: "hr-data",
    path: "hr",
    folderLink: "",               // OneDrive: sharing link to the HR folder
    folderName: "HR",
    fileName: "hr-data.json"
  }
};

/* ---- what each app reads (no need to edit below this line) ---- */
var WORKDESK_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.workdesk.branch, path: PORTAL_CONFIG.workdesk.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.workdesk.folderLink, folderName: PORTAL_CONFIG.workdesk.folderName, fileName: PORTAL_CONFIG.workdesk.fileName }
};
var TASKANA_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.taskana.branch, path: PORTAL_CONFIG.taskana.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.taskana.folderLink, folderName: PORTAL_CONFIG.taskana.folderName, fileName: PORTAL_CONFIG.taskana.fileName }
};
var HR_CONFIG = {
  domain: PORTAL_CONFIG.domain,
  storage: PORTAL_CONFIG.storage,
  github: { owner: PORTAL_CONFIG.github.owner, repo: PORTAL_CONFIG.github.repo, branch: PORTAL_CONFIG.hr.branch, path: PORTAL_CONFIG.hr.path },
  entra: { clientId: PORTAL_CONFIG.entra.clientId, tenantId: PORTAL_CONFIG.entra.tenantId },
  onedrive: { folderLink: PORTAL_CONFIG.hr.folderLink, folderName: PORTAL_CONFIG.hr.folderName, fileName: PORTAL_CONFIG.hr.fileName }
};
