import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "maria.silva@valkyra.app", nome: "Maria Silva", telefone: "(11) 99999-1234", cidade: "São Paulo", estado: "SP" },
    { email: "ana.oliveira@valkyra.app", nome: "Ana Oliveira", telefone: "(21) 98888-5678", cidade: "Rio de Janeiro", estado: "RJ" },
    { email: "juliana.santos@valkyra.app", nome: "Juliana Santos", telefone: "(31) 97777-9012", cidade: "Belo Horizonte", estado: "MG" },
    { email: "camila.costa@valkyra.app", nome: "Camila Costa", telefone: "(41) 96666-3456", cidade: "Curitiba", estado: "PR" },
    { email: "fernanda.lima@valkyra.app", nome: "Fernanda Lima", telefone: "(51) 95555-7890", cidade: "Porto Alegre", estado: "RS" },
  ];

  const results = [];
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "ValkyraTemp2024!",
      email_confirm: true,
    });
    if (error) {
      results.push({ email: u.email, error: error.message });
      continue;
    }
    // Update the auto-created profile
    await supabase.from("profiles").update({
      nome: u.nome,
      telefone: u.telefone,
      cidade: u.cidade,
      estado: u.estado,
      cadastro_completo: true,
      aprovado: true,
    }).eq("user_id", data.user.id);

    results.push({ email: u.email, success: true });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
