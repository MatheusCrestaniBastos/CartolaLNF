# ⚽ LNF Fantasy

> **Fantasy Game Profissional da Liga Nacional de Futsal**

Sistema completo de fantasy game com design inspirado no Cartola FC, tematizado para a Liga Nacional de Futsal.

[![Design](https://img.shields.io/badge/Design-Cartola_FC-05D982?style=for-the-badge)](.)
[![Responsive](https://img.shields.io/badge/Responsive-100%25-FF6B00?style=for-the-badge)](.)
[![Status](https://img.shields.io/badge/Status-Produção-success?style=for-the-badge)](.)

---

## 🎨 Design Profissional

✅ Interface inspirada no **Cartola FC**  
✅ **100% Responsivo** (Mobile, Tablet, Desktop)  
✅ Identidade visual **LNF** (Verde + Laranja)  
✅ Campo de futsal **realista** com textura  
✅ Animações **suaves** e profissionais  

---

## 🚀 Início Rápido (5 minutos)

### 1️⃣ Instalar VSCode + Live Server

```
1. Baixe: https://code.visualstudio.com
2. Instale a extensão "Live Server"
3. Abra esta pasta no VSCode
4. Clique direito em index.html → "Open with Live Server"
```

### 2️⃣ Configurar Supabase

```
1. Crie conta em https://supabase.com
2. Crie novo projeto
3. Execute database.sql no SQL Editor
4. Copie URL e ANON KEY
5. Cole em assets/js/config.js
```

### 3️⃣ Pronto!

```
http://localhost:5500
```

---

## 📁 O que tem aqui?

```
lnf-fantasy-v2/
├── 🏠 index.html           → Login/Cadastro
├── ⚽ dashboard.html        → Meu Time
├── 🛒 mercado.html          → Mercado
├── ⚙️  admin.html            → Painel Admin
├── 💾 database.sql          → Banco de dados
└── 📦 assets/               → CSS + JS
```

---

## 🎮 Funcionalidades

### Para Jogadores 👤

- [x] Cadastro e login seguros
- [x] Escalar time (5 jogadores)
- [x] Mercado com filtros
- [x] C$ 100,00 de orçamento
- [x] Pontuação em tempo real
- [x] Ranking geral

### Para Admins 👨‍💼

- [x] Gerenciar times LNF
- [x] Adicionar jogadores
- [x] Criar rodadas
- [x] Lançar scouts
- [x] Dashboard de stats

---

## 🎯 Regras

### Formação (Futsal)
```
1 Goleiro  (GOL)
1 Fixo     (FIX)
2 Alas     (ALA)
1 Pivô     (PIV)
────────────────
5 jogadores
```

### Pontuação
```
⚽ Gol              +8
🎯 Assistência     +5
🎪 Finalização     +3
🧤 Defesa          +7
🛡️ Sem sofrer gol  +5
───────────────────
⚽ Gol contra       -3
🟨 Amarelo          -1
🟥 Vermelho         -5
```

---

## 👨‍💼 Ser Admin

Execute no Supabase:

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'seu@email.com';
```

---

## 🎨 Cores LNF

```css
🟢 Verde Cartola:  #05D982
🟠 Laranja LNF:    #FF6B00
🔵 Azul LNF:       #003366
```

---

## 📱 100% Responsivo

| Dispositivo | Layout |
|-------------|--------|
| Desktop (>1024px) | 5 colunas |
| Tablet (768-1024px) | 3 colunas |
| Mobile (480-768px) | 2 colunas |
| Pequeno (<480px) | 1 coluna |

---

## 🔧 Tecnologias

- HTML5, CSS3, JavaScript
- Supabase (PostgreSQL + Auth)
- Design System profissional
- Sem frameworks (vanilla)

---

## 📦 Deploy Rápido

**Vercel:**
```bash
vercel
```

**Netlify:**
Arraste a pasta para netlify.com

**GitHub Pages:**
```bash
git push origin main
# Ative Pages no repo
```

---

## ❓ Problemas Comuns

### CSS não carrega?
❌ Não abra HTML diretamente  
✅ Use Live Server

### Supabase não conecta?
✅ Verifique `config.js`  
✅ Execute `database.sql`

### Não consigo fazer login?
✅ Execute SQL completo  
✅ Verifique credenciais

---

## 📄 Licença

MIT - Livre para uso

---

**Desenvolvido com 💚 para a Liga Nacional de Futsal**

🏆 **Bom jogo!** ⚽
