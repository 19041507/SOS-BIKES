import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/app/_components/LoginForm";

const { entrar } = vi.hoisted(() => ({ entrar: vi.fn() }));

vi.mock("@/app/_actions/auth", () => ({ entrar }));

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
      [key: string]: unknown;
    }) => createElement("a", { ...props, href }, children),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("mostra validações e não envia dados inválidos", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    expect(entrar).not.toHaveBeenCalled();
  });

  it("envia o perfil selecionado e apresenta erros de autenticação", async () => {
    const user = userEvent.setup();
    entrar.mockResolvedValue({ erro: "E-mail ou senha incorretos.", senhaIncorreta: true });
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "mecanico@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-segura");
    await user.click(screen.getByLabelText("Sou mecânico"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(entrar).toHaveBeenCalledWith({
        email: "mecanico@example.com",
        senha: "senha-segura",
        perfil: "mecanico",
      });
    });
    expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.");
    expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
      "href",
      "/recuperar-senha?email=mecanico%40example.com",
    );
  });

  it("informa o erro de e-mail associado ao campo", async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalido" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha" } });

    await userEvent.setup().click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-describedby", "email-error");
  });
});
