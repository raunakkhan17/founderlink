'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
  Download,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  StartupDocument,
  getStartupDocuments,
  uploadStartupDocument,
  updateDocumentAccessLevel,
  deleteDocument,
} from '@/lib/founder.api';

interface DocumentManagerProps {
  startupId: string;
  startupName?: string;
}

export function DocumentManager({ startupId, startupName }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<StartupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Upload modal/form state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'pitch_deck' | 'financial' | 'legal' | 'technical' | 'other'>('pitch_deck');
  const [accessLevel, setAccessLevel] = useState<'public' | 'locked' | 'approved_only'>('approved_only');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    if (!startupId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getStartupDocuments(startupId);
      if (res.success && res.data) {
        setDocuments(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [startupId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExts = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
    const nameLower = file.name.toLowerCase();
    const isValid = validExts.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      setError('Invalid file type. Only PDF, DOCX, PNG, and JPG files are supported.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20 MB limit.');
      return;
    }

    setError(null);
    setFileToUpload(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !startupId) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('document', fileToUpload);
      formData.append('title', title.trim() || fileToUpload.name);
      formData.append('type', type);
      formData.append('accessLevel', accessLevel);

      const res = await uploadStartupDocument(startupId, formData);
      if (res.success && res.data) {
        setDocuments((prev) => [res.data!, ...prev]);
        setFileToUpload(null);
        setTitle('');
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Document upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAccessLevelChange = async (docId: string, newLevel: 'public' | 'locked' | 'approved_only') => {
    try {
      setUpdatingId(docId);
      const res = await updateDocumentAccessLevel(docId, newLevel);
      if (res.success) {
        setDocuments((prev) =>
          prev.map((doc) => (doc._id === docId ? { ...doc, accessLevel: newLevel } : doc))
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update access level');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setUpdatingId(docId);
      const res = await deleteDocument(docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'public':
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
            <Unlock className="w-3 h-3" /> Public
          </span>
        );
      case 'locked':
        return (
          <span className="flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">
            <Lock className="w-3 h-3" /> Locked
          </span>
        );
      case 'approved_only':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
            <ShieldAlert className="w-3 h-3" /> Approved Only
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
            Document Vault {startupName ? `— ${startupName}` : ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Store pitch decks, financials, and cap tables. Control which investors can access each file.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-5 p-6 border-2 border-dashed rounded-xl text-center transition-all ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
        }`}
      >
        <UploadCloud
          className={`w-10 h-10 mx-auto mb-2 transition-colors ${
            isDragOver ? 'text-blue-600' : 'text-slate-400'
          }`}
        />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Drag and drop your file here, or browse
        </h4>
        <p className="text-xs text-slate-400 mt-1">Accepts PDF, DOCX, PNG, JPG (up to 20 MB)</p>

        <input
          ref={fileInputRef}
          type="file"
          id="vaultDocUpload"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* File Upload Configuration Card */}
      {fileToUpload && (
        <form
          onSubmit={handleUploadSubmit}
          className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 animate-in fade-in space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Ready to Upload: {fileToUpload.name} ({formatFileSize(fileToUpload.size)})
            </span>
            <button
              type="button"
              onClick={() => setFileToUpload(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="pitch_deck">Pitch Deck</option>
                <option value="financial">Financials & Models</option>
                <option value="legal">Legal & Cap Table</option>
                <option value="technical">Technical Whitepaper</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="public">Public (all verified investors)</option>
                <option value="approved_only">Approved Only (request access)</option>
                <option value="locked">Locked (private)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Confirm Upload
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Documents List */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Uploaded Documents ({documents.length})
        </h4>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-slate-100 dark:border-slate-800 rounded-lg">
            No documents uploaded yet. Upload your deck or financials above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </p>
                      {getAccessBadge(doc.accessLevel)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Access Level Dropdown */}
                  <select
                    value={doc.accessLevel}
                    disabled={updatingId === doc._id}
                    onChange={(e) =>
                      handleAccessLevelChange(doc._id, e.target.value as 'public' | 'locked' | 'approved_only')
                    }
                    data-testid={`access-select-${doc._id}`}
                    aria-label="Access Level"
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="approved_only">Approved Only</option>
                    <option value="locked">Locked</option>
                  </select>

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Download / View"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    disabled={updatingId === doc._id}
                    onClick={() => handleDelete(doc._id)}
                    data-testid={`delete-doc-${doc._id}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

