export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { capital, liga, riesgo } = req.body;
  const base = Math.round(capital * (riesgo === 'conservador' ? 0.025 : 0.04));
  const today = new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const prompt = `Hoy es ${today}. Eres un analista de apuestas deportivas experto. El usuario tiene ${Number(capital).toLocaleString('es-CO')} COP, perfil ${riesgo}, apuesta base ${base.toLocaleString('es-CO')} COP. Apuesta en Stake.

USA web_search para buscar los partidos de hoy de ${liga}, lesiones, forma reciente y noticias relevantes.

Responde SOLO con este JSON sin texto extra ni markdown:
{
  "fecha": "${today}",
  "resumen_dia": "2-3 oraciones sobre el panorama del dia",
  "recomendaciones": [
    {
      "partido": "Equipo A vs Equipo B",
      "liga": "liga y jornada",
      "horario": "hora",
      "mercado": "mercado exacto en Stake",
      "cuota_minima": 1.75,
      "monto_cop": ${base},
      "confianza": "ALTA",
      "analisis": "3-4 oraciones con forma reciente, lesiones, contexto y razon estadistica",
      "riesgo_principal": "factor que podria hacer perder",
      "evitar": "mercados a evitar en este partido"
    }
  ],
  "combinada": {
    "recomendada": true,
    "cuota_total_estimada": 2.50,
    "monto_cop": ${Math.round(base * 0.8)},
    "razon": "por que combinar"
  },
  "no_apostar": ["partido: razon"],
  "advertencia_dia": "nota importante del dia"
}

CRITICO: cuotas entre 1.65 y 2.60. Max 3 recomendaciones. No inventes nada.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API error' });
    let text = '';
    data.content?.forEach(b => { if (b.type === 'text') text += b.text; });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'No se pudo extraer el analisis' });
    return res.status(200).json(JSON.parse(match[0]));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
