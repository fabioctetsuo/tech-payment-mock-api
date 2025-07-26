import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentStatus } from '../domain/pagamento/pagamento.types';

export class PagamentoDto {
  @ApiProperty({
    description: 'The payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The Pedido ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  pedido_id: string;

  @IsUUID()
  @IsOptional()
  cliente_id?: string;

  @ApiProperty({
    description: 'The payment amount',
    example: 100.5,
  })
  valor: number;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;
}

export class CreatePagamentoDto extends PartialType(PagamentoDto) {}
