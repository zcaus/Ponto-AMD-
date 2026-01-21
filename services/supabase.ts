import { createClient } from '@supabase/supabase-js';

// CORREÇÃO APLICADA:
// 1. A URL do Supabase estava incorreta (terminava em .coE), foi ajustada para .co.
// 2. A chave API anterior não parecia ser uma chave 'anon' válida do Supabase (que é um JWT longo começando com 'ey...').
// Por favor, vá em Project Settings > API no seu painel Supabase e copie a chave "anon" / "public".

const SUPABASE_URL = 'https://nplrlqocehliejrwabns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbHJscW9jZWhsaWVqcndhYm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDAxMjgsImV4cCI6MjA4NDU3NjEyOH0.kVtH1fOA2G5lkRhXKSjlYiISN6pVJ4BygcOKN7CAzz4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);