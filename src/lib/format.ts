export const formatarCpf = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
};

export const validarCpf = (cpf: string): boolean => {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[10])) return false;

  return true;
};

export const formatarData = (data: string): string => {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatarTelefone = (valor: string): string => {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (!digitos) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};