import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Files } from 'formidable';
import fs from 'fs';
import supabase from '../../../lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

// 🔧 Utility to safely get a single string value from a field
const getFieldValue = (field: string | string[] | undefined, fallback: string): string => {
  if (Array.isArray(field)) return field[0];
  return field || fallback;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, async (err: unknown, fields: formidable.Fields, files: Files) => {
    if (err) {
      const parseError = err as Error;
      console.error('Formidable error:', parseError);
      return res.status(500).json({ error: 'File upload error', details: parseError.message });
    }

    let file = files.file as File | File[] | undefined;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (Array.isArray(file)) file = file[0];

    if (!file.originalFilename || !file.filepath) {
      return res.status(400).json({ error: 'Invalid file' });
    }

    const adminId = getFieldValue(fields.admin_id, '0');
    const username = getFieldValue(fields.username, 'admin');
    const fileExt = file.originalFilename.split('.').pop() || 'jpg';
    const fileName = `${adminId}-${username}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `.${fileExt}`;

    const fileBuffer = fs.readFileSync(file.filepath);

    // ✅ Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('admin-profile-pictures')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed', details: uploadError.message });
    }

    const { data } = supabase.storage.from('admin-profile-pictures').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    return res.status(200).json({ url: publicUrl });
  });
}
