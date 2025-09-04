// lib/calc/nesting.ts

/**
 * Representa una pieza de material a cortar.
 * @param id Identificador único de la pieza.
 * @param length Longitud requerida de la pieza.
 */
export interface Piece {
  id: string;
  length: number;
}

/**
 * Representa una barra o placa de material de la cual se cortarán las piezas.
 * @param stockLength Longitud original de la barra/placa.
 * @param pieces Un array de las piezas que se cortaron de esta barra.
 * @param waste La cantidad de material sobrante después de cortar.
 */
export interface UsedStock {
  stockLength: number;
  pieces: Piece[];
  waste: number;
}

/**
 * Algoritmo de optimización de cortes "First Fit Decreasing".
 * Ordena las piezas de mayor a menor y las va colocando en la primera barra que tenga espacio.
 *
 * @param piecesToCut Array de objetos `Piece` que necesitan ser cortados.
 * @param stockLength La longitud de las barras de material disponibles en stock.
 * @returns Un array de objetos `UsedStock` que representa cómo se deben cortar las barras.
 */
export function optimizeCuts(piecesToCut: Piece[], stockLength: number): UsedStock[] {
  // 1. Ordenar las piezas a cortar de la más larga a la más corta.
  const sortedPieces = [...piecesToCut].sort((a, b) => b.length - a.length);

  const usedStocks: UsedStock[] = [];

  // 2. Iterar sobre cada pieza que necesitamos cortar.
  for (const piece of sortedPieces) {
    let placed = false;

    // 3. Buscar en las barras ya utilizadas si hay espacio para esta pieza.
    for (const stock of usedStocks) {
      const currentLength = stock.pieces.reduce((sum, p) => sum + p.length, 0);
      if (stock.stockLength - currentLength >= piece.length) {
        stock.pieces.push(piece);
        placed = true;
        break; // Salir del bucle una vez que se coloca la pieza.
      }
    }

    // 4. Si no se encontró lugar en las barras existentes, abrir una nueva.
    if (!placed) {
      if (piece.length > stockLength) {
        console.warn(`La pieza ${piece.id} (${piece.length}m) es más larga que el stock disponible (${stockLength}m) y no puede ser cortada.`);
        continue; // Omitir esta pieza si es imposible de cortar
      }
      usedStocks.push({
        stockLength,
        pieces: [piece],
        waste: 0 // El desperdicio se calculará al final
      });
    }
  }

  // 5. Calcular el desperdicio final para cada barra utilizada.
  for (const stock of usedStocks) {
    const totalPieceLength = stock.pieces.reduce((sum, p) => sum + p.length, 0);
    stock.waste = parseFloat((stock.stockLength - totalPieceLength).toFixed(2));
  }

  return usedStocks;
}