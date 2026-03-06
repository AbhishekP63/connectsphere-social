import { supabase } from './supabase';

export async function uploadProfilePicture(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  const { error } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadCoverPhoto(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/cover.${fileExt}`;

  const { error } = await supabase.storage
    .from('cover-photos')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from('cover-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadPostImage(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('post-images')
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadStory(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('stories')
    .upload(fileName, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('stories')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
