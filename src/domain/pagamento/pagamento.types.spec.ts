import { PaymentStatus } from './pagamento.types';

describe('PaymentStatus', () => {
  describe('enum values', () => {
    it('should have PENDING status', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
    });

    it('should have PROCESSING status', () => {
      expect(PaymentStatus.PROCESSING).toBe('processing');
    });

    it('should have APPROVED status', () => {
      expect(PaymentStatus.APPROVED).toBe('approved');
    });

    it('should have REJECTED status', () => {
      expect(PaymentStatus.REJECTED).toBe('rejected');
    });

    it('should have CANCELLED status', () => {
      expect(PaymentStatus.CANCELLED).toBe('cancelled');
    });
  });

  describe('enum usage', () => {
    it('should contain all expected statuses', () => {
      const expectedStatuses = [
        'pending',
        'processing',
        'approved',
        'rejected',
        'cancelled',
      ];
      const actualStatuses = Object.values(PaymentStatus);

      expect(actualStatuses).toEqual(expect.arrayContaining(expectedStatuses));
      expect(actualStatuses).toHaveLength(expectedStatuses.length);
    });

    it('should allow assignment of enum values', () => {
      let status: PaymentStatus;

      status = PaymentStatus.PENDING;
      expect(status).toBe('pending');

      status = PaymentStatus.PROCESSING;
      expect(status).toBe('processing');

      status = PaymentStatus.APPROVED;
      expect(status).toBe('approved');

      status = PaymentStatus.REJECTED;
      expect(status).toBe('rejected');

      status = PaymentStatus.CANCELLED;
      expect(status).toBe('cancelled');
    });

    it('should work in switch statements', () => {
      const getStatusMessage = (status: PaymentStatus): string => {
        switch (status) {
          case PaymentStatus.PENDING:
            return 'Pagamento pendente';
          case PaymentStatus.PROCESSING:
            return 'Pagamento em processamento';
          case PaymentStatus.APPROVED:
            return 'Pagamento aprovado';
          case PaymentStatus.REJECTED:
            return 'Pagamento rejeitado';
          case PaymentStatus.CANCELLED:
            return 'Pagamento cancelado';
          default:
            return 'Status desconhecido';
        }
      };

      expect(getStatusMessage(PaymentStatus.PENDING)).toBe(
        'Pagamento pendente',
      );
      expect(getStatusMessage(PaymentStatus.PROCESSING)).toBe(
        'Pagamento em processamento',
      );
      expect(getStatusMessage(PaymentStatus.APPROVED)).toBe(
        'Pagamento aprovado',
      );
      expect(getStatusMessage(PaymentStatus.REJECTED)).toBe(
        'Pagamento rejeitado',
      );
      expect(getStatusMessage(PaymentStatus.CANCELLED)).toBe(
        'Pagamento cancelado',
      );
    });

    it('should allow comparison with string values', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.PROCESSING).toBe('processing');
      expect(PaymentStatus.APPROVED).toBe('approved');
      expect(PaymentStatus.REJECTED).toBe('rejected');
      expect(PaymentStatus.CANCELLED).toBe('cancelled');
    });
  });
});
