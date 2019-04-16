import { read as readClipboard } from 'clipboardy';
import * as fs from 'fs';
import { commands, ExtensionContext, Position, Range, TextEditorEdit, Uri, window, TextEditor } from 'vscode';

import {
	checkSelectionLength,
	formatDocument,
	getParsedJson,
	getSelectedText,
	getTempFilePath,
	getViewColumn,
	jsonIsValid,
	showErrorMessage,
	getDocumentText
} from './util';


/**
 * Callback method on extension activation
 * 
 *
 * @export
 * @param {ExtensionContext} context
 */
export function activate(context: ExtensionContext) {

	/**
	 * Get the form name to be created. The name given by the user will be appended with 'Form'.
	 * For example, if the user is entering 'user' as the form name, the 'userForm' will be assigned 
	 * as the name of the Form.
	 *
	 * @returns {Promise<string>}
	 */
	async function promptFormName(): Promise<string> {
		let formName = await window.showInputBox({
			prompt: "Form name?"
		});
		return formName || 'sample';
	}

	/**
	 * Generate reactive form from the clipboard and replace the current document content with the generated code.
	 *
	 */
	async function createFromFromClipboard(textEditor: TextEditor) {
		let json = await readClipboard();
		if (!jsonIsValid(json)) {
			showErrorMessage(new Error('Clipboard does not contain valid JSON.'));
			return;
		}

		const parsedJson = JSON.parse(json);
		let code = await getGeneratedSourceCode(parsedJson);
		textEditor.edit((editBuilder: any) => {
			editBuilder.replace(new Range(0, 0, 1, 0), code);
			formatDocument();
		});
	}

	/**
	 * Generate reactive form from the clipboard and paste it to the current cursor position.
	 *
	 */
	async function createFormHereFromClipboard(textEditor: any) {
		let json = await readClipboard();
		if (!jsonIsValid(json)) {
			showErrorMessage(new Error('Clipboard does not contain valid JSON.'));
			return;
		}

		const currentPosition: Position = textEditor.selection.active;
		const parsedJson = JSON.parse(json);
		let code = await getGeneratedFormCode(parsedJson);
		textEditor.edit((editBuilder: TextEditorEdit) => {
			editBuilder.insert(currentPosition, code);
			formatDocument();
		});
	}

	/**
	 * Generate reactive form from the selection. The selection content should be a valid JSON.
	 *
	 */
	async function createFromFromSelection() {

		const tmpFilePath = getTempFilePath();
		const tmpFileUri = Uri.file(tmpFilePath);

		getSelectedText()
			.then(checkSelectionLength)
			.then(getParsedJson)
			.then((json) => {
				return getGeneratedSourceCode(json);
			})
			.then((sourceCode) => {
				fs.writeFileSync(tmpFilePath, sourceCode);
			})
			.then(() => {
				commands.executeCommand('vscode.open', tmpFileUri, getViewColumn());
			})
			.then(formatDocument)
			.catch(showErrorMessage);
	}


	/**
	 * Generate reactive form from JSON file.
	 *
	 */
	async function createFromFromFile() {

		const tmpFilePath = getTempFilePath();
		const tmpFileUri = Uri.file(tmpFilePath);

		getDocumentText()
			.then(checkSelectionLength)
			.then(getParsedJson)
			.then((json) => {
				return getGeneratedSourceCode(json);
			})
			.then((sourceCode) => {
				fs.writeFileSync(tmpFilePath, sourceCode);
			})
			.then(() => {
				commands.executeCommand('vscode.open', tmpFileUri, getViewColumn());
			})
			.then(formatDocument)
			.catch(showErrorMessage);
	}


	context.subscriptions.push(
		commands.registerCommand('json2ReactiveForm.fromClipboard', () => {
			createFromFromClipboard(window.activeTextEditor || {} as TextEditor);
		}),
		commands.registerCommand('json2ReactiveForm.fromSelection', (uri: Uri) => {
			createFromFromSelection();
		}),
		commands.registerCommand('json2ReactiveForm.fromFile', () => {
			createFromFromFile();
		}),
		commands.registerCommand('json2ReactiveForm.pasteFormHere', () => {
			createFormHereFromClipboard(window.activeTextEditor);
		})
	);
/**
 * Get the generated source code snippets.
 *
 * @param {*} parsedJson
 * @param {string} [componentName]
 * @returns
 */
async function getGeneratedSourceCode(parsedJson: any, componentName?: string) {

		let formName = await promptFormName();

		let code = `
// TODO : Copy the imports to the top of the file.
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
			
// TODO : Copy the below declarations inside the component class.
public ${formName}Form: FormGroup;
public submitted = false;

// TODO : Make sure that the \`FormBuilder\` is injected in the constructor.
constructor(private formBuilder: FormBuilder) { 

}
			
// TODO : Copy the form builder code to the \`ngOnInit\` callback.
ngOnInit() {
	this.${formName}Form = this.formBuilder.group({
	`;

		for (const key of Object.keys(parsedJson)) {
			code += key + ` :` + ` ['', Validators.required],
					`;
		}
		code = code.slice(0, -1);
		code += `
	});
}

/**
 * Get the form controls.
 */
get ${formName}FormControls() { return this.${formName}Form.controls; }

/**
 * TODO : Update the documentation
 */
onSubmit () {
	this.submitted = true;
	// Check whether the form is valid
	if (this.${formName}Form.valid) {
		// TODO : Do your stuff for ${componentName}
	}
}`;

		return code;
	}

	/**
	 * Generate the source code for the form builder form JSON. 
	 * This will not generate the associated imports and variable declarations.
	 *
	 * @param {*} parsedJson
	 * @returns
	 */
	async function getGeneratedFormCode(parsedJson: any) {

		let formName = await promptFormName();

		let code = `
			
				this.${formName}Form = this.formBuilder.group({
				`;

		for (const key of Object.keys(parsedJson)) {
			code += key + ` :` + ` ['', Validators.required],
					`;
		}
		code = code.slice(0, -1);
		code += `
				});`;

		return code;
	}
}
/**
 * Callback method to handle extension deactivation.
 *
 * @export
 */
export function deactivate() { }
