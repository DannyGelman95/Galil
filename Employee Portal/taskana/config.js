/* =====================================================================
   Taskana — deployment settings (the same for everyone who opens it).

   storage   where the shared data lives:
     "local"     this browser only — a standalone demo
     "github"    a data file in a GitHub repository (the testing setup);
                 each device pastes a GitHub access token once
     "onedrive"  the company OneDrive (needs entra.clientId)
   entra     fill in clientId and sign-in goes through Microsoft Entra ID;
             leave it empty for WorkDesk-style email + demo password.

   See docs/taskana/ for the Microsoft 365 rollout guide. An Admin can try
   other settings in one browser from the sign-in screen (Connection
   settings…) before changing them here.
   ===================================================================== */
var TASKANA_CONFIG = {
  /* only accounts with this ending may sign in */
  domain: "@galiltc.co.il",

  storage: "github",

  github: {
    owner: "DannyGelman95",
    repo: "galil-workdesk-app",
    branch: "taskana-data",       // created on first use; every save is a commit on this branch
    path: "taskana"               // folder for taskana-data.json and attachments/
  },

  entra: {
    clientId: "",          // Application (client) ID of the Taskana app registration
    tenantId: ""           // Directory (tenant) ID of galiltc.co.il; empty = any work account (domain still enforced)
  },

  onedrive: {
    /* Sharing link ("People in GALIL with the link can edit") to the folder that holds Taskana's
       data files. Everyone who signs in must be able to edit it. Leave empty to use a folder
       named folderName in the signed-in person's own OneDrive (fine for trying it out alone). */
    folderLink: "",
    folderName: "Taskana",
    fileName: "taskana-data.json"
  }
};
