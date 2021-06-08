import { FieldConstants, parsePiece, Piece, Rotation } from '../enums';
import { FumenError } from '../errors';
import { getBlockPositions, getBlocks } from '../piece';

export class Field {
    private readonly playField: PlayField;
    private readonly sentLine: PlayField;

    private static create(length: number): PlayField {
        return new PlayField({ length });
    }

    constructor({ field = Field.create(FieldConstants.PlayBlocks), sentLine = Field.create(FieldConstants.Width) }: {
        field?: PlayField,
        sentLine?: PlayField,
    }) {
        this.playField = field;
        this.sentLine = sentLine;
    }

    add(x: number, y: number, value: number): void {
        if (0 <= y) {
            this.playField.add(x, y, value);
        } else {
            this.sentLine.add(x, -(y + 1), value);
        }
    }

    put(action: { type: Piece, rotation: Rotation, coordinate: { x: number, y: number } }): void {
        this.playField.put(action);
    }

    deleteAt(index: number): void {
        this.playField.setAt(index, Piece.Empty)
    }

    setToPlayField(index: number, value: number): void {
        this.playField.setAt(index, value);
    }

    setToSentLine(index: number, value: number): void {
        this.sentLine.setAt(index, value);
    }

    clearLine(): void {
        this.playField.clearLine();
    }

    up(): void {
        this.playField.up(this.sentLine);
        this.sentLine.clearAll();
    }

    mirror(): void {
        this.playField.mirror();
    }

    shiftToLeft(): void {
        this.playField.shiftToLeft();
    }

    shiftToRight(): void {
        this.playField.shiftToRight();
    }

    shiftToUp(): void {
        this.playField.shiftToUp();
    }

    shiftToBottom(): void {
        this.playField.shiftToBottom();
    }

    get(x: number, y: number): Piece {
        return 0 <= y ? this.playField.get(x, y) : this.sentLine.get(x, -(y + 1));
    }

    getAtIndex(index: number, isField: boolean): Piece {
        if (isField) {
            return this.get(index % 10, Math.floor(index / 10));
        }
        return this.get(index % 10, -(Math.floor(index / 10) + 1));
    }

    copy(): Field {
        return new Field({ field: this.playField.copy(), sentLine: this.sentLine.copy() });
    }

    toPlayFieldPieces(): Piece[] {
        return this.playField.toArray();
    }

    toSentLintPieces(): Piece[] {
        return this.sentLine.toArray();
    }

    equals(other: Field): boolean {
        return this.playField.equals(other.playField) && this.sentLine.equals(other.sentLine);
    }

    canPut(piece: Piece, rotation: Rotation, x: number, y: number) {
        const positions = getBlockPositions(piece, rotation, x, y);
        return positions.every(([px, py]) => {
            return 0 <= px && px < 10 && 0 <= py && this.get(px, py) === Piece.Empty;
        });
    }

    isOnGround(piece: Piece, rotation: Rotation, x: number, y: number) {
        return !this.canPut(piece, rotation, x, y - 1);
    }

    convertToGray() {
        this.playField.convertToGray();
        this.sentLine.convertToGray();
    }
}

export class PlayField {
    static load(...lines: string[]): PlayField {
        const blocks = lines.join('').trim();
        return PlayField.loadInner(blocks);
    }

    static loadMinify(...lines: string[]): PlayField {
        const blocks = lines.join('').trim();
        return PlayField.loadInner(blocks, blocks.length);
    }

    private static loadInner(blocks: string, length?: number): PlayField {
        const len = length !== undefined ? length : blocks.length;
        if (len % 10 !== 0) {
            throw new FumenError('Num of block in field should be mod 10');
        }

        const field = length !== undefined ? new PlayField({ length }) : new PlayField({});
        for (let index = 0; index < len; index += 1) {
            const block = blocks[index];
            field.set(index % 10, Math.floor((len - index - 1) / 10), parsePiece(block));
        }
        return field;
    }

    private readonly length: number;
    private pieces: Piece[];

    constructor({ pieces, length = FieldConstants.PlayBlocks }: {
        pieces?: Piece[],
        length?: number,
    }) {
        if (pieces !== undefined) {
            this.pieces = pieces;
        } else {
            this.pieces = Array.from({ length }).map(() => Piece.Empty);
        }
        this.length = length;
    }

    get(x: number, y: number): Piece {
        return this.pieces[x + y * FieldConstants.Width];
    }

    add(x: number, y: number, value: number) {
        const index = x + y * FieldConstants.Width;
        this.pieces[index] = Math.max(this.pieces[index] + value, 0);
    }

    set(x: number, y: number, piece: Piece) {
        this.setAt(x + y * FieldConstants.Width, piece);
    }

    setAt(index: number, piece: Piece) {
        this.pieces[index] = piece;
    }

    put({ type, rotation, coordinate }: { type: Piece, rotation: Rotation, coordinate: { x: number, y: number } }) {
        const blocks = getBlocks(type, rotation);
        for (const block of blocks) {
            const [x, y] = [coordinate.x + block[0], coordinate.y + block[1]];
            this.set(x, y, type);
        }
    }

    clearLine() {
        let newField = this.pieces.concat();
        const top = this.pieces.length / FieldConstants.Width - 1;
        for (let y = top; 0 <= y; y -= 1) {
            const line = this.pieces.slice(y * FieldConstants.Width, (y + 1) * FieldConstants.Width);
            const isFilled = line.every(value => value !== Piece.Empty);
            if (isFilled) {
                const bottom = newField.slice(0, y * FieldConstants.Width);
                const over = newField.slice((y + 1) * FieldConstants.Width);
                newField = bottom.concat(over, Array.from({ length: FieldConstants.Width }).map(() => Piece.Empty));
            }
        }
        this.pieces = newField;
    }

    up(blockUp: PlayField) {
        this.pieces = blockUp.pieces.concat(this.pieces).slice(0, this.length);
    }

    mirror() {
        const newField: Piece[] = [];
        for (let y = 0; y < this.pieces.length; y += 1) {
            const line = this.pieces.slice(y * FieldConstants.Width, (y + 1) * FieldConstants.Width);
            line.reverse();
            for (const obj of line) {
                newField.push(obj);
            }
        }
        this.pieces = newField;
    }

    shiftToLeft(): void {
        const height = this.pieces.length / 10;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < FieldConstants.Width - 1; x += 1) {
                this.pieces[x + y * FieldConstants.Width] = this.pieces[x + 1 + y * FieldConstants.Width];
            }
            this.pieces[9 + y * FieldConstants.Width] = Piece.Empty;
        }
    }

    shiftToRight(): void {
        const height = this.pieces.length / 10;
        for (let y = 0; y < height; y += 1) {
            for (let x = FieldConstants.Width - 1; 1 <= x; x -= 1) {
                this.pieces[x + y * FieldConstants.Width] = this.pieces[x - 1 + y * FieldConstants.Width];
            }
            this.pieces[y * FieldConstants.Width] = Piece.Empty;
        }
    }

    shiftToUp(): void {
        const blanks = Array.from({ length: 10 }).map(() => Piece.Empty);
        this.pieces = blanks.concat(this.pieces).slice(0, this.length);
    }

    shiftToBottom(): void {
        const blanks = Array.from({ length: 10 }).map(() => Piece.Empty);
        this.pieces = this.pieces.slice(10, this.length).concat(blanks);
    }

    toArray(): Piece[] {
        return this.pieces.concat();
    }

    get numOfBlocks(): number {
        return this.pieces.length;
    }

    copy(): PlayField {
        return new PlayField({ pieces: this.pieces.concat(), length: this.length });
    }

    toShallowArray() {
        return this.pieces;
    }

    clearAll() {
        this.pieces = this.pieces.map(() => Piece.Empty);
    }

    equals(other: PlayField): boolean {
        if (this.pieces.length !== other.pieces.length) {
            return false;
        }

        for (let index = 0; index < this.pieces.length; index += 1) {
            if (this.pieces[index] !== other.pieces[index]) {
                return false;
            }
        }

        return true;
    }

    convertToGray() {
        this.pieces = this.pieces.map(piece => piece !== Piece.Empty ? Piece.Gray : Piece.Empty);
    }
}
