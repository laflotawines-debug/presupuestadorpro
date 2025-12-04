import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // 🔐 clave privada ultra poderosa
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { product, secret } = req.body;

  // 🔒 Validación: solo el panel admin puede llamar a este endpoint
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "No autorizado" });
  }

  // Ejecutar el update en Supabase usando service_role
  const { error } = await supabase
    .from('products')
    .update(product)
    .eq('id', product.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
