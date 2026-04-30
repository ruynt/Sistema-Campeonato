"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cadastrarParticipante, loginParticipante } from "@/lib/api";
import { chavesSessao, setJSONStorage, setStorage } from "@/lib/sessao";
import { Calendar, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";

function mascararContato(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  if (!ddd) return "";
  if (resto.length <= 4) return `(${ddd}) ${resto}`.trim();
  if (resto.length <= 8) {
    const p1 = resto.slice(0, 4);
    const p2 = resto.slice(4);
    return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
  }
  const p1 = resto.slice(0, 5);
  const p2 = resto.slice(5);
  return `(${ddd}) ${p1}${p2 ? `-${p2}` : ""}`;
}

type PapelUsuario = "ADMIN" | "PARTICIPANTE";

type LoginResultado = {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    papel: PapelUsuario;
    contato?: string | null;
    dataNascimento?: string | Date | null;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [aba, setAba] = useState<"LOGIN" | "CADASTRO">("LOGIN");
  const [mensagem, setMensagem] = useState("");
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [carregando, setCarregando] = useState<null | "LOGIN" | "CADASTRO">(null);

  const [cadastro, setCadastro] = useState({
    nome: "",
    email: "",
    contato: "",
    sexo: "",
    dataNascimento: "",
    senha: ""
  });
  const [login, setLogin] = useState({ email: "", senha: "" });

  async function onCadastro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando("CADASTRO");
    try {
      await cadastrarParticipante({
        ...cadastro,
        contato: cadastro.contato.replace(/\D/g, "")
      });
      setCadastro({
        nome: "",
        email: "",
        contato: "",
        sexo: "",
        dataNascimento: "",
        senha: ""
      });
      setAba("LOGIN");
    } catch (err) {
      const error = err as Error;
      setMensagem(`Erro no cadastro: ${error.message}`);
    } finally {
      setCarregando(null);
    }
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando("LOGIN");
    try {
      const resultado = (await loginParticipante(login)) as LoginResultado;

      if (resultado?.usuario?.papel === "ADMIN") {
        setStorage(chavesSessao.tokenAdmin, resultado.token);
        setJSONStorage(chavesSessao.adminLogado, {
          nome: resultado.usuario.nome,
          email: resultado.usuario.email
        });
        router.push("/dashboard");
        return;
      }

      setStorage(chavesSessao.tokenParticipante, resultado.token);
      setJSONStorage(chavesSessao.participanteLogado, resultado.usuario);
      router.push("/dashboard");
    } catch (err) {
      const error = err as Error;
      setMensagem(`Erro no login: ${error.message}`);
    } finally {
      setCarregando(null);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link href="/" className="auth-back">
          ← Voltar
        </Link>

        <section className="auth-card" aria-label="Acesso">
          <div className="auth-brand">
            <img
              src="/logo/volei_club_jampa.png"
              alt="Vôlei Club Jampa"
              className="auth-brand-logo"
            />
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              type="button"
              role="tab"
              aria-selected={aba === "LOGIN"}
              className={`auth-tab ${aba === "LOGIN" ? "is-active" : ""}`}
              disabled={carregando !== null}
              onClick={() => {
                setAba("LOGIN");
                setMensagem("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === "CADASTRO"}
              className={`auth-tab ${aba === "CADASTRO" ? "is-active" : ""}`}
              disabled={carregando !== null}
              onClick={() => {
                setAba("CADASTRO");
                setMensagem("");
              }}
            >
              Cadastro
            </button>
          </div>

          {aba === "LOGIN" ? (
            <form onSubmit={onLogin} className="auth-form">
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Mail size={18} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={login.email}
                  onChange={(e) => setLogin((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="E-mail"
                  autoComplete="email"
                  disabled={carregando === "LOGIN"}
                />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Lock size={18} />
                </span>
                <input
                  id="login-senha"
                  type={mostrarSenhaLogin ? "text" : "password"}
                  value={login.senha}
                  onChange={(e) => setLogin((p) => ({ ...p, senha: e.target.value }))}
                  required
                  placeholder="Senha"
                  autoComplete="current-password"
                  disabled={carregando === "LOGIN"}
                />
                <button
                  type="button"
                  className="auth-field-action"
                  onClick={() => setMostrarSenhaLogin((v) => !v)}
                  aria-label={mostrarSenhaLogin ? "Ocultar senha" : "Mostrar senha"}
                  disabled={carregando === "LOGIN"}
                >
                  {mostrarSenhaLogin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="auth-submit" disabled={carregando === "LOGIN"}>
                {carregando === "LOGIN" ? (
                  <>
                    <span className="auth-spinner" aria-hidden />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={onCadastro} className="auth-form">
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <User size={18} />
                </span>
                <input
                  id="cadastro-nome"
                  value={cadastro.nome}
                  onChange={(e) => setCadastro((p) => ({ ...p, nome: e.target.value }))}
                  required
                  placeholder="Nome"
                  autoComplete="name"
                  disabled={carregando === "CADASTRO"}
                />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Mail size={18} />
                </span>
                <input
                  id="cadastro-email"
                  type="email"
                  value={cadastro.email}
                  onChange={(e) => setCadastro((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="E-mail"
                  autoComplete="email"
                  disabled={carregando === "CADASTRO"}
                />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Phone size={18} />
                </span>
                <input
                  id="cadastro-contato"
                  value={cadastro.contato}
                  onChange={(e) =>
                    setCadastro((p) => ({
                      ...p,
                      contato: mascararContato(e.target.value)
                    }))
                  }
                  required
                  placeholder="Contato (WhatsApp)"
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={carregando === "CADASTRO"}
                />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <User size={18} />
                </span>
                <select
                  id="cadastro-sexo"
                  value={cadastro.sexo}
                  onChange={(e) => setCadastro((p) => ({ ...p, sexo: e.target.value }))}
                  required
                  aria-label="Sexo"
                  disabled={carregando === "CADASTRO"}
                >
                  <option value="" disabled hidden>
                    Sexo
                  </option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                  {/* <option value="OUTRO">Outro</option> */}
                </select>
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Calendar size={18} />
                </span>
                <input
                  id="cadastro-nascimento"
                  type="date"
                  value={cadastro.dataNascimento}
                  onChange={(e) =>
                    setCadastro((p) => ({ ...p, dataNascimento: e.target.value }))
                  }
                  required
                  aria-label="Data de nascimento"
                  disabled={carregando === "CADASTRO"}
                />
              </div>
              <div className="auth-field">
                <span className="auth-field-icon" aria-hidden>
                  <Lock size={18} />
                </span>
                <input
                  id="cadastro-senha"
                  type={mostrarSenhaCadastro ? "text" : "password"}
                  value={cadastro.senha}
                  onChange={(e) => setCadastro((p) => ({ ...p, senha: e.target.value }))}
                  required
                  placeholder="Senha"
                  autoComplete="new-password"
                  disabled={carregando === "CADASTRO"}
                />
                <button
                  type="button"
                  className="auth-field-action"
                  onClick={() => setMostrarSenhaCadastro((v) => !v)}
                  aria-label={mostrarSenhaCadastro ? "Ocultar senha" : "Mostrar senha"}
                  disabled={carregando === "CADASTRO"}
                >
                  {mostrarSenhaCadastro ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="auth-submit" disabled={carregando === "CADASTRO"}>
                {carregando === "CADASTRO" ? (
                  <>
                    <span className="auth-spinner" aria-hidden />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </button>
            </form>
          )}

          {mensagem ? <p className="auth-message">{mensagem}</p> : null}

          <p className="auth-footnote">© {new Date().getFullYear()} Vôlei Club Jampa</p>
        </section>
      </div>
    </main>
  );
}

