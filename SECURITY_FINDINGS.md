# Security Review Findings

## Critical Findings

### 1. Plaintext Password Storage and Exposure
**What**: Passwords are stored in plaintext in the `cadastros` table (`senha` column). The login flow directly compares `usuario.senha !== senha.trim()` without any hashing. Passwords are also exposed in API responses when querying the database.

**Risk**: If the database is breached, all user passwords are immediately compromised. Since many users reuse passwords, this could lead to account takeover on other services. The passwords are also returned in Supabase query responses (e.g., `.select("nome_completo, senha")` in Login.tsx).

**Potential Solutions**:
1. **Immediate**: Use Supabase Auth instead of custom auth - it handles password hashing with bcrypt automatically
2. **If keeping custom auth**: Hash passwords with bcrypt/argon2 before storing, use constant-time comparison
3. **Never select password column** in queries - only verify via server-side function

**Relevant Files**: 
- `src/pages/Login.tsx` (lines 85-95, 115-125)
- `src/pages/Cadastro.tsx` (line 115)
- `src/pages/EsqueciSenha.tsx` (line 125)
- `src/pages/LoginEntregador.tsx` (lines 115-125)
- Database: `cadastros` table `senha` column

---

### 2. Excessive RLS Policies - Anonymous Access to All Data
**What**: The `cadastros`, `encomendas`, and `admin_tentativas` tables have RLS policies that grant `SELECT`, `INSERT`, `UPDATE`, `DELETE` to the `anon` role (unauthenticated users). Policies use `USING (true)` and `WITH CHECK (true)` meaning any unauthenticated user can read, modify, or delete all data.

**Risk**: Any unauthenticated attacker can:
- Read all user PII (names, CPFs, phone numbers, passwords)
- Insert fake users/deliveries
- Update any user's password
- Delete all data
- Read admin access attempts

**Potential Solutions**:
1. **Revoke all `anon` grants** on sensitive tables (`cadastros`, `encomendas`, `admin_tentativas`)
2. **Create proper RLS policies** using `auth.uid()` to restrict users to their own data
3. **Use Supabase Auth** with proper user sessions instead of localStorage

**Relevant Files**:
- Database: `cadastros` table policies (lines 45-55 in schema)
- Database: `encomendas` table policies (lines 105-115 in schema)
- Database: `admin_tentativas` table policies (lines 15-20 in schema)

---

### 3. Password Reset by CPF Without Authentication
**What**: The `EsqueciSenha` page allows password reset by only providing CPF and name. The `handleRedefinir` function updates the password with `.update({ senha: novaSenha }).eq("cpf", digitosCpf)` - no email verification, no token, no rate limiting.

**Risk**: Anyone who knows a user's CPF (which is semi-public in Brazil) can take over their account by resetting the password. CPF enumeration is also possible via the login/search endpoints.

**Potential Solutions**:
1. **Use Supabase Auth's built-in password reset** with email verification
2. **If keeping custom flow**: Send reset token to verified email/phone, require token to reset
3. **Add rate limiting** on reset attempts

**Relevant Files**:
- `src/pages/EsqueciSenha.tsx` (lines 75-125)

---

## High Findings

### 4. CPF Enumeration via Login/Search Endpoints
**What**: The login and CPF search flows query the database by CPF and return whether a user exists (e.g., "Nenhum usuário encontrado com este CPF" vs success). This allows attackers to enumerate valid CPFs in the system.

**Risk**: Attackers can build a database of valid CPFs registered in the app, enabling targeted attacks (password reset, social engineering, identity theft).

**Potential Solutions**:
1. **Use constant-time responses** - always return generic "if account exists, email sent" message
2. **Implement rate limiting** on CPF lookup endpoints
3. **Use Supabase Auth** which handles this properly

**Relevant Files**:
- `src/pages/Login.tsx` (lines 55-85, `buscarPorCpf`)
- `src/pages/LoginEntregador.tsx` (lines 100-130, `buscarPorCpf`)
- `src/pages/EsqueciSenha.tsx` (lines 35-65, `handleVerificar`)

---

### 5. No Real Authentication - localStorage Only
**What**: The app uses `localStorage.setItem("usuario_nome", ...)` as the only "authentication" mechanism. There's no Supabase session, no JWT, no server-side validation. Any user can set this localStorage value and access protected pages.

**Risk**: Complete authentication bypass. Attackers can access any user's data by setting `localStorage.usuario_nome` to a known name. The `Index` and `TelaEntregas` pages only check localStorage.

**Potential Solutions**:
1. **Migrate to Supabase Auth** with proper session management
2. **Use `supabase.auth.onAuthStateChange`** to track real auth state
3. **Protect routes** with authentication guards

**Relevant Files**:
- `src/pages/Index.tsx` (lines 25-30)
- `src/pages/TelaEntregas.tsx` (lines 45-55)
- `src/pages/Login.tsx` (line 95)
- `src/pages/LoginEntregador.tsx` (line 125)

---

### 6. Admin Access Code Hardcoded in Client
**What**: The admin access code `"0127183876116669674759"` is hardcoded in `LoginEntregador.tsx` and checked client-side. Anyone with the source code (or who inspects the bundle) can access the admin panel.

**Risk**: Full admin panel access for anyone who finds the code. The admin panel shows failed login attempts with user names and device info.

**Potential Solutions**:
1. **Move admin verification to server-side** (Edge Function)
2. **Use proper role-based access control** with Supabase Auth
3. **Remove hardcoded secrets** from client code

**Relevant Files**:
- `src/pages/LoginEntregador.tsx` (lines 155-180, `verificarCodigoAdmin`)

---

## Medium Findings

### 7. Passwords Returned in API Responses
**What**: Multiple queries explicitly select the `senha` column: `.select("nome_completo, senha")` in Login, LoginEntregador, and CPF search. This sends plaintext passwords over the network to the browser.

**Risk**: Passwords exposed in network traffic, browser dev tools, and any logging. Combined with plaintext storage, this is a severe exposure.

**Potential Solutions**:
1. **Never select password column** in client queries
2. **Use Supabase Auth** for password verification server-side
3. **If custom auth**: Verify password in a server-side function (Edge Function) that only returns success/failure

**Relevant Files**:
- `src/pages/Login.tsx` (lines 85, 115)
- `src/pages/LoginEntregador.tsx` (lines 115, 145)
- `src/pages/EsqueciSenha.tsx` (line 125 - though this is an update, not select)

---

### 8. Missing Rate Limiting on Auth Endpoints
**What**: No rate limiting on login attempts, CPF searches, password resets, or admin code attempts. The `admin_tentativas` table logs failed admin attempts but is writable by `anon`.

**Risk**: Brute force attacks on passwords, CPF enumeration at scale, credential stuffing.

**Potential Solutions**:
1. **Implement rate limiting** via Supabase Edge Functions or PostgreSQL
2. **Use Supabase Auth** which has built-in rate limiting
3. **Add CAPTCHA** for sensitive operations

**Relevant Files**:
- `src/pages/Login.tsx`
- `src/pages/LoginEntregador.tsx`
- `src/pages/EsqueciSenha.tsx`

---

### 9. Insecure Direct Object References (IDOR) on Encomendas
**What**: The `encomendas` table allows `anon` full access. Users can query any delivery by ID. The `TelaEntregas` page filters by `nome_entregador` but this is client-side only - an attacker can query all deliveries.

**Risk**: Delivery drivers can see all deliveries, not just their own. Customer PII (names, phone numbers) exposed.

**Potential Solutions**:
1. **Revoke `anon` access** to `encomendas`
2. **Create RLS policies** restricting users to their own deliveries (`auth.uid()` or `nome_entregador` matching authenticated user)
3. **Use Supabase Auth** with proper user identity

**Relevant Files**:
- Database: `encomendas` table policies
- `src/pages/TelaEntregas.tsx` (lines 65-80)

---

### 10. Supabase Publishable Key in Source Code
**What**: The Supabase publishable key is hardcoded in `src/integrations/supabase/client.ts`. While this is a public key, it should be in environment variables for proper secret management and rotation.

**Risk**: Key rotation requires code deployment. If the key is ever compromised, it's harder to rotate.

**Potential Solutions**:
1. **Move to environment variable** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
2. **Use `.env` files** for local development

**Relevant Files**:
- `src/integrations/supabase/client.ts` (lines 3-4)

---

## Low Findings

### 11. Window Close on Back Navigation (UX/Security)
**What**: The `Login` and `LoginEntregador` pages use `window.close()` on `popstate` event. This can be abused to close user tabs unexpectedly.

**Risk**: Low - mainly UX issue, but could be used in phishing flows.

**Potential Solutions**:
1. **Remove `window.close()`** - let browser handle navigation normally
2. **Use proper navigation guards** instead

**Relevant Files**:
- `src/pages/Login.tsx` (lines 20-30)
- `src/pages/LoginEntregador.tsx` (lines 30-40)

---

### 12. Missing Security Headers
**What**: No CSP, HSTS, or other security headers configured. The `vercel.json` and `vite.config.ts` don't set security headers.

**Risk**: Increased attack surface for XSS, clickjacking, MIME sniffing.

**Potential Solutions**:
1. **Add security headers** via Vercel configuration or middleware
2. **Implement CSP** to restrict script sources

**Relevant Files**:
- `vercel.json`
- `vite.config.ts`

---

## Summary of Required Fixes (Priority Order)

1. **Migrate to Supabase Auth** - eliminates plaintext passwords, fixes auth bypass, provides rate limiting, proper sessions
2. **Revoke all `anon` grants** on `cadastros`, `encomendas`, `admin_tentativas`
3. **Create proper RLS policies** using `auth.uid()` for user data isolation
4. **Remove hardcoded admin code** - move to server-side verification
5. **Never select `senha` column** in client queries
6. **Implement proper password reset** with email verification
7. **Add rate limiting** on auth endpoints
8. **Move Supabase keys to environment variables**
9. **Add security headers**
10. **Remove `window.close()` on popstate**