import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

let hash: string;
beforeAll(async () => { hash = await bcrypt.hash('correct', 10); });

function makeRepo(overrides: object = {}) {
  const base = {
    id: '1', email: 'a@b.com', name: 'A', password: hash,
    isActive: true, twoFactorEnabled: false, roleDetail: null,
    loginFailCount: 0, loginLockUntil: null,
    ...overrides,
  };
  const repo = {
    lastUpdate: null as any,
    findOne: jest.fn().mockResolvedValue(base),
    update: jest.fn().mockImplementation((_id: string, data: any) => {
      Object.assign(base, data);
      repo.lastUpdate = data;
    }),
  };
  return repo;
}

function svc(repo: any) {
  const mockReferral = { generateCode: jest.fn().mockResolvedValue({}) } as any;
  return new AuthService(repo as any, { sign: () => 'tok' } as unknown as JwtService, mockReferral);
}

describe('login lockout', () => {
  it('passes on correct password', async () => {
    const repo = makeRepo();
    const result = await svc(repo).login('a@b.com', 'correct');
    expect(result).toHaveProperty('accessToken');
  });

  it('increments fail count on wrong password', async () => {
    const repo = makeRepo();
    await expect(svc(repo).login('a@b.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repo.lastUpdate.loginFailCount).toBe(1);
    expect(repo.lastUpdate.loginLockUntil).toBeNull();
  });

  it('locks after 3rd wrong password and resets count', async () => {
    const repo = makeRepo({ loginFailCount: 2 });
    const err = await svc(repo).login('a@b.com', 'wrong').catch(e => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toContain('3 lần');
    expect(repo.lastUpdate.loginFailCount).toBe(0);
    expect(repo.lastUpdate.loginLockUntil).toBeInstanceOf(Date);
    // lock is ~30 min in the future
    expect(repo.lastUpdate.loginLockUntil.getTime() - Date.now()).toBeGreaterThan(29 * 60 * 1000);
  });

  it('blocks login while locked with wait time in message', async () => {
    const lockUntil = new Date(Date.now() + 20 * 60 * 1000);
    const repo = makeRepo({ loginLockUntil: lockUntil });
    const err = await svc(repo).login('a@b.com', 'correct').catch(e => e);
    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err.message).toContain('20 phút');
  });

  it('resets counter on successful login after partial fails', async () => {
    const repo = makeRepo({ loginFailCount: 2 });
    await svc(repo).login('a@b.com', 'correct');
    expect(repo.lastUpdate.loginFailCount).toBe(0);
    expect(repo.lastUpdate.loginLockUntil).toBeNull();
  });
});
