/* =====================================================================
   GALIL WorkDesk — deployment settings (the same for everyone).

   storage   where the shared data lives:
     "local"     this browser only — the standalone demo
     "github"    a data file in a GitHub repository (the testing setup);
                 each device pastes a GitHub access token once
     "onedrive"  the company OneDrive (needs entra.clientId)
   entra     fill in clientId and sign-in goes through Microsoft Entra ID;
             leave it empty for email + demo password (GalilWorkdesk1).

   See docs/workdesk/ for the Microsoft 365 rollout guide.
   ===================================================================== */
var WORKDESK_CONFIG = {
  domain: "@galiltc.co.il",

  storage: "github",

  github: {
    owner: "DannyGelman95",
    repo: "galil-workdesk-app",
    branch: "workdesk-data",      // created on first use; every save is a commit on this branch
    path: "workdesk"              // folder for workdesk-data.json
  },

  entra: {
    clientId: "",                 // Application (client) ID — the Taskana registration can be reused
    tenantId: ""                  // Directory (tenant) ID of galiltc.co.il
  },

  onedrive: {
    folderLink: "",               // sharing link to the WorkDesk folder ("People in GALIL", Can edit)
    folderName: "WorkDesk",
    fileName: "workdesk-data.json"
  }
};
