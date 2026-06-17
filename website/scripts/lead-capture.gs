/**
 * Harbormill Automation — free-guide lead capture (Google Apps Script web app).
 *
 * Logs each website signup to a Google Sheet and emails a notification, all
 * inside your Google Workspace. The marketing site POSTs to this script's
 * deployed /exec URL (set as VITE_FORM_ENDPOINT in Vercel).
 *
 * SETUP
 *   1. Create a Google Sheet (e.g. "Harbormill Leads") in your Workspace.
 *   2. Extensions → Apps Script. Delete the default code, paste this file, Save.
 *   3. (Optional) change NOTIFY_EMAIL below.
 *   4. Deploy → New deployment → type "Web app".
 *        - Execute as:        Me (dwilliams@harbormill.net)
 *        - Who has access:    Anyone            ← required so the site can POST
 *      Deploy, then Authorize/allow the permissions prompt.
 *   5. Copy the Web app URL (ends with /exec) and paste it as VITE_FORM_ENDPOINT
 *      in the Vercel project (Settings → Environment Variables), then redeploy.
 *
 * The site sends a "simple" text/plain POST (no CORS preflight); we parse the
 * JSON body ourselves below.
 */

var NOTIFY_EMAIL = "dwilliams@harbormill.net";
var SHEET_NAME = "Leads";

function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    var email = String(payload.email || "").trim();
    var source = String(payload.source || "website");

    if (!email) {
      return json_({ ok: false, error: "missing email" });
    }

    var sheet = getOrCreateSheet_();
    sheet.appendRow([new Date(), email, source]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: "New AI-guide signup: " + email,
      body: "A visitor requested the AI prompt guide.\n\nEmail: " + email + "\nSource: " + source + "\nTime: " + new Date(),
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// A GET on the URL returns a small health check (handy for testing in a browser).
function doGet() {
  return json_({ ok: true, service: "harbormill lead-capture" });
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Email", "Source"]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
