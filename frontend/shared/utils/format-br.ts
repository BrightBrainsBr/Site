// Brazilian-format input masks shared across the portal.
// Each `mask*` function takes a raw string and returns it formatted up to the
// target shape. Each `unmask*` returns digits-only.

export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function unmaskCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCNPJLength(value: string): boolean {
  const digits = unmaskCNPJ(value)
  return digits.length === 0 || digits.length === 14
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// CNAE: 0000-0/00 (4 digits + class digit + subclass 2 digits = 7 digits total)
export function maskCNAE(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 7)
  if (d.length <= 4) return d
  if (d.length <= 5) return d.replace(/^(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{4})(\d)(\d{1,2})/, '$1-$2/$3')
}

export function isValidCNAEFormat(value: string): boolean {
  if (!value) return true
  return /^\d{4}-\d\/\d{2}$/.test(value)
}

// Simple email validation: must contain @ and a dot in the domain.
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function maskPhoneBR(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
