import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';
import { X, Upload, Loader2, Edit2 } from 'lucide-react';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirmEdit: (product: Product) => void;
}

export default function EditProductModal({
  isOpen,
  product,
  onClose,
  onConfirmEdit
}: EditProductModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setPrice(product.price ? product.price.toString() : '');
      setCategory(product.category || 'Pins');
      setImgUrl(product.image_url || '');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `trinkets/${cleanFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError.message);
      if (imagePreview) return imagePreview;
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(uploadData?.path || filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalImageUrl = imgUrl.trim();

      if (imageFile) {
        setIsUploadingImage(true);
        try {
          finalImageUrl = await uploadImageToSupabase(imageFile);
        } catch (uploadErr: any) {
          console.error('Image upload failed:', uploadErr);
          if (imagePreview) {
            finalImageUrl = imagePreview;
          } else {
            throw uploadErr;
          }
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (!finalImageUrl) {
        alert('Please provide an image for the trinket (upload a file or paste an image URL).');
        setIsSaving(false);
        return;
      }

      const updatedProductData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category as any,
        image_url: finalImageUrl
      };

      const { data, error } = await supabase
        .from('products')
        .update(updatedProductData)
        .eq('id', product.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        onConfirmEdit(data as Product);
      } else {
        onConfirmEdit({ ...product, ...updatedProductData });
      }
      onClose();
    } catch (err: any) {
      alert('Error updating product: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bb-navy/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 p-1.5 rounded-full text-bb-navy/40 hover:text-bb-navy hover:bg-bb-cream transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-bb-teal/10 text-bb-teal flex items-center justify-center shrink-0">
            <Edit2 size={20} />
          </div>
          <h2 className="text-xl font-serif font-bold text-bb-navy">Edit Product</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Product Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="e.g. Celestial Moth Enamel Pin" />
            </div>
            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal bg-white">
                <option>Pins</option>
                <option>Keychains</option>
                <option>Artworks</option>
                <option>Prints</option>
                <option>Stickers</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Price in PHP (₱) *</label>
              <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal" placeholder="150.00" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Trinket Image (File Upload or URL) *</span>
              </label>
              
              <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="edit-artwork-file-upload"
                />
                <label
                  htmlFor="edit-artwork-file-upload"
                  className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-bb-cream hover:bg-bb-navy/10 text-bb-navy border border-bb-navy/20 rounded-xl text-xs font-semibold transition-colors shrink-0"
                >
                  <Upload size={14} className="text-bb-teal" />
                  <span>{imageFile ? 'Change File' : 'Upload New Image'}</span>
                </label>

                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="url"
                    value={imgUrl}
                    onChange={e => {
                      setImgUrl(e.target.value);
                      if (e.target.value) {
                        setImageFile(null);
                        setImagePreview(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal"
                    placeholder={imageFile ? `Selected: ${imageFile.name}` : "Or paste image URL (https://...)"}
                  />
                </div>
              </div>

              {(imagePreview || imgUrl) && (
                <div className="relative mt-2 p-2 bg-bb-cream/50 rounded-xl border border-bb-navy/10 flex items-center gap-3 w-fit">
                  <img
                    src={imagePreview || imgUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-bb-navy/10 shadow-xs"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-bb-navy block truncate max-w-[200px]">
                      {imageFile ? imageFile.name : 'Current Image Preview'}
                    </span>
                    <span className="text-[10px] text-teal-700 block">
                      {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB (Ready to upload)` : 'Live Preview'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-bb-navy uppercase tracking-wider mb-1">Description & Material</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 rounded-xl border border-bb-navy/20 text-xs focus:border-bb-teal h-20 resize-none" placeholder="Describe the handcrafted medium, dimensions, backing..." />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-bb-navy/5">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-bb-navy/15 text-bb-navy hover:bg-bb-cream">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="bg-bb-teal text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-2">
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
