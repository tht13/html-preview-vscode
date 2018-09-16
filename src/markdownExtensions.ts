/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';

const resolveExtensionResource = (extension: vscode.Extension<any>, resourcePath: string): vscode.Uri => {
	return vscode.Uri.file(path.join(extension.extensionPath, resourcePath))
		.with({ scheme: 'vscode-resource' });
};

const resolveExtensionResources = (extension: vscode.Extension<any>, resourcePaths: any): vscode.Uri[] => {
	const result: vscode.Uri[] = [];
	if (Array.isArray(resourcePaths)) {
		for (const resource of resourcePaths) {
			try {
				result.push(resolveExtensionResource(extension, resource));
			} catch (e) {
				// noop
			}
		}
	}
	return result;
};

interface MarkdownContributions {
	readonly extensionPath: string;
	readonly previewScripts: vscode.Uri[];
	readonly previewStyles: vscode.Uri[];
	readonly previewResourceRoots: vscode.Uri[];
}

class MarkdownExtensionContributions implements MarkdownContributions {
	private readonly _scripts: vscode.Uri[] = [];
	private readonly _styles: vscode.Uri[] = [];
	private readonly _previewResourceRoots: vscode.Uri[] = [];

	private _loaded = false;

	public constructor(
		public readonly extensionPath: string,
	) { }

	public get previewScripts(): vscode.Uri[] {
		this.ensureLoaded();
		return this._scripts;
	}

	public get previewStyles(): vscode.Uri[] {
		this.ensureLoaded();
		return this._styles;
	}

	public get previewResourceRoots(): vscode.Uri[] {
		this.ensureLoaded();
		return this._previewResourceRoots;
	}

	private ensureLoaded() {
		if (this._loaded) {
			return;
		}

		this._loaded = true;
		for (const extension of vscode.extensions.all) {
			const contributes = extension.packageJSON && extension.packageJSON.contributes;
			if (!contributes) {
				continue;
			}

			this.tryLoadPreviewStyles(contributes, extension);
			this.tryLoadPreviewScripts(contributes, extension);

			if (contributes['markdown.previewScripts'] || contributes['markdown.previewStyles']) {
				this._previewResourceRoots.push(vscode.Uri.file(extension.extensionPath));
			}
		}
	}

	private tryLoadPreviewScripts(
		contributes: any,
		extension: vscode.Extension<any>
	) {
		this._scripts.push(...resolveExtensionResources(extension, contributes['markdown.previewScripts']));
	}

	private tryLoadPreviewStyles(
		contributes: any,
		extension: vscode.Extension<any>
	) {
		this._styles.push(...resolveExtensionResources(extension, contributes['markdown.previewStyles']));
	}
}

export function getMarkdownExtensionContributions(context: vscode.ExtensionContext): MarkdownContributions {
	return new MarkdownExtensionContributions(context.extensionPath);
}