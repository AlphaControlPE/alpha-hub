import { registerDecorator, ValidationOptions } from 'class-validator';

// Validação real de CNPJ (dígitos verificadores) para a verificação de
// organizações (Parte III, 03.08). Antes só o tamanho era conferido, então um
// número no formato certo mas inválido (dígitos verificadores errados) entrava
// na fila de verificação. Aqui validamos de verdade e normalizamos o formato,
// tornando o índice único do documento consistente ("12.345.678/0001-90" e
// "12345678000190" passam a ser o mesmo valor armazenado).

/** Remove tudo que não for dígito. */
export function normalizarCnpj(valor: string): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Formata 14 dígitos no padrão "12.345.678/0001-90" (retorna cru se não tiver 14). */
export function formatarCnpj(valor: string): string {
  const d = normalizarCnpj(valor);
  const m = d.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
  return m ? `${m[1]}.${m[2]}.${m[3]}/${m[4]}-${m[5]}` : valor;
}

/** true se o CNPJ (com ou sem máscara) tiver 14 dígitos e verificadores válidos. */
export function cnpjValido(valor: string): boolean {
  const d = normalizarCnpj(valor);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false; // rejeita sequências repetidas (ex.: 000...)

  const digito = (base: string): number => {
    let pos = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * pos;
      pos = pos - 1 < 2 ? 9 : pos - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  if (digito(d.slice(0, 12)) !== Number(d[12])) return false;
  if (digito(d.slice(0, 13)) !== Number(d[13])) return false;
  return true;
}

/** Decorator class-validator: valida um CNPJ real. Combine com @IsOptional se opcional. */
export function ECnpj(options?: ValidationOptions) {
  return function (alvo: object, propriedade: string): void {
    registerDecorator({
      name: 'eCnpj',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: 'CNPJ inválido', ...options },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && cnpjValido(value);
        },
      },
    });
  };
}
