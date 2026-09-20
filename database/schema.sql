CREATE TABLE IF NOT EXISTS translations (
  locale text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (locale, key)
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  category text NOT NULL,
  image_src text NOT NULL,
  price_usd numeric(10, 2) NOT NULL,
  calories_kcal integer NOT NULL,
  spicy boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_translations (
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, locale)
);

CREATE TABLE IF NOT EXISTS promos (
  id text PRIMARY KEY,
  image_src text NOT NULL,
  image_position text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_locations (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zip_code text NOT NULL DEFAULT '',
  country_code text NOT NULL DEFAULT 'US',
  street_line text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  complement text NOT NULL DEFAULT '',
  store_id text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  total_usd numeric(10, 2) NOT NULL,
  delivery jsonb NOT NULL,
  lines jsonb NOT NULL
);
