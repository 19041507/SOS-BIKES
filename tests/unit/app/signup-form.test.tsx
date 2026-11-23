import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/app/cadastro/_components/SignupForm";

const { cadastrar } = vi.hoisted(() => ({ cadastrar: vi.fn() }));

vi.mock("@/app/_actions/auth", () => ({ cadastrar }));

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

async function preencherCadastro() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nome completo"), "Ana Ciclista");
  await user.type(screen.getByLabelText("WhatsApp"), "81999990000");
  await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
  await user.type(screen.getByLabelText("Senha"), "senha-segura");
  await user.click(screen.getByRole("checkbox"));
  return user;
}

describe("SignupForm", () => {
  it("mostra as validações obrigatórias sem chamar a action", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(screen.getByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText("Informe o WhatsApp com DDD.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("A senha precisa ter pelo menos 6 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Aceite os termos de uso para criar sua conta.")).toBeInTheDocument();
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("exibe confirmação após uma resposta de cadastro bem-sucedida", async () => {
    cadastrar.mockResolvedValue({ confirmarEmail: "ana@example.com" });
    render(<SignupForm />);

    await preencherCadastro();
    await userEvent.setup().click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(cadastrar).toHaveBeenCalledWith({
        perfil: "ciclista",
        nome: "Ana Ciclista",
        telefone: "(81) 99999-0000",
        oficina: "",
        email: "ana@example.com",
        senha: "senha-segura",
        aceitouTermos: true,
      });
    });
    expect(screen.getByRole("status")).toHaveTextContent("Confirme seu e-mail");
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("exibe erros retornados pela action e mostra oficina para mecânico", async () => {
    const user = userEvent.setup();
    cadastrar.mockResolvedValue({ erros: { geral: "Não foi possível criar a conta." } });
    render(<SignupForm />);

    await user.click(screen.getByLabelText("Sou mecânico"));
    expect(screen.getByLabelText(/Oficina/)).toBeInTheDocument();
    await preencherCadastro();
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível criar a conta.");
    });
    expect(cadastrar).toHaveBeenCalledWith(expect.objectContaining({ perfil: "mecanico" }));
  });
});
