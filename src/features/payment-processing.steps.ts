import { defineFeature, loadFeature } from 'jest-cucumber';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { CreatePagamentoDto } from '../dto/pagamento.dto';
import { PaymentStatus } from '../domain/pagamento/pagamento.types';

const feature = loadFeature('src/features/payment-processing.feature');

defineFeature(feature, (test) => {
  let controller: AppController;
  let mockHttpService: {
    post: jest.Mock;
  };
  let mockLogger: {
    log: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };
  let paymentDto: CreatePagamentoDto;
  let result: {
    status: string;
    message?: string;
    timestamp?: string;
  };
  let module: TestingModule;

  const setupTestModule = async () => {
    mockHttpService = {
      post: jest.fn().mockReturnValue(of({ data: { success: true } })),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [AppController],
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

    controller = module.get<AppController>(AppController);
  };

  beforeEach(async () => {
    process.env.PAYMENT_WEBHOOK_URL = 'http://test-webhook:3001';
    await setupTestModule();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Successfully process a payment request', ({
    given,
    when,
    then,
    and,
  }) => {
    given('a payment request with valid data', () => {
      paymentDto = {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 100.5,
        cliente_id: '456e7890-e89b-12d3-a456-426614174001',
      };
    });

    when('the payment is processed', () => {
      result = controller.createPagamento(paymentDto);
    });

    then(/^the payment status should be "(.*)"$/, (expectedStatus: string) => {
      expect(result.status).toBe(expectedStatus);
    });

    and('a success response should be returned', () => {
      expect(result).toEqual({
        status: PaymentStatus.PROCESSING,
        message: 'Pagamento em processamento',
      });
    });

    and('the payment should be sent to the webhook', () => {
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://test-webhook:3001/payment',
        {
          ...paymentDto,
          status: PaymentStatus.APPROVED,
        },
      );
    });
  });

  test('Process payment with minimal required data', ({
    given,
    when,
    then,
    and,
  }) => {
    given('a payment request with only pedido_id', () => {
      paymentDto = {
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
      };
    });

    when('the payment is processed', () => {
      result = controller.createPagamento(paymentDto);
    });

    then(/^the payment status should be "(.*)"$/, (expectedStatus: string) => {
      expect(result.status).toBe(expectedStatus);
    });

    and(
      'the payment should be sent to the webhook with approved status',
      () => {
        expect(mockHttpService.post).toHaveBeenCalledWith(
          'http://test-webhook:3001/payment',
          {
            pedido_id: '123e4567-e89b-12d3-a456-426614174000',
            status: PaymentStatus.APPROVED,
          },
        );
      },
    );
  });

  test('Health check endpoint returns system status', ({
    given,
    when,
    then,
    and,
  }) => {
    given('the payment service is running', () => {
      // Service is already set up in beforeEach
      expect(controller).toBeDefined();
    });

    when('a health check is requested', () => {
      result = controller.health();
    });

    then(/^the health status should be "(.*)"$/, (expectedStatus: string) => {
      expect(result.status).toBe(expectedStatus);
    });

    and('a timestamp should be included in the response', () => {
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      if (result.timestamp) {
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
      }
    });
  });

  test('Payment webhook receives correct data', ({
    given,
    when,
    then,
    and,
  }) => {
    given('a payment request with complete data', () => {
      paymentDto = {
        id: '789e0123-e89b-12d3-a456-426614174002',
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 250.75,
        cliente_id: '456e7890-e89b-12d3-a456-426614174001',
        status: PaymentStatus.PENDING,
      };
    });

    when('the payment is processed', () => {
      result = controller.createPagamento(paymentDto);
    });

    then('the webhook should receive the payment data', () => {
      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      const [, data] = mockHttpService.post.mock.calls[0] as [string, unknown];
      expect(data).toMatchObject({
        id: '789e0123-e89b-12d3-a456-426614174002',
        pedido_id: '123e4567-e89b-12d3-a456-426614174000',
        valor: 250.75,
        cliente_id: '456e7890-e89b-12d3-a456-426614174001',
      });
    });

    and('the webhook payload should contain approved status', () => {
      const [, data] = mockHttpService.post.mock.calls[0] as [
        string,
        { status: string },
      ];
      expect(data.status).toBe(PaymentStatus.APPROVED);
    });

    and('the webhook should be called with correct URL', () => {
      const [url] = mockHttpService.post.mock.calls[0] as [string, unknown];
      expect(url).toBe('http://test-webhook:3001/payment');
    });
  });
});
