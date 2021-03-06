import { NextState } from './commons';
import { action, main } from '../actions';
import { FieldConstants, isInPlayField, Piece } from '../lib/enums';
import { Block, HighlightType } from '../state_types';
import { Move, Page } from '../lib/fumen/types';
import { inferPiece } from '../lib/inference';
import { generateKey } from '../lib/random';
import { getBlockPositions } from '../lib/piece';

export interface SetterActions {
    setPages: (data: { pages: Page[], open?: boolean }) => action;
    updateFumenData: (data: { value: string }) => action;
    clearFumenData: () => action;
    setComment: (data: { comment: string }) => action;
    setField: (data: {
        field: Block[],
        move?: Move,
        filledHighlight: boolean,
        inferences: number[],
        ghost: boolean,
        allowSplit: boolean,
    }) => action;
    setFieldColor: (data: { guideLineColor: boolean }) => action;
    setSentLine: (data: { sentLine: Block[] }) => action;
    setHold: (data: { hold?: Piece }) => action;
    setNext: (data: { next?: Piece[] }) => action;
}

export const setterActions: Readonly<SetterActions> = {
    setPages: ({ pages, open = true }) => (state): NextState => {
        if (pages.length < 1) {
            return undefined;
        }

        if (open) {
            setTimeout(() => {
                main.openPage({ index: 0 });
            }, 0);
        }

        return {
            fumen: {
                ...state.fumen,
                pages,
                maxPage: pages.length,
            },
        };
    },
    updateFumenData: ({ value }) => (state): NextState => {
        return {
            fumen: {
                ...state.fumen,
                value,
                errorMessage: undefined,
            },
        };
    },
    clearFumenData: () => (state): NextState => {
        return {
            fumen: {
                ...state.fumen,
                value: undefined,
                errorMessage: undefined,
            },
        };
    },
    setComment: ({ comment }) => (state): NextState => {
        const isChanged = comment !== undefined && comment !== state.comment.text;
        const text = comment !== undefined ? comment : state.comment.text;
        if (isChanged === state.comment.isChanged && text === state.comment.text) {
            return undefined;
        }

        return {
            comment: {
                isChanged,
                text,
                changeKey: generateKey(),
            },
        };
    },
    setField: (
        { field, move, filledHighlight, inferences, ghost, allowSplit },
    ) => (): NextState => {
        const drawnField: Block[] = field.concat();

        // ?????????????????????
        // ?????????????????????????????????????????????????????????????????????
        let ghostY: number | undefined = undefined;
        if (move !== undefined && ghost) {
            const piece = move.type;
            for (let pieceY = move.coordinate.y - 1; 0 <= pieceY; pieceY -= 1) {
                const positions = getBlockPositions(piece, move.rotation, move.coordinate.x, pieceY);
                const canPut = positions.every(
                    ([x, y]) => isInPlayField(x, y) && drawnField[x + y * 10].piece === Piece.Empty,
                );

                if (!canPut) {
                    break;
                }

                ghostY = pieceY;
            }
        }

        // ????????????????????????
        if (move !== undefined) {
            const piece = move.type;
            const positions = getBlockPositions(piece, move.rotation, move.coordinate.x, move.coordinate.y);
            for (const [x, y] of positions) {
                if (isInPlayField(x, y)) {
                    drawnField[x + y * 10] = { piece, highlight: HighlightType.Highlight2 };
                }
            }
        }

        if (filledHighlight) {
            // ??????????????????????????????
            for (let y = 0; y < FieldConstants.Height + FieldConstants.SentLine; y += 1) {
                const [start, end] = [y * FieldConstants.Width, (y + 1) * FieldConstants.Width];
                const line = drawnField.slice(start, end);
                const filled = line.every(block => block.piece !== Piece.Empty);
                if (filled) {
                    for (let index = start; index < end; index += 1) {
                        const currentBlock = drawnField[index];
                        if (currentBlock !== undefined) {
                            const highlight = currentBlock.highlight;
                            drawnField[index].highlight = (
                                highlight !== undefined && HighlightType.Highlight1 < highlight
                                    ? highlight
                                    : HighlightType.Highlight1
                            );
                        } else {
                            drawnField[index] = { ...field[index] };
                        }
                    }
                }
            }
        }

        // ?????????????????????
        if (move !== undefined && ghostY !== undefined) {
            const piece = move.type;
            const positions = getBlockPositions(piece, move.rotation, move.coordinate.x, ghostY);

            for (const [x, y] of positions) {
                const currentBlock = drawnField[x + y * 10];
                if (currentBlock === undefined || currentBlock.piece === Piece.Empty) {
                    drawnField[x + y * 10] = { piece, highlight: HighlightType.Lighter };
                }
            }
        }

        let piece = undefined;
        const inferredResult = inferPiece(inferences);
        if (inferredResult) {
            if (inferredResult.coordinate) {
                // ???????????????
                piece = inferredResult.piece;
            } else if (!inferredResult.coordinate && allowSplit) {
                // ?????????????????????????????????????????? ?????? ????????????????????????????????????
                piece = inferredResult.piece;
            }
        }

        if (piece) {
            // InferencePiece????????????????????????
            for (const inference of inferences) {
                drawnField[inference] = {
                    ...field[inference],
                    piece,
                    highlight: HighlightType.Highlight2,
                };
            }
        } else {
            // InferencePiece???????????????????????????
            for (const inference of inferences) {
                drawnField[inference] = {
                    ...field[inference],
                    piece: 'inference',
                    highlight: HighlightType.Highlight2,
                };
            }
        }

        return { field: drawnField };
    },
    setFieldColor: ({ guideLineColor }) => (state): NextState => {
        return {
            fumen: {
                ...state.fumen,
                guideLineColor,
            },
        };
    },
    setSentLine: ({ sentLine }) => (): NextState => {
        return { sentLine };
    },
    setHold: ({ hold }) => (): NextState => {
        return { hold };
    },
    setNext: ({ next }) => (): NextState => {
        return { nexts: next };
    },
};
