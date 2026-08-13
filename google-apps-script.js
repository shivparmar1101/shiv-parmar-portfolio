function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  
  var subject = "New Contact Message - " + data.subject;
  
  var htmlBody = `
    <div style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
      <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#c9a84c,#e8d48b);padding:32px 40px;text-align:center">
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#000">New Contact Message</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#333;font-weight:500">${data.subject}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px">

          <!-- Name -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr><td style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Name</td></tr>
          <tr><td style="font-size:16px;color:#f0f0f0;font-weight:600">${data.name}</td></tr>
          </table>

          <!-- Email -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr><td style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Email</td></tr>
          <tr><td style="font-size:16px"><a href="mailto:${data.email}" style="color:#60a5fa;text-decoration:none">${data.email}</a></td></tr>
          </table>

          <!-- Phone -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
          <tr><td style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Phone</td></tr>
          <tr><td style="font-size:16px;color:#f0f0f0">${data.phone || "Not provided"}</td></tr>
          </table>

          <!-- Subject & Budget -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr>
            <td width="50%" style="padding-right:12px">
              <div style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Subject</div>
              <div style="font-size:15px;color:#f0f0f0;font-weight:500">${data.subject}</div>
            </td>
            <td width="50%" style="padding-left:12px">
              <div style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Budget</div>
              <div style="font-size:15px;color:#f0f0f0;font-weight:500">${data.budget || "Not specified"}</div>
            </td>
          </tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr><td style="border-top:1px solid #222"></td></tr>
          </table>

          <!-- Message -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
          <tr><td style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">Message</td></tr>
          <tr><td style="font-size:15px;color:#d0d0d0;line-height:1.7;background:#1a1a1a;padding:20px;border-radius:10px;border-left:3px solid #c9a84c">${data.message}</td></tr>
          </table>

          <!-- From Page -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
          <tr><td style="font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px">From Page</td></tr>
          <tr><td style="font-size:14px"><a href="${data.pageUrl}" style="color:#60a5fa;text-decoration:none">${data.pageUrl}</a></td></tr>
          </table>

          <!-- Reply Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="mailto:${data.email}?subject=Re: ${data.subject}" style="display:inline-block;background:#c9a84c;color:#000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px">Reply to ${data.name}</a>
          </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #222;text-align:center">
          <p style="margin:0;font-size:12px;color:#555">Sent from <strong style="color:#c9a84c">Shiv Parmar</strong> Portfolio</p>
        </td></tr>

      </table>
      </td></tr>
      </table>
    </div>
  `;
  
  MailApp.sendEmail({
    to: "parmarshiv1101@gmail.com",
    subject: subject,
    htmlBody: htmlBody
  });
  
  return ContentService.createTextOutput(JSON.stringify({status: "ok"}));
}
