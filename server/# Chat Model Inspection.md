# Chat Model Inspection

## Latest Response

```json
[]
```

## Full Chat Model

```json
{
  "version": 3,
  "responderUsername": "GitHub Copilot",
  "initialLocation": "panel",
  "requests": [
    {
      "requestId": "request_82750f81-26bb-4b7f-b605-2e6c91fa5be1",
      "message": {
        "parts": [
          {
            "range": {
              "start": 0,
              "endExclusive": 339
            },
            "editorRange": {
              "startLineNumber": 1,
              "startColumn": 1,
              "endLineNumber": 23,
              "endColumn": 20
            },
            "text": "Analyze this MediBridge codebase.\r\n\r\nProject:\r\n- React\r\n- Node.js\r\n- Express\r\n- MongoDB\r\n- Gemini API\r\n\r\nCurrent Features:\r\n- Authentication\r\n- Claims Storage\r\n- Claim Retrieval\r\n- AI Chatbot\r\n\r\nDo not modify any files.\r\n\r\nGive me:\r\n1. Current architecture\r\n2. Existing features\r\n3. Missing features\r\n4. Technical debt\r\n5. Top 5 next steps",
            "kind": "text"
          }
        ],
        "text": "Analyze this MediBridge codebase.\r\n\r\nProject:\r\n- React\r\n- Node.js\r\n- Express\r\n- MongoDB\r\n- Gemini API\r\n\r\nCurrent Features:\r\n- Authentication\r\n- Claims Storage\r\n- Claim Retrieval\r\n- AI Chatbot\r\n\r\nDo not modify any files.\r\n\r\nGive me:\r\n1. Current architecture\r\n2. Existing features\r\n3. Missing features\r\n4. Technical debt\r\n5. Top 5 next steps"
      },
      "variableData": {
        "variables": []
      },
      "response": [],
      "agent": {
        "id": "claude-code",
        "name": "claude",
        "fullName": "Claude",
        "description": "Delegate tasks to the Claude SDK running locally on your machine. The agent iterates via chat and works asynchronously to implement changes.",
        "isDefault": false,
        "isCore": false,
        "isDynamic": true,
        "slashCommands": [
          {
            "name": "init",
            "description": "Initialize a new CLAUDE.md file with codebase documentation"
          },
          {
            "name": "pr-comments",
            "description": "Get comments from a GitHub pull request"
          },
          {
            "name": "review",
            "description": "Review a pull request"
          },
          {
            "name": "security-review",
            "description": "Complete a security review of the pending changes on the current branch"
          },
          {
            "name": "simplify",
            "description": "Review changed code for reuse, quality, and efficiency"
          },
          {
            "name": "claude-api",
            "description": "Help building with Claude API or Anthropic SDK"
          },
          {
            "name": "agents",
            "description": "Create and manage specialized Claude agents"
          },
          {
            "name": "hooks",
            "description": "Configure Claude Code hooks for tool execution and events"
          },
          {
            "name": "memory",
            "description": "Open memory files (CLAUDE.md) for editing"
          },
          {
            "name": "compact",
            "description": "Compact the conversation history to save context tokens"
          }
        ],
        "locations": [
          "panel"
        ],
        "modes": [
          "agent",
          "ask"
        ],
        "disambiguation": [],
        "metadata": {
          "themeIcon": {
            "id": "claude"
          },
          "hasFollowups": false
        },
        "capabilities": {
          "supportsFileAttachments": true,
          "supportsImageAttachments": true
        },
        "canAccessPreviousChatHistory": true,
        "extensionId": {
          "value": "GitHub.copilot-chat",
          "_lower": "github.copilot-chat"
        },
        "extensionVersion": "0.51.0",
        "extensionDisplayName": "GitHub Copilot Chat",
        "extensionPublisherId": "GitHub"
      },
      "timestamp": 1780835210857,
      "modelId": "copilot/auto",
      "modeInfo": {
        "kind": "agent",
        "isBuiltin": true,
        "modeId": "agent",
        "modeName": "agent",
        "permissionLevel": "default"
      },
      "responseId": "response_8e4b16d4-23ba-4079-b151-6fac1a5ef184",
      "result": {
        "errorDetails": {
          "code": "failed",
          "message": "Sorry, your request failed. Please try again.\n\nClient Request Id: 0f738805-0304-4e8c-a040-0d4ed7812a09\n\nGH Request Id: 4D9A:15B1E7:1E379E3:237D931:6A256436\n\nReason: Request Failed: 400 {\"error\":{\"message\":\"output_config.effort \\\"high\\\" was provided, but model claude-haiku-4.5 does not support reasoning effort\",\"code\":\"invalid_reasoning_effort\"}}\n",
          "responseIsIncomplete": true
        },
        "timings": {
          "totalElapsed": 218324
        },
        "details": "Claude Haiku 4.5"
      },
      "followups": [],
      "modelState": {
        "value": 3,
        "completedAt": 1780835429227
      },
      "contentReferences": [],
      "codeCitations": [],
      "timeSpentWaiting": 0,
      "elapsedMs": 218370
    },
    {
      "requestId": "request_57abd41d-f218-4246-8a37-c30c15a22a1f",
      "message": {
        "parts": [
          {
            "range": {
              "start": 0,
              "endExclusive": 20
            },
            "editorRange": {
              "startLineNumber": 1,
              "startColumn": 1,
              "endLineNumber": 1,
              "endColumn": 21
            },
            "text": "Claude: Change Model",
            "kind": "text"
          }
        ],
        "text": "Claude: Change Model"
      },
      "variableData": {
        "variables": []
      },
      "response": [],
      "agent": {
        "id": "claude-code",
        "name": "claude",
        "fullName": "Claude",
        "description": "Delegate tasks to the Claude SDK running locally on your machine. The agent iterates via chat and works asynchronously to implement changes.",
        "isDefault": false,
        "isCore": false,
        "isDynamic": true,
        "slashCommands": [
          {
            "name": "init",
            "description": "Initialize a new CLAUDE.md file with codebase documentation"
          },
          {
            "name": "pr-comments",
            "description": "Get comments from a GitHub pull request"
          },
          {
            "name": "review",
            "description": "Review a pull request"
          },
          {
            "name": "security-review",
            "description": "Complete a security review of the pending changes on the current branch"
          },
          {
            "name": "simplify",
            "description": "Review changed code for reuse, quality, and efficiency"
          },
          {
            "name": "claude-api",
            "description": "Help building with Claude API or Anthropic SDK"
          },
          {
            "name": "agents",
            "description": "Create and manage specialized Claude agents"
          },
          {
            "name": "hooks",
            "description": "Configure Claude Code hooks for tool execution and events"
          },
          {
            "name": "memory",
            "description": "Open memory files (CLAUDE.md) for editing"
          },
          {
            "name": "compact",
            "description": "Compact the conversation history to save context tokens"
          }
        ],
        "locations": [
          "panel"
        ],
        "modes": [
          "agent",
          "ask"
        ],
        "disambiguation": [],
        "metadata": {
          "themeIcon": {
            "id": "claude"
          },
          "hasFollowups": false
        },
        "capabilities": {
          "supportsFileAttachments": true,
          "supportsImageAttachments": true
        },
        "canAccessPreviousChatHistory": true,
        "extensionId": {
          "value": "GitHub.copilot-chat",
          "_lower": "github.copilot-chat"
        },
        "extensionVersion": "0.51.0",
        "extensionDisplayName": "GitHub Copilot Chat",
        "extensionPublisherId": "GitHub"
      },
      "timestamp": 1780835738577,
      "modelId": "claude-code/claude-haiku-4.5",
      "modeInfo": {
        "kind": "agent",
        "isBuiltin": true,
        "modeId": "agent",
        "modeName": "agent",
        "permissionLevel": "default"
      },
      "responseId": "response_a2f6c298-11f2-4c23-8667-1f1535807eb3",
      "result": {
        "errorDetails": {
          "code": "quota_exceeded",
          "message": "You've reached your monthly credit limit. Please enable additional paid credits, upgrade to Copilot Pro+, or wait until your credits reset on July 1, 2026 at 5:30 AM.",
          "isQuotaExceeded": true,
          "responseIsIncomplete": true
        },
        "timings": {
          "totalElapsed": 11486
        },
        "details": "Claude Haiku 4.5"
      },
      "followups": [],
      "modelState": {
        "value": 3,
        "completedAt": 1780835750097
      },
      "contentReferences": [],
      "codeCitations": [],
      "timeSpentWaiting": 0,
      "elapsedMs": 11520
    }
  ],
  "sessionId": "claude-code:/5ad6f3f6-f6f1-4e75-88a1-d0dfa397250f",
  "creationDate": 1780835210848,
  "customTitle": "Analyze this MediBridge codebase. Project: - React…",
  "inputState": {
    "contrib": {
      "chatDynamicVariableModel": []
    },
    "attachments": [],
    "mode": {
      "id": "agent",
      "kind": "agent"
    },
    "selectedModel": {
      "identifier": "claude-code/claude-haiku-4.5",
      "metadata": {
        "extension": {
          "value": "GitHub.copilot-chat",
          "_lower": "github.copilot-chat"
        },
        "id": "claude-haiku-4.5",
        "vendor": "claude-code",
        "name": "Claude Haiku 4.5",
        "family": "claude-haiku-4.5",
        "tooltip": "Fastest and most compact Claude model. Ideal for quick responses and simple tasks.",
        "version": "claude-haiku-4.5",
        "pricing": "In: 100 · Out: 500 AICs/1M tokens",
        "inputCost": 100,
        "outputCost": 500,
        "cacheCost": 10,
        "priceCategory": "low",
        "maxInputTokens": 127997,
        "maxOutputTokens": 32000,
        "isDefaultForLocation": {},
        "isUserSelectable": true,
        "targetChatSessionType": "claude-code",
        "capabilities": {
          "vision": true,
          "toolCalling": true,
          "agentMode": true
        }
      }
    },
    "inputText": "",
    "selections": [
      {
        "startLineNumber": 1,
        "startColumn": 1,
        "endLineNumber": 1,
        "endColumn": 1,
        "selectionStartLineNumber": 1,
        "selectionStartColumn": 1,
        "positionLineNumber": 1,
        "positionColumn": 1
      }
    ],
    "permissionLevel": "default"
  }
}
```
