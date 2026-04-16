import { CloudStorageDriver, CloudStorageType } from '../../shared/types';
import { BaiduDriver } from './baidu';
import { QuarkDriver } from './quark';
import { XunleiDriver } from './xunlei';

class DriverManager {
  private drivers: Map<CloudStorageType, CloudStorageDriver> = new Map();

  constructor() {
    this.drivers.set('baidu', new BaiduDriver());
    this.drivers.set('quark', new QuarkDriver());
    this.drivers.set('xunlei', new XunleiDriver());
  }

  getDriver(type: CloudStorageType): CloudStorageDriver {
    const driver = this.drivers.get(type);
    if (!driver) {
      throw new Error(`不支持的网盘类型: ${type}`);
    }
    return driver;
  }

  getAllDrivers(): CloudStorageDriver[] {
    return Array.from(this.drivers.values());
  }
}

export const driverManager = new DriverManager();
