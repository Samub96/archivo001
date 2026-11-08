import type { PuzzleDefinition, PuzzleId } from '../types'

/**
 * The eight protocols. Answers, fragments, copy and hints are literal from
 * SOFTWARE DESIGN DOCUMENT (SDD) §6 — do not rewrite.
 */
export const PUZZLES: PuzzleDefinition[] = [
  {
    id: 'caesar',
    order: 1,
    protocol: 'CAESAR CIPHER',
    description: 'Descifrar un mensaje mediante desplazamiento César.',
    instructions: 'Recupera el mensaje original y escríbelo en el campo de respuesta.',
    content: `El sistema desplazó cada letra
tres posiciones hacia adelante.

Mensaje interceptado:

HQWUH

Recupera el mensaje original.`,
    fragment: 'ENTRE',
    answer: 'ENTRE',
    hints: [
      'Es un cifrado de sustitución.',
      'Debes retroceder tres posiciones en el alfabeto.',
      'H → E, Q → N, W → T.',
    ],
  },
  {
    id: 'binary',
    order: 2,
    protocol: 'BINARY / ASCII',
    description: 'Convertir código binario a ASCII.',
    instructions: 'Cada grupo es un carácter. Reconstruye la palabra.',
    content: `01001101
01001001
01001100
01001100
01001111
01001110
01000101
01010011`,
    fragment: 'MILLONES',
    answer: 'MILLONES',
    hints: [
      'Cada grupo representa un carácter.',
      'Convierte cada byte a decimal.',
      'Utiliza la tabla ASCII.',
    ],
  },
  {
    id: 'logic-gates',
    order: 3,
    protocol: 'LOGIC GATES',
    description: 'Electrónica digital.',
    instructions:
      'Evalúa cada compuerta y forma los dos bytes resultantes. Convierte cada byte a ASCII.',
    content: `A = 1    B = 0    C = 1

BYTE 1:

A AND B
A XOR B
B OR NOT A
A AND B
B OR NOT A
A AND C
A AND B
A AND B

BYTE 2:

A AND B
A XOR B
B OR NOT A
A AND B
B OR NOT A
A AND C
A AND B
A AND C`,
    fragment: 'DE',
    answer: 'DE',
    hints: [
      'Evalúa cada compuerta independientemente.',
      'NOT A = 0; AND requiere dos unos; XOR devuelve uno cuando las entradas son diferentes.',
      'Los resultados deben convertirse a ASCII.',
    ],
  },
  {
    id: 'pattern',
    order: 4,
    protocol: 'MATH PATTERN',
    description: 'Matemáticas y lógica.',
    instructions:
      'Encuentra el siguiente término de la secuencia, calcula su raíz cuadrada y usa ese número como índice de extracción sobre las diez filas.',
    content: `1 - 4 - 9 - 16 - 25 - ?

Encuentra el siguiente término.

Calcula su raíz cuadrada.

El resultado representa el índice
de extracción.

Extrae la sexta letra de cada fila:

QWERTC
ASDFGO
ZXCVBN
PLMKJE
GHJKLX
TYUIOI
MNBVCO
LKJHGN
POIUYE
QAZWES`,
    fragment: 'CONEXIONES',
    answer: 'CONEXIONES',
    hints: [
      'Los números son cuadrados perfectos.',
      'El siguiente término es 36.',
      'Su raíz cuadrada es 6. Selecciona la sexta letra.',
    ],
  },
  {
    id: 'routing',
    order: 5,
    protocol: 'NETWORK ROUTING',
    description: 'Encontrar la ruta de menor costo.',
    instructions:
      'Selecciona la ruta de menor costo entre S y FIN. El costo acumulado se muestra en cada enlace.',
    content: `S → I       2
I → E1      2
E1 → M      2
M → P       2
P → R       2
R → E2      2
E2 → FIN    1

S → A       1
A → M       8
I → B       1
B → P       8
E1 → C      1
C → R       8
P → D       1
D → E2      8`,
    fragment: 'SIEMPRE',
    answer: 'SIEMPRE',
    interaction: 'route',
    hints: [
      'Busca minimizar el costo total.',
      'Puedes utilizar Dijkstra.',
      'La ruta correcta tiene costo 13.',
    ],
  },
  {
    id: 'morse',
    order: 6,
    protocol: 'MORSE CODE',
    description: 'Telecomunicaciones.',
    instructions: 'Traduce los grupos de puntos y rayas a letras.',
    content: `. / .-.. / . / --. / .. /
.-. / .. / .-`,
    fragment: 'ELEGIRÍA',
    answer: 'ELEGIRIA',
    hints: [
      'Cada grupo representa una letra.',
      'Los puntos y rayas corresponden al alfabeto Morse.',
      'El mensaje es ELEGIRIA.',
    ],
  },
  {
    id: 'polybius',
    order: 7,
    protocol: 'POLYBIUS SQUARE',
    description: 'Criptografía.',
    instructions: 'Cada coordenada es fila-columna. Recupera las dos letras.',
    content: `      1  2  3  4  5

1     A  B  C  D  E
2     F  G  H  I  K
3     L  M  N  O  P
4     Q  R  S  T  U
5     V  W  X  Y  Z

Coordenadas:

31 - 11`,
    fragment: 'LA',
    answer: 'LA',
    hints: [
      'Cada número representa una coordenada.',
      'El primer número es la fila.',
      '31 = L y 11 = A.',
    ],
  },
  {
    id: 'vigenere',
    order: 8,
    protocol: 'VIGENERE CIPHER',
    description: 'Descifrar un mensaje utilizando una clave recuperada anteriormente.',
    instructions: 'La clave está en los nodos rojos del protocolo de enrutamiento.',
    content: `Última transmisión:

EYHJXUR

La clave está escondida
en los nodos rojos del
protocolo de enrutamiento.

Ordénalos según su numeración.

Descifra el mensaje.`,
    fragment: 'NUESTRA',
    answer: 'NUESTRA',
    hints: [
      'Recupera la información de la topología.',
      'Ordena los nodos R, E y D.',
      'Descifra el texto utilizando Vigenère y la clave RED.',
    ],
  },
]

export const PUZZLE_IDS: PuzzleId[] = PUZZLES.map((puzzle) => puzzle.id)

export const TOTAL_PUZZLES = PUZZLES.length

export const byOrder = (a: PuzzleDefinition, b: PuzzleDefinition) => a.order - b.order

export const puzzleById = (id: PuzzleId): PuzzleDefinition => {
  const found = PUZZLES.find((puzzle) => puzzle.id === id)
  if (!found) throw new Error(`Unknown puzzle: ${id}`)
  return found
}

export const canonicalOrder = (): PuzzleId[] => [...PUZZLE_IDS]
