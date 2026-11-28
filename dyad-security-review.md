# Security Review Findings

## Critical Findings

### 1. Plaintext Passwords at Rest in `cadastros` Table
**Title**: Plaintext Passwords in `cadastros` Table with Broken RLS
**What**: The `cadastros` table contains 4 rows with the `senha` column set to NOT NULL and containing plaintext passwords. The `user_id` column is NULL for all rows. Row Level Security policies use `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE, but since `user_id` is NULL for all rows, **no authenticated user can read any row** — including the row's owner. The passwords remain in the database at rest.

**Risk**: If the PostgreSQL database is breached at the storage level, all 4 users' plaintext passwords are immediately compromised. Since many users reuse passwords, this could lead to account takeover on other services. The RLS policies are effectively broken for these legacy rows because `user_id` is NULL, meaning the owning user cannot even read their own row via the Data API, let alone protect their password.

**Potential Solutions**:
1. **Immediate**: Delete the `senha` column from `cadastros` and migrate all password verification to Supabase Auth (which handles bcrypt hashing automatically). The app already uses `supabase.auth.signInWithPassword` — the `cadastros.senha` is legacy and not used for verification.
2. **If retaining column**: At minimum, set `user_id` to the corresponding `auth.users(id)` for all rows so RLS policies function, or remove the NOT NULL constraint and ensure the column is never selected in client queries.
3. **Never select `senha` column** in any client-facing query (already fixed in current code — Login.tsx and LoginEntregador.tsx now select `nome_completo, cpf` only).

**Relevant Files**: 
- Database: `cadastros` table `senha` column (4 rows with plaintext values)
- `src/pages/Login.tsx` (now selects `nome_completo, cpf` only — no `senha`)
- `src/pages/LoginEntregador.tsx` (now selects `nome_completo, cpf` only — no `senha`)
- `src/pages/Cadastro.tsx` (collects password for Supabase Auth, not written to `cadastros`)

---

### 2. `admin_tentativas` RLS Allows Any Authenticated User to Read All Failed Admin Attempts
**Title**: admin_tentativas RLS Policies Use `USING (true)` for Authenticated Users
**What**: The `admin_tentativas` table has RLS policies `admin_tentativas_select_auth` with `USING (true)` for the `authenticated` role. This means **any authenticated user** (including non-admin entregadores) can SELECT all rows, exposing `usuario_nome_falhou` and `dispositivo_id` for every failed admin login attempt.

**Risk**: Data exposure of failed login attempts including usernames and device identifiers. Combined with the admin authorization flaw (below), any authenticated user can escalate to admin and read this sensitive data. The TelaAdmin page gates access on client-side `user.user_metadata?.is_admin === true`, but this check is bypassable.

**Potential Solutions**:
1. **Revoke `authenticated` SELECT** on `admin_tentativas` or restrict with `auth.uid()` based policy
2. **Create admin-specific policy**: `CREATE POLICY "Admin can view failed attempts" ON admin_tentativas FOR SELECT TO authenticated USING (auth.role() = 'service_role' OR ...)` — but better to use proper role-based access
3. **Remove realtime subscription** or restrict to service_role only

**Relevant Files**: 
- Database: `admin_tentativas` table policies (SELECT to authenticated with `USING (true)`)
- `src/pages/TelaAdmin.tsx` (lines 44-59: realtime subscription + line 29: client-side is_admin check)
- `src/pages/TelaAdmin.tsx` (line 76: `if (!usuario || !usuario.is_admin)` — client-side only)

---

## High Findings

### 3. Admin Authorization via `user_metadata.is_admin` Is User-Writable (Privilege Escalation)
**Title**: Self-Admin Promotion via User-Metadata
**What**: The TelaAdmin page checks `user.user_metadata?.is_admin === true` to determine access. However, Supabase `user_metadata` is **user-writable** via `supabase.auth.updateUser({ data: { is_admin: true } })`. Any authenticated user can promote themselves to admin without any server-side verification.

**Risk**: Full privilege escalation. Any user who logs in can set `is_admin: true` in their user metadata and gain access to the admin panel at `/tela-admin`, which displays all failed admin login attempts (including usernames and device info from `admin_tentativas`). This is exacerbated by finding #2 where any authenticated user can read `admin_tentativas` data.

**Potential Solutions**:
1. **Move admin check to server-side** — verify `is_admin` via a server-side Edge Function or Supabase Edge Function that checks the user's actual role, not client-controllable `user_metadata`
2. **Use `app_metadata` instead** — `app_metadata` is not user-writable via `updateUser`, but also not typically used for this purpose
3. **Implement proper role-based access** using Supabase Auth built-in roles or a separate admin table with server-managed assignments

**Relevant Files**: 
- `src/pages/TelaAdmin.tsx` (line 29: `is_admin: user.user_metadata?.is_admin === true`)
- `src/integrations/supabase/client.ts` (Supabase Auth client — `updateUser` method)
- Database: No direct table needed if using Supabase Auth built-in management

---

### 4. No Rate Limiting on Auth Endpoints
**Title**: Missing Rate Limiting on Login, CPF Search, Password Reset, and Admin Attempts
**What**: The application has no rate limiting on:
- Login attempts (`supabase.auth.signInWithPassword`)
- CPF search flows in `Login.tsx` and `LoginEntregador.tsx` (query `cadastros` by CPF)
- Password reset (`supabase.auth.resetPasswordForEmail`)
- Admin code attempts (the `admin_tentativas` table is writable by any authenticated user)

**Risk**: 
- **Brute force attacks** on passwords at scale
- **CPF enumeration** at scale (though anon grants are removed, the login/search endpoints still process CPF queries)
- **Credential stuffing** 
- **Unlimited admin attempt logging** — an attacker could flood the `admin_tentativas` table with entries, obscuring real attacks

**Potential Solutions**:
1. **Implement rate limiting** via Supabase Edge Functions or PostgreSQL triggers/RLS
2. **Use Supabase Auth built-in rate limiting** which provides default protections
3. **Add CAPTCHA** for login and password reset flows
4. **Throttle `admin_tentativas` inserts** at the database level

**Relevant Files**: 
- `src/pages/Login.tsx` (login flow, CPF search)
- `src/pages/LoginEntregador.tsx` (login flow, CPF search)
- `src/pages/EsqueciSenha.tsx` (password reset)
- `src/pages/TelaAdmin.tsx` (admin attempts display)

---

### 5. Missing Security Headers in Vercel Configuration
**Title**: No Security Headers Configured
**What**: The `vercel.json` only contains route rewrites to `index.html`. No security headers are configured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).

**Risk**: Increased attack surface for XSS, clickjacking, MIME sniffing, and other client-side attacks. Without CSP, malicious scripts can be injected. Without HSTS, downgrade attacks are possible. Without X-Frame-Options, clickjacking is enabled.

**Potential Solutions**:
1. **Add security headers** via Vercel project settings or `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]}
  ]
}
```
2. **Implement CSP** to restrict script sources
3. **Enable HSTS** via HTTPS redirect configuration

**Relevant Files**: 
- `vercel.json` (currently only has rewrites)
- `vite.config.ts`

---

## Medium Findings

### 6. TelaAdmin Realtime Subscription Accessible to Any Authenticated User
**Title**: admin_tentativas Realtime Channel Not Enforcing Admin Authorization
**What**: The TelaAdmin page subscribes to `supabase.channel("admin_tentativas_realtime")` with `{ event: "INSERT", schema: "public", table: "admin_tentativas" }`. The realtime channel does not enforce the client-side `is_admin` check — **any authenticated user** can subscribe to this channel and receive realtime inserts to `admin_tentativas`, which include `usuario_nome_falhou` and `dispositivo_id`.

**Risk**: Any authenticated user (not just admins) can receive realtime updates of all failed admin login attempts, enabling monitoring of admin login activity or data exfiltration. Combined with the RLS policy finding #2 and the privilege escalation finding #3, this is a significant data exposure.

**Potential Solutions**:
1. **Remove the realtime subscription** if not essential, or restrict it to service_role only
2. **Add a filter** to the realtime channel that checks for admin status at the database level (not client-side)
3. **Use a separate channel/table** for admin-only notifications with proper RLS

**Relevant Files**: 
- `src/pages/TelaAdmin.tsx` (lines 56-59: realtime channel subscription)

---

### 7. `window.close()` on Popstate Can Be Abused to Close User Tabs
**Title**: Unexpected Tab Closure via `window.close()` on Popstate
**What**: The `Login.tsx` and `LoginEntregador.tsx` pages use `useEffect` with `window.close()` on the `popstate` event. This can be abused to unexpectedly close user browser tabs, potentially in phishing flows or to disrupt user sessions.

**Risk**: Low — primarily a UX issue, but could be leveraged in social engineering or phishing attacks to catch users off-guard. The `window.close()` call has no user gesture and can fire on any popstate (back button, history navigation, programmatic `history.pushState`).

**Potential Solutions**:
1. **Remove `window.close()`** — let the browser handle navigation normally
2. **Use proper navigation guards** with `react-router-dom` `Navigate` component instead
3. **Only close on explicit user action** (e.g., button click), not on popstate events

**Relevant Files**: 
- `src/pages/Login.tsx` (lines 20-30: `useEffect` with `window.close()`)
- `src/pages/LoginEntregador.tsx` (lines 30-40: `useEffect` with `window.close()`)

---

## Low Findings

### 8. `configuracoes` Table Referenced but Update Check Broken
**Title**: `useAtualizacoes` Hook Queries Non-Existent or Inaccessible `configuracoes` Table
**What**: The `useAtualizacoes` hook in `src/hooks/use-atualizacoes.ts` queries the `configuracoes` table via `supabase.from("configuracoes").select("*").eq("chave", "versao_app").maybeSingle()`. The table DDL exists in `supabase-setup-atualizacoes.sql` but the `information_schema.tables` query only returned `admin_tentativas`, `cadastros`, `encomendas` — the `configuracoes` table may not have been created in the current database, or lacks proper RLS.

**Risk**: The update check feature is broken — the hook falls back to "ocioso" status, and users cannot see update notifications. Not a direct security vulnerability, but indicates a database schema inconsistency.

**Potential Solutions**:
1. **Create the `configuracoes` table** in the database using the SQL from `supabase-setup-atualizacoes.sql`
2. **Add proper RLS** and grants to the table if it's needed
3. **Remove the update check** if not required, or use a different data source

**Relevant Files**: 
- `src/hooks/use-atualizacoes.ts` (line 23: `supabase.from("configuracoes").select("*")`)
- `supabase-setup-atualizacoes.sql` (contains the `configuracoes` table DDL)

---

### 9. Cadastro Page Collects Plaintext Passwords (Supabase Auth Handles Hashing)
**Title**: Password Fields in Cadastro Form
**What**: The `Cadastro.tsx` page collects `senha` and `confirmarSenha` in the registration form. These are sent to `supabase.auth.signUp()` which correctly hashes passwords with bcrypt. However, the legacy `cadastros.senha` column (NOT NULL, plaintext) still exists in the database with 4 rows of data, and the form does not map to that column.

**Risk**: Low — Supabase Auth handles hashing correctly. The risk is only if the `cadastros.senha` column is somehow written to in the future, or if someone queries the database directly and finds the legacy plaintext passwords. The current code correctly uses Supabase Auth for authentication, so the form passwords are protected.

**Potential Solutions**:
1. **Keep as-is** — Supabase Auth handles hashing correctly
2. **Remove password confirmation** field if not needed, or add client-side validation
3. **Ensure `cadastros.senha` is never written to** by any code path

**Relevant Files**: 
- `src/pages/Cadastro.tsx` (lines 16-23: `senha` and `confirmarSenha` state)
- Database: `cadastros` table `senha` column (4 rows, legacy plaintext)

---

### 10. CPF Search Returns No Results Due to RLS (Functionality Issue, Not Security Vulnerability)
**Title**: CPF Enumeration No Longer Possible (Anon Grants Removed)
**What**: The CPF search flows in `Login.tsx` and `LoginEntregador.tsx` query the `cadastros` table by CPF. Since the old `SECURITY_FINDINGS.md` identified anon grants as a vulnerability, those have been removed. Now the `cadastros` table has RLS `auth.uid() = user_id` policies, and since `user_id` is NULL for all rows (including the 4 legacy rows), **CPF search always returns "Nenhum usuário encontrado"** — even for valid, registered users.

**Risk**: Functionality broken — legitimate users cannot find their accounts via CPF search. This is not a security vulnerability (CPF enumeration is no longer possible since anon has no access), but the feature is non-functional.

**Potential Solutions**:
1. **Fix RLS policies** to allow users to find their own data via CPF/search, using `auth.uid()` properly
2. **Restore CPF search functionality** with proper user-scoped policies
3. **Remove the CPF search feature** if not essential, or replace with email-based lookup

**Relevant Files**: 
- `src/pages/Login.tsx` (lines 60-92: `buscarPorCpf` function)
- `src/pages/LoginEntregador.tsx` (lines 60-92: `buscarPorCpf` function)
- Database: `cadastros` table RLS policies (`auth.uid() = user_id` with `user_id` NULL)