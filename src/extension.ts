"use strict";
import { window, ExtensionContext, commands, Uri,
    ViewColumn, TextDocument } from "vscode";
import { HtmlDocumentView } from "./document";

export enum SourceType {
    SCRIPT,
    STYLE
}

export function activate(context: ExtensionContext) {
    const viewManager = new ViewManager();

    context.subscriptions.push(
        commands.registerCommand("html.previewToSide", () => {
            viewManager.previewToSide();
        }),
        commands.registerCommand("html.preview", () => {
            viewManager.preview();
        })
    );
}

class ViewManager {
    private fileMap: Map<Uri, HtmlDocumentView> = new Map();

    private sendHTMLCommand(displayColumn: ViewColumn, doc: TextDocument, toggle: boolean = false) {
        if (!this.fileMap.has(doc.uri)) {
            this.fileMap.set(doc.uri, new HtmlDocumentView(doc));
        }
        if (toggle) {
            this.fileMap.get(doc.uri).executeToggle(displayColumn);
        } else {
            this.fileMap.get(doc.uri).executeSide(displayColumn);
        }
    }

    public previewToSide() {
        let displayColumn: ViewColumn;
        switch (window.activeTextEditor.viewColumn) {
            case ViewColumn.One:
                displayColumn = ViewColumn.Two;
                break;
            case ViewColumn.Two:
            case ViewColumn.Three:
                displayColumn = ViewColumn.Three;
                break;
        }
        this.sendHTMLCommand(displayColumn,
            window.activeTextEditor.document);
    }

    public preview() {
        this.sendHTMLCommand(window.activeTextEditor.viewColumn,
            window.activeTextEditor.document, true);
    }
}
