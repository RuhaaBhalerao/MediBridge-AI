import { useState } from "react";
import { sendChatMessage } from "./services/api.jsx";

const starterMessages = [
  {
    role: "assistant",
    content:
      "Hi, I'm MediBridge AI. Paste your insurance policy and hospital estimate, then ask me questions about coverage, costs, exclusions, waiting periods, and billing.",
  },
];

const quickPrompts = [
  "Will my surgery be covered?",
  "How much will I have to pay?",
  "Are there any exclusions?",
  "Is the waiting period completed?",
];

function App() {
  const [messages, setMessages] = useState(starterMessages);

  const [input, setInput] = useState("");

  const [policyText, setPolicyText] = useState("");

  const [hospitalEstimateText, setHospitalEstimateText] = useState("");

  const [isSending, setIsSending] = useState(false);

  const [error, setError] = useState("");

  const handleSend = async (messageText = input) => {
    const trimmed = messageText.trim();

    if (!trimmed || isSending) return;

    setInput("");
    setError("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setIsSending(true);

    try {
      const response = await sendChatMessage({
        message: trimmed,
        policyText,
        hospitalEstimateText,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (err) {
      setError("AI service unavailable.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AI service unavailable.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSend();
  };

  return (
    <div className="app-shell">
      <main className="layout">

        <section className="hero-panel">

          <div className="hero-copy">
            <p className="eyebrow">MEDIBRIDGE AI</p>

            <h1>
              Healthcare
              <br />
              financing,
              <br />
              explained simply.
            </h1>

            <p className="hero-text">
              Ask about insurance coverage, hospital estimates,
              claims steps, or what you may need to pay out of pocket.
            </p>
          </div>

          <div className="claim-panel">

            <div className="info-card full-width">
              <span>Insurance Policy Notes</span>

              <textarea
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Paste policy details, exclusions, sum insured, waiting periods..."
                rows={8}
              />
            </div>

            <div className="info-card full-width">
              <span>Hospital Estimate Notes</span>

              <textarea
                value={hospitalEstimateText}
                onChange={(e) => setHospitalEstimateText(e.target.value)}
                placeholder="Paste estimate, procedure name, total cost, itemized expenses..."
                rows={8}
              />
            </div>

          </div>

        </section>

        <section className="chat-panel">

          <div className="chat-header">
            <div>
              <p className="panel-label">CHATBOT</p>
              <h2>Ask MediBridge AI</h2>
            </div>

            <span className="status-pill ready">
              Ready
            </span>
          </div>

          <div className="message-stream">

            {messages.map((message, index) => (
              <article
                key={index}
                className={`message ${message.role}`}
              >
                <span className="message-role">
                  {message.role === "assistant"
                    ? "MEDIBRIDGE"
                    : "YOU"}
                </span>

                <p>{message.content}</p>
              </article>
            ))}

          </div>

          <div className="prompt-row">

            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                className="prompt-chip"
                type="button"
                disabled={isSending}
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}

          </div>

          <form
            className="composer"
            onSubmit={handleSubmit}
          >

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here..."
              rows={3}
            />

            <div className="composer-footer">

              <p className="helper-text">
                I can explain insurance and billing,
                but I can't provide medical advice.
              </p>

              <button
                type="submit"
                disabled={isSending || !input.trim()}
              >
                {isSending ? "Sending..." : "Send"}
              </button>

            </div>

            {error && (
              <p className="error-text">
                {error}
              </p>
            )}

          </form>

        </section>

      </main>
    </div>
  );
}

export default App;