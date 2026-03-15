-- Migration : simplification des statuts DevisStatus
-- À exécuter AVANT prisma db push
-- -----------------------------------------------------------------

-- 1. Supprimer la valeur par défaut et passer la colonne en TEXT
ALTER TABLE "Devis" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Devis" ALTER COLUMN status TYPE TEXT;

-- 2. Migrer les données
UPDATE "Devis" SET status = 'EN_ATTENTE' WHERE status IN ('BROUILLON', 'ENVOYE', 'VU');
UPDATE "Devis" SET status = 'SIGNE'      WHERE status = 'ACCEPTE';
UPDATE "Devis" SET status = 'REFUSE'     WHERE status = 'EXPIRE';

-- 3. Supprimer l'ancien enum
DROP TYPE IF EXISTS "DevisStatus";

-- 4. Créer le nouveau enum
CREATE TYPE "DevisStatus" AS ENUM ('EN_ATTENTE', 'SIGNE', 'REFUSE');

-- 5. Reconvertir la colonne
ALTER TABLE "Devis"
  ALTER COLUMN status TYPE "DevisStatus"
  USING status::"DevisStatus";

ALTER TABLE "Devis"
  ALTER COLUMN status SET DEFAULT 'EN_ATTENTE'::"DevisStatus";

-- Vérification
SELECT status, count(*) FROM "Devis" GROUP BY status;
