import { useState } from 'react';
import { AlertTriangle, Shield, FileText, ChevronDown, ChevronUp, Scale } from 'lucide-react';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing, registering, or using the NYX Platform (the "Platform"), its products, services, or any associated features — including but not limited to Futures Trading, Quantitative Bot Engine, Staking, and any other financial instruments offered now or in the future — you ("User") unconditionally and irrevocably agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and all applicable laws and regulations.

If you do not agree with any part of these Terms, you must immediately cease using the Platform. Continued use of the Platform constitutes acceptance of any updates or modifications to these Terms, which may be made at any time without prior notice.`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility & Jurisdiction',
    content: `The Platform is intended solely for users who are at least 18 years of age (or the legal age of majority in their jurisdiction, whichever is higher). By using this Platform, you represent and warrant that:

(a) You are of legal age in your jurisdiction;
(b) Your use of the Platform does not violate any applicable laws or regulations in your country of residence or domicile;
(c) You are not a resident of, or located in, any jurisdiction where participation in cryptocurrency trading, derivatives, or similar financial activities is prohibited or restricted;
(d) You are solely responsible for ensuring your compliance with local laws.

The Platform does not accept users from jurisdictions where such services are prohibited. The Platform reserves the right to restrict access at any time, at its sole discretion, without liability.`,
  },
  {
    id: 'risk',
    title: '3. Risk Disclosure & No Liability',
    content: `TRADING CRYPTOCURRENCIES, PERPETUAL FUTURES CONTRACTS, AND RELATED DERIVATIVE INSTRUMENTS INVOLVES SUBSTANTIAL RISK OF LOSS AND IS NOT SUITABLE FOR ALL INVESTORS.

3.1 High-Risk Nature: Cryptocurrency and derivatives markets are highly volatile. Prices can move rapidly, and you may lose all or more than your initial investment. Past performance is not indicative of future results.

3.2 Leverage Risk: Use of leverage magnifies both potential gains and potential losses. Positions may be liquidated automatically if your margin falls below the maintenance requirement. Liquidation results in total or partial loss of your margin and you will not be entitled to any recovery.

3.3 Technology Risk: The Platform may experience outages, latency, errors, or technical malfunctions. Orders may not execute as expected. You acknowledge that no guarantee of uptime, execution speed, or system availability is made.

3.4 No Investment Advice: Nothing on the Platform constitutes financial, investment, legal, or tax advice. All trading decisions are made solely by you. The Platform provides tools only — it does not recommend, endorse, or advise on any specific trade, strategy, or asset.

3.5 Quantitative Bot Engine: The automated trading strategies offered through the Quant Engine are provided as informational tools only. Past bot performance does not guarantee future returns. You acknowledge that bots can and do generate losses, and the Platform bears no responsibility for any losses incurred.

3.6 Staking Products: Staking yields are variable and not guaranteed. Staked funds are subject to platform risk, market risk, and smart-contract risk. Early withdrawal may result in reduced or forfeited yield.`,
  },
  {
    id: 'norefund',
    title: '4. No Refund Policy & Finality of Transactions',
    content: `4.1 All Transactions Are Final: All deposits, withdrawals, trades, and other financial transactions executed on the Platform are final and irreversible. The Platform does not offer refunds, chargebacks, or reversals under any circumstances.

4.2 Trading Losses Are Non-Recoverable: Any losses incurred through futures trading, spot trading, staking, or bot activity are borne entirely and exclusively by the User. The Platform shall not be liable for any trading losses, regardless of cause, including but not limited to: market volatility, liquidation events, system errors, delayed order execution, or incorrect user inputs.

4.3 No Recourse Against the Platform: By using the Platform, you expressly waive any right to seek recovery, reimbursement, or compensation from the Platform, its operators, affiliates, directors, employees, or agents for any trading losses, missed profits, or any other financial losses of any nature.

4.4 Deposit Finality: Funds deposited to the Platform are held for trading purposes only. The Platform is not a bank and does not offer deposit insurance or guarantee of fund safety. Deposits are used entirely at the User's own risk.`,
  },
  {
    id: 'liability',
    title: '5. Limitation of Liability & Indemnification',
    content: `5.1 Maximum Liability: TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE PLATFORM, ITS PARENT COMPANIES, SUBSIDIARIES, AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES.

5.2 No Liability for User Losses: The Platform expressly disclaims any and all liability for losses of any kind arising from your use of the Platform, including losses from: futures trading, automated bot strategies, staking products, market price movements, liquidations, deposit or withdrawal processing, or any failure of the Platform's systems.

5.3 Force Majeure: The Platform is not liable for any failure or delay caused by events beyond its reasonable control, including but not limited to: acts of God, natural disasters, government actions, exchange outages, blockchain network failures, cyberattacks, or market disruptions.

5.4 Indemnification: You agree to indemnify, defend, and hold harmless the Platform and its affiliates from any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from: your use of the Platform, your breach of these Terms, your violation of any law, or your infringement of any third-party rights.`,
  },
  {
    id: 'disputes',
    title: '6. Dispute Resolution & Governing Law',
    content: `6.1 Binding Arbitration: Any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Platform shall be resolved exclusively through binding arbitration, and not through any court or judicial proceeding, except where prohibited by law.

6.2 Waiver of Class Actions: You waive any right to participate in class action lawsuits or class-wide arbitration. All disputes must be brought in your individual capacity only.

6.3 Governing Law: These Terms shall be governed by and construed in accordance with applicable international financial services law. You agree that any dispute shall be handled under the jurisdiction selected by the Platform, and you submit to such jurisdiction.

6.4 No Judicial Recovery: By accepting these Terms, you explicitly acknowledge that you waive the right to seek refunds, damages, or compensation through courts, regulatory bodies, financial ombudsmen, consumer protection agencies, or any other judicial or quasi-judicial authority in connection with trading losses or any loss arising from your use of the Platform.

6.5 Time Limitation: Any claim against the Platform must be submitted within thirty (30) days of the event giving rise to the claim, after which all such claims are permanently barred.`,
  },
  {
    id: 'accounts',
    title: '7. Account Security & User Responsibility',
    content: `7.1 You are solely responsible for maintaining the security of your account credentials, 2FA codes, and any access to your account. The Platform is not responsible for unauthorized account access resulting from your negligence.

7.2 You must not share your account with others. Any activity performed from your account is deemed to be performed by you, regardless of who actually performed it.

7.3 You are responsible for all taxes, duties, and other charges applicable to your trading activity in your jurisdiction. The Platform does not withhold taxes and bears no responsibility for your tax obligations.

7.4 The Platform reserves the right to suspend or terminate accounts at any time, for any reason, including but not limited to suspected fraud, breach of Terms, or regulatory compliance requirements.`,
  },
  {
    id: 'kyc',
    title: '8. KYC / AML Compliance',
    content: `8.1 The Platform complies with applicable Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations. Users may be required to submit identity verification documents.

8.2 Withdrawal limits and full platform access are contingent on completion of KYC verification. The Platform reserves the right to freeze funds or restrict withdrawals pending identity verification.

8.3 The Platform reserves the right to report suspicious activity to relevant authorities and to freeze or seize funds in accordance with applicable law.`,
  },
  {
    id: 'amendments',
    title: '9. Amendments & Termination',
    content: `9.1 The Platform reserves the right to modify, update, or replace any part of these Terms at any time without prior notice. Changes become effective immediately upon posting.

9.2 The Platform may terminate or suspend access to the Platform for any user at any time, with or without cause, with or without notice, and without any liability to you.

9.3 Upon termination, all provisions of these Terms that by their nature should survive termination shall continue to apply, including but not limited to the No Refund Policy, Limitation of Liability, and Dispute Resolution sections.`,
  },
  {
    id: 'entire',
    title: '10. Entire Agreement',
    content: `These Terms, together with the Privacy Policy and any other legal notices published by the Platform, constitute the entire agreement between you and the Platform with respect to your use of the Platform, and supersede all prior agreements, representations, and understandings.

If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

BY USING THE PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS IN THEIR ENTIRETY. YOU ACKNOWLEDGE THAT THE PLATFORM BEARS NO LIABILITY FOR TRADING LOSSES, BOT LOSSES, STAKING LOSSES, OR ANY OTHER FINANCIAL LOSSES ARISING FROM YOUR USE OF THE PLATFORM.`,
  },
];

export default function Legal() {
  const [open, setOpen] = useState<string | null>('risk');

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 fade-in">

      {/* Header */}
      <div className="ex-card p-5" style={{ borderTop: '3px solid var(--red)' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <Scale size={18} style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Terms of Service & Risk Disclosure</h1>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text3)' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' '}· Please read these terms carefully before using the Platform.
            </p>
          </div>
        </div>
      </div>

      {/* Critical warning banner */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.25)' }}>
        <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-xs font-black text-white mb-1">⚠ HIGH RISK WARNING</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
            Cryptocurrency derivatives, futures, and leveraged trading carry an extremely high risk of loss.
            <strong className="text-white"> You may lose all of your deposited funds.</strong> The Platform
            does not provide refunds for trading losses under any circumstances. Ensure you fully understand
            the risks before trading. Only trade with funds you can afford to lose entirely.
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          { icon: AlertTriangle, label: 'No Refunds', desc: 'All losses are final', color: 'var(--red)' },
          { icon: Shield, label: 'No Liability', desc: 'Platform not responsible for losses', color: 'var(--yellow)' },
          { icon: FileText, label: 'Binding Arbitration', desc: 'No court proceedings', color: 'var(--brand-1)' },
          { icon: Scale, label: 'No Class Action', desc: 'Individual disputes only', color: '#06b6d4' },
          { icon: AlertTriangle, label: 'Leverage Risk', desc: 'Full margin can be lost', color: 'var(--red)' },
          { icon: Shield, label: 'KYC Required', desc: 'For full withdrawal access', color: 'var(--green)' },
        ].map(c => (
          <div key={c.label} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <c.icon size={13} style={{ color: c.color, flexShrink: 0 }} />
            <div>
              <p className="text-xs font-bold text-white">{c.label}</p>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: 'var(--text3)' }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sections accordion */}
      <div className="space-y-1.5">
        {sections.map(s => (
          <div key={s.id} className="ex-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
              onClick={() => setOpen(open === s.id ? null : s.id)}
              style={{ background: open === s.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <span className="text-sm font-semibold text-white">{s.title}</span>
              {open === s.id
                ? <ChevronUp size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                : <ChevronDown size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
            </button>
            {open === s.id && (
              <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs leading-relaxed mt-3 whitespace-pre-line"
                  style={{ color: 'var(--text2)' }}>
                  {s.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer acknowledgment */}
      <div className="rounded-xl p-4 text-center"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
          By continuing to use the Platform, you confirm that you have read, understood, and accepted
          all of the above terms. All trading activity is performed at your own risk.
          The Platform accepts no liability for any losses of any nature.
        </p>
      </div>
    </div>
  );
}
