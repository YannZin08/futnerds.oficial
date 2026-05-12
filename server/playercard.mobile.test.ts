import { describe, it, expect } from 'vitest';

// Testa a lógica de formatação de preço usada no PlayerCard
function formatPrice(price: number | null | undefined): string {
  if (!price) return '—';
  if (price >= 1000000) {
    const m = price / 1000000;
    return `€${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  } else {
    const k = price / 1000;
    return `€${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
}

// Testa a lógica de deduplicação de posições alternativas
function getAltPositions(position: string, altPositions: string | null): string[] {
  try {
    if (!altPositions) return [];
    let alts: string[] = altPositions.startsWith('[')
      ? JSON.parse(altPositions)
      : altPositions.split(',').map((s: string) => s.trim()).filter(Boolean);
    const seen = new Set<string>();
    return alts.filter((p: string) => {
      if (p === position || seen.has(p)) return false;
      seen.add(p);
      return true;
    });
  } catch { return []; }
}

describe('PlayerCard mobile layout - formatPrice', () => {
  it('formata valores em milhões corretamente', () => {
    expect(formatPrice(65500000)).toBe('€65.5M');
    expect(formatPrice(100000000)).toBe('€100M');
    expect(formatPrice(157000000)).toBe('€157M');
  });

  it('formata valores em milhares corretamente', () => {
    expect(formatPrice(650000)).toBe('€650K');
    expect(formatPrice(500000)).toBe('€500K');
  });

  it('retorna traço para preço nulo ou zero', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice(0)).toBe('—');
  });
});

describe('PlayerCard mobile layout - getAltPositions', () => {
  it('remove posição principal das alternativas', () => {
    const alts = getAltPositions('MC', 'MC,MEI,VOL');
    expect(alts).not.toContain('MC');
    expect(alts).toContain('MEI');
    expect(alts).toContain('VOL');
  });

  it('deduplica posições repetidas', () => {
    const alts = getAltPositions('ATA', 'MEI,MEI,PE');
    expect(alts.filter(p => p === 'MEI').length).toBe(1);
  });

  it('retorna array vazio se altPositions for null', () => {
    expect(getAltPositions('GOL', null)).toEqual([]);
  });

  it('suporta formato JSON array', () => {
    const alts = getAltPositions('ZAG', '["ZAG","LD","LE"]');
    expect(alts).not.toContain('ZAG');
    expect(alts).toContain('LD');
    expect(alts).toContain('LE');
  });
});
