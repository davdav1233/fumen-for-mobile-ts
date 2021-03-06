import { FieldConstants, isMinoPiece, Piece, Rotation } from '../enums';
import { Quiz } from './quiz';
import { Field } from './field';
import { decodeAction, encodeAction } from './action';
import { ENCODE_TABLE_LENGTH, Values } from './values';
import { FumenError } from '../errors';
import { Pages } from '../pages';
import { Move, Page, PreCommand } from './types';

const COMMENT_TABLE =
    ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
const MAX_COMMENT_CHAR_VALUE = COMMENT_TABLE.length + 1;

function decodeToCommentChars(v: number): string[] {
    const array: string[] = [];
    let value = v;
    for (let count = 0; count < 4; count += 1) {
        const index = value % MAX_COMMENT_CHAR_VALUE;
        array.push(COMMENT_TABLE[index]);
        value = Math.floor(value / MAX_COMMENT_CHAR_VALUE);
    }
    return array;
}

function enodeFromCommentChars(ch: string): number {
    return COMMENT_TABLE.indexOf(ch);
}

const FIELD_WIDTH = FieldConstants.Width;

export function extract(str: string): { version: '115' | '110', data: string } {
    const format = (version: '115' | '110', data: string) => {
        const trim = data.trim().replace(/[?\s]+/g, '');
        return { version, data: trim };
    };

    let data = str;

    // url parameters
    const paramIndex = data.indexOf('&');
    if (0 <= paramIndex) {
        data = data.substring(0, paramIndex);
    }

    // v115@~
    {
        const match = str.match(/[vmd]115@/);
        if (match !== undefined && match !== null && match.index !== undefined) {
            const sub = data.substr(match.index + 5);
            return format('115', sub);
        }
    }

    // v110@~
    {
        const match = str.match(/[vmd]110@/);
        if (match !== undefined && match !== null && match.index !== undefined) {
            const sub = data.substr(match.index + 5);
            return format('110', sub);
        }
    }

    throw new FumenError('Fumen is not supported');
}

type Callback = (field: Field, move: Move | undefined, comment: string) => void;

export async function decode(fumen: string, callback: Callback = () => {
}): Promise<Page[]> {
    const { version, data } = extract(fumen);
    switch (version) {
    case '115':
        return innerDecode(data, 23, callback);
    case '110':
        return innerDecode(data, 21, callback);
    }
}

export async function innerDecode(
    fumen: string,
    fieldTop: number,
    callback: Callback = () => {
    },
): Promise<Page[]> {
    const FIELD_MAX_HEIGHT = fieldTop + FieldConstants.SentLine;
    const FIELD_BLOCKS = FIELD_MAX_HEIGHT * FIELD_WIDTH;

    const updateField = (prev: Field) => {
        const result = {
            changed: false,
            field: prev,
        };

        let index = 0;
        while (index < FIELD_BLOCKS) {
            const diffBlock = values.poll(2);
            const diff = Math.floor(diffBlock / FIELD_BLOCKS);

            const numOfBlocks = diffBlock % FIELD_BLOCKS;

            if (numOfBlocks !== FIELD_BLOCKS - 1) {
                result.changed = true;
            }

            for (let block = 0; block < numOfBlocks + 1; block += 1) {
                const x = index % FIELD_WIDTH;
                const y = fieldTop - Math.floor(index / FIELD_WIDTH) - 1;
                result.field.add(x, y, diff - 8);
                index += 1;
            }
        }

        return result;
    };

    let pageIndex = 0;
    const values = new Values(fumen);
    let prevField = new Field({});

    const store: {
        repeatCount: number,
        refIndex: {
            comment: number,
            field: number,
        };
        quiz?: Quiz,
        lastCommentText: string;
    } = {
        repeatCount: -1,
        refIndex: {
            comment: 0,
            field: 0,
        },
        quiz: undefined,
        lastCommentText: '',
    };

    const pages: Page[] = [];

    while (!values.isEmpty()) {
        // Parse field
        let currentFieldObj;
        if (0 < store.repeatCount) {
            currentFieldObj = {
                field: prevField,
                changed: false,
            };

            store.repeatCount -= 1;
        } else {
            currentFieldObj = updateField(prevField.copy());

            if (!currentFieldObj.changed) {
                store.repeatCount = values.poll(1);
            }
        }

        // Parse action
        const actionValue = values.poll(3);
        const action = decodeAction(actionValue, fieldTop);

        // Parse comment
        let comment;
        if (action.comment) {
            // ????????????????????????????????????
            const commentValues: number[] = [];
            const commentLength = values.poll(2);

            for (let commentCounter = 0; commentCounter < Math.floor((commentLength + 3) / 4); commentCounter += 1) {
                const commentValue = values.poll(5);
                commentValues.push(commentValue);
            }

            const flatten: string[] = [];
            for (const value of commentValues) {
                const chars = decodeToCommentChars(value);
                flatten.push(...chars);
            }

            const commentText = unescape(flatten.slice(0, commentLength).join(''));
            store.lastCommentText = commentText;
            comment = { text: commentText };
            store.refIndex.comment = pageIndex;

            const text = comment.text;
            if (Quiz.isQuizComment(text)) {
                try {
                    store.quiz = new Quiz(text);
                } catch (e) {
                    store.quiz = undefined;
                }
            } else {
                store.quiz = undefined;
            }
        } else if (pageIndex === 0) {
            // ???????????????????????????????????????????????????????????????
            comment = { text: '' };
        } else {
            // ????????????????????????????????????
            comment = { ref: store.refIndex.comment };
        }

        // Quiz??????????????????????????????????????????????????????Quiz???1????????????
        let quiz = false;
        if (store.quiz !== undefined) {
            quiz = true;

            if (store.quiz.canOperate() && action.lock) {
                if (isMinoPiece(action.piece.type)) {
                    try {
                        const nextQuiz = store.quiz.nextIfEnd();
                        const operation = nextQuiz.getOperation(action.piece.type);
                        store.quiz = nextQuiz.operate(operation);
                    } catch (e) {
                        console.error(e.message);

                        // Not operate
                        store.quiz = store.quiz.format();
                    }
                } else {
                    store.quiz = store.quiz.format();
                }
            }
        }

        // ?????????????????????????????????
        let currentPiece: {
            type: Piece;
            rotation: Rotation;
            coordinate: {
                x: number,
                y: number,
            };
        } | undefined;
        if (action.piece.type !== Piece.Empty) {
            currentPiece = action.piece;
        }

        // page?????????
        let field;
        if (currentFieldObj.changed || pageIndex === 0) {
            // ??????????????????????????????????????????
            // ??????????????????????????????????????????????????????????????????????????????
            field = { obj: currentFieldObj.field.copy() };
            store.refIndex.field = pageIndex;
        } else {
            // ???????????????????????????????????????
            field = { ref: store.refIndex.field };
        }

        const page = {
            field,
            comment,
            index: pageIndex,
            piece: currentPiece,
            flags: {
                quiz,
                lock: action.lock,
                mirror: action.mirror,
                colorize: action.colorize,
                rise: action.rise,
            },
        };
        pages.push(page);

        callback(
            currentFieldObj.field.copy()
            , currentPiece
            , store.quiz !== undefined ? store.quiz.format().toString() : store.lastCommentText,
        );

        pageIndex += 1;

        if (action.lock) {
            if (isMinoPiece(action.piece.type)) {
                currentFieldObj.field.put(action.piece);
            }

            currentFieldObj.field.clearLine();

            if (action.rise) {
                currentFieldObj.field.up();
            }

            if (action.mirror) {
                currentFieldObj.field.mirror();
            }
        }

        prevField = currentFieldObj.field;
    }

    return pages;
}

export async function encode(inputPages: Page[], isAsync: boolean = false): Promise<string> {
    const updateField = (prev: Field, current: Field) => {
        const { changed, values } = encodeField(prev, current);

        if (changed) {
            // ????????????????????????????????????????????????????????????
            allValues.merge(values);
            lastRepeatIndex = -1;
        } else if (lastRepeatIndex < 0 || allValues.get(lastRepeatIndex) === ENCODE_TABLE_LENGTH - 1) {
            // ????????????????????????????????????????????????????????????
            allValues.merge(values);
            allValues.push(0);
            lastRepeatIndex = allValues.length - 1;
        } else if (allValues.get(lastRepeatIndex) < (ENCODE_TABLE_LENGTH - 1)) {
            // ?????????????????????????????????????????????????????????
            const currentRepeatValue = allValues.get(lastRepeatIndex);
            allValues.set(lastRepeatIndex, currentRepeatValue + 1);
        }
    };

    let lastRepeatIndex = -1;
    const allValues = new Values();
    let prevField = new Field({});

    const pages = new Pages(inputPages);

    const innerEncode = (index: number) => {
        const field = pages.getField(index);

        const currentPage = inputPages[index];
        const currentField = field !== undefined ? field.copy() : prevField.copy();

        // ?????????????????????
        const commands = currentPage.commands;
        if (commands !== undefined) {
            Object.keys(commands.pre)
                .map(key => commands.pre[key])
                .forEach((command: PreCommand) => {
                    switch (command.type) {
                    case 'block': {
                        const { x, y, piece } = command;
                        currentField.setToPlayField(x + y * 10, piece);
                        return;
                    }
                    case 'sentBlock': {
                        const { x, y, piece } = command;
                        currentField.setToSentLine(x + y * 10, piece);
                        return;
                    }
                    }
                });
        }

        // ????????????????????????
        updateField(prevField, currentField);

        // ????????????????????????
        const isComment = currentPage.comment.text !== undefined && (index !== 0 || currentPage.comment.text !== '');
        const piece = currentPage.piece !== undefined ? currentPage.piece : {
            type: Piece.Empty,
            rotation: Rotation.Reverse,
            coordinate: {
                x: 0,
                y: 22,
            },
        };
        const action = {
            piece,
            rise: currentPage.flags.rise,
            mirror: currentPage.flags.mirror,
            colorize: currentPage.flags.colorize,
            lock: currentPage.flags.lock,
            comment: isComment,
        };

        const actionNumber = encodeAction(action);
        allValues.push(actionNumber, 3);

        // ?????????????????????
        if (currentPage.comment.text !== undefined && isComment) {
            const comment = escape(currentPage.comment.text);
            const commentLength = Math.min(comment.length, 4095);

            allValues.push(commentLength, 2);

            // ????????????????????????
            for (let index = 0; index < commentLength; index += 4) {
                let value = 0;
                for (let count = 0; count < 4; count += 1) {
                    const newIndex = index + count;
                    if (commentLength <= newIndex) {
                        break;
                    }
                    const ch = comment.charAt(newIndex);
                    value += enodeFromCommentChars(ch) * Math.pow(MAX_COMMENT_CHAR_VALUE, count);
                }

                allValues.push(value, 5);
            }
        }

        // ???????????????
        if (action.lock) {
            if (isMinoPiece(action.piece.type)) {
                currentField.put(action.piece);
            }

            currentField.clearLine();

            if (action.rise) {
                currentField.up();
            }

            if (action.mirror) {
                currentField.mirror();
            }
        }

        prevField = currentField;
    };

    const innerEncodeAsync = async (index: number) => {
        innerEncode(index);
    };

    for (let index = 0; index < inputPages.length; index += 1) {
        if (isAsync) {
            await innerEncodeAsync(index);
        } else {
            innerEncode(index);
        }
    }

    // ???????????????????????????????????????????????????
    // 47??????????????????????????????????????????????????????????v115@???????????????????????????????42??????????????????
    const data = allValues.toString();
    if (data.length < 41) {
        return data;
    }

    // ????????????????
    const head = [data.substr(0, 42)];
    const tails = data.substring(42);
    const split = tails.match(/[\S]{1,47}/g) || [];
    return head.concat(split).join('?');
}

// ???????????????????????????????????????
// ???????????????????????????????????????????????????????????????????????????
// ?????????????????????????????????23, ??????10
function encodeField(prev: Field, current: Field) {
    const FIELD_TOP = 23;
    const FIELD_MAX_HEIGHT = FIELD_TOP + 1;
    const FIELD_BLOCKS = FIELD_MAX_HEIGHT * FIELD_WIDTH;

    const values = new Values();

    // ???????????????????????????????????????: 0???16
    const getDiff = (xIndex: number, yIndex: number) => {
        const y: number = FIELD_TOP - yIndex - 1;
        return current.get(xIndex, y) - prev.get(xIndex, y) + 8;
    };

    // ??????????????????
    const recordBlockCounts = (diff: number, counter: number) => {
        const value: number = diff * FIELD_BLOCKS + counter;
        values.push(value, 2);
    };

    // ????????????????????????????????????????????????????????????
    let changed = false;
    let prev_diff = getDiff(0, 0);
    let counter = -1;
    for (let yIndex = 0; yIndex < FIELD_MAX_HEIGHT; yIndex += 1) {
        for (let xIndex = 0; xIndex < FIELD_WIDTH; xIndex += 1) {
            const diff = getDiff(xIndex, yIndex);
            if (diff !== prev_diff) {
                recordBlockCounts(prev_diff, counter);
                counter = 0;
                prev_diff = diff;
                changed = true;
            } else {
                counter += 1;
            }
        }
    }

    // ????????????????????????????????????
    recordBlockCounts(prev_diff, counter);

    return {
        values,
        changed,
    };
}
