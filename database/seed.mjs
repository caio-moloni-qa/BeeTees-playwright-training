import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://beetee:beetee_dev_password@localhost:5432/beetee_dev";

async function readSeedJson(fileName) {
  const filePath = path.join(rootDir, "database", "seeds", fileName);
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function loadSeedContent() {
  const [translations, products, promos] = await Promise.all([
    readSeedJson("translations.json"),
    readSeedJson("products.json"),
    readSeedJson("promos.json"),
  ]);
  return { translations, products, promos };
}

const seed = await loadSeedContent();
const pool = new Pool({ connectionString });
const client = await pool.connect();

function hashPassword(password) {
  return createHash("sha256").update(`beetee:${password}`).digest("hex");
}

function hashResetToken(token) {
  return createHash("sha256").update(`beetee-reset:${token}`).digest("hex");
}

/** Deterministic, always-expired token for negative-path testing of the reset flow. */
const EXPIRED_RESET_TOKEN = "expired-demo-reset-token";

try {
  await client.query("BEGIN");

  for (const [locale, dictionary] of Object.entries(seed.translations)) {
    for (const [key, value] of Object.entries(dictionary)) {
      await client.query(
        `
          INSERT INTO translations (locale, key, value)
          VALUES ($1, $2, $3)
          ON CONFLICT (locale, key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        `,
        [locale, key, value]
      );
    }
  }

  for (const [index, product] of seed.products.entries()) {
    await client.query(
      `
        INSERT INTO products (
          id, category, image_src, price_usd, calories_kcal, spicy, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id)
        DO UPDATE SET
          category = EXCLUDED.category,
          image_src = EXCLUDED.image_src,
          price_usd = EXCLUDED.price_usd,
          calories_kcal = EXCLUDED.calories_kcal,
          spicy = EXCLUDED.spicy,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
      `,
      [
        product.id,
        product.category,
        product.imageSrc,
        product.priceUsd,
        product.caloriesKcal,
        product.spicy,
        index,
      ]
    );

    for (const [locale, translation] of Object.entries(product.translations)) {
      await client.query(
        `
          INSERT INTO product_translations (
            product_id, locale, name, short_name, description
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (product_id, locale)
          DO UPDATE SET
            name = EXCLUDED.name,
            short_name = EXCLUDED.short_name,
            description = EXCLUDED.description,
            updated_at = now()
        `,
        [
          product.id,
          locale,
          translation.name,
          translation.shortName,
          translation.description,
        ]
      );
    }
  }

  for (const [index, promo] of seed.promos.entries()) {
    await client.query(
      `
        INSERT INTO promos (id, image_src, image_position, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          image_src = EXCLUDED.image_src,
          image_position = EXCLUDED.image_position,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
      `,
      [promo.id, promo.imageSrc, promo.imagePosition, index]
    );
  }

  await client.query(
    `
      INSERT INTO users (id, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = now()
    `,
    [
      "demo-user",
      "alex@beetees.test",
      hashPassword("beetee123"),
      "Alex",
      "Burger",
    ]
  );

  await client.query(
    `
      INSERT INTO user_locations (
        user_id, zip_code, country_code, street_line, neighborhood,
        city, state, country, complement, store_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id)
      DO UPDATE SET
        zip_code = EXCLUDED.zip_code,
        country_code = EXCLUDED.country_code,
        street_line = EXCLUDED.street_line,
        neighborhood = EXCLUDED.neighborhood,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        complement = EXCLUDED.complement,
        store_id = EXCLUDED.store_id,
        updated_at = now()
    `,
    [
      "demo-user",
      "01001-000",
      "BR",
      "Praca da Se",
      "Se",
      "Sao Paulo",
      "SP",
      "Brazil",
      "Apt 42",
      "br-sp-pinheiros",
    ]
  );

  await client.query(
    `
      INSERT INTO orders (id, user_id, total_usd, delivery, lines)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id)
      DO UPDATE SET
        total_usd = EXCLUDED.total_usd,
        delivery = EXCLUDED.delivery,
        lines = EXCLUDED.lines
    `,
    [
      "demo-order-favorite",
      "demo-user",
      9.99,
      JSON.stringify({
        zipCode: "01001-000",
        countryCode: "BR",
        streetLine: "Praca da Se",
        neighborhood: "Se",
        city: "Sao Paulo",
        state: "SP",
        country: "Brazil",
        complement: "Apt 42",
        storeId: "br-sp-pinheiros",
      }),
      JSON.stringify([
        {
          productId: "combo-tenders-cheeseburguer",
          quantity: 1,
          unitPriceUsd: 9.99,
          customizationSummary: [],
        },
      ]),
    ]
  );

  await client.query(
    `
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at)
      VALUES ($1, $2, $3, $4, NULL)
      ON CONFLICT (id)
      DO UPDATE SET
        token_hash = EXCLUDED.token_hash,
        expires_at = EXCLUDED.expires_at,
        used_at = NULL
    `,
    [
      "demo-expired-reset-token",
      "demo-user",
      hashResetToken(EXPIRED_RESET_TOKEN),
      "2020-01-01T00:00:00Z",
    ]
  );

  await client.query("COMMIT");
  console.log("Database content seed is ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
