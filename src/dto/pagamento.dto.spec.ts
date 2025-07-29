import { validate } from 'class-validator';
import { PagamentoDto, CreatePagamentoDto } from './pagamento.dto';
import { PaymentStatus } from '../domain/pagamento/pagamento.types';

describe('PagamentoDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = new PagamentoDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';
      dto.pedido_id = '456e7890-e89b-12d3-a456-426614174001';
      dto.cliente_id = '789e0123-e89b-12d3-a456-426614174002';
      dto.valor = 100.5;
      dto.status = PaymentStatus.APPROVED;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional cliente_id', async () => {
      const dto = new PagamentoDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';
      dto.pedido_id = '456e7890-e89b-12d3-a456-426614174001';
      dto.valor = 100.5;
      dto.status = PaymentStatus.APPROVED;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid cliente_id UUID', async () => {
      const dto = new PagamentoDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';
      dto.pedido_id = '456e7890-e89b-12d3-a456-426614174001';
      dto.cliente_id = 'invalid-uuid';
      dto.valor = 100.5;
      dto.status = PaymentStatus.APPROVED;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('cliente_id');
    });

    it('should fail validation with invalid payment status', async () => {
      const dto = new PagamentoDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';
      dto.pedido_id = '456e7890-e89b-12d3-a456-426614174001';
      dto.valor = 100.5;
      dto.status = 'invalid_status' as PaymentStatus;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should fail validation with empty status', async () => {
      const dto = new PagamentoDto();
      dto.id = '123e4567-e89b-12d3-a456-426614174000';
      dto.pedido_id = '456e7890-e89b-12d3-a456-426614174001';
      dto.valor = 100.5;
      dto.status = '' as PaymentStatus;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('properties', () => {
    it('should have correct properties', () => {
      const dto = new PagamentoDto();

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('pedido_id');
      expect(dto).toHaveProperty('cliente_id');
      expect(dto).toHaveProperty('valor');
      expect(dto).toHaveProperty('status');
    });
  });
});

describe('CreatePagamentoDto', () => {
  describe('inheritance', () => {
    it('should inherit from PagamentoDto', () => {
      const createDto = new CreatePagamentoDto();
      expect(createDto).toBeInstanceOf(CreatePagamentoDto);
    });

    it('should have all PagamentoDto properties as optional', async () => {
      const createDto = new CreatePagamentoDto();

      // Should pass validation with empty object (since it's a PartialType)
      const errors = await validate(createDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate properly when properties are provided', async () => {
      const createDto = new CreatePagamentoDto();
      createDto.pedido_id = '123e4567-e89b-12d3-a456-426614174000';
      createDto.valor = 250.75;
      createDto.status = PaymentStatus.PENDING;

      const errors = await validate(createDto);
      expect(errors).toHaveLength(0);
    });
  });
});
