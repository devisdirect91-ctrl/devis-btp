-- Migration : simplification des statuts DevisStatus
-- À exécuter dans le SQL Editor de Supabase AVANT `prisma db push`
-- -----------------------------------------------------------------

-- 1. Migrer les données vers les nouveaux statuts
UPDATE "Devis" SET status = 'EN_ATTENTE' WHERE status IN ('BROUILLON', 'ENVOYE', 'VU');
UPDATE "Devis" SET status = 'SIGNE'      WHERE status = 'ACCEPTE';
UPDATE "Devis" SET status = 'REFUSE'     WHERE status = 'EXPIRE';

-- 2. Passer la colonne en TEXT pour permettre le changement d'enum
ALTER TABLE "Devis" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Devis" ALTER COLUMN status TYPE TEXT;

-- 3. Supprimer l'ancien type enum
DROP TYPE IF EXISTS "DevisStatus";

-- 4. Créer le nouveau type enum
CREATE TYPE "DevisStatus" AS ENUM ('EN_ATTENTE', 'SIGNE', 'REFUSE');

-- 5. Reconvertir la colonne vers le nouveau enum
ALTER TABLE "Devis"
  ALTER COLUMN status TYPE "DevisStatus"
  USING status::"DevisStatus";

ALTER TABLE "Devis"
  ALTER COLUMN status SET DEFAULT 'EN_ATTENTE'::"DevisStatus";

-- Vérification
SELECT status, count(*) FROM "Devis" GROUP BY status;
