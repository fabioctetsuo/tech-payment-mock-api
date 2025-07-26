import { Injectable, Logger } from '@nestjs/common';
import { CreatePagamentoDto } from './dto/pagamento.dto';
import { HttpService } from '@nestjs/axios';
import { PaymentStatus } from './domain/pagamento/pagamento.types';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {}
  processPayment(createPagamentoDto: CreatePagamentoDto) {
    this.logger.log('Processando pagamento...');
    this.logger.log(`PAYMENT_WEBHOOK_URL: ${process.env.PAYMENT_WEBHOOK_URL}`);

    this.httpService
      .post(`${process.env.PAYMENT_WEBHOOK_URL}/payment`, {
        ...createPagamentoDto,
        status: PaymentStatus.APPROVED,
      })
      .subscribe({
        complete: () => {
          this.logger.log('Pagamento processado com sucesso!');
        },
        error: (err: any) => {
          this.logger.error('Erro ao processar pagamento: ', err);
        },
      });
  }
}
