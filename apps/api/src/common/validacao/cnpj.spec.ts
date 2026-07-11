import { cnpjValido, formatarCnpj, normalizarCnpj } from './cnpj';

describe('validação de CNPJ', () => {
  describe('cnpjValido', () => {
    it('aceita CNPJ válido com e sem máscara', () => {
      expect(cnpjValido('11.222.333/0001-81')).toBe(true);
      expect(cnpjValido('11222333000181')).toBe(true);
    });

    it('rejeita dígito verificador errado', () => {
      expect(cnpjValido('11.222.333/0001-82')).toBe(false);
      expect(cnpjValido('11222333000180')).toBe(false);
    });

    it('rejeita sequências repetidas', () => {
      expect(cnpjValido('00000000000000')).toBe(false);
      expect(cnpjValido('11111111111111')).toBe(false);
    });

    it('rejeita tamanho errado e lixo', () => {
      expect(cnpjValido('123')).toBe(false);
      expect(cnpjValido('')).toBe(false);
      expect(cnpjValido('112223330001811')).toBe(false); // 15 dígitos
      expect(cnpjValido('abc.def.ghi/jklm-no')).toBe(false);
    });
  });

  describe('normalizarCnpj', () => {
    it('mantém só os dígitos', () => {
      expect(normalizarCnpj('11.222.333/0001-81')).toBe('11222333000181');
      expect(normalizarCnpj(' 11 222 333 0001 81 ')).toBe('11222333000181');
    });
  });

  describe('formatarCnpj', () => {
    it('formata 14 dígitos no padrão brasileiro', () => {
      expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
      // idempotente sobre um valor já formatado
      expect(formatarCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81');
    });
  });
});
