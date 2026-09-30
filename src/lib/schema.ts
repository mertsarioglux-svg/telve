// Uygulamanın bütün tabloları. Sunucu ilk sorguda bunu çalıştırır;
// "if not exists" sayesinde tekrar çalışması zararsızdır.
export const SCHEMA = `
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  member_no     serial unique,
  name          text not null,
  phone         text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'musteri' check (role in ('musteri', 'kasiyer')),
  stamps        int  not null default 0 check (stamps >= 0),
  free_drinks   int  not null default 0 check (free_drinks >= 0),
  total_earned  int  not null default 0,
  total_coffees int  not null default 0,
  marketing     boolean not null default false,
  notif_stamp   boolean not null default true,
  notif_gift    boolean not null default true,
  notif_promo   boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null
);

-- Müşterinin ekranındaki QR. Kısa ömürlü ve tek kullanımlık.
create table if not exists qr_codes (
  code       text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);
create index if not exists qr_codes_user_idx on qr_codes(user_id);

create table if not exists transactions (
  id         bigserial primary key,
  user_id    uuid not null references users(id) on delete cascade,
  cashier_id uuid references users(id) on delete set null,
  kind       text not null check (kind in ('stamp', 'reward_earned', 'reward_used')),
  count      int  not null default 1,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on transactions(user_id, created_at desc);
create index if not exists transactions_cashier_idx on transactions(cashier_id, created_at desc);

create table if not exists password_resets (
  token_hash text primary key,
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);

-- Supabase public şemadaki tabloları anahtarla herkese açık bir API'den sunar.
-- RLS açık ve hiç policy yok → o API'den hiçbir satır okunamaz/yazılamaz.
-- Uygulama tabloların sahibi olan rol ile bağlandığı için RLS'ten etkilenmez.
alter table users           enable row level security;
alter table sessions        enable row level security;
alter table qr_codes        enable row level security;
alter table transactions    enable row level security;
alter table password_resets enable row level security;
`;
