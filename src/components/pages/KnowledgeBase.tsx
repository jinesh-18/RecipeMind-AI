import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Trash2, Search, Database, AlertCircle,
  CheckCircle, Loader2, FileSearch, BookOpen, Eye
} from 'lucide-react';
import type { RecipeDocument } from '../../types';
import { getDocuments, uploadDocument, deleteDocument } from '../../services/documentService';
import { retrieve } from '../../services/retrievalService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG = {
  processing: { icon: <Loader2 size={14} className="animate-spin" />, badge: 'orange' as const, label: 'Processing' },
  ready: { icon: <CheckCircle size={14} />, badge: 'green' as const, label: 'Ready' },
  error: { icon: <AlertCircle size={14} />, badge: 'red' as const, label: 'Error' },
};

export function KnowledgeBase() {
  const [documents, setDocuments] = useState<RecipeDocument[]>(() => getDocuments());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof retrieve> | null>(null);
  const [previewDoc, setPreviewDoc] = useState<RecipeDocument | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const refresh = useCallback(() => setDocuments(getDocuments()), []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file);
        setUploadSuccess(`"${file.name}" uploaded successfully!`);
        refresh();
      } catch (err) {
        setUploadError((err as Error).message);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleSearch() {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const results = retrieve(searchQuery, 6);
    setSearchResults(results);
  }

  function handleDelete(doc: RecipeDocument) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    deleteDocument(doc.id);
    refresh();
    setDeleting(null);
  }

  const readyDocs = documents.filter(d => d.status === 'ready');
  const totalChunks = readyDocs.reduce((sum, d) => sum + d.chunks.length, 0);
  const totalRecipes = documents.reduce((sum, d) => sum + d.recipeCount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipe Knowledge Base</h1>
        <p className="text-gray-500 mt-1">Upload your cookbooks and recipe documents to power the AI assistant.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Documents', value: documents.length, icon: <BookOpen size={16} className="text-green-700" /> },
          { label: 'Recipes Found', value: totalRecipes, icon: <Database size={16} className="text-orange-500" /> },
          { label: 'Text Chunks', value: totalChunks, icon: <FileSearch size={16} className="text-blue-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-green-400'}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDragOver ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Upload size={24} className={isDragOver ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Drop recipe documents here</p>
            <p className="text-sm text-gray-500 mt-1">PDF, TXT, and DOCX supported · Max 10 MB per file</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
            disabled={uploading}
          >
            {uploading ? 'Processing…' : 'Choose Files'}
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle size={16} /> {uploadSuccess}
        </div>
      )}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} /> {uploadError}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">Search Recipe Content</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search across all uploaded documents…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            icon={<Search size={15} />}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm" icon={<Search size={14} />}>
            Search
          </Button>
        </div>

        {searchResults && (
          <div className="mt-4 space-y-3">
            {searchResults.chunks.length === 0 ? (
              <p className="text-sm text-gray-500">No results found. Try different keywords.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500">Found {searchResults.chunks.length} relevant passages across {searchResults.sources.length} document(s).</p>
                {searchResults.chunks.map((chunk, i) => (
                  <div key={chunk.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-green-700">{chunk.documentName}</span>
                      <span className="text-xs text-gray-400">Passage {i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{chunk.content.substring(0, 300)}…</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Document List */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Uploaded Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Database size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No documents yet. Upload your first cookbook!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => {
              const statusCfg = STATUS_CONFIG[doc.status];
              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-green-700" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm truncate">{doc.name}</span>
                        <Badge variant={statusCfg.badge}>
                          <span className="flex items-center gap-1">{statusCfg.icon} {statusCfg.label}</span>
                        </Badge>
                        <Badge variant="gray" size="xs">.{doc.type.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatBytes(doc.size)}</span>
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                        {doc.status === 'ready' && (
                          <>
                            <span>{doc.chunks.length} chunks indexed</span>
                            <span>~{doc.recipeCount} recipe(s)</span>
                          </>
                        )}
                      </div>
                      {doc.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{doc.errorMessage}</p>
                      )}
                      {doc.name === 'Sample Italian Cookbook.txt' && (
                        <span className="text-xs text-orange-600 mt-1 inline-block">📌 Demo document</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {doc.status === 'ready' && doc.chunks.length > 0 && (
                        <button
                          onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                          title="Preview chunks"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {previewDoc?.id === doc.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Indexed chunks ({doc.chunks.length})</p>
                      {doc.chunks.slice(0, 3).map((chunk, i) => (
                        <div key={chunk.id} className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                          <span className="text-green-600 font-medium mr-1">Chunk {i + 1}:</span>
                          {chunk.content.substring(0, 180)}…
                        </div>
                      ))}
                      {doc.chunks.length > 3 && (
                        <p className="text-xs text-gray-400">+{doc.chunks.length - 3} more chunks…</p>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
