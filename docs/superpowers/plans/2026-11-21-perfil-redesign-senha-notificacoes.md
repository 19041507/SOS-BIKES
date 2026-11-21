# Meu perfil: redesign, senha e notificações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar os dois perfis reais com visual do app, senha autenticada e gerenciamento de Web Push, sem migration.

**Architecture:** FormularioDePerfil mantém os campos/regras e gravação existentes. Cards Senha e Notificações são componentes separados; senha usa uma Server Action sem redirecionamento, notificações usam as funções da dev.

**Tech Stack:** Next.js 16.4.6, React 19.3.0, Supabase, TypeScript, Vitest/Testing Library.

**Spec:** solicitação completa do card e autorização de separação na conversa. O usuário confirmou execução nativa e pediu “faça”; não repetir aprovação da mesma entrega. Extras ficam na branch feat/perfil-ciclista-completo e na prévia, sem serem apagados nem importados nesta entrega.

## Global Constraints

- Base origin/dev 402be9f, com Web Push integrado. Branch separada feat/perfil-redesign-senha-notificacoes.
- Nenhuma migration nova ou modificada. Sem push, deploy, alteração de contas reais ou aplicação remota.
- Manter nome, WhatsApp e oficina opcional para mecânico; autônomos continuam permitidos.
- Card Senha abaixo de dados pessoais, com Senha atual, Nova senha, Confirmar senha, Trocar senha e mostrar/ocultar como login.
- SENHA_MINIMA compartilhada. Divergência: “As senhas não são iguais.”; senha atual inválida: “Senha atual incorreta.”; same_password: “Use uma senha diferente da atual.”; weak_password: “Senha fraca. Use letras e números.”
- Sucesso limpa campos, toast “Senha alterada.”, mantém login sem redirect/signOut.
- Notificações: estados ativadas/desativadas/bloqueadas/instalar/indisponivel, textos exatos do card e nenhuma simulação na tela real.
- Preservar InstalarApp e dar destino ao link para instalar no iPhone.
- Testes locais não substituem login e Web Push reais: sem configuração Supabase disponível, registrar a pendência.

## Review Focus

1. A identidade muda durante reautenticação: não atualizar senha de outra conta.
2. Erros de transporte não viram sucesso; rascunhos e preferências permanecem confiáveis.
3. Desativação de push falha no banco ou navegador: não anunciar sucesso falso.
4. Validação da nova senha não depende só do navegador; API direta também é validada.
5. Cabeçalho e painel recebem os dados confirmados, sem refletir rascunhos como gravações reais.

## Task 1: Troca de senha autenticada

**Files:** src/app/_actions/auth.ts, src/lib/trocar-senha.ts, tests/trocar-senha.test.ts, vitest.config.ts, package.json/package-lock.json.
**Interfaces:** action trocarSenha({atual,nova}): Promise<{erro:string}|{ok:true}>; núcleo trocarSenhaAutenticada(auth,dados) usa getUser/signInWithPassword/updateUser e retorna o mesmo contrato.

- [ ] Escrever testes para mínimo, sessão ausente, senha atual errada, identidade divergente, same_password, weak_password, falha de transporte e sucesso com argumentos corretos.
- [ ] Rodar npm test: esperado falhar por módulo ausente.
- [ ] Implementar núcleo e action com cliente autenticado, não registrar senhas, não redirecionar.
- [ ] Rodar npm test e npm run typecheck: esperado exit 0. Commit de senha.

## Task 2: Redesign e card Senha

**Files:** src/components/perfil/FormularioDePerfil.tsx, TrocarSenha.tsx, CampoSenha.tsx, src/app/ciclista/perfil/page.tsx, src/app/mecanico/perfil/page.tsx, tests/perfil.test.tsx, tests/trocar-senha-ui.test.tsx.
**Interfaces:** TrocarSenha sem props de prévia; chama action da Task 1. FormularioDePerfil continua usando atualizarPerfil e router.refresh.

- [ ] Testes da interface: dois tipos de perfil, oficina só para mecânico, preservação de edição/salvamento, erro sem apagar rascunhos; confirmação divergente e nova curta sem chamar action, campos mostrar/ocultar, sucesso limpa e toast, falha mantém rascunho.
- [ ] Rodar testes vermelhos antes da implementação.
- [ ] Aplicar visual responsivo com cards, cores e tipografia atuais; dados pessoais, depois card Senha. Preservar regras, adicionar tratamento de falhas de rede.
- [ ] Rodar npm test, typecheck e lint: esperado exit 0. Commit de interface.

## Task 3: Notificações e validação final

**Files:** src/components/perfil/Notificacoes.tsx, src/lib/notificacoes.ts, tests/notificacoes.test.tsx, tests/notificacoes-servico.test.ts, docs de checklist manual.
**Interfaces:** Notificacoes sem props de prévia chama estadoDasNotificacoes, ativarNotificacoes, desativarNotificacoes; link #instalar-app presente nas duas páginas. As funções públicas mantêm os nomes/assinaturas da dev.

- [ ] Testes vermelhos dos cinco estados e textos, ativar/desativar, operação pendente/erro sem sucesso falso, iPhone link e indisponível oculto. Serviço: erro ao remover inscrição no banco e unsubscribe false não passam silenciosamente.
- [ ] Implementar card com atualização manual e reconsulta ao voltar à aba; cancelar atualizações após desmontar; evitar cliques repetidos.
- [ ] Rodar npm test, typecheck, lint, build e git diff --check; conferir 390 px com fixture local temporária que renderize componentes reais, depois remover fixture. Testes com dublês não contam como teste Supabase remoto.
- [ ] Revisão independente da branch inteira; corrigir problemas importantes com regressão RED→GREEN. Confirmar diff vazio em supabase/migrations. Commit e manter branch local, sem publicação.

## Entrega adicional preservada

CPF/CNPJ, fotos, bicicletas, clientes favoritos, acessibilidade persistida e outras seções continuam no desenho e na branch de perfil completo. Não anunciar essa entrega como concluída. Sua implementação e migrations são separadas do card acima.
