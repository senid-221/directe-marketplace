INSERT INTO "User" ("id","name","email","password","role","createdAt","updatedAt")
VALUES (
  'admin-akaziconnect',
  'AkaziConnect Admin',
  'iraguhavincent11@gmail.com',
  '5066d71cf2767fbbda79e5ed915c9111:cfe95ee0d7d456683cae0c32297211ae6636e4ed37d50d0d9d5f89191300f746',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "password" = EXCLUDED."password",
  "role" = 'ADMIN',
  "updatedAt" = CURRENT_TIMESTAMP;
