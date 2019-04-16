import * as os from 'os';
import * as path from 'path';
import { TextEditor, Uri, ViewColumn, window, commands } from 'vscode';


/**
 * Get the temporary file path.
 *
 * @export
 * @returns
 */
export function getTempFilePath() {
    const tmpFilePath = path.join(os.tmpdir(), 'json-to-reactive-form.ts');
    return tmpFilePath;
}


/**
 * Show the error message.
 *
 * @export
 * @param {Error} error
 */
export function showErrorMessage(error: Error) {
    window.showErrorMessage(error.message);
}


/**
 * Check whether the JSON is valid.
 *
 * @export
 * @param {string} json
 * @returns
 */
export function jsonIsValid(json: string) {
    try {
        JSON.parse(json);
    } catch (e) {
        return false;
    }
    return true;
}


/**
 * Get the selected text from the editor.
 *
 * @export
 * @returns {Promise<string>}
 */
export function getSelectedText(): Promise<string> {
    const { selection, document } = window.activeTextEditor || {} as TextEditor;
    return Promise.resolve(document.getText(selection).trim());
}


/**
 * Get the complete text content from the current document.
 *
 * @export
 * @returns {Promise<string>}
 */
export function getDocumentText(): Promise<string> {
    const { document } = window.activeTextEditor || {} as TextEditor;
    return Promise.resolve(document.getText().trim());
}


/**
 * Get the view column
 *
 * @export
 * @returns {ViewColumn}
 */
export function getViewColumn(): ViewColumn {
    const activeEditor = window.activeTextEditor || {} as TextEditor;
    if (!activeEditor) {
        return ViewColumn.One;
    }

    switch (activeEditor.viewColumn) {
        case ViewColumn.One:
            return ViewColumn.Two;
        case ViewColumn.Two:
            return ViewColumn.Three;
        case ViewColumn.Three:
            return ViewColumn.Four;
        case ViewColumn.Four:
            return ViewColumn.Five;
        case ViewColumn.Five:
            return ViewColumn.Six;
        case ViewColumn.Six:
            return ViewColumn.Seven;
        case ViewColumn.Seven:
            return ViewColumn.Eight;
        case ViewColumn.Eight:
            return ViewColumn.Nine;
        case ViewColumn.Nine:
            return ViewColumn.Nine;
    }

    return activeEditor.viewColumn || ViewColumn.One;
}

export const checkSelectionLength = (selectedContent: any) => {
    if (selectedContent.length === 0) {
        return Promise.reject(new Error('Selection does not contain valid JSON'));
    } else {
        return Promise.resolve(selectedContent);
    }
};

/**
 * Get parsed JSON object from string.
 *
 * @export
 * @param {string} json
 * @returns {Promise<object>}
 */
export function getParsedJson(json: string): Promise<object> {
    const tryEval = (jsonStr: any) => eval(`const a = ${jsonStr}; a`);

    try {
        return Promise.resolve(JSON.parse(json));
    } catch (exception) {
        // Do nothing
    }

    try {
        return Promise.resolve(tryEval(json));
    } catch (error) {
        return Promise.reject(new Error('Not a valid JSON'));
    }

}

/**
 * Get the current directory path.
 *
 * @export
 * @param {string} formName
 * @param {Uri} fileUri
 * @returns {string}
 */
export function getDirPath(formName: string, fileUri: Uri): string {
    //const dirPath = path.dirname(fileUri.fsPath);
    //const tmpFilePath = path.join(dirPath, formName + 'Component.ts');
    const tmpFilePath = 'untitled:'+formName + 'Component.ts';
    return tmpFilePath;
}

/**
 * Format the document.
 *
 * @export
 * @returns
 */
export function formatDocument() {
    commands.executeCommand("editor.action.formatDocument");
    return Promise.resolve(true);
}