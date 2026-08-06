-- ========================================================
-- DATABASE SCHEMA SUPABASE UNTUK GDGATE DASHBOARD
-- ========================================================
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor
-- ========================================================

-- 1. TABEL PROFIL PENGGUNA (users_profile)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses RLS untuk Profile (User hanya bisa membaca/mengubah data miliknya sendiri)
CREATE POLICY "Pengguna dapat membaca profil sendiri" ON public.users_profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Pengguna dapat memperbarui profil sendiri" ON public.users_profile
    FOR UPDATE USING (auth.uid() = id);


-- 2. TABEL AKUN GOOGLE DRIVE TERHUBUNG (gdrive_accounts)
CREATE TABLE IF NOT EXISTS public.gdrive_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    email TEXT,
    folder_id TEXT NOT NULL,
    color TEXT DEFAULT 'from-blue-600 to-indigo-600',
    used_bytes BIGINT DEFAULT 0,
    total_bytes BIGINT DEFAULT 16106127360, -- 15 GB default
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.gdrive_accounts ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses RLS untuk Akun Drive
CREATE POLICY "Pengguna dapat membaca akun drive milik sendiri" ON public.gdrive_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menambahkan akun drive milik sendiri" ON public.gdrive_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat memperbarui akun drive milik sendiri" ON public.gdrive_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat menghapus akun drive milik sendiri" ON public.gdrive_accounts
    FOR DELETE USING (auth.uid() = user_id);


-- 3. TABEL CACHE MEDIA & FOTO (media_cache)
CREATE TABLE IF NOT EXISTS public.media_cache (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    account_name TEXT,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video', 'doc', 'other')),
    ext TEXT,
    size BIGINT,
    size_formatted TEXT,
    subfolder TEXT DEFAULT 'Utama',
    url TEXT,
    view_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.media_cache ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses RLS untuk Media Cache
CREATE POLICY "Pengguna dapat membaca cache media milik sendiri" ON public.media_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pengguna dapat mengelola cache media milik sendiri" ON public.media_cache
    FOR ALL USING (auth.uid() = user_id);


-- 4. TRIGGER OTOMATIS SAAT USER REGISTRASI BARU
-- Fungsi untuk membuat baris profile otomatis saat user daftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, email, display_name)
    VALUES (new.id, new.email, split_part(new.email, '@', 1));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pemanggil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- SCHEMA BERHASIL DIBUAT!
-- ========================================================
