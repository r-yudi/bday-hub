import Link from "next/link";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingMotion } from "./LandingMotion";

export function Landing() {
  return (
    <LandingMotion>
      <LandingNav />

      <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div className="hero">
          <div className="hero-left">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Disponível agora — grátis
            </div>
            <h1>
              Nunca esqueça um <em>aniversário</em> importante novamente
            </h1>
            <p className="hero-sub">
              Lista calma, lembretes no ritmo que você escolhe e mensagem pronta em um toque — no celular ou no computador, com ou sem conta.
            </p>
            <div className="hero-pills">
              <span className="pill">Sem planilhas</span>
              <span className="pill">Sem redes sociais</span>
              <span className="pill">Sem esquecer quem importa</span>
            </div>
            <div className="hero-actions">
              <Link href="/today?onboarding=1" className="btn-primary">
                Começar grátis
                <svg
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="#reminder" className="btn-secondary">
                Ver como funciona
                <svg
                  width={15}
                  height={15}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="confetti-wrap top-right">
              <div
                className="confetti-dot"
                style={{
                  width: "12px",
                  height: "12px",
                  background: "#E85D26",
                  top: 0,
                  right: 0,
                  animationDelay: "0s",
                }}
              />
              <div
                className="confetti-dot"
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#C9973A",
                  top: "30px",
                  right: "20px",
                  animationDelay: "0.5s",
                  borderRadius: "2px",
                }}
              />
              <div
                className="confetti-dot"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#F4845A",
                  top: "10px",
                  right: "40px",
                  animationDelay: "1s",
                }}
              />
            </div>
            <div className="confetti-wrap bottom-left">
              <div
                className="confetti-dot"
                style={{
                  width: "10px",
                  height: "10px",
                  background: "#C9973A",
                  bottom: "40px",
                  left: "10px",
                  animationDelay: "0.3s",
                  borderRadius: "2px",
                }}
              />
              <div
                className="confetti-dot"
                style={{
                  width: "7px",
                  height: "7px",
                  background: "#E85D26",
                  bottom: "10px",
                  left: 0,
                  animationDelay: "0.8s",
                }}
              />
            </div>

            <div className="phone-wrap">
              <div className="phone-frame">
                <div className="phone-screen">
                  <div className="phone-notch" />
                  <div className="phone-header">
                    <div className="phone-date">Terça, 4 Mar</div>
                    <div className="phone-title">Aniversários 🎂</div>
                  </div>

                  <div className="phone-mock-sheet">
                    <div className="phone-mock-eyebrow">Hoje</div>
                    <ul className="phone-mock-list" aria-hidden>
                      <li className="phone-mock-row">
                        <span className="phone-mock-emoji">🎉</span>
                        <div className="phone-mock-row-main">
                          <span className="phone-mock-name">Ana Souza</span>
                          <span className="phone-mock-meta">Aniversário hoje</span>
                        </div>
                        <button type="button" className="phone-mock-cta">
                          Dar parabéns
                        </button>
                      </li>
                      <li className="phone-mock-row">
                        <span className="phone-mock-emoji">🥳</span>
                        <div className="phone-mock-row-main">
                          <span className="phone-mock-name">Lucas Melo</span>
                          <span className="phone-mock-meta">Aniversário hoje</span>
                        </div>
                        <button type="button" className="phone-mock-cta phone-mock-cta--quiet">
                          Dar parabéns
                        </button>
                      </li>
                    </ul>

                    <div className="phone-mock-eyebrow phone-mock-eyebrow--spaced">Em breve</div>
                    <ul className="phone-mock-list phone-mock-list--compact" aria-hidden>
                      <li className="phone-mock-row phone-mock-row--compact">
                        <span className="phone-mock-emoji phone-mock-emoji--sm">🌸</span>
                        <span className="phone-mock-name phone-mock-name--flex">Marina Castro</span>
                        <span className="phone-mock-date">7 mar</span>
                        <span className="phone-mock-days-badge">3d</span>
                      </li>
                      <li className="phone-mock-row phone-mock-row--compact">
                        <span className="phone-mock-emoji phone-mock-emoji--sm">⭐</span>
                        <span className="phone-mock-name phone-mock-name--flex">Pedro Lima</span>
                        <span className="phone-mock-date">13 mar</span>
                        <span className="phone-mock-days-badge">9d</span>
                      </li>
                      <li className="phone-mock-row phone-mock-row--compact">
                        <span className="phone-mock-emoji phone-mock-emoji--sm">🎂</span>
                        <span className="phone-mock-name phone-mock-name--flex">Carla Dias</span>
                        <span className="phone-mock-date">25 mar</span>
                        <span className="phone-mock-days-badge">1d</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="why" id="why">
        <div className="container">
          <div className="why-header observe-fade">
            <div className="section-eyebrow">Por que usar</div>
            <h2>
              Simples como <em>deve ser</em>
            </h2>
            <p className="section-sub">
              Não existe motivo para esquecer quem você ama. O Lembra cuida
              disso por você.
            </p>
          </div>
          <div className="cards-grid">
            <div
              className="feature-card observe-fade"
              style={{ transitionDelay: "0.1s" }}
            >
              <div className="feature-icon">
                <svg
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <rect x={3} y={4} width={18} height={18} rx={2} />
                  <line x1={16} y1={2} x2={16} y2={6} />
                  <line x1={8} y1={2} x2={8} y2={6} />
                  <line x1={3} y1={10} x2={21} y2={10} />
                </svg>
              </div>
              <h3>Nunca esqueça</h3>
              <p>
                Veja quem faz aniversário hoje e nos próximos dias em um único
                lugar. Sem distrações.
              </p>
            </div>
            <div
              className="feature-card observe-fade"
              style={{ transitionDelay: "0.2s" }}
            >
              <div className="feature-icon">
                <svg
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>Parabenize em segundos</h3>
              <p>
                Copie uma mensagem pronta ou abra diretamente no WhatsApp ou
                Instagram com um toque.
              </p>
            </div>
            <div
              className="feature-card observe-fade"
              style={{ transitionDelay: "0.3s" }}
            >
              <div className="feature-icon">
                <svg
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Sincronize quando quiser</h3>
              <p>
                Funciona sem login. Mas se quiser, sincronize sua lista entre
                todos os seus dispositivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="reminder" id="reminder">
        <div className="container">
          <div className="reminder-grid">
            <div className="reminder-left observe-fade">
              <div className="section-eyebrow">Lembretes</div>
              <h2>
                O Lembra avisa você no <em>momento certo</em>
              </h2>
              <p>
                Receba uma notificação discreta toda manhã quando alguém que você
                se importa estiver comemorando. Nunca mais chegue atrasado.
              </p>
              <div className="reminder-actions">
                <Link href="/today" className="btn-primary">
                  Começar agora
                </Link>
                <Link href="/today" className="btn-dark-outline">
                  Ver demo
                </Link>
              </div>
            </div>

            <div className="observe-fade" style={{ transitionDelay: "0.15s" }}>
              <div className="dashboard">
                <div className="dash-topbar">
                  <div
                    className="dash-dot"
                    style={{ background: "#FF5F57" }}
                  />
                  <div
                    className="dash-dot"
                    style={{ background: "#FEBC2E" }}
                  />
                  <div
                    className="dash-dot"
                    style={{ background: "#28C840" }}
                  />
                  <div className="dash-title">Lembra — hoje</div>
                </div>
                <div className="dash-body">
                  <div className="dash-today">
                    <div className="dash-today-label">Hoje</div>
                    <div className="dash-row">
                      <span className="dash-mock-emoji" aria-hidden>
                        🎂
                      </span>
                      <div className="dash-row-main">
                        <div className="dash-name">Ana Souza</div>
                        <div className="dash-meta">Aniversário hoje</div>
                      </div>
                      <button type="button" className="dash-btn">
                        Dar parabéns
                      </button>
                    </div>
                    <div className="dash-row">
                      <span className="dash-mock-emoji" aria-hidden>
                        🎈
                      </span>
                      <div className="dash-row-main">
                        <div className="dash-name">Lucas Melo</div>
                        <div className="dash-meta">Aniversário hoje</div>
                      </div>
                      <button type="button" className="dash-btn dash-btn--secondary">
                        Dar parabéns
                      </button>
                    </div>
                  </div>

                  <div className="dash-list">
                    <div className="dash-list-section-label">Em breve</div>
                    <div className="dash-list-item">
                      <span className="dash-mock-emoji dash-mock-emoji--sm" aria-hidden>
                        🌸
                      </span>
                      <div className="dash-list-name">Marina Castro</div>
                      <div className="dash-list-date">7 mar</div>
                      <div className="dash-days-badge">3d</div>
                    </div>
                    <div className="dash-list-item">
                      <span className="dash-mock-emoji dash-mock-emoji--sm" aria-hidden>
                        ⭐
                      </span>
                      <div className="dash-list-name">Pedro Lima</div>
                      <div className="dash-list-date">13 mar</div>
                      <div className="dash-days-badge">9d</div>
                    </div>
                    <div className="dash-list-item">
                      <span className="dash-mock-emoji dash-mock-emoji--sm" aria-hidden>
                        🎂
                      </span>
                      <div className="dash-list-name">Carla Dias</div>
                      <div className="dash-list-date">25 mar</div>
                      <div className="dash-days-badge">1d</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust" id="trust">
        <div className="container">
          <div className="trust-grid">
            <div className="observe-fade">
              <div className="section-eyebrow">Privacidade</div>
              <h2>
                Simples, privado e <em>confiável</em>
              </h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>
                Seus aniversários são seus. O Lembra foi construído para ser
                simples, privado e sem complexidade desnecessária.
              </p>
            </div>

            <div
              className="trust-checks observe-fade"
              style={{ transitionDelay: "0.15s" }}
            >
              <div className="check-item">
                <div className="check-icon">
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="check-text">Funciona mesmo sem login</span>
              </div>
              <div className="check-item">
                <div className="check-icon">
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="check-text">
                  Seus dados ficam sob seu controle
                </span>
              </div>
              <div className="check-item">
                <div className="check-icon">
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="check-text">
                  Sincronização segura entre dispositivos
                </span>
              </div>
              <div className="check-item">
                <div className="check-icon">
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="check-text">
                  Projeto leve, rápido e sem anúncios
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section" id="cta">
        <div className="container">
          <div className="observe-fade">
            <div
              className="section-eyebrow"
              style={{ color: "var(--gold)" }}
            >
              Comece agora
            </div>
            <h2>
              Nunca mais esqueça um <em>aniversário</em> importante
            </h2>
            <ul className="cta-list">
              <li>Comece em segundos</li>
              <li>Organize aniversários em um só lugar</li>
              <li>Receba lembretes na hora certa</li>
            </ul>
            <Link href="/today?onboarding=1" className="btn-cta-big">
              Começar grátis
              <svg
                width={18}
                height={18}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-logo">
            <span className="topnav-brand-dot" aria-hidden />
            <span className="topnav-brand-title">Lembra.</span>
          </div>
          <ul className="footer-links">
            <li>
              <Link href="/#reminder">Como funciona</Link>
            </li>
            <li>
              <Link href="/privacy">Privacidade</Link>
            </li>
            <li>
              <Link href="/terms">Termos</Link>
            </li>
          </ul>
          <div className="footer-copy">© 2025 Lembra.</div>
        </div>
      </footer>
    </LandingMotion>
  );
}
