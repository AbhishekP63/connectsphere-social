/*
  # Setup Storage Buckets for ConnectSphere

  1. Storage Buckets
    - `profile-pictures` - User profile pictures (public read)
    - `cover-photos` - User cover photos (public read)
    - `post-images` - Images attached to posts (public read for friends)
    - `stories` - Story images (public read for friends, auto-expire)

  2. Security
    - Users can upload to their own folders
    - Public read access for profile and cover photos
    - Restricted read access for post images and stories based on friendships
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profile-pictures', 'profile-pictures', true),
  ('cover-photos', 'cover-photos', true),
  ('post-images', 'post-images', false),
  ('stories', 'stories', false)
ON CONFLICT (id) DO NOTHING;

-- Profile pictures policies
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own profile picture"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile picture"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Cover photos policies
CREATE POLICY "Anyone can view cover photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cover-photos');

CREATE POLICY "Users can upload their own cover photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own cover photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own cover photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cover-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Post images policies
CREATE POLICY "Users can view post images from friends"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND recipient_id::text = (storage.foldername(name))[1])
             OR (recipient_id = auth.uid() AND requester_id::text = (storage.foldername(name))[1]))
      )
    )
  );

CREATE POLICY "Users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Stories policies
CREATE POLICY "Users can view stories from friends"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'stories' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND recipient_id::text = (storage.foldername(name))[1])
             OR (recipient_id = auth.uid() AND requester_id::text = (storage.foldername(name))[1]))
      )
    )
  );

CREATE POLICY "Users can upload stories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own stories"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );