-- Dados iniciais (os mesmos exemplos do site). A Heloisa troca tudo pelo painel.

insert into public.categories (id, label_pt, label_en, description_pt, description_en, max_cols, position)
values
  ('posts', 'Posts', 'Posts', 'Publicações para feed e stories.', 'Feed and stories publications.', null, 1),
  ('desenhos', 'Desenhos', 'Drawings', 'Ilustrações e artes autorais.', 'Illustrations and original artwork.', null, 2),
  ('adesivos', 'Adesivos', 'Stickers', 'Cartelas e adesivos avulsos.', 'Sticker sheets and single stickers.', null, 3),
  ('banners', 'Banners', 'Banners', 'Banners para sites, campanhas e eventos.', 'Banners for websites, campaigns and events.', 2, 4);

-- Contatos de exemplo: trocar pelos reais no painel.
insert into public.site_settings (id, data)
values (
  1,
  $json$
  {
    "name": "Heloisa S. B.",
    "role": { "pt": "Designer e marketing", "en": "Designer and marketer" },
    "photo_path": null,
    "about": {
      "pt": [
        "Sou designer e trabalho com marketing, criando identidades, peças para redes sociais e materiais que ajudam marcas a serem lembradas.",
        "Gosto de começar pela conversa: entender quem é o cliente e o que ele quer dizer, e só depois desenhar. O resultado é um design bonito que também cumpre o seu papel."
      ],
      "en": [
        "I'm a designer working in marketing, creating identities, social media pieces and materials that help brands be remembered.",
        "I like to start with a conversation: understanding who the client is and what they want to say, and only then design. The result is beautiful design that also does its job."
      ]
    },
    "contact": {
      "email": "contato@exemplo.com",
      "whatsapp": "5500000000000",
      "instagram": "https://instagram.com/",
      "linkedin": "https://linkedin.com/"
    }
  }
  $json$::jsonb
);

-- Depois de criar o usuário da Heloisa em Authentication > Users, cadastre-a como administradora
-- (troque o e-mail pelo dela):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'email-da-heloisa@exemplo.com';
