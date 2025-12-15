// ============================================
// LNF FANTASY - CONFIGURAÇÃO
// ============================================

// ⚠️ ALTERE ESTAS CREDENCIAIS COM AS SUAS DO SUPABASE!
// Acesse: https://supabase.com/dashboard → Settings → API

const SUPABASE_URL = 'https://ocratwtvhripofiyxetw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcmF0d3R2aHJpcG9maXl4ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODc2NDAsImV4cCI6MjA4MTA2MzY0MH0.8CbFwuhH10zGLH5IGuyF1-F4pn9xbPLgb-WPwkK0SFA';

// Verificar se Supabase CDN foi carregado
if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase CDN não carregado! Verifique a conexão.');
} else {
    console.log('✅ Supabase CDN carregado');
}

// Inicializar Supabase
let supabase;

try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = supabase; // Garantir que está no window também
        console.log('✅ Supabase client criado');
    } else {
        console.error('❌ window.supabase.createClient não encontrado!');
    }
} catch (error) {
    console.error('❌ Erro ao criar Supabase client:', error);
}

console.log('✅ Config.js carregado');
