const web3FormsAccessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
const calculatorInbox = import.meta.env.VITE_CALCULATOR_LEAD_EMAIL || "contatowinc@gmail.com";

export function isCalculatorLeadEmailConfigured() {
  return Boolean(web3FormsAccessKey);
}

export async function sendCalculatorLeadEmail({
  name,
  company,
  phone,
  email,
  profile,
  page,
  source,
  subject = "Novo lead da calculadora Extintoria",
}) {
  if (!web3FormsAccessKey) {
    throw new Error("Web3Forms nao configurado.");
  }

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: web3FormsAccessKey,
      subject,
      from_name: "Extintoria Calculadora",
      email: calculatorInbox,
      replyto: email,
      name,
      company,
      phone,
      lead_email: email,
      profile,
      page,
      source,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Falha ao enviar lead por e-mail.");
  }

  return payload;
}
