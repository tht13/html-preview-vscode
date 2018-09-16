"use strict";
import {
  window,
  ExtensionContext,
  commands,
  Uri,
  ViewColumn,
  TextDocument,
  TextEditor,
  workspace
} from "vscode";
import * as uuid from "uuid";
import { HtmlDocumentView } from "./document";

let viewManager: ViewManager;
export function activate(context: ExtensionContext): void {
  console.log("active");
  viewManager = new ViewManager();

  context.subscriptions.push(
    commands.registerTextEditorCommand("html.previewToSide", editor =>
      viewManager.preview(editor, true)
    ),
    commands.registerTextEditorCommand("html.preview", editor =>
      viewManager.preview(editor)
    ),
    commands.registerTextEditorCommand("html.source", editor =>
      viewManager.source(editor.document.uri)
    )
  );
}

export function deactivate(): void {
  console.log("deactivate");
  viewManager.dispose();
}

class ViewManager {
  private idMap: IDMap = new IDMap();
  private fileMap: Map<string, HtmlDocumentView> = new Map<
    string,
    HtmlDocumentView
  >();

  private sendHTMLCommand(
    displayColumn: ViewColumn,
    doc: TextDocument,
    toggle: boolean = false
  ): Thenable<any> {
    let htmlDoc: HtmlDocumentView;
    if (!this.idMap.hasUri(doc.uri)) {
      htmlDoc = new HtmlDocumentView(doc);
      let id = this.idMap.add(doc.uri, htmlDoc.uri);
      this.fileMap.set(id, htmlDoc);
    } else {
      let id = this.idMap.getByUri(doc.uri);
      if (id === null) {
          throw new Error("Invalid Id");
      }
      if (!this.fileMap.has(id)) {
        throw new Error("Missing id in file map");
      }
      htmlDoc = this.fileMap.get(id) as HtmlDocumentView;
    }
    return htmlDoc.execute(displayColumn);
  }

  private getViewColumn(sideBySide: boolean): ViewColumn {
    if (!window.activeTextEditor) {
      return ViewColumn.One;
    }
    const active: TextEditor = window.activeTextEditor;

    if (!sideBySide) {
      return active.viewColumn || ViewColumn.One;
    }

    switch (active.viewColumn) {
      case ViewColumn.One:
        return ViewColumn.Two;
      case ViewColumn.Two:
        return ViewColumn.Three;
    }

    return active.viewColumn || ViewColumn.One;
  }

  public source(mdUri: Uri): Thenable<any> {
    const docUri: Uri = Uri.parse(mdUri.query);

    for (let editor of window.visibleTextEditors) {
      if (editor.document.uri.toString() === docUri.toString()) {
        return window.showTextDocument(editor.document, editor.viewColumn);
      }
    }

    return workspace.openTextDocument(docUri).then(doc => {
      return window.showTextDocument(doc);
    });
  }

  public async preview(
    editor: TextEditor,
    sideBySide: boolean = false
  ): Promise<void> {
    // activeTextEditor does not exist when triggering on a html preview
    if (!window.activeTextEditor) {
      return;
    }
    await this.sendHTMLCommand(
      this.getViewColumn(sideBySide),
      window.activeTextEditor.document
    );
  }

  public dispose(): void {
    for (let document of this.fileMap.values()) {
      document.dispose();
    }
  }
}

class IDMap {
  private map: Map<[Uri, Uri], string> = new Map<[Uri, Uri], string>();

  public getByUri(uri: Uri): string | null {
    for (let key of this.map.keys()) {
      if (key.indexOf(uri) > -1) {
        return this.map.get(key) as string;
      }
    }
    return null;
  }

  public hasUri(uri: Uri): boolean {
    return this.getByUri(uri) !== null;
  }

  public add(uri1: Uri, uri2: Uri): string {
    let id: string = uuid.v4();
    this.map.set([uri1, uri2], id);
    return id;
  }
}
