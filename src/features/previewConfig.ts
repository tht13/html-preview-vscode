/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export class HTMLPreviewConfiguration {
	public static getForResource(resource: vscode.Uri) {
		return new HTMLPreviewConfiguration(resource);
	}

	public readonly doubleClickToSwitchToEditor: boolean;
	public readonly scrollEditorWithPreview: boolean;
	public readonly scrollPreviewWithEditor: boolean;
	public readonly markEditorSelection: boolean;

	public readonly styles: string[];

	private constructor(resource: vscode.Uri) {
		const editorConfig = vscode.workspace.getConfiguration('editor', resource);
		const htmlConfig = vscode.workspace.getConfiguration('html', resource);
		const htmlEditorConfig = vscode.workspace.getConfiguration('[html]', resource);

		this.scrollPreviewWithEditor = !!htmlConfig.get<boolean>('preview.scrollPreviewWithEditor', true);
		this.scrollEditorWithPreview = !!htmlConfig.get<boolean>('preview.scrollEditorWithPreview', true);
		this.doubleClickToSwitchToEditor = !!htmlConfig.get<boolean>('preview.doubleClickToSwitchToEditor', true);
		this.markEditorSelection = !!htmlConfig.get<boolean>('preview.markEditorSelection', true);

		this.styles = htmlConfig.get<string[]>('styles', []);
	}

	public isEqualTo(otherConfig: HTMLPreviewConfiguration) {
		for (let key in this) {
			if (this.hasOwnProperty(key) && key !== 'styles') {
				if (this[key] !== otherConfig[key]) {
					return false;
				}
			}
		}

		// Check styles
		if (this.styles.length !== otherConfig.styles.length) {
			return false;
		}
		for (let i = 0; i < this.styles.length; ++i) {
			if (this.styles[i] !== otherConfig.styles[i]) {
				return false;
			}
		}

		return true;
	}

	[key: string]: any;
}

export class HTMLPreviewConfigurationManager {
	private readonly previewConfigurationsForWorkspaces = new Map<string, HTMLPreviewConfiguration>();

	public loadAndCacheConfiguration(
		resource: vscode.Uri
	): HTMLPreviewConfiguration {
		const config = HTMLPreviewConfiguration.getForResource(resource);
		this.previewConfigurationsForWorkspaces.set(this.getKey(resource), config);
		return config;
	}

	public hasConfigurationChanged(
		resource: vscode.Uri
	): boolean {
		const key = this.getKey(resource);
		const currentConfig = this.previewConfigurationsForWorkspaces.get(key);
		const newConfig = HTMLPreviewConfiguration.getForResource(resource);
		return (!currentConfig || !currentConfig.isEqualTo(newConfig));
	}

	private getKey(
		resource: vscode.Uri
	): string {
		const folder = vscode.workspace.getWorkspaceFolder(resource);
		return folder ? folder.uri.toString() : '';
	}
}
