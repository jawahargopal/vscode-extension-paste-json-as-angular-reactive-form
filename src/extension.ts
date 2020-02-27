import { read as readClipboard } from 'clipboardy';
import * as fs from 'fs';
import { commands, ExtensionContext, Position, Range, TextEditorEdit, Uri, window, TextEditor } from 'vscode';

import {
	checkSelectionLength,
	formatDocument,
	getParsedJson,
	getSelectedText,
	getTempHtmlFilePath,
	getTempTsFilePath,
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

	const tmpTsFilePath = getTempTsFilePath();
	const tmpTsFileUri = Uri.file(tmpTsFilePath);

	const tmpHtmlFilePath = getTempHtmlFilePath();
	const tmpHtmlFileUri = Uri.file(tmpHtmlFilePath);

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
		return Promise.resolve(formName || 'sample');
	}

	/**
	 * Get the form name to be created. The name given by the user will be appended with 'Form'.
	 * For example, if the user is entering 'user' as the form name, the 'userForm' will be assigned 
	 * as the name of the Form.
	 *
	 * @returns {Promise<string>}
	 */
	async function promptComponentName(): Promise<string> {
		let formName = await window.showInputBox({
			prompt: "Component name?"
		});
		return Promise.resolve(formName || 'sample');
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

		let code = await getParsedJson(json).then(getFormComponentName).then((data) => getGeneratedSourceCode(data.json, data.componentName, convertFormName(data.formName)));
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
		getSelectedText()
			.then(checkSelectionLength)
			.then(getParsedJson)
			.then(getFormComponentName)
			.then(getTsHtmlCode)
			.then(writeFile)
			.then(openVscode)
			.then(formatDocument)
			.catch(showErrorMessage);
	}


	/**
	 * Generate reactive form from JSON file.
	 *
	 */
	async function createFromFromFile() {
		getDocumentText()
			.then(checkSelectionLength)
			.then(getParsedJson)
			.then(getFormComponentName)
			.then(getTsHtmlCode)
			.then(writeFile)
			.then(openVscode)
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

	function getFormComponentName(json: any) {
		return promptFormName().then((formName) => {
			return promptComponentName().then((componentName) => {
				return {
					componentName,
					formName,
					json
				};
			});
		});
	}

	function getTsHtmlCode(data: any) {
		const ts = getGeneratedSourceCode(data.json, data.componentName, convertFormName(data.formName));
		const html = getGenerateHtmlCode(data.json, convertFormName(data.formName));
		return Promise.all([ts, html]).then((values) => {
			return values;
		})
	}

	function writeFile(sourceCode: any) {
		fs.writeFileSync(tmpTsFilePath, sourceCode[0]);
		fs.writeFileSync(tmpHtmlFilePath, sourceCode[1]);
	}

	function openVscode() {
		commands.executeCommand('vscode.open', tmpTsFileUri, getViewColumn());
		setTimeout(() => {
			commands.executeCommand('vscode.open', tmpHtmlFileUri, getViewColumn());
		}, 250);
	}

	function convertComponentName(name: string, selector:boolean = true) {
		if (selector) {
			return name.toLowerCase().split(' ').join('-');
		}
		return name.toLowerCase().split(' ').map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join('');
	}

	function convertFormName(name: string) {
		return name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase();
		  }).replace(/\s+/g, '');
	}

	/**
	 * Get the generated source code snippets.
	 *
	 * @param {*} parsedJson
	 * @param {string} [componentName]
	 * @returns
	 */
	async function getGeneratedSourceCode(parsedJson: any, componentName: string, formName: string): Promise<string> {

		let code = `
// TODO : Copy the imports to the top of the file.
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component ({
	selector: 'app-` + convertComponentName(componentName) + `'
})

export class ` + convertComponentName(componentName, false) +`Component implements OnInit {
			
	// TODO : Copy the below declarations inside the component class.
	public ${formName}Form: FormGroup;
	public submitted = false;

	// TODO : Make sure that the \`FormBuilder\` is injected in the constructor.
	constructor(private formBuilder: FormBuilder) { 

	}
				
	// TODO : Copy the form builder code to the \`ngOnInit\` callback.
	ngOnInit() { `;

			code += await getGeneratedFormCode(parsedJson, formName);


			code += 
	`
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
	}

}`;

		return Promise.resolve(code);
	}

	/**
	 * Generate the source code for the form builder form JSON. 
	 * This will not generate the associated imports and variable declarations.
	 *
	 * @param {*} parsedJson
	 * @returns
	 */
	async function getGeneratedFormCode(parsedJson: any, frmName: string = 'sample') {

		const formName = convertFormName(frmName || await promptFormName());

		let code = `
		this.${formName}Form = this.formBuilder.group({`;

			for (const key of Object.keys(parsedJson)) { code += `
			` + key + ` :` + ` ['', [Validators.required]],`;
			}
			code = code.slice(0, -1);
			code += `
		});`;

		return code;
	}

	/**
	 * Generate the source code for the form builder form JSON. 
	 * This will not generate the associated imports and variable declarations.
	 *
	 * @param {*} parsedJson
	 * @returns
	 */
	async function getGenerateHtmlCode(parsedJson: any, fName: string): Promise<string> {

		let htmlCode = `<form [formGroup]="` + fName + `" (ngSubmit)="onSubmit()">`;
		for (const key of Object.keys(parsedJson)) {
			htmlCode += `
	<div class="form-group">
		<label for ="` + key + `">` + key + `</label>`;
			htmlCode += `
		<input type="text" class="form-control" formControlName="` + key + `"/>`;
			htmlCode += `
	<div>`;
		}
		htmlCode += `
	<div class="form-group">
		<button class="btn btn-primary">Register</button>
	</div>
</form>`;
		return Promise.resolve(htmlCode);
			
		}
}
/**
 * Callback method to handle extension deactivation.
 *
 * @export
 */
export function deactivate() { }
