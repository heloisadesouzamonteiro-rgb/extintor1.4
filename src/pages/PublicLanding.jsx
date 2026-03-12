import { useEffect, useState } from "react";
import extintor01 from "../assets/extintor-01.jpg";
import extintor02 from "../assets/extintor-02.jpg";
import extintor03 from "../assets/extintor-03.jpg";
import { sendLeadToSheetsWebhook } from "../services/leadWebhook";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import "../styles/landing.css";

const initialForm = {
  name: "",
  phone: "",
  companyName: "",
  employeeCount: "",
};

const painPoints = [
  {
    title: "Planilhas baguncadas",
    description: "Centralize tudo em um sistema",
    icon: FilesIcon,
  },
  {
    title: "Controle de extintores",
    description: "Historico e status sempre atualizados",
    icon: ExtinguisherIcon,
  },
  {
    title: "Falta de visao da operacao",
    description: "Relatorios claros em segundos",
    icon: ChartIcon,
  },
];

const features = [
  { title: "Clientes", description: "Cadastro completo", icon: UsersIcon },
  { title: "Extintores", description: "Historico e localizacao", icon: ExtinguisherIcon },
  { title: "O.S.", description: "Registro em poucos cliques", icon: ClipboardIcon },
  { title: "Relatorios", description: "Visao mensal da operacao", icon: ChartIcon },
  { title: "Area do tecnico", description: "Uso facil pelo celular", icon: MobileIcon },
  { title: "Unidades atendidas", description: "Organizacao por local", icon: PinIcon },
];

const steps = [
  {
    title: "Preencha o formulario",
    description: "Solicite o acesso ao ambiente de teste",
  },
  {
    title: "Receba o acesso",
    description: "Nossa equipe libera seu ambiente",
  },
  {
    title: "Teste por 7 dias",
    description: "Explore o sistema sem compromisso",
  },
];

const faqItems = [
  {
    question: "Preciso de cartao para testar?",
    answer: "Nao. Voce testa sem cartao e sem compromisso.",
  },
  {
    question: "O sistema funciona no celular?",
    answer: "Sim. Tecnicos podem usar em campo pelo navegador.",
  },
  {
    question: "Serve para empresas de extintores?",
    answer: "Sim. Foi criado especificamente para esse mercado.",
  },
  {
    question: "Preciso instalar algo?",
    answer: "Nao. Funciona direto no navegador.",
  },
];

export default function PublicLanding({ onOpenLogin }) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}/landing`;
    const title = "ExtintorIA | Sistema de Gestao para Empresas de Extintores";
    const description =
      "Clientes, extintores, inspecoes e relatorios em um unico sistema. Teste gratis por 7 dias sem compromisso.";
    const imageUrl = `${window.location.origin}${extintor01}`;

    document.title = title;
    updateMetaTag('meta[name="description"]', "content", description);
    updateMetaTag('meta[property="og:title"]', "content", title);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:url"]', "content", canonicalUrl);
    updateMetaTag('meta[property="og:image"]', "content", imageUrl);
    updateMetaTag('meta[name="twitter:title"]', "content", title);
    updateMetaTag('meta[name="twitter:description"]', "content", description);
    updateMetaTag('meta[name="twitter:image"]', "content", imageUrl);

    const canonicalLink = document.getElementById("canonical-link");
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonicalUrl);
    }

    const schemaNode = document.getElementById("seo-structured-data");
    if (schemaNode) {
      schemaNode.textContent = JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ExtintorIA",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description,
          url: canonicalUrl,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "BRL",
            description: "Teste gratuito por 7 dias",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        },
      ]);
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "employeeCount") {
      const onlyDigits = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, employeeCount: onlyDigits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isSupabaseConfigured && !import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL) {
      setError("Configure o Supabase ou VITE_GOOGLE_SHEETS_WEBHOOK_URL para receber os leads.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      companyName: formData.companyName.trim(),
      employeeCount: Number(formData.employeeCount),
      pageUrl: window.location.href,
    };

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error: functionError } = await supabase.functions.invoke("submit-trial-request", {
          body: payload,
        });

        if (functionError) {
          throw new Error(functionError.message || "Falha ao enviar solicitacao.");
        }

        if (data?.success !== true) {
          throw new Error(data?.error || "Falha ao processar solicitacao.");
        }

        if (data?.sheetsSync === "failed") {
          throw new Error("Lead salvo, mas o envio para a planilha falhou.");
        }
      } else {
        await sendLeadToSheetsWebhook({
          nome: payload.name,
          whatsapp: payload.phone,
          empresa: payload.companyName,
          qtdFuncionarios: payload.employeeCount,
          origem: "landing_page",
          pageUrl: payload.pageUrl,
        });
      }

      setSuccess("Recebemos seu pedido de teste. Em breve entraremos em contato para liberar seu acesso.");
      setFormData(initialForm);
    } catch (submitError) {
      console.error("Erro ao enviar lead para o Google Sheets:", submitError);
      setError("Nao foi possivel enviar seus dados agora. Verifique a funcao submit-trial-request e a publicacao do webhook do Google Sheets.");
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToForm() {
    document.getElementById("teste-gratis")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToFlow() {
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="landing-shell">
      <header className="landing-topbar">
        <div className="landing-brand">
          <div className="landing-brand-mark">E</div>
          <div>
            <div className="landing-brand-title">ExtintorIA</div>
            <div className="landing-brand-subtitle">Sistema de gestao para empresas de extintores</div>
          </div>
        </div>

        <div className="landing-topbar-actions">
          <button type="button" className="landing-button landing-button-secondary" onClick={onOpenLogin}>
            Entrar no sistema
          </button>
          <button type="button" className="landing-button landing-button-primary" onClick={scrollToForm}>
            Testar gratis por 7 dias
          </button>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="landing-pill">Teste gratis por 7 dias, sem cartao e sem compromisso</span>
            <h1>Controle total da sua operacao de extintores</h1>
            <p>Clientes, extintores, inspecoes e relatorios em um unico sistema. Pare de depender de planilhas.</p>

            <div className="hero-benefits">
              <article className="hero-benefit-card">
                <div className="hero-benefit-icon"><BuildingIcon /></div>
                <div>
                  <strong>Clientes</strong>
                  <span>Cadastro de clientes e unidades</span>
                </div>
              </article>

              <article className="hero-benefit-card">
                <div className="hero-benefit-icon"><ExtinguisherIcon /></div>
                <div>
                  <strong>Extintores</strong>
                  <span>Gestao completa de extintores</span>
                </div>
              </article>

              <article className="hero-benefit-card">
                <div className="hero-benefit-icon"><ChartIcon /></div>
                <div>
                  <strong>Relatorios</strong>
                  <span>Inspecoes e relatorios automaticos</span>
                </div>
              </article>
            </div>

            <div className="hero-actions">
              <button type="button" className="landing-button landing-button-primary landing-button-large" onClick={scrollToForm}>
                Testar gratis por 7 dias
              </button>
              <button type="button" className="landing-button landing-button-secondary landing-button-large" onClick={scrollToFlow}>
                Ver como funciona
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-dashboard-card">
              <div className="hero-dashboard-header">
                <span className="landing-pill landing-pill-soft">Painel operacional</span>
                <strong>Visao da operacao</strong>
              </div>

              <div className="hero-stats-grid">
                <article>
                  <span>Clientes</span>
                  <strong>Base organizada</strong>
                </article>
                <article>
                  <span>Extintores</span>
                  <strong>Status em dia</strong>
                </article>
                <article>
                  <span>OS / Inspecoes</span>
                  <strong>Registro rapido</strong>
                </article>
                <article>
                  <span>Relatorios</span>
                  <strong>Leitura simples</strong>
                </article>
              </div>
            </div>

            <div className="hero-image-grid">
              <img
                src={extintor01}
                alt="Extintor de incendio em destaque"
              />
              <img
                src={extintor02}
                alt="Equipamentos de extintores organizados"
              />
              <img
                src={extintor03}
                alt="Area com extintores de incendio instalados"
              />
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-dark">
          <div className="section-heading">
            <span className="landing-pill landing-pill-soft">Qual dor resolvemos</span>
            <h2>Menos improviso. Mais controle no dia a dia.</h2>
          </div>

          <div className="card-grid">
            {painPoints.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="info-card info-card-centered">
                  <div className="info-card-icon"><Icon /></div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <span className="landing-pill">Funcionalidades</span>
            <h2>O que sua equipe encontra no sistema</h2>
          </div>

          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="feature-item feature-card">
                  <div className="feature-icon feature-icon-large"><Icon /></div>
                  <div className="feature-copy">
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="como-funciona" className="landing-section process-section">
          <div className="section-heading">
            <span className="landing-pill">Como funciona</span>
            <h2>Comece sem burocracia</h2>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <article key={step.title} className="process-card">
                <span className="process-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <span className="landing-pill">Veja o sistema funcionando</span>
            <h2>Prova visual para entender o sistema em segundos</h2>
            <p>Dashboard, cadastro, controle de extintores e relatorios em uma visao simples.</p>
          </div>

          <div className="screen-grid">
            <article className="screen-card">
              <div className="screen-header"><span className="screen-dot" /><span className="screen-dot" /><span className="screen-dot" /></div>
              <div className="screen-body">
                <div className="screen-title-row"><strong>Dashboard</strong><span>Visao geral</span></div>
                <div className="screen-metrics">
                  <div><span>Clientes</span><strong>124</strong></div>
                  <div><span>Extintores</span><strong>1.248</strong></div>
                  <div><span>Inspecoes</span><strong>96</strong></div>
                </div>
              </div>
            </article>

            <article className="screen-card">
              <div className="screen-header"><span className="screen-dot" /><span className="screen-dot" /><span className="screen-dot" /></div>
              <div className="screen-body">
                <div className="screen-title-row"><strong>Cadastro de cliente</strong><span>Dados organizados</span></div>
                <div className="screen-list">
                  <span>Nome da empresa</span>
                  <span>Unidade atendida</span>
                  <span>Responsavel e contato</span>
                </div>
              </div>
            </article>

            <article className="screen-card">
              <div className="screen-header"><span className="screen-dot" /><span className="screen-dot" /><span className="screen-dot" /></div>
              <div className="screen-body">
                <div className="screen-title-row"><strong>Controle de extintores</strong><span>Status e historico</span></div>
                <div className="screen-tags">
                  <span>Aprovado</span>
                  <span>Recarga</span>
                  <span>Substituicao</span>
                </div>
              </div>
            </article>

            <article className="screen-card">
              <div className="screen-header"><span className="screen-dot" /><span className="screen-dot" /><span className="screen-dot" /></div>
              <div className="screen-body">
                <div className="screen-title-row"><strong>Relatorio mensal</strong><span>Leitura simples</span></div>
                <div className="screen-bars">
                  <span style={{ width: "92%" }} />
                  <span style={{ width: "68%" }} />
                  <span style={{ width: "82%" }} />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="teste-gratis" className="landing-section form-section">
          <div className="form-copy">
            <span className="landing-pill">Teste gratuito</span>
            <h2>Solicite seu teste gratuito por 7 dias</h2>
            <p>Preencha seus dados e nossa equipe libera o acesso para voce conhecer o sistema sem compromisso.</p>

            <div className="trust-list">
              <span>Sem compromisso de pagamento</span>
              <span>Contato rapido pelo WhatsApp</span>
              <span>Ambiente real para testar</span>
            </div>
          </div>

          <form className="trial-form-card" onSubmit={handleSubmit}>
            <div className="trial-form-intro">
              <strong>Teste completo do sistema por 7 dias</strong>
              <span>Sem cartao. Sem compromisso.</span>
            </div>

            <label>
              Nome
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Seu nome" required />
            </label>

            <label>
              Telefone / WhatsApp
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" required />
            </label>

            <label>
              Nome da empresa
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Nome da empresa" required />
            </label>

            <label>
              Quantidade de funcionarios
              <input type="text" inputMode="numeric" name="employeeCount" value={formData.employeeCount} onChange={handleChange} placeholder="Ex.: 12" required />
            </label>

            <button type="submit" className="landing-button landing-button-primary landing-button-large" disabled={submitting}>
              {submitting ? "Enviando..." : "Quero testar gratis"}
            </button>

            <div className="security-badge">
              <LockIcon />
              <span>Seus dados estao seguros</span>
            </div>

            {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}
            {success ? <p className="form-feedback form-feedback-success">{success}</p> : null}

            <small>Ao enviar, voce autoriza nosso contato para liberar o teste gratuito.</small>
          </form>
        </section>

        <section className="landing-cta-banner">
          <div>
            <span className="landing-pill landing-pill-soft">Pronto para testar?</span>
            <h2>Organize sua operacao de extintores hoje mesmo</h2>
            <p>Teste gratuitamente por 7 dias e veja como o sistema simplifica a gestao da sua empresa.</p>
          </div>

          <div className="landing-topbar-actions">
            <button type="button" className="landing-button landing-button-primary" onClick={scrollToForm}>
              Testar gratis
            </button>
            <button type="button" className="landing-button landing-button-secondary" onClick={onOpenLogin}>
              Entrar no sistema
            </button>
          </div>
        </section>

        <section className="landing-section faq-section">
          <div className="section-heading">
            <span className="landing-pill">FAQ</span>
            <h2>Perguntas rapidas antes do teste</h2>
          </div>

          <div className="faq-list">
            {faqItems.map((item) => (
              <details key={item.question} className="faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function updateMetaTag(selector, attribute, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.setAttribute(attribute, value);
  }
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V6.5C4 5.67 4.67 5 5.5 5H10v15H4Zm10 0V3.5c0-.83.67-1.5 1.5-1.5h3C19.33 2 20 2.67 20 3.5V20h-6ZM7 8h1.5v1.5H7V8Zm0 3h1.5v1.5H7V11Zm0 3h1.5v1.5H7V14Zm10-8h1.5v1.5H17V6Zm0 3h1.5v1.5H17V9Zm0 3h1.5v1.5H17V12Zm-4 8v-4h2v4h-2Z" fill="currentColor" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 1a3 3 0 1 0-2.12-5.12A5.97 5.97 0 0 1 15 9c0 1.1-.3 2.12-.82 3H17Zm-8 2c4.42 0 8 1.79 8 4v2H1v-2c0-2.21 3.58-4 8-4Zm8 1c2.97 0 6 1.15 6 3v2h-4v-2c0-1.12-.52-2.15-1.44-3H17Z" fill="currentColor" />
    </svg>
  );
}

function ExtinguisherIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 3a2 2 0 0 1 2 2v1h1.25A2.75 2.75 0 0 1 19 8.75V10h-2V8.75a.75.75 0 0 0-.75-.75H15v1.1a3.99 3.99 0 0 1 2 3.4V19a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3v-6.5a3.99 3.99 0 0 1 2-3.4V5a2 2 0 0 1 2-2h2Zm0 2h-2v3h2V5Zm1 7.5a2 2 0 1 0-4 0V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.5ZM9 2h6v2H9V2Z" fill="currentColor" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 3h6a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v11.5A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2-2Zm0 2v1h6V5H9Zm-1 7h8v2H8v-2Zm0 4h5v2H8v-2Z" fill="currentColor" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16v2H2V3h2v16Zm4-2H6v-6h2v6Zm5 0h-2V7h2v10Zm5 0h-2V10h2v7Z" fill="currentColor" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h10V5H7Zm5 16a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 21Z" fill="currentColor" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s7-6.16 7-12a7 7 0 1 0-14 0c0 5.84 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm3 8.73V17h-2v-1.27a2 2 0 1 1 2 0Z" fill="currentColor" />
    </svg>
  );
}

function FilesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h7l2 2h7v14H4V4Zm4 5h8v2H8V9Zm0 4h8v2H8v-2Z" fill="currentColor" />
    </svg>
  );
}
