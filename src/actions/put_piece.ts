import { State } from '../states';
import { getBlockPositions, Piece, toPositionIndex } from '../lib/enums';
import { action, actions } from '../actions';
import { NextState, sequence } from './commons';
import { toPrimitivePage, toSinglePageTask } from '../history_task';
import { fieldEditorActions } from './field_editor';
import { inferPiece } from '../lib/inference';

export interface PutPieceActions {
    fixInferencePiece(): action;

    clearInferencePiece(): action;

    resetInferencePiece(): action;

    ontouchStartField(data: { index: number }): action;

    ontouchMoveField(data: { index: number }): action;

    ontouchEnd(): action;
}

export const putPieceActions: Readonly<PutPieceActions> = {
    fixInferencePiece: () => (state): NextState => {
        const inferences = state.events.inferences;
        if (inferences.length < 4) {
            return undefined;
        }

        // InferencePieceが揃っているとき
        let piece;
        try {
            piece = inferPiece(inferences);
        } catch (e) {
            return undefined;
        }

        const currentPageIndex = state.fumen.currentIndex;
        const pages = state.fumen.pages;
        const page = pages[currentPageIndex];
        const prevPage = toPrimitivePage(page);

        page.piece = {
            type: piece.piece,
            rotation: piece.rotate,
            coordinate: piece.coordinate,
        };

        // 4つ以上あるとき
        return sequence(state, [
            fieldEditorActions.resetInferencePiece(),
            actions.saveToMemento(),
            actions.registerHistoryTask({ task: toSinglePageTask(currentPageIndex, prevPage, page) }),
        ]);
    },
    clearInferencePiece: () => (state): NextState => {
        return sequence(state, [
            () => ({
                events: {
                    ...state.events,
                    inferences: [],
                },
            }),
        ]);
    },
    resetInferencePiece: () => (state): NextState => {
        return sequence(state, [
            fieldEditorActions.clearInferencePiece(),
            actions.openPage({ index: state.fumen.currentIndex }),
        ]);
    },
    ontouchStartField: ({ index }) => (state): NextState => {
        const pages = state.fumen.pages;
        const page = pages[state.fumen.currentIndex];
        const piece = page.piece;

        return sequence(state, [
            piece !== undefined ? (newState) => {
                const blocks = getBlockPositions(piece.type, piece.rotation, piece.coordinate.x, piece.coordinate.y);
                const indexes = blocks.map(toPositionIndex);
                page.piece = undefined;
                return {
                    fumen: {
                        ...newState.fumen,
                        pages,
                    },
                    events: {
                        ...newState.events,
                        inferences: indexes,
                    },
                };
            } : undefined,
            newState => ({
                events: {
                    ...newState.events,
                    touch: {
                        piece: newState.events.inferences.find(e => e === index) === undefined
                            ? Piece.Gray
                            : Piece.Empty,
                    },
                    updated: false,
                },
            }),
            actions.ontouchMoveField({ index }),
        ]);
    },
    ontouchMoveField: ({ index }) => (state): NextState => {
        const piece = state.events.touch.piece;
        if (piece === undefined) {
            return undefined;
        }

        const page = state.fumen.pages[state.fumen.currentIndex];
        if (page === undefined) {
            return undefined;
        }

        if (page.piece !== undefined) {
            return undefined;
        }

        // 追加
        const inferences = state.events.inferences;
        if (piece !== Piece.Empty) {
            // 4つ以上あるとき
            if (4 <= inferences.length) {
                return undefined;
            }

            // すでに表示上にブロックがある
            if (state.field[index].piece !== Piece.Empty) {
                return undefined;
            }

            // まだ存在しないとき
            if (inferences.find(e => e === index) === undefined) {
                const nextInterences = state.events.inferences.concat([index]);
                return sequence(state, [
                    () => ({
                        events: {
                            ...state.events,
                            inferences: nextInterences,
                            updated: true,
                        },
                    }),
                    actions.openPage({ index: state.fumen.currentIndex }),
                ]);
            }
        }

        // 削除
        if (piece === Piece.Empty) {
            return sequence(state, [
                () => ({
                    events: {
                        ...state.events,
                        inferences: state.events.inferences.filter(e => e !== index),
                        updated: true,
                    },
                }),
                actions.openPage({ index: state.fumen.currentIndex }),
            ]);
        }

        return undefined;
    },
    ontouchEnd: () => (state): NextState => {
        return sequence(state, [
            putPieceActions.fixInferencePiece(),
            endDrawingField,
        ]);
    },
};

const endDrawingField = (state: State): NextState => {
    return {
        events: {
            ...state.events,
            touch: { piece: undefined },
            prevPage: undefined,
            updated: false,
        },
    };
};