import * as crypto from 'crypto';

export class CryptoManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  // 生成加密密钥（基于用户密码或机器指纹）
  private static getKey(): Buffer {
    // 在实际应用中，应该使用安全的密钥派生方式
    // 这里使用固定密钥作为演示，生产环境应使用更安全的方式
    const secret = 'pantools-secret-key-2026-secure';
    return crypto.scryptSync(secret, 'pantools-salt', this.KEY_LENGTH);
  }

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.getKey();
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // 组合 IV + tag + 加密数据
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const key = this.getKey();
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
