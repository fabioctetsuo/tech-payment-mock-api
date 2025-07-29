import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AppService } from './app.service';
import { CreatePagamentoDto } from './dto/pagamento.dto';
import { PaymentStatus } from './domain/pagamento/pagamento.types';

describe('AppService', () => {
  let service: AppService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.PAYMENT_WEBHOOK_URL = 'http://localhost:3001';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('processPayment', () => {
    const mockCreatePagamentoDto: CreatePagamentoDto = {
      pedido_id: '123e4567-e89b-12d3-a456-426614174000',
      valor: 100.5,
      cliente_id: '456e7890-e89b-12d3-a456-426614174001',
    };

    it('should process payment successfully', () => {
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(mockCreatePagamentoDto);

      expect(mockLogger.log).toHaveBeenCalledWith('Processando pagamento...');
      expect(mockLogger.log).toHaveBeenCalledWith(
        'PAYMENT_WEBHOOK_URL: http://localhost:3001',
      );
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/payment',
        {
          ...mockCreatePagamentoDto,
          status: PaymentStatus.APPROVED,
        },
      );
    });

    it('should log success message on successful payment processing', (done: jest.DoneCallback) => {
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(mockCreatePagamentoDto);

      // Allow the observable to complete
      setTimeout(() => {
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Pagamento processado com sucesso!',
        );
        done();
      }, 10);
    });

    it('should log error message on payment processing failure', (done: jest.DoneCallback) => {
      const mockError = new Error('Network error');
      mockHttpService.post.mockReturnValue(throwError(() => mockError));

      service.processPayment(mockCreatePagamentoDto);

      // Allow the observable to error
      setTimeout(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Erro ao processar pagamento: ',
          mockError,
        );
        done();
      }, 10);
    });

    it('should use correct webhook URL from environment', () => {
      process.env.PAYMENT_WEBHOOK_URL = 'http://external-service:8080';
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(mockCreatePagamentoDto);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'PAYMENT_WEBHOOK_URL: http://external-service:8080',
      );
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://external-service:8080/payment',
        expect.any(Object),
      );
    });

    it('should send payment data with APPROVED status', () => {
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(mockCreatePagamentoDto);

      expect(mockHttpService.post).toHaveBeenCalledWith(expect.any(String), {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 100.5,
        cliente_id: '456e7890-e89b-12d3-a456-426614174001',
        status: PaymentStatus.APPROVED,
      });
    });

    it('should handle payment with minimal data', () => {
      const minimalDto: CreatePagamentoDto = {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(minimalDto);

      expect(mockHttpService.post).toHaveBeenCalledWith(expect.any(String), {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        status: PaymentStatus.APPROVED,
      });
    });

    it('should handle undefined PAYMENT_WEBHOOK_URL', () => {
      delete process.env.PAYMENT_WEBHOOK_URL;
      const mockResponse = { data: { success: true } };
      mockHttpService.post.mockReturnValue(of(mockResponse));

      service.processPayment(mockCreatePagamentoDto);

      expect(mockLogger.log).toHaveBeenCalledWith(
        'PAYMENT_WEBHOOK_URL: undefined',
      );
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'undefined/payment',
        expect.any(Object),
      );
    });
  });
});
