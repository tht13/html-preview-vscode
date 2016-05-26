"use strict";
import { window, ExtensionContext, commands, Uri,
    ViewColumn, TextDocument } from "vscode";
import { HtmlDocumentView } from "./document";

export enum SourceType {
    SCRIPT,
    STYLE
}

const fileMap: Map<Uri, HtmlDocumentView> = new Map();

export function activate(context: ExtensionContext) {

    function sendHTMLCommand(displayColumn: ViewColumn, doc: TextDocument, toggle: boolean = false) {
        if (!fileMap.has(doc.uri)) {
            fileMap.set(doc.uri, new HtmlDocumentView(doc));
        }
        if (toggle) {
            fileMap.get(doc.uri).executeToggle(displayColumn);
        } else {
            fileMap.get(doc.uri).executeSide(displayColumn);
        }
    }

    let previewToSide = commands.registerCommand("html.previewToSide", () => {
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
        return sendHTMLCommand(displayColumn,
            window.activeTextEditor.document);
    });

    let preview = commands.registerCommand("html.preview", () => {
        return sendHTMLCommand(window.activeTextEditor.viewColumn,
            window.activeTextEditor.document, true);
    });

    context.subscriptions.push(preview, previewToSide);
}
