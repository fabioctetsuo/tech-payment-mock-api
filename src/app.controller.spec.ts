import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CreatePagamentoDto } from './dto/pagamento.dto';
import { PaymentStatus } from './domain/pagamento/pagamento.types';

describe('AppController', () => {
  let controller: AppController;

  const mockAppService = {
    processPayment: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('health', () => {
    it('should return health status with timestamp', () => {
      const result = controller.health();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp', () => {
      const before = new Date();
      const result = controller.health();
      const after = new Date();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('createPagamento', () => {
    const mockCreatePagamentoDto: CreatePagamentoDto = {
      pedido_id: '123e4567-e89b-12d3-a456-426614174000',
      valor: 100.5,
      cliente_id: '456e7890-e89b-12d3-a456-426614174001',
    };

    it('should create payment and return processing status', () => {
      const result = controller.createPagamento(mockCreatePagamentoDto);

      expect(result).toEqual({
        status: PaymentStatus.PROCESSING,
        message: 'Pagamento em processamento',
      });
    });

    it('should log payment processing start', () => {
      controller.createPagamento(mockCreatePagamentoDto);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Iniciando processamento do pagamento do pedido ${mockCreatePagamentoDto.pedido_id}!`,
      );
    });

    it('should call appService.processPayment with correct DTO', () => {
      controller.createPagamento(mockCreatePagamentoDto);

      expect(mockAppService.processPayment).toHaveBeenCalledWith(
        mockCreatePagamentoDto,
      );
      expect(mockAppService.processPayment).toHaveBeenCalledTimes(1);
    });

    it('should handle payment with minimal required fields', () => {
      const minimalDto: CreatePagamentoDto = {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = controller.createPagamento(minimalDto);

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(mockAppService.processPayment).toHaveBeenCalledWith(minimalDto);
    });

    it('should handle payment with all fields', () => {
      const fullDto: CreatePagamentoDto = {
        id: '789e0123-e89b-12d3-a456-426614174002',
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 250.75,
        cliente_id: '456e7890-e89b-12d3-a456-426614174001',
        status: PaymentStatus.PENDING,
      };

      const result = controller.createPagamento(fullDto);

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(mockAppService.processPayment).toHaveBeenCalledWith(fullDto);
    });
  });
});
