import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CloudinaryService } from '../services/cloudinaryService';
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle,
  AlertTriangle,
  X,
  FileImage,
  RefreshCw
} from 'lucide-react';

export const ImageEvidence: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [metaForm, setMetaForm] = useState({
    defect_category: 'Surface Scratch',
    associated_inspection_id: '',
    associated_investigation_id: '',
    notes: '',
  });

  // Preview Modal
  const [previewImage, setPreviewImage] = useState<any | null>(null);

  const fetchImages = () => {
    setLoading(true);
    api.listImages({
      defect_category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      search: search ? search : undefined,
    })
      .then((res) => setImages(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchImages();
  }, [selectedCategory, search]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const val = CloudinaryService.validateImage(f);
      if (!val.valid) {
        setUploadError(val.error || 'Invalid file');
        setUploadFile(null);
        return;
      }
      setUploadError(null);
      setUploadFile(f);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Direct upload to Cloudinary using unsigned preset
      const result = await CloudinaryService.uploadImage(uploadFile, (percent) => {
        setUploadProgress(percent);
      });

      // 2. Register metadata with FastAPI backend & Firestore mirror
      await api.registerImage({
        secure_url: result.secure_url,
        public_id: result.public_id,
        original_filename: result.original_filename,
        file_size: result.bytes,
        content_type: uploadFile.type,
        defect_category: metaForm.defect_category,
        associated_inspection_id: metaForm.associated_inspection_id || undefined,
        associated_investigation_id: metaForm.associated_investigation_id || undefined,
        notes: metaForm.notes || undefined,
      });

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadProgress(null);
      fetchImages();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm(`Are you sure you want to remove image evidence ${imageId}?`)) return;
    try {
      await api.deleteImage(imageId);
      fetchImages();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete image record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inspection & Defect Photographic Evidence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cloudinary-backed photographic evidence archive for surface defects, assembly anomalies and failure analysis
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Image Evidence</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search filename, notes, or inspection ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Defect Categories</option>
            <option value="Surface Scratch">Surface Scratch</option>
            <option value="Dimensional Deviation">Dimensional Deviation</option>
            <option value="Material Crack">Material Crack</option>
            <option value="Assembly Misalignment">Assembly Misalignment</option>
            <option value="Contamination">Contamination</option>
            <option value="Electrical Failure">Electrical Failure</option>
            <option value="Missing Component">Missing Component</option>
            <option value="Packaging Damage">Packaging Damage</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {images.length} Evidence Records
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img) => (
          <div
            key={img.image_id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Image Thumbnail */}
            <div
              onClick={() => setPreviewImage(img)}
              className="h-44 bg-slate-100 relative cursor-pointer overflow-hidden group flex items-center justify-center"
            >
              <img
                src={img.secure_url}
                alt={img.original_filename}
                onError={(e: any) => {
                  // Fallback visual placeholder if external image url is placeholder
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('bg-slate-200');
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                Click to inspect
              </div>
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-sm">
                {img.defect_category || 'Evidence'}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate" title={img.original_filename}>
                  {img.original_filename}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {(img.file_size / 1024).toFixed(0)} KB • {new Date(img.uploaded_at).toLocaleDateString()}
                </p>

                {img.associated_inspection_id && (
                  <p className="text-[11px] font-mono text-blue-600 mt-2 truncate">
                    Inspection: {img.associated_inspection_id}
                  </p>
                )}
                {img.notes && (
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">
                    "{img.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={img.secure_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <span>Cloudinary URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleDelete(img.image_id)}
                  title="Remove metadata record"
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <FileImage className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No evidence photographs match search</p>
            <p className="text-xs mt-1">Upload JPEG, PNG or WEBP photos to establish visual audit trail.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Upload Inspection Photograph
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Photograph (JPEG, PNG, WEBP - Max 10MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect Category
                </label>
                <select
                  value={metaForm.defect_category}
                  onChange={(e) => setMetaForm({ ...metaForm, defect_category: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="Surface Scratch">Surface Scratch</option>
                  <option value="Dimensional Deviation">Dimensional Deviation</option>
                  <option value="Material Crack">Material Crack</option>
                  <option value="Assembly Misalignment">Assembly Misalignment</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Electrical Failure">Electrical Failure</option>
                  <option value="Missing Component">Missing Component</option>
                  <option value="Packaging Damage">Packaging Damage</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inspection ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INSP-2026-0001"
                    value={metaForm.associated_inspection_id}
                    onChange={(e) => setMetaForm({ ...metaForm, associated_inspection_id: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Investigation Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0042"
                    value={metaForm.associated_investigation_id}
                    onChange={(e) => setMetaForm({ ...metaForm, associated_investigation_id: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Observations, lighting conditions, or AOI coordinates..."
                  value={metaForm.notes}
                  onChange={(e) => setMetaForm({ ...metaForm, notes: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Uploading to Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploading ? 'Processing...' : 'Upload to Cloudinary'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {previewImage.defect_category} Evidence
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {previewImage.original_filename}
                </h3>
              </div>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
              <img
                src={previewImage.secure_url}
                alt={previewImage.original_filename}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <p><b>Secure URL:</b> <a href={previewImage.secure_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate">{previewImage.secure_url}</a></p>
              {previewImage.associated_inspection_id && <p><b>Inspection:</b> {previewImage.associated_inspection_id}</p>}
              {previewImage.associated_investigation_id && <p><b>Investigation:</b> {previewImage.associated_investigation_id}</p>}
              {previewImage.notes && <p><b>Notes:</b> {previewImage.notes}</p>}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
