
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
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0;
    padding: 24px;
    background-color: var(--vscode-editor-background);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    color: var(--vscode-foreground);
}

.container {
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-widget-border);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 24px;
    width: 100%;
    max-width: 800px;
    box-sizing: border-box;
}

h1 {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 24px;
    color: var(--vscode-foreground);
}

#prompt {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.6;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    resize: vertical;
    min-height: 80px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

#prompt:focus {
    border-color: var(--vscode-focusBorder);
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

#response {
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    padding: 16px;
    min-height: 240px;
    max-height: 500px;
    overflow-y: auto;
    background-color: var(--vscode-editor-background);
    font-size: 14px;
    line-height: 1.6;
    color: var(--vscode-editor-foreground);
    font-family: 'SF Mono', Monaco, Menlo, Courier, monospace;
    white-space: pre-wrap;
    margin-bottom: 16px;
}

button {
    padding: 8px 16px;
    border: none;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;
    min-width: 120px;
    text-align: center;
}

button:hover {
    background-color: var(--vscode-button-hoverBackground);
}

button:active {
    transform: translateY(1px);
}

button:focus {
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: 2px;
}

::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 5px;
}

::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-hoverBackground);
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-activeBackground);
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