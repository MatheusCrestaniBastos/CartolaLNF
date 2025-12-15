# 🚀 COMO USAR O LNF FANTASY

## ❌ PROBLEMA: Arquivo não encontrado

Se você viu esse erro:
```
GET file:///C:/Users/.../dashboard.css net::ERR_FILE_NOT_FOUND
```

É porque você está abrindo o HTML **diretamente** pelo explorador de arquivos.

---

## ✅ SOLUÇÃO: Usar Servidor Local

### **OPÇÃO 1: Live Server (VSCode) - RECOMENDADO** ⭐

1. **Instale o Visual Studio Code:**
   - https://code.visualstudio.com/

2. **Instale a extensão "Live Server":**
   - Abra VSCode
   - Vá em Extensions (Ctrl+Shift+X)
   - Procure por "Live Server"
   - Clique em "Install"

3. **Abra o projeto:**
   - File → Open Folder
   - Selecione a pasta `lnf-fantasy-v2`

4. **Inicie o servidor:**
   - Clique com botão direito em `index.html`
   - Selecione "Open with Live Server"
   - OU clique em "Go Live" no canto inferior direito

5. **Acesse:**
   ```
   http://localhost:5500
   ```

---

### **OPÇÃO 2: Python (Rápido)** 🐍

1. **Abra o terminal na pasta do projeto**

2. **Python 3:**
   ```bash
   python -m http.server 8000
   ```

3. **Acesse:**
   ```
   http://localhost:8000
   ```

---

### **OPÇÃO 3: Node.js (http-server)** 📦

1. **Instale (uma vez):**
   ```bash
   npm install -g http-server
   ```

2. **Execute na pasta:**
   ```bash
   http-server
   ```

3. **Acesse:**
   ```
   http://localhost:8080
   ```

---

### **OPÇÃO 4: PHP (Se tiver instalado)** 🐘

```bash
php -S localhost:8000
```

Acesse: http://localhost:8000

---

## 📁 ESTRUTURA CORRETA

Certifique-se de ter esta estrutura:

```
lnf-fantasy-v2/
├── index.html
├── dashboard.html
├── mercado.html
├── admin.html
├── database.sql
├── assets/
│   ├── css/
│   │   ├── style.css        ✅
│   │   ├── dashboard.css    ✅
│   │   └── admin.css        ✅
│   └── js/
│       ├── config.js        ✅
│       ├── auth.js          ✅
│       ├── dashboard.js     ✅
│       ├── mercado.js       ✅
│       └── admin.js         ✅
└── ...
```

---

## 🔧 CONFIGURAÇÃO DO SUPABASE

Antes de usar, configure suas credenciais:

1. **Abra:** `assets/js/config.js`

2. **Edite:**
   ```javascript
   const CONFIG = {
       SUPABASE_URL: 'SUA_URL_AQUI',
       SUPABASE_ANON_KEY: 'SUA_CHAVE_AQUI',
       // ...
   };
   ```

3. **Execute:** `database.sql` no SQL Editor do Supabase

---

## 🎯 PASSO A PASSO COMPLETO

### **1. Extrair o ZIP**
```
✅ Extraia lnf-fantasy-v2.zip
✅ Verifique se a pasta assets/ existe
✅ Verifique se os arquivos CSS estão em assets/css/
```

### **2. Configurar Supabase**
```
✅ Crie conta no Supabase (https://supabase.com)
✅ Crie novo projeto
✅ Execute database.sql no SQL Editor
✅ Copie URL e ANON KEY para config.js
```

### **3. Iniciar Servidor Local**
```
✅ Use uma das opções acima (Live Server é a melhor)
✅ Acesse http://localhost:PORTA
```

### **4. Fazer Login**
```
✅ Clique em "Cadastro"
✅ Preencha: Nome do Time, Email, Senha
✅ Faça login
```

### **5. Tornar-se Admin (opcional)**
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'seu@email.com';
```

---

## ⚠️ ERROS COMUNS

### **Erro: CSS não carrega**
❌ Abrindo com `file:///`
✅ Use servidor local

### **Erro: Supabase não conecta**
❌ Credenciais erradas em config.js
✅ Verifique URL e KEY

### **Erro: Não consegue fazer login**
❌ Database.sql não foi executado
✅ Execute o SQL completo

### **Erro: 406 Not Acceptable**
❌ Políticas RLS com problema
✅ Execute CORRIGIR-RLS.sql

---

## 🌐 HOSPEDAGEM ONLINE (Produção)

Para colocar online:

### **Vercel (Recomendado):**
1. Crie conta: https://vercel.com
2. Conecte GitHub ou faça upload
3. Deploy automático!

### **Netlify:**
1. Crie conta: https://netlify.com
2. Arraste a pasta para o site
3. Pronto!

### **GitHub Pages:**
1. Crie repositório no GitHub
2. Faça push dos arquivos
3. Ative Pages nas configurações

---

## 📞 SUPORTE

Se ainda tiver problemas:

1. ✅ Verifique a estrutura de pastas
2. ✅ Use servidor local (não file://)
3. ✅ Configure o Supabase corretamente
4. ✅ Execute o database.sql
5. ✅ Verifique o console do navegador (F12)

---

## 🎮 PRIMEIRO USO

```
1. Extrair ZIP ✅
2. Abrir VSCode ✅
3. Instalar Live Server ✅
4. Open with Live Server ✅
5. Configurar Supabase ✅
6. Executar database.sql ✅
7. Fazer cadastro ✅
8. Usar o sistema ✅
```

---

**IMPORTANTE:** Nunca abra os arquivos HTML diretamente clicando duas vezes no explorador. Sempre use um servidor local!

🟢 **LIVE SERVER É O MAIS FÁCIL!** 🟢
