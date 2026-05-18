# Supabase Storage Setup for Profile Photos

## Manual Setup Required

The following storage bucket setup must be done manually in the Supabase Dashboard:

### 1. Create Storage Bucket
- Go to Supabase Dashboard → Storage
- Click "New bucket"
- Name: `profile-photos`
- Public bucket: Yes (for photo display)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### 2. Configure Bucket Policies

**Public Read Access:**
```sql
-- Allow public read access to profile photos
create policy "Public read access for profile photos"
on storage.objects
for select
to anon
using (bucket_id = 'profile-photos');
```

**Authenticated Write Access:**
```sql
-- Allow authenticated users to upload to their own folder
create policy "Authenticated users can upload own photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
create policy "Authenticated users can update own photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
create policy "Authenticated users can delete own photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Enable Image Transformation

In Supabase Dashboard → Storage → profile-photos → Settings:
- Enable Image Transformation
- Max width: 400px
- Max height: 400px
- Quality: 85%

### 4. File Naming Convention

Photos will be stored with the following naming pattern:
`{user_id}/{timestamp}.{ext}`

Example: `550e8400-e29b-41d4-a716-446655440000/1716067200.jpg`

This ensures:
- Each user has their own folder
- Timestamp prevents overwrites
- Easy to identify owner
