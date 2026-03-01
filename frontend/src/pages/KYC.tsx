import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, CheckCircle, Clock, XCircle, FileText, Camera, CreditCard, RefreshCw, Shield, AlertTriangle, BadgeCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; desc: string }> = {
  unverified: { icon: AlertTriangle, color: 'var(--yellow)',  bg: 'rgba(245,158,11,0.08)',  label: 'Not Verified',    desc: 'Submit your ID to unlock full platform features and higher withdrawal limits.' },
  pending:    { icon: Clock,         color: 'var(--cyan)',    bg: 'rgba(6,182,212,0.08)',   label: 'Under Review',    desc: 'Your documents are being reviewed. This usually takes 24–48 hours.' },
  approved:   { icon: BadgeCheck,    color: 'var(--green)',   bg: 'rgba(16,185,129,0.08)',  label: 'Verified',        desc: 'Your identity has been verified. You have full access to all platform features.' },
  rejected:   { icon: XCircle,       color: 'var(--red)',     bg: 'rgba(244,63,94,0.08)',   label: 'Rejected',        desc: 'Your submission was rejected. Please re-submit with clearer documents.' },
};

const DOC_TYPES = [
  { value: 'passport',       label: 'Passport',          icon: FileText },
  { value: 'national_id',    label: 'National ID Card',  icon: CreditCard },
  { value: 'drivers_license',label: "Driver's License",  icon: CreditCard },
];

interface KYCSub {
  id: number; status: string; doc_type: string; submitted_at: string; admin_note?: string;
}

export default function KYC() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<KYCSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType] = useState('passport');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [files, setFiles] = useState<{ id_front?: File; id_back?: File; selfie?: File }>({});
  const [previews, setPreviews] = useState<{ id_front?: string; id_back?: string; selfie?: string }>({});

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/kyc/status');
      setSubmission(data.submission);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStatus();
    setFullName(user?.full_name || '');
  }, [fetchStatus, user]);

  const handleFile = (field: 'id_front' | 'id_back' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles(prev => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onload = ev => setPreviews(prev => ({ ...prev, [field]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.id_front) { toast('warning', 'ID front photo required'); return; }
    if (!files.selfie)   { toast('warning', 'Selfie with ID required'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('doc_type', docType);
      fd.append('full_name', fullName);
      fd.append('dob', dob);
      fd.append('country', country);
      if (files.id_front) fd.append('id_front', files.id_front);
      if (files.id_back)  fd.append('id_back',  files.id_back);
      if (files.selfie)   fd.append('selfie',   files.selfie);
      await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('success', 'KYC Submitted', 'Under review — usually 24–48 hours');
      await fetchStatus();
      await refreshUser();
    } catch (err: any) {
      toast('error', err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const kycStatus = submission?.status || user?.kyc_status || 'unverified';
  const cfg = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.unverified;
  const canSubmit = kycStatus === 'unverified' || kycStatus === 'rejected';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text3)' }} />
    </div>
  );

  return (
    <div className="p-5 space-y-4 fade-in max-w-[900px] mx-auto">

      {/* Status banner */}
      <div className="ex-card p-5 flex items-start gap-4"
        style={{ border: `1px solid ${cfg.color}25`, background: cfg.bg }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}>
          <cfg.icon size={20} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-white">{cfg.label}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cfg.color}18`, color: cfg.color }}>
              KYC
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{cfg.desc}</p>
          {submission?.admin_note && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.2)' }}>
              Admin note: {submission.admin_note}
            </p>
          )}
          {submission && (
            <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
              Submitted {new Date(submission.submitted_at).toLocaleDateString(undefined, { year:'numeric',month:'short',day:'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Shield,      color: 'var(--green)',   title: 'Higher Limits',      desc: 'Increase daily withdrawal limits after verification' },
          { icon: BadgeCheck,  color: 'var(--brand-1)', title: 'Verified Badge',     desc: 'Display a verification badge on your profile' },
          { icon: CheckCircle, color: 'var(--cyan)',    title: 'Priority Support',   desc: 'Verified users get faster support response times' },
        ].map(b => (
          <div key={b.title} className="ex-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${b.color}12`, border: `1px solid ${b.color}20` }}>
              <b.icon size={15} style={{ color: b.color }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">{b.title}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Submission form */}
      {canSubmit && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: Personal info */}
            <div className="ex-card p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <FileText size={14} style={{ color: 'var(--brand-1)' }} />
                <span className="text-sm font-bold text-white">Personal Information</span>
              </div>

              {/* Document type */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text2)' }}>Document Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {DOC_TYPES.map(d => (
                    <button key={d.value} type="button" onClick={() => setDocType(d.value)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all text-center"
                      style={docType === d.value
                        ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.4)', color: 'var(--brand-1)' }
                        : { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)' }}>
                      <d.icon size={16} />
                      <span className="text-[10px] font-semibold leading-tight">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text2)' }}>Full Legal Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--brand-1)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  placeholder="As it appears on your ID" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text2)' }}>Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', colorScheme: 'dark' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--brand-1)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text2)' }}>Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--brand-1)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    placeholder="e.g. United States" />
                </div>
              </div>
            </div>

            {/* Right: Document uploads */}
            <div className="ex-card p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <Upload size={14} style={{ color: 'var(--brand-1)' }} />
                <span className="text-sm font-bold text-white">Document Uploads</span>
              </div>

              {([
                { field: 'id_front' as const, label: 'ID Front', icon: CreditCard, required: true,  tip: 'Front of your document — all text must be readable' },
                { field: 'id_back'  as const, label: 'ID Back',  icon: CreditCard, required: false, tip: 'Back of your document (not required for passport)' },
                { field: 'selfie'   as const, label: 'Selfie with ID', icon: Camera, required: true, tip: 'Hold your ID next to your face' },
              ]).map(({ field, label, icon: Icon, required, tip }) => (
                <FileUploadBox key={field} label={label} icon={Icon} required={required} tip={tip}
                  file={files[field]} preview={previews[field]}
                  onChange={handleFile(field)} />
              ))}
            </div>
          </div>

          {/* Guidelines */}
          <div className="ex-card p-4">
            <p className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={12} style={{ color: 'var(--yellow)' }} />
              Submission Guidelines
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Document must not be expired',
                'All text and photos must be clearly visible',
                'No blurry, cropped or edited images',
                'Selfie: face and ID fully visible together',
                'Accepted formats: JPG, PNG, PDF, WEBP (max 10MB)',
                'Personally identifiable — do not share with others',
              ].map(g => (
                <div key={g} className="flex items-start gap-2">
                  <CheckCircle size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--green)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'var(--brand-1)', color: '#fff' }}>
            {submitting
              ? <><RefreshCw size={14} className="animate-spin" /> Uploading…</>
              : <><Upload size={14} /> Submit KYC Verification</>}
          </button>
        </form>
      )}

      {/* Approved — display verified badge */}
      {kycStatus === 'approved' && (
        <div className="ex-card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid var(--green)' }}>
            <BadgeCheck size={32} style={{ color: 'var(--green)' }} />
          </div>
          <p className="text-lg font-bold text-white mb-2">Identity Verified</p>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            Your account is fully verified. Enjoy unlimited access to all platform features.
          </p>
        </div>
      )}

      {/* Pending — show waiting state */}
      {kycStatus === 'pending' && (
        <div className="ex-card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(6,182,212,0.12)', border: '2px solid var(--cyan)' }}>
            <Clock size={32} style={{ color: 'var(--cyan)' }} />
          </div>
          <p className="text-lg font-bold text-white mb-2">Review In Progress</p>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            Our team is reviewing your documents. You will receive an email notification when complete (24–48h).
          </p>
        </div>
      )}
    </div>
  );
}

function FileUploadBox({ label, icon: Icon, required, tip, file, preview, onChange }: {
  label: string; icon: React.ElementType; required: boolean; tip: string;
  file?: File; preview?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
          <Icon size={11} />
          {label}
          {required && <span style={{ color: 'var(--red)' }}>*</span>}
        </label>
        {file && <span className="text-[10px]" style={{ color: 'var(--green)' }}>✓ {file.name.slice(0, 20)}</span>}
      </div>
      <div
        onClick={() => ref.current?.click()}
        className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
        style={{
          background: 'var(--bg3)',
          border: file ? '1px solid rgba(16,185,129,0.4)' : '1px dashed rgba(255,255,255,0.12)',
          height: 90,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = file ? 'rgba(16,185,129,0.6)' : 'rgba(99,102,241,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = file ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)')}>
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            <Upload size={18} style={{ color: 'var(--text3)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{tip}</span>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={onChange} />
      </div>
    </div>
  );
}
