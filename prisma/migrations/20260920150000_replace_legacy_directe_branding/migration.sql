-- Replace legacy DIRECTE branding in existing product descriptions.
UPDATE "Product"
SET "description" = REGEXP_REPLACE(
  "description",
  'DIRECTE|Directe|directe',
  'AkaziConnect',
  'gi'
)
WHERE "description" ~* 'DIRECTE|Directe|directe';
