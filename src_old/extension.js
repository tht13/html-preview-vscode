"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const uuid = require("uuid");
const document_1 = require("./document");
let viewManager;
function activate(context) {
    console.log("active");
    viewManager = new ViewManager();
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("html.previewToSide", editor => viewManager.preview(editor, true)), vscode_1.commands.registerTextEditorCommand("html.preview", editor => viewManager.preview(editor)), vscode_1.commands.registerTextEditorCommand("html.source", editor => viewManager.source(editor.document.uri)));
}
exports.activate = activate;
function deactivate() {
    console.log("deactivate");
    viewManager.dispose();
}
exports.deactivate = deactivate;
class ViewManager {
    constructor() {
        this.idMap = new IDMap();
        this.fileMap = new Map();
    }
    sendHTMLCommand(displayColumn, doc, toggle = false) {
        let htmlDoc;
        if (!this.idMap.hasUri(doc.uri)) {
            htmlDoc = new document_1.HtmlDocumentView(doc);
            let id = this.idMap.add(doc.uri, htmlDoc.uri);
            this.fileMap.set(id, htmlDoc);
        }
        else {
            let id = this.idMap.getByUri(doc.uri);
            if (id === null) {
                throw new Error("Invalid Id");
            }
            if (!this.fileMap.has(id)) {
                throw new Error("Missing id in file map");
            }
            htmlDoc = this.fileMap.get(id);
        }
        return htmlDoc.execute(displayColumn);
    }
    getViewColumn(sideBySide) {
        if (!vscode_1.window.activeTextEditor) {
            return vscode_1.ViewColumn.One;
        }
        const active = vscode_1.window.activeTextEditor;
        if (!sideBySide) {
            return active.viewColumn || vscode_1.ViewColumn.One;
        }
        switch (active.viewColumn) {
            case vscode_1.ViewColumn.One:
                return vscode_1.ViewColumn.Two;
            case vscode_1.ViewColumn.Two:
                return vscode_1.ViewColumn.Three;
        }
        return active.viewColumn || vscode_1.ViewColumn.One;
    }
    source(mdUri) {
        const docUri = vscode_1.Uri.parse(mdUri.query);
        for (let editor of vscode_1.window.visibleTextEditors) {
            if (editor.document.uri.toString() === docUri.toString()) {
                return vscode_1.window.showTextDocument(editor.document, editor.viewColumn);
            }
        }
        return vscode_1.workspace.openTextDocument(docUri).then(doc => {
            return vscode_1.window.showTextDocument(doc);
        });
    }
    preview(editor, sideBySide = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // activeTextEditor does not exist when triggering on a html preview
            if (!vscode_1.window.activeTextEditor) {
                return;
            }
            yield this.sendHTMLCommand(this.getViewColumn(sideBySide), vscode_1.window.activeTextEditor.document);
        });
    }
    dispose() {
        for (let document of this.fileMap.values()) {
            document.dispose();
        }
    }
}
class IDMap {
    constructor() {
        this.map = new Map();
    }
    getByUri(uri) {
        for (let key of this.map.keys()) {
            if (key.indexOf(uri) > -1) {
                return this.map.get(key);
            }
        }
        return null;
    }
    hasUri(uri) {
        return this.getByUri(uri) !== null;
    }
    add(uri1, uri2) {
        let id = uuid.v4();
        this.map.set([uri1, uri2], id);
        return id;
    }
}
