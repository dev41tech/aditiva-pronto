export const onlyDigits = (s: string) => s.replace(/\D/g, '');

export function isValidCPF(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += parseInt(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 || r === 11 ? 0 : r;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export function isValidCNPJ(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (d: string, w: number[]) => {
    let s = 0;
    for (let i = 0; i < w.length; i++) s += parseInt(d[i]) * w[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return (
    calc(d, [5,4,3,2,9,8,7,6,5,4,3,2]) === parseInt(d[12]) &&
    calc(d, [6,5,4,3,2,9,8,7,6,5,4,3,2]) === parseInt(d[13])
  );
}

export function maskCPF(v: string)  { const d = onlyDigits(v).slice(0,11); return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4').replace(/-$/,''); }
export function maskCNPJ(v: string) { const d = onlyDigits(v).slice(0,14); return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,'$1.$2.$3/$4-$5').replace(/-$/,''); }
export function maskCEP(v: string)  { const d = onlyDigits(v).slice(0,8);  return d.replace(/(\d{5})(\d{0,3})/,'$1-$2').replace(/-$/,''); }
export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0,11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'');
}
