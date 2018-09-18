/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from"path";
import * as testRunner from"vscode/lib/testrunner";

const suite = "Integration Markdown Tests";

const options: any = {
  ui: "tdd",
  useColors: true,
  timeout: 60000
};

// options.reporter = "mocha-multi-reporters";
// options.reporterOptions = {
//   reporterEnabled: "spec, mocha-junit-reporter",
//   mochaJunitReporterReporterOptions: {
//     testsuitesTitle: `${suite} ${process.platform}`,
//     mochaFile: path.join(
//       "test-results",
//       `test-results/${process.platform}-${suite
//         .toLowerCase()
//         .replace(/[^\w]/g, "-")}-results.xml`
//     )
//   }
// };

testRunner.configure(options);

export = testRunner;
