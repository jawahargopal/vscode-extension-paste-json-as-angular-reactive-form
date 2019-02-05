// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { read as readClipboard } from 'clipboardy';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	function jsonIsValid(json: string) {
		try {
			JSON.parse(json);
		} catch (e) {
			return false;
		}
		return true;
	}	

	// promot form name
	async function promptFormName(): Promise<string> {
		let formName = await vscode.window.showInputBox({
			prompt: "Form name?"
		});
		return formName || 'sample';
	}

	async function newCopyBuf(textEditor: any) {
		let json = await readClipboard();
		if (!jsonIsValid(json)) {
			vscode.window.showErrorMessage('Clipboard does not contain valid JSON.');
			return;
		}

		const parsedJson = Object.keys(JSON.parse(json));
		let formName =  await promptFormName();		

		let result = `
	import { Component, OnInit } from '@angular/core';
	import { FormBuilder, FormGroup, Validators } from '@angular/forms';
	

    public ${formName}Form: FormGroup;
	public submitted = false;
	  
	constructor(private formBuilder: FormBuilder) { 

	}
	  
    ngOnInit() {
        this.${formName}Form = this.formBuilder.group({
		  `;

		for (const key of parsedJson) {
			result += key + ` :` + ` ['', Validators.required],
			`;
		}
		result = result.slice(0, -1);
		result += `
        });
	}
	  
	get f() { return this.${formName}Form.controls; }
	  
    onSubmit () {
        this.submitted = true;
        if (this.${formName}Form.valid) {
			// service call
        }
    }`;
		textEditor.edit((editBuilder: any) => {
			editBuilder.replace(new vscode.Range(0, 0, 1, 0), result);
		});
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.pasteJSONAsReactiveForm', () => {
			newCopyBuf(vscode.window.activeTextEditor);
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }
