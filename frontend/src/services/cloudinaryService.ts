import axios from 'axios';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface ImageMetadata {
  image_id: string;
  secure_url: string;
  public_id: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  associated_inspection_id?: string;
  associated_defect_id?: string;
  associated_investigation_id?: string;
  defect_category?: string;
  notes?: string;
}

const CLOUD_NAME = "dlvjvskje";
const UPLOAD_PRESET = "Quality lens";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

export class CloudinaryService {
  /**
   * Validates the image file before attempting upload
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No file selected." };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file format (${file.type}). Allowed formats: JPEG, PNG, WEBP, BMP, TIFF.`
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`
      };
    }
    return { valid: true };
  }

  /**
   * Uploads image file directly to Cloudinary using unsigned preset
   */
  static async uploadImage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<CloudinaryUploadResult> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'qualitylens/defects');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      return {
        secure_url: response.data.secure_url,
        public_id: response.data.public_id,
        original_filename: file.name,
        format: response.data.format || file.type.split('/')[1],
        bytes: response.data.bytes || file.size,
        width: response.data.width,
        height: response.data.height,
        created_at: response.data.created_at || new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Cloudinary Direct Upload Error:', err);
      const detail = err.response?.data?.error?.message || err.message || "Cloudinary upload failed";
      throw new Error(`Upload to Cloudinary failed: ${detail}`);
    }
  }
}
