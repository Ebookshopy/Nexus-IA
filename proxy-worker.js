// ============================================================
// PROXY CLOUDFLARE WORKER — garde ta clé Groq côté serveur
// ============================================================
//
// DÉPLOIEMENT (5 minutes, gratuit) :
// 1. Va sur https://dash.cloudflare.com -> Workers & Pages -> Create Worker
// 2. Colle ce code dans l'éditeur
// 3. Dans "Settings" -> "Variables and Secrets" du Worker, ajoute une
//    variable SECRÈTE nommée GROQ_API_KEY avec ta clé Groq comme valeur.
//    (Ne mets JAMAIS la clé directement dans ce fichier.)
// 4. Déploie. Tu obtiens une URL du type :
//    https://ton-worker.ton-compte.workers.dev
// 5. Dans nexus-chat.html, remplace PROXY_URL par cette URL + "/chat"
//    (ou juste l'URL racine si tu gardes le code tel quel ci-dessous).
//
// Optionnel mais recommandé : restreins qui peut appeler ce Worker en
// vérifiant l'en-tête "Origin" (voir ALLOWED_ORIGIN plus bas), sinon
// n'importe qui trouvant l'URL du Worker peut s'en servir gratuitement
// à tes frais.

const ALLOWED_ORIGIN = "https://ton-site.exemple.com"; // <-- change ça

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const body = await request.text();

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`, // clé secrète, jamais exposée
          "Content-Type": "application/json",
        },
        body,
      }
    );

    // On relaie le flux (stream) tel quel au client
    return new Response(groqResponse.body, {
      status: groqResponse.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
    });
  },
};
