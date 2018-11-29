import { NextState, sequence } from './commons';
import { action, actions, main } from '../actions';
import { CommentType, ModeTypes, Piece, Screens, TouchTypes } from '../lib/enums';
import { resources, State } from '../states';
import { animationActions } from './animation';

export interface ScreenActions {
    changeToReaderScreen: () => action;
    changeToDrawerScreen: () => action;
    changeToDrawingMode: () => action;
    changeToDrawingToolMode: () => action;
    changeToFlagsMode: () => action;
    changeToShiftMode: () => action;
    changeToFillRowMode: () => action;
    changeToDrawPieceMode: () => action;
    changeToMovePieceMode: () => action;
    changeScreen: (data: { screen: Screens }) => action;
    changeCommentMode: (data: { type: CommentType }) => action;
}

export const modeActions: Readonly<ScreenActions> = {
    changeToReaderScreen: () => (state): NextState => {
        resources.konva.stage.reload((done) => {
            main.changeScreen({ screen: Screens.Reader });
            done();
        });
        return sequence(state, [
            actions.fixInferencePiece(),
            actions.resetInferencePiece(),
        ]);
    },
    changeToDrawerScreen: () => (state): NextState => {
        resources.konva.stage.reload((done) => {
            main.changeScreen({ screen: Screens.Editor });
            done();
        });
        return sequence(state, [
            animationActions.pauseAnimation(),
        ]);
    },
    changeToDrawingMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.Drawing }),
            changeModeType({ type: ModeTypes.Drawing }),
        ]);
    },
    changeToDrawingToolMode: () => (state): NextState => {
        return sequence(state, [
            changeModeType({ type: ModeTypes.DrawingTool }),
        ]);
    },
    changeToFlagsMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.Drawing }),
            changeModeType({ type: ModeTypes.Flags }),
        ]);
    },
    changeToShiftMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.None }),
            changeModeType({ type: ModeTypes.Slide }),
        ]);
    },
    changeToFillRowMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.FillRow }),
            changeModeType({ type: ModeTypes.Fill }),
            newState => ({
                mode: {
                    ...newState.mode,
                    piece: newState.mode.piece !== undefined ? newState.mode.piece : Piece.Gray,
                },
            }),
        ]);
    },
    changeToDrawPieceMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.Piece }),
            changeModeType({ type: ModeTypes.Piece }),
        ]);
    },
    changeToMovePieceMode: () => (state): NextState => {
        return sequence(state, [
            changeTouchType({ type: TouchTypes.MovePiece }),
            changeModeType({ type: ModeTypes.Piece }),
        ]);
    },
    changeScreen: ({ screen }) => (state): NextState => {
        return {
            mode: {
                ...state.mode,
                screen,
            },
        };
    },
    changeCommentMode: ({ type }) => (state): NextState => {
        return {
            mode: {
                ...state.mode,
                comment: type,
            },
        };
    },
};

const changeTouchType = ({ type }: { type: TouchTypes }) => (state: State): NextState => {
    if (state.mode.touch === type) {
        return undefined;
    }

    return sequence(state, [
        actions.fixInferencePiece(),
        actions.resetInferencePiece(),
        () => ({
            mode: {
                ...state.mode,
                touch: type,
            },
        }),
    ]);
};

const changeModeType = ({ type }: { type: ModeTypes }) => (state: State): NextState => {
    if (state.mode.type === type) {
        return undefined;
    }

    return {
        mode: {
            ...state.mode,
            type,
        },
    };
};
