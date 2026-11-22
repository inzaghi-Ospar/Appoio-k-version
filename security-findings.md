# Security Review Findings

## Critical Findings

<dyad-security-finding title="Plaintext Password Storage and Client-Side Password Comparison" level="critical">
**What**: Passwords are stored in plaintext in the `cadastros` table and compared in the browser. The login flow queries Supabase for `senha` (password) and compares it client-side: `if (usuario.senha !== senha.trim())`. This means passwords are transmitted to the client and visible in React DevTools, network tab, and browser memory.

**Risk**: All user passwords can be stolen by any attacker who can access the database or intercept network traffic. If the database is compromised, all passwords are immediately usable. Client-side comparison also allows attackers to extract passwords via the "buscar por CPF" feature which returns `senha` in the response.

**Potential Solutions**:
1. **Immediate**: Implement proper authentication using Supabase Auth (email/password or magic links) which handles secure password hashing server-side.
2. **If keeping custom auth**: Move password verification to a Supabase Edge Function or PostgreSQL function that uses `pgcrypto`'s `crypt()`/`verify()` and never returns the hash to the client.
3. **At minimum**: Hash passwords with bcrypt/argon2 before storing, and use a server-side endpoint for verification.

**Relevant Files**: `src/pages/Login.tsx` (lines 121, 135), `src/pages/LoginEntregador.tsx` (lines 121, 135), `src/pages/Cadastro.tsx` (line 160), `src/pages/EsqueciSenha.tsx` (line 137)
</dyad-security-finding>

<dyad-security-finding title="Password Exposure via CPF Search Feature" level="critical">
**What**: The "Buscar por CPF" feature in both Login and LoginEntregador pages executes a query that selects `nome_completo, senha, cpf` from the `cadastros` table and stores the result (including the plaintext password) in React state (`usuarioEncontradoCpf` / `entregadorEncontradoCpf`). This password is then displayed in the UI (copied to clipboard) and remains in memory.

**Risk**: Any user who knows or guesses a valid CPF can retrieve that user's plaintext password. CPFs are 11-digit numbers with a known format, making enumeration feasible. The password is exposed in the browser's React DevTools, network responses, and JavaScript memory.

**Potential Solutions**:
1. **Remove the CPF search feature entirely** or restrict it to authenticated admin users only.
2. If CPF lookup is required, only return non-sensitive data (e.g., `nome_completo` without `senha`).
3. Implement proper authentication with Supabase Auth so passwords are never stored in or returned from your custom table.

**Relevant Files**: `src/pages/Login.tsx` (lines 79, 87, 108), `src/pages/LoginEntregador.tsx` (lines 79, 87, 108)
</dyad-security-finding>

<dyad-security-finding title="Authentication Bypass via Password Reset (No Token Verification)" level="critical">
**What**: The "Esqueci a senha" flow allows anyone to reset any user's password by providing only CPF and name (verified client-side). After verification, the password is updated via `supabase.from("cadastros").update({ senha: novaSenha }).eq("cpf", digitosCpf)` with no server-side token, rate limiting, or proof of identity. The verification step is purely client-side and can be bypassed by calling the Supabase API directly.

**Risk**: An attacker who knows a user's CPF (and optionally name) can take over their account by resetting the password. Since the update uses the publishable key directly from the browser, anyone with the Supabase URL and publishable key can execute this update without any authentication.

**Potential Solutions**:
1. **Use Supabase Auth's built-in password reset** which sends a secure reset link to the user's verified email/phone.
2. If keeping custom reset: Implement a server-side Edge Function that generates a time-limited, single-use reset token sent via email/SMS, and verify that token before allowing password change.
3. Add rate limiting and CAPTCHA to the reset endpoint.
4. Never allow password updates by CPF alone without a verified second factor.

**Relevant Files**: `src/pages/EsqueciSenha.tsx` (lines 115-137, 137)
</dyad-security-finding>

<dyad-security-finding title="Database Exposed via Publishable Key with Permissive RLS" level="critical">
**What**: The application uses the Supabase publishable key directly in the browser (`src/integrations/supabase/client.ts`) to perform all database operations. The fact that the client can read `senha` from `cadastros`, update passwords by CPF, and read all `encomendas` indicates that Row Level Security (RLS) policies are either missing or overly permissive (e.g., `true` for all operations).

**Risk**: Anyone with the Supabase URL and publishable key (both visible in the bundled JavaScript) can read and write all data in the `cadastros` and `encomendas` tables. This includes stealing all passwords, CPFs, names, phone numbers, and delivery records, as well as modifying or deleting data.

**Potential Solutions**:
1. **Enable and configure strict RLS policies** on all tables:
   - `cadastros`: Users can only read/update their own row (matched by authenticated user ID).
   - `encomendas`: Users can only see deliveries relevant to them (e.g., where they are the entregador or destinatario).
2. **Migrate to Supabase Auth** so each user has a unique `auth.uid()` that can be used in RLS policies.
3. **Never use the publishable key for sensitive operations** that should be server-side only; use Edge Functions with the service role key for admin actions.

**Relevant Files**: `src/integrations/supabase/client.ts`, all pages using `supabase.from(...)`
</dyad-security-finding>

## High Findings

<dyad-security-finding title="Insecure Direct Object References (IDOR) - All Users See All Deliveries" level="high">
**What**: Both `Index.tsx` (client view) and `TelaEntregas.tsx` (entregador view) fetch all `encomendas` with `select("*")` and no filtering by user. Any authenticated (or even unauthenticated, due to the backdoor) user can see every delivery's `nome_destinatario`, `nome_entregador`, timestamps, and status.

**Risk**: Sensitive personal information (names of recipients and deliverers) is exposed to all users. This violates privacy and could enable social engineering or targeted attacks.

**Potential Solutions**:
1. Add RLS policies on `encomendas` so users only see rows where `nome_entregador = current_user` or `nome_destinatario = current_user`.
2. In the short term, add a `user_id` column referencing `auth.users` and filter queries by `auth.uid()`.
3. Use Supabase Auth to get the current user's identity and filter server-side via RLS.

**Relevant Files**: `src/pages/Index.tsx` (lines 60-70, 85-95), `src/pages/TelaEntregas.tsx` (lines 55-70, 75-90)
</dyad-security-finding>

<dyad-security-finding title="Development Backdoor Allows Unauthenticated Access to Main App" level="high">
**What**: In `Index.tsx`, a development fallback sets `usuario_nome` to "Usuário Teste" and writes it to `localStorage` if no saved user exists, then proceeds to load the main app. The comment says "Em produção, remova este bloco e descomente o redirect para /login" but this code is present in the codebase.

**Risk**: If deployed to production without removing this block, anyone can access the main application (`/tela-inicial`) without any authentication, bypassing the login page entirely.

**Potential Solutions**:
1. **Remove the development fallback block entirely** before any production deployment.
2. Use environment variables to gate development-only code: `if (import.meta.env.DEV) { ... }`.
3. Implement proper server-side authentication checks (via Supabase Auth) so the backdoor cannot work even if accidentally left in.

**Relevant Files**: `src/pages/Index.tsx` (lines 42-49)
</dyad-security-finding>

<dyad-security-finding title="User Enumeration via Name Search in Entregador Panel" level="high">
**What**: The `TelaEntregas` page includes a search feature (`buscarNomesCadastro`) that queries `cadastros` with `ilike("nome_completo", \`%${valor}%\`)` and returns `nome_completo` for any matching name. This allows enumeration of all registered users' full names.

**Risk**: An attacker can harvest all user names from the system, facilitating targeted phishing, social engineering, or credential stuffing attacks.

**Potential Solutions**:
1. Restrict this search to only return names of users who have a relationship with the current entregador (e.g., have pending deliveries).
2. Implement RLS on `cadastros` so users cannot read other users' rows.
3. If a global search is needed, require authentication and rate limit it heavily.

**Relevant Files**: `src/pages/TelaEntregas.tsx` (lines 100-120)
</dyad-security-finding>

## Medium Findings

<dyad-security-finding title="Weak Password Policy (Minimum 4 Characters)" level="medium">
**What**: Both registration (`Cadastro.tsx`) and password reset (`EsqueciSenha.tsx`) only enforce a minimum password length of 4 characters with no complexity requirements.

**Risk**: Short, simple passwords are trivial to brute-force or guess. Combined with the plaintext storage and client-side comparison, this makes credential stuffing and guessing attacks highly effective.

**Potential Solutions**:
1. Enforce a minimum length of 12 characters.
2. Require mixed case, numbers, and symbols (or use a password strength meter).
3. Implement a deny-list of common passwords (e.g., using `zxcvbn`).
4. Use Supabase Auth which has configurable password strength policies.

**Relevant Files**: `src/pages/Cadastro.tsx` (line 98), `src/pages/EsqueciSenha.tsx` (line 115)
</dyad-security-finding>

<dyad-security-finding title="No Rate Limiting on Authentication Endpoints" level="medium">
**What**: Login, CPF search, password reset, and registration endpoints have no rate limiting. An attacker can make unlimited requests to guess passwords, enumerate CPFs, or brute-force the reset flow.

**Risk**: Automated attacks can quickly compromise accounts, especially given the weak password policy and plaintext password exposure.

**Potential Solutions**:
1. Implement rate limiting at the Supabase level (via Edge Functions or PostgreSQL `pg_ratelimit`).
2. Add client-side exponential backoff and CAPTCHA after failed attempts.
3. Use Supabase Auth which includes built-in rate limiting and brute-force protection.

**Relevant Files**: `src/pages/Login.tsx`, `src/pages/LoginEntregador.tsx`, `src/pages/Cadastro.tsx`, `src/pages/EsqueciSenha.tsx`
</dyad-security-finding>

<dyad-security-finding title="Client-Side Only Authentication (localStorage)" level="medium">
**What**: Authentication state is stored solely in `localStorage` (`usuario_nome`, `entregador_nome`). Pages check for these values in `useEffect` and redirect if missing, but this is easily bypassed by setting the values manually in the browser console. There are no server-side session tokens, JWTs, or Supabase Auth sessions.

**Risk**: Any user can impersonate another by setting `localStorage.setItem("usuario_nome", "victim_name")`. The backdoor in `Index.tsx` demonstrates this vulnerability.

**Potential Solutions**:
1. **Migrate to Supabase Auth** which provides secure, server-validated sessions with JWTs.
2. If keeping custom auth, implement a session token stored in an HttpOnly cookie, validated on each request via an Edge Function.
3. At minimum, verify the `localStorage` value against the database on each page load (but this still relies on client-side enforcement).

**Relevant Files**: `src/pages/Login.tsx` (lines 43, 140), `src/pages/LoginEntregador.tsx` (lines 43, 140), `src/pages/Index.tsx` (lines 42-49), `src/pages/TelaEntregas.tsx` (lines 38, 208)
</dyad-security-finding>

## Low Findings

<dyad-security-finding title="Predictable Delivery Code Generation" level="low">
**What**: Delivery codes are generated as `ENV-${Date.now()}` in `TelaEntregas.tsx`. This is predictable and could allow an attacker to guess or enumerate delivery codes.

**Risk**: Low direct impact, but predictable identifiers can aid in enumeration attacks or social engineering.

**Potential Solutions**:
1. Use a cryptographically secure random string (e.g., `crypto.randomUUID()` or `nanoid`).
2. Add a unique constraint on the `codigo` column in the database.

**Relevant Files**: `src/pages/TelaEntregas.tsx` (line 144)
</dyad-security-finding>

<dyad-security-finding title="History Manipulation to Prevent Window Close" level="low">
**What**: Both `Login.tsx` and `LoginEntregador.tsx` use `window.history.pushState` and a `popstate` listener to call `window.close()` when the user tries to navigate back, effectively trapping the user on the page.

**Risk**: This is a hostile UX pattern that can be used for phishing (preventing users from leaving a fake login page). It also breaks normal browser navigation.

**Potential Solutions**:
1. Remove the `pushState`/`popstate` logic entirely.
2. If you need to prevent accidental navigation, use `beforeunload` with a confirmation dialog (standard browser behavior).

**Relevant Files**: `src/pages/Login.tsx` (lines 30-40), `src/pages/LoginEntregador.tsx` (lines 30-40)
</dyad-security-finding>