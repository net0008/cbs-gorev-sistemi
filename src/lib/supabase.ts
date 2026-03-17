import { createClient } from '@supabase/supabase-js';

// '!' işareti TypeScript'e "Bu değerlerin var olduğuna eminim, hata verme" der.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Vercel'de veya çalışma anında eksiklik varsa yine de hata fırlatırız (güvenlik için)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL ve Key bilgileri .env.local içinde tanımlanmamış!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);