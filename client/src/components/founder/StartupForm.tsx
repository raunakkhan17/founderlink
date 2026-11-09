'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  FileText,
  Users,
  DollarSign,
  Upload,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { createStartup, uploadStartupDocument, Startup, TeamMember } from '@/lib/founder.api';

interface StartupFormProps {
  onSuccess?: (startup: Startup) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Basics', icon: Rocket },
  { id: 2, title: 'Problem & Market', icon: FileText },
  { id: 3, title: 'Team', icon: Users },
  { id: 4, title: 'Funding', icon: DollarSign },
  { id: 5, title: 'Documents', icon: Upload },
];

export function StartupForm({ onSuccess, onCancel }: StartupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('SaaS');
  const [stage, setStage] = useState<'idea' | 'mvp' | 'early_traction' | 'growth' | 'scaling'>('mvp');

  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [marketSize, setMarketSize] = useState('');

  const [team, setTeam] = useState<TeamMember[]>([
    { name: '', role: 'Founder & CEO', linkedinUrl: '' },
  ]);

  const [fundingAsk, setFundingAsk] = useState<string>('');
  const [equityOffered, setEquityOffered] = useState<string>('');

  // Initial document state
  const [docTitle, setDocTitle] = useState('Pitch Deck');
  const [docType, setDocType] = useState<'pitch_deck' | 'financial' | 'legal' | 'technical' | 'other'>('pitch_deck');
  const [docAccessLevel, setDocAccessLevel] = useState<'public' | 'locked' | 'approved_only'>('public');
  const [docFile, setDocFile] = useState<File | null>(null);

  const handleAddTeamMember = () => {
    setTeam([...team, { name: '', role: '', linkedinUrl: '' }]);
  };

  const handleRemoveTeamMember = (index: number) => {
    if (team.length <= 1) return;
    setTeam(team.filter((_, i) => i !== index));
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...team];
    updated[index] = { ...updated[index], [field]: value };
    setTeam(updated);
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter your startup name.');
        return false;
      }
      if (!tagline.trim()) {
        setError('Please enter a short tagline.');
        return false;
      }
      if (!industry.trim()) {
        setError('Please select an industry.');
        return false;
      }
    } else if (step === 2) {
      if (!problem.trim()) {
        setError('Please describe the problem you are solving.');
        return false;
      }
      if (!solution.trim()) {
        setError('Please describe your product/solution.');
        return false;
      }
    } else if (step === 3) {
      const validMembers = team.filter((m) => m.name.trim() && m.role.trim());
      if (validMembers.length === 0) {
        setError('Please add at least one team member with name and role.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError(null);

    try {
      const cleanedTeam = team
        .filter((m) => m.name.trim() && m.role.trim())
        .map((m) => ({
          name: m.name.trim(),
          role: m.role.trim(),
          linkedinUrl: m.linkedinUrl?.trim() || undefined,
        }));

      const payload: Partial<Startup> = {
        name: name.trim(),
        tagline: tagline.trim(),
        industry,
        stage,
        problem: problem.trim(),
        solution: solution.trim(),
        marketSize: marketSize.trim() || undefined,
        team: cleanedTeam,
        fundingAsk: fundingAsk ? parseFloat(fundingAsk) : undefined,
        equityOffered: equityOffered ? parseFloat(equityOffered) : undefined,
      };

      const res = await createStartup(payload);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create startup');
      }

      const createdStartup = res.data;

      // If a document was selected in step 5, upload it
      if (docFile && createdStartup._id) {
        try {
          const formData = new FormData();
          formData.append('document', docFile);
          formData.append('title', docTitle.trim() || docFile.name);
          formData.append('type', docType);
          formData.append('accessLevel', docAccessLevel);

          await uploadStartupDocument(createdStartup._id, formData);
        } catch (uploadErr) {
          console.warn('Initial document upload warning:', uploadErr);
        }
      }

      if (onSuccess) {
        onSuccess(createdStartup);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while posting your startup';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header & Stepper */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Post Your Startup</h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete the 5 steps to submit your venture for investor matching. New profiles start in Pending review.
        </p>

        {/* Stepper Bar */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isDone = currentStep > s.id;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (isDone) setCurrentStep(s.id);
                }}
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs border-2 mb-1 transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                      : isDone
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] text-center hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: BASICS */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Startup Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme AI"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline (One-sentence pitch) *
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous workflows for high-growth tech founders"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Industry *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SaaS">SaaS & Enterprise</option>
                  <option value="Fintech">Fintech & Payments</option>
                  <option value="Healthtech">Healthtech & Biotech</option>
                  <option value="AI / ML">Artificial Intelligence & ML</option>
                  <option value="CleanTech">CleanTech & Energy</option>
                  <option value="E-commerce">E-commerce & Retail</option>
                  <option value="Edtech">Edtech</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Hardware">Hardware & Robotics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Stage *
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="idea">Idea Stage</option>
                  <option value="mvp">MVP (Minimum Viable Product)</option>
                  <option value="early_traction">Early Traction</option>
                  <option value="growth">Growth & Expansion</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROBLEM & MARKET */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                The Problem *
              </label>
              <textarea
                rows={3}
                placeholder="What pain point does your customer experience?"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Your Solution *
              </label>
              <textarea
                rows={3}
                placeholder="How does your product solve this uniquely and effectively?"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Market Size & TAM (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. $12B global market, growing 18% YoY"
                value={marketSize}
                onChange={(e) => setMarketSize(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* STEP 3: TEAM */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Core Team Members</h3>
                <p className="text-xs text-slate-500">Highlight founders, advisors, and key contributors.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTeamMember}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Member #{index + 1}
                    </span>
                    {team.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={member.name}
                        onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Role / Title * (e.g. CTO)"
                        value={member.role}
                        onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="LinkedIn Profile URL"
                        value={member.linkedinUrl || ''}
                        onChange={(e) => handleTeamMemberChange(index, 'linkedinUrl', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: FUNDING */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Funding Target / Round Ask ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="500000"
                  value={fundingAsk}
                  onChange={(e) => setFundingAsk(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Leave blank if not currently actively raising.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Equity Offered (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="10"
                  value={equityOffered}
                  onChange={(e) => setEquityOffered(e.target.value)}
                  className="w-full pr-8 pl-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm">%</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: DOCUMENTS */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attach Initial Document (Optional)</h3>
              <p className="text-xs text-slate-500">
                You can attach your Pitch Deck or One-Pager now or upload more documents later in the Document Vault.
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center">
              <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <input
                type="file"
                id="docUpload"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="docUpload"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                {docFile ? 'Change Selected File' : 'Select PDF or Document (max 20MB)'}
              </label>

              {docFile && (
                <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-2">
                  <span>Selected: {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => setDocFile(null)}
                    className="text-rose-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {docFile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="pitch_deck">Pitch Deck</option>
                    <option value="financial">Financials</option>
                    <option value="legal">Legal & Cap Table</option>
                    <option value="technical">Technical Whitepaper</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Access Level
                  </label>
                  <select
                    value={docAccessLevel}
                    onChange={(e) => setDocAccessLevel(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="public">Public (Visible to verified investors)</option>
                    <option value="approved_only">Approved Only (Requires founder sign-off)</option>
                    <option value="locked">Locked (Private)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            ) : onCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {loading ? 'Submitting...' : 'Complete & Post Pitch'}
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

