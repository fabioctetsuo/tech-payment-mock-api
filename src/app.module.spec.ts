import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('module compilation', () => {
    it('should compile the module successfully', () => {
      expect(module).toBeDefined();
    });

    it('should provide AppController', () => {
      const controller = module.get<AppController>(AppController);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(AppController);
    });

    it('should provide AppService', () => {
      const service = module.get<AppService>(AppService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(AppService);
    });

    it('should provide Logger', () => {
      const logger = module.get<Logger>(Logger);
      expect(logger).toBeDefined();
    });

    it('should have HttpModule imported', () => {
      // Test that HttpModule is properly imported by checking module metadata
      const moduleMetadata = (Reflect.getMetadata('imports', AppModule) ||
        []) as unknown[];
      expect(moduleMetadata).toContain(HttpModule);
    });
  });

  describe('dependency injection', () => {
    it('should inject dependencies correctly in AppController', () => {
      const controller = module.get<AppController>(AppController);

      // Test that the controller has access to its dependencies by calling a method
      expect(() => controller.health()).not.toThrow();
    });

    it('should inject dependencies correctly in AppService', () => {
      const service = module.get<AppService>(AppService);

      // Test that the service is properly instantiated
      expect(service).toHaveProperty('processPayment');
      expect(typeof service.processPayment).toBe('function');
    });
  });

  describe('module configuration', () => {
    it('should have correct module metadata', () => {
      const moduleMetadata = (Reflect.getMetadata('imports', AppModule) ||
        []) as unknown[];
      const controllers = (Reflect.getMetadata('controllers', AppModule) ||
        []) as unknown[];
      const providers = (Reflect.getMetadata('providers', AppModule) ||
        []) as unknown[];

      expect(moduleMetadata).toContain(HttpModule);
      expect(controllers).toContain(AppController);
      expect(providers).toContain(AppService);
      expect(providers).toContain(Logger);
    });
  });
});
