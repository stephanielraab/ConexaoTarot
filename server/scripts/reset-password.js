// Redefine a senha de uma conta direto no banco (use quando esquecer a senha).
//
// Como usar (no PowerShell, dentro da pasta "server"):
//   node scripts/reset-password.js                              -> lista as contas que existem
//   node scripts/reset-password.js seu@email.com NovaSenha123   -> define a nova senha
//
// Dica: use uma senha simples, sem espaços (6 a 72 caracteres).
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';

const [, , emailArg, newPassword] = process.argv;

const printAccounts = () => {
  console.log('\nContas existentes:');
  for (const u of db.getUsers()) {
    const papel = u.role === 'admin' ? 'admin' : u.role === 'reader' ? 'oraculista' : 'cliente';
    console.log(`  - ${u.email}  (${papel})`);
  }
  console.log('');
};

if (!emailArg) {
  printAccounts();
  console.log('Para redefinir uma senha:  node scripts/reset-password.js seu@email.com NovaSenha123\n');
  process.exit(0);
}

const user = db.findUserByEmail(emailArg.trim());
if (!user) {
  console.error(`\nNão existe conta com o e-mail "${emailArg}".`);
  printAccounts();
  console.error('Confira o e-mail acima. Se a sua conta não aparece, crie uma nova em "Criar Conta" no site.\n');
  process.exit(1);
}

if (!newPassword || newPassword.length < 6 || newPassword.length > 72) {
  console.error('\nInforme uma nova senha de 6 a 72 caracteres:');
  console.error(`  node scripts/reset-password.js ${user.email} NovaSenha123\n`);
  process.exit(1);
}

const hash = await bcrypt.hash(newPassword, 11);
db.updateUser(user.id, { password: hash, tokenVersion: (user.tokenVersion || 0) + 1 });

console.log(`\n✔ Senha de ${user.email} redefinida com sucesso.`);
console.log('  Entre no site com o e-mail e a nova senha. (Sessões antigas foram encerradas.)\n');
process.exit(0);
