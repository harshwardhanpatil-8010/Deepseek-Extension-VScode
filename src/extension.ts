import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activated');

    const disposable = vscode.commands.registerCommand('deepseek-ext.debug-code', () => {
        const panel = vscode.window.createWebviewPanel(
            'deepseek-ext',
            'Deepseek Ext',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        
        panel.webview.html = getWebviewContent();
        
        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';
                try {
                    const streamResponse = await ollama.chat({
                        model: 'deepseek-r1:1.5b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true,
                    });

                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                } catch (err) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
                }
            }
        });
    });
    
    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' vscode-resource:;">

        <title>Deepseek Ext</title>
        <style>
            body {
    font-family: 'Arial', sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f4f7fc;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

#prompt {
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 16px;
    line-height: 1.5;
    background-color: #fafafa;
    transition: border-color 0.3s ease-in-out;
}

#prompt:focus {
    border-color: #007ACC;
    outline: none;
}

#response {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    height: 200px;
    overflow-y: auto;
    background-color: #ffffff;
    font-size: 14px;
    color: #555;
    line-height: 1.5;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
    margin-bottom: 15px;
}

button {
    padding: 12px 18px;
    border: none;
    background-color: #007ACC;
    color: white;
    cursor: pointer;
    border-radius: 8px;
    font-size: 16px;
    transition: background-color 0.3s ease;
    width: 100%;
}

button:hover {
    background-color: #005F99;
}

button:focus {
    outline: none;
}

        </style>
    </head>
    <body>
        <h1>Deepseek for VS Code</h1>
        <textarea id="prompt" rows="3" placeholder="Ask anything to Deepseek"></textarea><br/>
        <button id="askBtn">Submit</button><br/>
        <div id="response"></div>
        <script>
            const vscode = window.acquireVsCodeApi();

            document.getElementById('askBtn').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                vscode.postMessage({ command: 'chat', text });
            });
            window.addEventListener('message', (event) => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    document.getElementById('response').innerText = text;
                }
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}