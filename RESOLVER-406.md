# 🔧 RESOLVER ERRO 406 - PASSO A PASSO

## ❌ PROBLEMA

```
GET .../rest/v1/users?select=*&id=eq.xxx 406 (Not Acceptable)
```

**Causa:** O usuário não tem permissão para ler a tabela `users` (problema de RLS).

---

## ✅ SOLUÇÃO RÁPIDA

### **PASSO 1: Abrir Supabase SQL Editor**

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor**
3. Clique em **New Query**

### **PASSO 2: Executar SQL de Correção**

Cole e execute este código:

```sql
-- CORRIGIR RLS DA TABELA USERS
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON users;

CREATE POLICY "Allow authenticated users to read all users"
ON users FOR SELECT
TO authenticated
USING (true);
```

✅ **Isso permite que usuários autenticados leiam a tabela**

### **PASSO 3: Criar Seu Registro (se necessário)**

Se o erro persistir, seu registro pode não existir. Execute:

```sql
-- SUBSTITUA 'b40ff61c-...' pelo ID que aparece no erro 406
-- SUBSTITUA 'seu@email.com' pelo seu email

INSERT INTO users (id, email, team_name, cartoletas, total_points, is_admin)
VALUES (
    'b40ff61c-a6f8-40eb-9b98-110404fadedb',  -- ← SEU ID
    'seu@email.com',                          -- ← SEU EMAIL
    'Meu Time',
    100.00,
    0,
    false
)
ON CONFLICT (id) DO NOTHING;
```

### **PASSO 4: Verificar**

Execute:

```sql
SELECT * FROM users WHERE id = 'b40ff61c-a6f8-40eb-9b98-110404fadedb';
```

✅ **Deve retornar seus dados**

### **PASSO 5: Fazer Login Novamente**

1. Volte para `index.html`
2. Faça login
3. ✅ **Deve funcionar!**

---

## 🔍 DIAGNÓSTICO DETALHADO

Se quiser investigar mais, execute o arquivo **DIAGNOSTICO.sql**:

1. Abra `DIAGNOSTICO.sql`
2. Execute cada seção
3. Veja os resultados
4. Identifique o problema

---

## 🛠️ SOLUÇÃO PERMANENTE

Para evitar esse problema no futuro, execute **CORRIGIR-RLS.sql**:

```sql
-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON users;

-- 2. Criar política correta
CREATE POLICY "Allow authenticated users to read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 3. Permitir INSERT
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Permitir UPDATE
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

---

## 📋 CHECKLIST

- [ ] Executei CORRIGIR-RLS.sql
- [ ] Criei meu registro manualmente (se necessário)
- [ ] Verifiquei que o registro existe
- [ ] Fiz login novamente
- [ ] ✅ Funcionou!

---

## 🔑 PEGAR SEU USER ID

O ID está no erro 406:

```
...id=eq.b40ff61c-a6f8-40eb-9b98-110404fadedb
            ↑
       Este é seu ID
```

Use esse ID nos SQLs acima!

---

## 💡 POR QUE ISSO ACONTECE?

1. **RLS (Row Level Security)** está ativo na tabela `users`
2. Por padrão, RLS **bloqueia tudo**
3. É preciso criar **políticas** para permitir acesso
4. A política estava faltando ou incorreta

---

## ✅ APÓS CORREÇÃO

Seu login deve:
1. ✅ Autenticar no Supabase Auth
2. ✅ Buscar dados na tabela users
3. ✅ Carregar o dashboard
4. ✅ Não voltar para index

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. Abra o Console (F12)
2. Vá na aba **Console**
3. Cole e execute:

```javascript
// Verificar se RLS está funcionando
const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

console.log('Data:', data);
console.log('Error:', error);
```

Se o erro persistir, **copie a mensagem** e me envie!

---

**ARQUIVOS DISPONÍVEIS:**
- `CORRIGIR-RLS.sql` - Corrige as políticas
- `DIAGNOSTICO.sql` - Diagnóstico completo
- `DEBUG-AUTH.js` - Debug no navegador
