const nodemailer = require('nodemailer');

// Configure via environment variables — fallback to ethereal (test) if not set
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'NYX Platform <noreply@nyxplatform.com>';

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host, port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Development: log emails to console instead of sending
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 [EMAIL — not sent, configure SMTP env vars]');
        console.log(`  To: ${opts.to}`);
        console.log(`  Subject: ${opts.subject}`);
        console.log(`  Text: ${(opts.text || '').slice(0, 120)}`);
        return { messageId: 'dev-mode' };
      }
    };
  }
  return transporter;
}

const BRAND_COLOR = '#6366f1';
const BRAND_NAME  = 'NYX Platform';

function htmlWrap(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0a0a0f;font-family:Inter,-apple-system,sans-serif;color:#f1f1f5}
  .wrap{max-width:520px;margin:0 auto;padding:32px 16px}
  .card{background:#13131a;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:32px;margin:16px 0}
  .logo{display:flex;align-items:center;gap:12px;margin-bottom:24px}
  .logo-icon{width:40px;height:40px;background:${BRAND_COLOR};border-radius:10px;display:flex;align-items:center;justify-content:center}
  .brand{font-size:18px;font-weight:900;letter-spacing:0.1em}
  h2{font-size:20px;font-weight:700;margin:0 0 8px;color:#fff}
  p{font-size:14px;line-height:1.7;color:#9191a8;margin:0 0 12px}
  .highlight{color:#fff;font-weight:600}
  .stat-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07)}
  .stat-row:last-child{border-bottom:none}
  .stat-label{font-size:12px;color:#52525e}
  .stat-val{font-size:13px;font-weight:700;color:#fff;font-family:monospace}
  .btn{display:inline-block;background:${BRAND_COLOR};color:#fff;font-weight:700;font-size:13px;padding:12px 28px;border-radius:10px;text-decoration:none;margin:16px 0}
  .pill-green{background:rgba(16,185,129,0.12);color:#10b981;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700}
  .pill-red{background:rgba(244,63,94,0.12);color:#f43f5e;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700}
  .pill-yellow{background:rgba(245,158,11,0.12);color:#f59e0b;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700}
  .footer{font-size:11px;color:#52525e;text-align:center;margin-top:24px}
</style></head><body>
<div class="wrap">
  <div style="text-align:center;margin-bottom:8px">
    <span class="brand" style="color:${BRAND_COLOR}">${BRAND_NAME}</span>
  </div>
  <div class="card">${content}</div>
  <div class="footer">
    © ${new Date().getFullYear()} ${BRAND_NAME} · This is an automated message.<br>
    Do not reply to this email.
  </div>
</div>
</body></html>`;
}

async function sendEmail(to, subject, htmlContent, textContent) {
  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.SMTP_FROM || `${BRAND_NAME} <noreply@nyxplatform.com>`,
      to, subject,
      html: htmlWrap(htmlContent),
      text: textContent || subject,
    });
  } catch (e) {
    console.error('Email send error:', e.message);
  }
}

// ── Email templates ────────────────────────────────────────────────────────

exports.sendVerificationEmail = (to, name, verifyUrl) => sendEmail(to,
  `Verify your ${BRAND_NAME} email`,
  `<h2>Verify Your Email Address</h2>
   <p>Hi <span class="highlight">${name}</span>, thanks for registering!</p>
   <p>Click the button below to verify your email and activate your account. This link expires in 24 hours.</p>
   <a href="${verifyUrl}" class="btn">Verify Email →</a>
   <p style="margin-top:16px;font-size:12px;color:#52525e">If you didn't create an account, you can safely ignore this email.</p>`,
  `Verify your email: ${verifyUrl}`
);

exports.sendWelcome = (to, name) => sendEmail(to,
  `Welcome to ${BRAND_NAME} 🎉`,
  `<h2>Welcome, ${name}!</h2>
   <p>Your account is ready. Start by depositing USDT to unlock the Quant Engine and earn daily yield.</p>
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard →</a>
   <p style="margin-top:16px">Need help? Visit our Help Centre or reply to this email.</p>`,
  `Welcome to ${BRAND_NAME}, ${name}! Your account is ready.`
);

exports.sendDepositConfirmed = (to, name, amount, txid) => sendEmail(to,
  `Deposit Confirmed — $${amount.toFixed(2)} USDT`,
  `<h2>Deposit Confirmed ✅</h2>
   <p>Your USDT deposit has been verified and credited to your account.</p>
   <div>
     <div class="stat-row"><span class="stat-label">Amount</span><span class="stat-val">$${amount.toFixed(2)} USDT</span></div>
     <div class="stat-row"><span class="stat-label">Status</span><span class="pill-green">Confirmed</span></div>
     <div class="stat-row"><span class="stat-label">TxID</span><span class="stat-val" style="font-size:10px">${txid}</span></div>
   </div>
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" class="btn">View Dashboard →</a>`,
  `Deposit of $${amount.toFixed(2)} USDT confirmed. TxID: ${txid}`
);

exports.sendWithdrawalRequested = (to, name, amount, address) => sendEmail(to,
  `Withdrawal Request Submitted — $${amount.toFixed(2)} USDT`,
  `<h2>Withdrawal Requested</h2>
   <p>Your withdrawal request has been submitted and is pending admin review (usually within 24h).</p>
   <div>
     <div class="stat-row"><span class="stat-label">Amount</span><span class="stat-val">$${amount.toFixed(2)} USDT</span></div>
     <div class="stat-row"><span class="stat-label">Address</span><span class="stat-val" style="font-size:10px">${address}</span></div>
     <div class="stat-row"><span class="stat-label">Status</span><span class="pill-yellow">Pending Review</span></div>
   </div>
   <p>You will receive another email when processed.</p>`,
  `Withdrawal of $${amount.toFixed(2)} USDT submitted. Address: ${address}`
);

exports.sendWithdrawalProcessed = (to, name, amount, status) => sendEmail(to,
  `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'} — $${amount.toFixed(2)} USDT`,
  `<h2>Withdrawal ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
   <p>Your withdrawal of <span class="highlight">$${amount.toFixed(2)} USDT</span> has been <strong>${status}</strong>.</p>
   ${status === 'approved'
     ? `<p>Funds have been sent to your wallet. Allow up to 30 minutes for blockchain confirmation.</p>`
     : `<p>Your funds have been returned to your platform balance. Please contact support if you have questions.</p>`
   }
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/assets" class="btn">View Assets →</a>`,
  `Your withdrawal of $${amount.toFixed(2)} USDT was ${status}.`
);

exports.sendLiquidationAlert = (to, name, symbol, direction, margin) => sendEmail(to,
  `⚠️ Position Liquidated — ${symbol}`,
  `<h2>Position Liquidated ⚠️</h2>
   <p>Your futures position has been automatically liquidated because the price reached your liquidation level.</p>
   <div>
     <div class="stat-row"><span class="stat-label">Pair</span><span class="stat-val">${symbol}</span></div>
     <div class="stat-row"><span class="stat-label">Direction</span><span class="stat-val">${direction.toUpperCase()}</span></div>
     <div class="stat-row"><span class="stat-label">Margin Lost</span><span class="stat-val" style="color:#f43f5e">-$${margin.toFixed(2)}</span></div>
     <div class="stat-row"><span class="stat-label">Status</span><span class="pill-red">Liquidated</span></div>
   </div>
   <p>Consider using lower leverage or setting a stop-loss on your next trade.</p>
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/trade" class="btn">Back to Trading →</a>`,
  `Your ${direction} ${symbol} position was liquidated. Margin lost: $${margin.toFixed(2)}`
);

exports.sendStakingMatured = (to, name, plan, amount, earned) => sendEmail(to,
  `Staking Matured — $${(amount + earned).toFixed(2)} Returned`,
  `<h2>Staking Position Matured 🎉</h2>
   <p>Your <span class="highlight">${plan.toUpperCase()}</span> staking plan has completed and your funds have been returned.</p>
   <div>
     <div class="stat-row"><span class="stat-label">Principal</span><span class="stat-val">$${amount.toFixed(2)}</span></div>
     <div class="stat-row"><span class="stat-label">Interest Earned</span><span class="stat-val" style="color:#10b981">+$${earned.toFixed(4)}</span></div>
     <div class="stat-row"><span class="stat-label">Total Returned</span><span class="stat-val" style="color:#10b981">$${(amount + earned).toFixed(2)}</span></div>
   </div>
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/staking" class="btn">Restake Now →</a>`,
  `Your ${plan} staking matured. +$${earned.toFixed(4)} interest. Total returned: $${(amount + earned).toFixed(2)}`
);

exports.sendTradeClosed = (to, name, symbol, direction, pnl) => sendEmail(to,
  `Trade Closed — ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} PnL`,
  `<h2>Position Closed ${pnl >= 0 ? '🟢' : '🔴'}</h2>
   <p>Your <span class="highlight">${direction.toUpperCase()} ${symbol}</span> position has been closed.</p>
   <div>
     <div class="stat-row"><span class="stat-label">Pair</span><span class="stat-val">${symbol}</span></div>
     <div class="stat-row"><span class="stat-label">PnL</span><span class="stat-val" style="color:${pnl >= 0 ? '#10b981' : '#f43f5e'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</span></div>
     <div class="stat-row"><span class="stat-label">Result</span>${pnl >= 0 ? '<span class="pill-green">Profit</span>' : '<span class="pill-red">Loss</span>'}</div>
   </div>
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/analytics" class="btn">View Analytics →</a>`,
  `Trade closed: ${direction} ${symbol} | PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
);

exports.sendKycUpdate = (to, name, status) => sendEmail(to,
  `KYC Verification ${status === 'approved' ? 'Approved' : 'Rejected'}`,
  `<h2>KYC ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
   <p>Your identity verification has been <strong>${status}</strong>.</p>
   ${status === 'approved'
     ? `<p>Your account is now fully verified. Withdrawal limits have been increased.</p>`
     : `<p>Please re-submit clear photos of your ID. Make sure the document is not expired and all text is readable.</p>`
   }
   <a href="${process.env.APP_URL || 'http://localhost:5173'}/profile" class="btn">View Profile →</a>`,
  `Your KYC verification was ${status}.`
);

exports.send2FAEnabled = (to, name) => sendEmail(to,
  '2FA Enabled on Your Account',
  `<h2>Two-Factor Authentication Enabled 🔐</h2>
   <p>Google Authenticator 2FA has been successfully enabled on your <span class="highlight">${BRAND_NAME}</span> account.</p>
   <p>You will now be asked for a 6-digit code at every login. Keep your authenticator app safe.</p>
   <p>If you did not enable this, please contact support immediately.</p>`,
  '2FA has been enabled on your account.'
);
