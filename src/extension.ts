import * as vscode from 'vscode';

let captureInput = false;
let capturedText = '';
let apiKey: string | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Your extension "natural-language-supabase" is now active!');

    let startCaptureCommand = vscode.commands.registerCommand('natural-language-supabase.startCapture', () => {
        captureInput = true;
        capturedText = '';

        vscode.window.showInformationMessage('Start capturing input...');
    });

    // Listening to all typing actions
    context.subscriptions.push(vscode.commands.registerCommand('type', async (args) => {
        if (captureInput) {
            capturedText += args.text;
        }
        await vscode.commands.executeCommand('default:type', args);
    }));

    let stopCaptureCommand = vscode.commands.registerCommand('natural-language-supabase.stopCapture', async () => {
        vscode.window.showInformationMessage('Stopped capturing input.');
        if (captureInput) {
            captureInput = false;
            const displayText = await processCapturedText(capturedText);
            // console.log("capturedText: ", capturedText)
            // console.log("displayText: ", displayText);
    
            const editor = vscode.window.activeTextEditor;
            if (editor && capturedText.length > 0) {
                const document = editor.document;
                const selection = editor.selection;
    
                // Ensure startPos is not negative
                const startCharPos = Math.max(0, selection.start.character - capturedText.length);
                const startPos = new vscode.Position(selection.start.line, startCharPos);
                const endPos = selection.start;
                const range = new vscode.Range(startPos, endPos);
    
                editor.edit(editBuilder => {
                    editBuilder.delete(range);
                    editBuilder.insert(startPos, displayText);
                });
            }    
        }
    });
	
    context.subscriptions.push(startCaptureCommand);
    context.subscriptions.push(stopCaptureCommand);
}

async function processCapturedText(text: string): Promise<string> {
    const params = new URLSearchParams({ user_query: text });
    const url = `https://shreya-51--supabase-natural-queries-run.modal.run?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json()

        return data as string || '';
    } catch (error) {
        console.error("There was a problem with the get operation: ", error);
        return '';
    }
}



export function deactivate() {}
