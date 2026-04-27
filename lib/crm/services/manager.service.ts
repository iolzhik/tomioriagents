import { prisma } from '../../prisma';
import fs from 'fs';
import { MANAGERS_PATH } from '../constants';

function readManagersFromFile() {
  try {
    if (!fs.existsSync(MANAGERS_PATH)) return [];
    const raw = fs.readFileSync(MANAGERS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getManagers() {
  try {
    return await prisma.manager.findMany();
  } catch {
    return readManagersFromFile();
  }
}

export async function getManagerById(id: string) {
  return await prisma.manager.findUnique({ where: { id } });
}

export async function authenticateManager(login: string, password?: string) {
  let manager: any = null;

  try {
    manager = await prisma.manager.findUnique({
      where: { login }
    });
  } catch {
    const managers = readManagersFromFile();
    manager = managers.find((m: any) => String(m?.login) === String(login)) || null;
  }
  
  if (!manager) return null;
  
  // Basic check for MVP, in prod use bcrypt
  if (password && manager.password !== password) return null;
  
  return manager;
}

export async function updateManager(id: string, data: any) {
  return await prisma.manager.update({
    where: { id },
    data
  });
}
