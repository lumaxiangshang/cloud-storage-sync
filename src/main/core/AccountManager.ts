import { v4 as uuidv4 } from 'uuid';
import { CloudStorageType } from '../../shared/types';
import { CryptoManager } from './Crypto';

export interface Account {
  id: string;
  name: string;
  type: CloudStorageType;
  cookies: string; // 加密存储的 cookies
  isActive: boolean;
  spaceTotal?: number; // 总空间（字节）
  spaceUsed?: number;  // 已用空间（字节）
  lastLoginAt: Date;
  createdAt: Date;
}

export interface CookieData {
  [key: string]: string;
}

export class AccountManager {
  private accounts: Map<string, Account> = new Map();
  private store: any; // electron-store 实例

  constructor(store: any) {
    this.store = store;
    this.loadAccounts();
  }

  private loadAccounts(): void {
    const savedAccounts = this.store.get('accounts', []) as Account[];
    for (const account of savedAccounts) {
      // 恢复 Date 对象
      account.lastLoginAt = new Date(account.lastLoginAt);
      account.createdAt = new Date(account.createdAt);
      this.accounts.set(account.id, account);
    }
  }

  private saveAccounts(): void {
    this.store.set('accounts', Array.from(this.accounts.values()));
  }

  async addAccount(
    name: string,
    type: CloudStorageType,
    cookies: CookieData
  ): Promise<Account> {
    // 加密 cookies
    const encryptedCookies = CryptoManager.encrypt(JSON.stringify(cookies));

    const account: Account = {
      id: uuidv4(),
      name,
      type,
      cookies: encryptedCookies,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date()
    };

    this.accounts.set(account.id, account);
    this.saveAccounts();

    return account;
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  getAccountsByType(type: CloudStorageType): Account[] {
    return this.getAccounts().filter(a => a.type === type && a.isActive);
  }

  getActiveAccount(type: CloudStorageType): Account | undefined {
    return this.getAccountsByType(type).find(a => a.isActive);
  }

  getCookies(accountId: string): CookieData | null {
    const account = this.getAccount(accountId);
    if (!account) return null;

    try {
      const decrypted = CryptoManager.decrypt(account.cookies);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt cookies:', error);
      return null;
    }
  }

  updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>): void {
    const account = this.accounts.get(id);
    if (!account) return;

    Object.assign(account, updates);
    this.saveAccounts();
  }

  deleteAccount(id: string): boolean {
    const success = this.accounts.delete(id);
    if (success) {
      this.saveAccounts();
    }
    return success;
  }

  setActiveAccount(id: string, active: boolean): void {
    this.updateAccount(id, { isActive: active });
  }

  async updateSpaceInfo(
    accountId: string,
    spaceTotal: number,
    spaceUsed: number
  ): Promise<void> {
    this.updateAccount(accountId, { spaceTotal, spaceUsed });
  }

  getAvailableSpace(type: CloudStorageType): number {
    const accounts = this.getAccountsByType(type);
    let totalAvailable = 0;

    for (const account of accounts) {
      if (account.spaceTotal && account.spaceUsed) {
        totalAvailable += (account.spaceTotal - account.spaceUsed);
      }
    }

    return totalAvailable;
  }

  findAccountWithSpace(
    type: CloudStorageType,
    requiredSpace: number
  ): Account | undefined {
    const accounts = this.getAccountsByType(type);

    for (const account of accounts) {
      if (account.spaceTotal && account.spaceUsed) {
        const available = account.spaceTotal - account.spaceUsed;
        if (available >= requiredSpace) {
          return account;
        }
      }
    }

    return undefined;
  }
}
