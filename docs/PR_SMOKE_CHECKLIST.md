# Smoke checks antes de merge (produção)

Use este checklist no PR ou rode localmente antes de aprovar.

## Build e servidor

- [ ] `npm run build` — termina sem erro
- [ ] `npm run start` — sobe e responde

## Verificação manual (após `npm run start`)

- [ ] **/** — landing de marketing, sem chrome do app (sem TopNav/main)
- [ ] **/today** — app normal (TopNav + conteúdo)
- [ ] **/privacy** e **/terms** — carregam sem layout quebrado
- [ ] **/manage**, **/upcoming** — app normal
- [ ] **/share/[token]** — rota resolve (usar token de teste ou só validar que não 404)
- [ ] **/robots.txt** e **/sitemap.xml** — respondem corretamente

## Marketing sem herança do app

- [ ] `app/(marketing)/landing.css` — nenhum seletor global (html, body, :root sem prefixo `.landing`)
- [ ] `app/(marketing)/layout.tsx` — não importa `globals.css` nem componentes do app (só `landing.css` e fontes)

## Links mortos

- [ ] Nenhum `href="#"` em `app/(marketing)/Landing.tsx` nem em rotas do app (busca: `href="#"`)

## Landing estática

- [ ] `app/(marketing)/page.tsx` não faz fetch nem usa APIs; rota permanece estática por default

## Rotas legadas

- [ ] **/landing** — preview (não é a home); deve ter `robots: { index: false, follow: false }` em metadata

---

## Pós-deploy (prod)

Rodar na URL de produção (ex.: https://uselembra.com.br ou https://bday-hub.vercel.app).

- [ ] Abrir **/** e validar CTAs (botões/links) que levam a **/today**
- [ ] Abrir **/today** e criar 1 item em modo guest (se aplicável)
- [ ] Abrir **/privacy** e **/terms** — páginas carregam
- [ ] Abrir **/robots.txt** — contém referência ao sitemap
- [ ] Abrir **/sitemap.xml** — contém a URL da home (/)
- [ ] Abrir **/landing** — confirmar que é o preview (e que está com noindex no código)
