import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getStripeKey(supabaseClient: any): Promise<string> {
  const envKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (envKey && (envKey.startsWith("sk_") || envKey.startsWith("rk_"))) {
    return envKey;
  }
  const { data } = await supabaseClient
    .from("api_keys")
    .select("chave")
    .eq("servico", "stripe")
    .eq("ativo", true)
    .limit(1)
    .single();
  if (data?.chave) return data.chave;
  throw new Error("Stripe key not found in env or database");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin only");

    const stripeKey = await getStripeKey(supabaseClient);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { action, ...body } = await req.json();

    if (action === "create") {
      const product = await stripe.products.create({
        name: body.nome,
        description: body.descricao || undefined,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(body.preco * 100),
        currency: "brl",
        recurring: { interval: body.intervalo === "year" ? "year" : "month" },
      });

      const { data, error } = await supabaseClient.from("planos").insert({
        nome: body.nome,
        descricao: body.descricao || "",
        preco: body.preco,
        intervalo: body.intervalo || "month",
        stripe_price_id: price.id,
        stripe_product_id: product.id,
        ativo: true,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, plan: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { data: existing } = await supabaseClient
        .from("planos")
        .select("*")
        .eq("id", body.id)
        .single();
      if (!existing) throw new Error("Plan not found");

      if (existing.stripe_product_id) {
        await stripe.products.update(existing.stripe_product_id, {
          name: body.nome,
          description: body.descricao || undefined,
        });
      }

      let newPriceId = existing.stripe_price_id;
      if (body.preco !== Number(existing.preco)) {
        if (existing.stripe_price_id) {
          await stripe.prices.update(existing.stripe_price_id, { active: false });
        }
        const newPrice = await stripe.prices.create({
          product: existing.stripe_product_id,
          unit_amount: Math.round(body.preco * 100),
          currency: "brl",
          recurring: { interval: (body.intervalo || existing.intervalo) === "year" ? "year" : "month" },
        });
        newPriceId = newPrice.id;
      }

      const { error } = await supabaseClient.from("planos").update({
        nome: body.nome,
        descricao: body.descricao,
        preco: body.preco,
        intervalo: body.intervalo,
        stripe_price_id: newPriceId,
      }).eq("id", body.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle") {
      const { data: existing } = await supabaseClient
        .from("planos")
        .select("*")
        .eq("id", body.id)
        .single();
      if (!existing) throw new Error("Plan not found");

      const newStatus = !existing.ativo;
      if (existing.stripe_product_id) {
        await stripe.products.update(existing.stripe_product_id, { active: newStatus });
      }

      const { error } = await supabaseClient
        .from("planos")
        .update({ ativo: newStatus })
        .eq("id", body.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, ativo: newStatus }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { data: existing } = await supabaseClient
        .from("planos")
        .select("*")
        .eq("id", body.id)
        .single();
      if (!existing) throw new Error("Plan not found");

      if (existing.stripe_price_id) {
        await stripe.prices.update(existing.stripe_price_id, { active: false });
      }
      if (existing.stripe_product_id) {
        await stripe.products.update(existing.stripe_product_id, { active: false });
      }

      const { error } = await supabaseClient.from("planos").delete().eq("id", body.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
