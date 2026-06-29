import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { User } from '../../users/user.entity';
import { Role } from '../../roles/role.entity';
import { Plan } from '../../plans/plan.entity';
import * as bcrypt from 'bcrypt';

const roleSeeds = [
  { name: 'Admin', key: 'super_admin', description: 'Toàn quyền hệ thống', group: 'Admin' },
  { name: 'Nhân Viên CSKH', key: 'cs_staff', description: 'Nhân viên chăm sóc khách hàng', group: 'CSKH' },
  { name: 'User', key: 'user', description: 'Người dùng thông thường', group: 'User' },
];

async function seed() {
  await AppDataSource.initialize();

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  const roleMap: Record<string, string> = {};
  for (const r of roleSeeds) {
    let role = await roleRepo.findOneBy({ key: r.key });
    if (!role) {
      role = await roleRepo.save(roleRepo.create(r));
      console.log(`Seeded role: ${role.name} (${role.key})`);
    } else {
      Object.assign(role, r);
      role = await roleRepo.save(role);
      console.log(`Updated role: ${role.key}`);
    }
    roleMap[role.key] = role.id;
  }

  const users = [
    { email: 'admin@aikey.com', name: 'Admin', password: 'Admin@123', roleKey: 'super_admin' },
    { email: 'cskh@aikey.com', name: 'Nhân Viên CSKH', password: 'Cskh@123', roleKey: 'cs_staff' },
    { email: 'user@aikey.com', name: 'User', password: 'User@123', roleKey: 'user' },
  ];

  for (const u of users) {
    const exists = await userRepo.findOneBy({ email: u.email });
    if (exists) { console.log(`Skip user: ${u.email}`); continue; }
    const { roleKey, ...rest } = u;
    await userRepo.save(userRepo.create({
      ...rest,
      password: await bcrypt.hash(u.password, 10),
      roleId: roleMap[roleKey] ?? null,
    }));
    console.log(`Seeded user: ${u.email} → ${roleKey}`);
  }

  // Seed default plans
  const planRepo = AppDataSource.getRepository(Plan);
  const defaultPlans = [
    { name: 'Gói Tháng', tokenQuota: 21000000, durationDays: 30, price: 350000 },
  ];
  for (const p of defaultPlans) {
    const exists = await planRepo.findOneBy({ name: p.name });
    if (!exists) { await planRepo.save(planRepo.create(p)); console.log(`Seeded plan: ${p.name}`); }
    else console.log(`Skip plan: ${p.name}`);
  }

  await AppDataSource.destroy();
}

seed().catch((e) => { console.error(e); process.exit(1); });
