/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Command } from '../commandManager';
import { HTMLPreviewManager } from '../features/previewManager';

export class RefreshPreviewCommand implements Command {
	public readonly id = 'html.preview.refresh';

	public constructor(
		private readonly webviewManager: HTMLPreviewManager
	) { }

	public execute() {
		this.webviewManager.refresh();
	}
}