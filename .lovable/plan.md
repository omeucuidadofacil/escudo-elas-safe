

## Plano: Integrar Google Maps na página de Mapa de Risco

### Visão geral
Substituir o placeholder atual por um mapa interativo do Google Maps, mostrando incidentes reais do banco de dados como marcadores coloridos por tipo.

### O que já existe
- Tabela `incidentes` no banco com campos: `latitude`, `longitude`, `tipo`, `descricao`, `created_at`, `user_id`
- Page `MapaPage.tsx` com filtros e lista de incidentes (dados mock)
- Lógica de paywall já implementada

### Etapas

1. **Configurar a API Key do Google Maps**
   - Solicitar ao usuário a chave da API Maps JavaScript via ferramenta de secrets
   - A chave será usada no frontend (chave pública, restrita por domínio)

2. **Instalar biblioteca `@react-google-maps/api`**
   - Biblioteca React para Google Maps, bem mantida e compatível com React 18

3. **Atualizar `MapaPage.tsx`**
   - Carregar o mapa com `GoogleMap` + `LoadScript` usando a API key
   - Centralizar no GPS do usuário (via `navigator.geolocation`) ou São Paulo como fallback
   - Buscar incidentes reais da tabela `incidentes` via Supabase
   - Renderizar marcadores coloridos por tipo (vermelho=agressão, laranja=assédio, amarelo=suspeito, roxo=stalking)
   - Clicar no marcador abre `InfoWindow` com descrição e data
   - Calcular distância real entre o usuário e cada incidente
   - Manter filtros e lista de incidentes existentes, agora com dados reais

4. **Funcionalidade "Reportar"**
   - Botão "Reportar" abre modal para selecionar tipo, escrever descrição
   - Usa localização GPS atual para lat/lng
   - Insere na tabela `incidentes` via Supabase

### Detalhes técnicos
- API key armazenada como variável de ambiente `VITE_GOOGLE_MAPS_API_KEY` (chave pública, segura no frontend)
- Distância calculada com fórmula Haversine no cliente
- Tempo relativo calculado com `date-fns`

