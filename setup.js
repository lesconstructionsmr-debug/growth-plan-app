const fs = require('fs');
const path = require('path');

const dirs = [
  'app/(auth)/login',
  'app/(auth)/register',
  'app/(app)/dashboard',
  'app/(app)/leads',
  'app/(app)/clients',
  'app/(app)/clients/[id]',
  'app/(app)/devis',
  'app/(app)/devis/[id]',
  'app/(app)/jobs',
  'app/(app)/jobs/[id]',
  'app/(app)/calendrier',
  'app/(app)/factures',
  'app/(app)/factures/[id]',
  'app/(app)/employes',
  'app/(app)/rapports',
  'app/(app)/parametres',
  'app/(public)/carte/[slug]',
  'app/(public)/devis/[id]/approve',
  'components/ui',
  'components/layout',
  'components/modules/dashboard',
  'components/modules/leads',
  'components/modules/jobs',
  'components/modules/calendrier',
  'components/modules/factures',
  'components/modules/devis',
  'lib/supabase',
  'lib/types',
  'lib/hooks',
  'lib/utils',
  'public/icons',
];

console.log('\n Création de la structure ERP Construction...\n');

dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log('  OK', dir);
});

console.log('\n Structure créée avec succès!');
console.log(' Prochaine étape : tailwind.config.ts + globals.css\n');