import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreatePagamentoDto } from './dto/pagamento.dto';
import { PaymentStatus } from './domain/pagamento/pagamento.types';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}
  @Post('pagamentos')
  createPagamento(@Body() createPagamentoDto: CreatePagamentoDto): {
    status: string;
    message: string;
  } {
    this.logger.log(
      `Iniciando processamento do pagamento do pedido ${createPagamentoDto.pedido_id}!`,
    );

    this.appService.processPayment(createPagamentoDto);

    return {
      status: PaymentStatus.PROCESSING,
      message: 'Pagamento em processamento',
    };
  }
}
