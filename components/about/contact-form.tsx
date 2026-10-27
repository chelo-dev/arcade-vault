"use client";

import { startTransition, useActionState, useState } from "react";
import { sendContact, type ContactState } from "@/app/about/actions";

const IDLE: ContactState = { status: "idle" };
const EMPTY = { name: "", email: "", msg: "" };

export function ContactForm() {
  // Cambiar la key remonta el formulario: estado de la acción y campos vuelven a cero.
  const [round, setRound] = useState(0);
  return <ContactFormInner key={round} onReset={() => setRound((r) => r + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(sendContact, IDLE);
  const [form, setForm] = useState(EMPTY);
  const [shake, setShake] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return (
    <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
      {state.status !== "ok" ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          {/* Honeypot: invisible para personas, los bots lo rellenan. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {state.status === "error" && (
            <p role="alert" className="mb-3 font-mono text-[11px] leading-relaxed tracking-[0.1em] text-magenta">
              ▸ {state.message}
            </p>
          )}
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            ▶  ENVIAR MENSAJE
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
