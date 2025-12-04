import { createClient } from '@supabase/supabase-js';

// Crear cliente con la service_role (SOLO backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    // Solo POST permitido
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    // Validar body JSON
    if (!req.body) {
      return res.status(400).json({ error: "Body vacío" });
    }

    const { product, secret } = req.body;

    // Validar clave secreta del admin
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Validar datos del producto
    if (!product || !product.id) {
      return res.status(400).json({ error: "Producto inválido" });
    }

    // Ejecutar UPDATE usando service_role (permite saltar RLS)
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', product.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("ERROR en updateProduct:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// Asegura que Vercel parsee JSON automáticamente
export const config = {
  api: {
    bodyParser: true,
  },
};
