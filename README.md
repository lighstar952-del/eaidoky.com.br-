# EAIDOKY — site para Render
Reconstruído a partir do HTML salvo do site original (mesma estrutura, textos e links).

## Imagens (importante)
Copie para `public/img/` os arquivos da pasta "EAIDOKY — Streamer Oficial_files" do site salvo:
- hero-streamer_aab81f49.webp  (arte principal)
- image-1.webp  (mascote dos cards)
- image-2.webp  (mascote do rodapé)
Sem eles o site usa um recorte de baixa resolução (hero.png) e esconde os mascotes.

## Deploy no Render
1. Suba esta pasta para um repositório no GitHub.
2. Render > New + > Web Service > escolha o repositório (ou Blueprint com o render.yaml).
3. Build: `npm install` | Start: `npm start`.
4. O ID do canal é descoberto pelo @eaidoky. Se falhar, crie YT_CHANNEL_ID (começa com UC...).

## Feed
/api/feed lê o RSS do YouTube a cada 60 s. "Shorts" = vídeo com #shorts no título ou descrição; "Live" = último vídeo sem essa marcação.
