// /api/products.ts
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge', // opcional, hace el endpoint más rápido
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // <- ESTA ES LA CLAVE IMPORTANTE
);

export default async function handler(req: Request): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60"
        }
      }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
