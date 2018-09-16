"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fileUrl = require("file-url");
const validFiles = ["html", "jade"];
class HtmlDocumentView {
    constructor(document) {
        this.registrations = [];
        this.doc = document;
        this.provider = new HtmlDocumentContentProvider(this.doc);
        this.registrations.push(vscode_1.workspace.registerTextDocumentContentProvider("html", this.provider));
        this.previewUri = this.getHTMLUri(document.uri);
        this.registerEvents();
    }
    get uri() {
        return this.previewUri;
    }
    getHTMLUri(uri) {
        return uri.with({ scheme: "html", path: uri.path + ".rendered", query: uri.toString() });
    }
    registerEvents() {
        vscode_1.workspace.onDidSaveTextDocument(document => {
            if (this.isValidFile(document)) {
                const uri = this.getHTMLUri(document.uri);
                this.provider.update(uri);
            }
        });
        vscode_1.workspace.onDidChangeTextDocument(event => {
            if (this.isValidFile(event.document)) {
                const uri = this.getHTMLUri(event.document.uri);
                this.provider.update(uri);
            }
        });
        vscode_1.workspace.onDidChangeConfiguration(() => {
            vscode_1.workspace.textDocuments.forEach(document => {
                if (document.uri.scheme === "html") {
                    // update all generated md documents
                    this.provider.update(document.uri);
                }
            });
        });
        this.registrations.push(vscode_1.workspace.onDidChangeTextDocument((e) => {
            if (!this.visible) {
                return;
            }
            if (e.document === this.doc) {
                this.provider.update(this.previewUri);
            }
        }));
    }
    get visible() {
        for (let editor of vscode_1.window.visibleTextEditors) {
            if (editor.document.uri === this.previewUri) {
                return true;
            }
        }
        return false;
    }
    execute(column) {
        return vscode_1.commands.executeCommand("vscode.previewHtml", this.previewUri, column, `Preview '${path.basename(this.uri.fsPath)}'`).then((success) => success, (reason) => {
            console.warn(reason);
            vscode_1.window.showErrorMessage(reason);
        });
    }
    dispose() {
        for (let registration of this.registrations) {
            registration.dispose();
        }
    }
    isValidFile(document) {
        return validFiles.includes(document.languageId)
            && document.uri.scheme !== "html"; // prevent processing of own documents
    }
}
exports.HtmlDocumentView = HtmlDocumentView;
class HtmlDocumentContentProvider {
    constructor(document) {
        this._onDidChange = new vscode_1.EventEmitter();
        this.doc = document;
    }
    provideTextDocumentContent(uri) {
        return this.createHtmlSnippet();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    createHtmlSnippet() {
        if (!validFiles.includes(this.doc.languageId)) {
            return this.errorSnippet("Active editor doesn't show a HTML or Jade document - no properties to preview.");
        }
        return this.preview();
    }
    errorSnippet(error) {
        return `
                <body>
                    ${error}
                </body>`;
    }
    fixLinks() {
        return this.doc.getText().replace(new RegExp("((?:src|href)=[\'\"])((?!http|\/|data:\w+\/\w+;base64).*?)([\'\"])", "gmi"), (subString, p1, p2, p3) => {
            // avoid failing base64 negative lookahead
            const match = subString.match(new RegExp("data:\w+\/\w+;base64"));
            return match === null ? subString : [
                p1,
                fileUrl(path.join(path.dirname(this.doc.fileName), p2)),
                p3
            ].join("");
        });
    }
    preview() {
        return this.fixLinks();
    }
}
