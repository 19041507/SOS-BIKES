# Perfis completos de ciclista e mecânico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar todas as seções solicitadas aos perfis reais, preservando o redesign, senha, notificações e instalação existentes.

**Architecture:** Next.js e Supabase existentes. Dados privados e fotos protegidos por proprietário; Server Actions autenticadas e RLS. Reutilizar favoritos, avaliações e chat já implantados, sem segunda tabela de mensagens nem callbacks de simulação nos componentes reais.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, Supabase Auth/Postgres/Storage, Vitest/Testing Library e testes SQL isolados.

**Spec:** Desenhos existentes `2026-11-21-perfil-ciclista-real-design.md` e `2026-11-21-perfil-mecanico-real-design.md`, na branch local `feat/perfil-ciclista-completo`, acrescidos das decisões aprovadas na conversa: preservar os cards atuais; CNPJ obrigatório apenas com vínculo a oficina; implementar migrations localmente sem aplicá-las em produção. Copiar os dois desenhos para esta entrega durante a tarefa 1 para torná-la autocontida. O chat segue as permissões atuais da dev, que prevalecem sobre o desenho antigo do ciclista.

## Global Constraints

- Trabalho em branch isolada derivada de `feat/perfil-redesign-senha-notificacoes`; não sobrescrever a cópia principal suja ou o trabalho anterior.
- Nenhum push, merge em dev/main, deploy ou migration remota nesta autorização.
- Preservar troca real de senha e mensagens exatas já testadas; card Senha abaixo dos dados pessoais, inclusive na estrutura com seções.
- Preservar Notificações e InstalarApp para ambos os papéis.
- CPF/idade opcionais e privados. CNPJ, endereço empresarial e fotos inicialmente privados, conforme desenho existente; validação documental não equivale a verificação de identidade/vínculo.
- CNPJ obrigatório somente para mecânico vinculado; nome da oficina também obrigatório nesse caso. Contas antigas incompletas não perdem acesso aos atendimentos.
- Fotos JPG/PNG/WebP até 5242880 bytes, assinatura validada no servidor, bucket privado e URLs assinadas.
- Status indica completude e ausência de análise de diretrizes; não inventar aprovação, punição ou certificação.
- Ajuda descreve funcionalidades reais e o caráter acadêmico da FICR, sem inventar canal de atendimento.
- Nada de listas exemplificadas, sucesso simulado ou persistência somente em memória nas páginas autenticadas.
- Ler os guias locais pertinentes do Next.js antes de editar código; verificar formato vigente de CNPJ em fonte oficial antes de implementar sua validação.

## Review Focus

1. Consulta direta por outro usuário não revela documentos, fotos, locais ou favoritos privados (tarefas 2–4).
2. Migration ausente ou sessão expirada produz erro recuperável, não lista vazia nem sucesso falso (tarefas 3–6).
3. Duplo clique e troca concorrente de foto não duplicam gravações nem apagam imagem ativa (tarefa 3).
4. Voltar entre seções e falha de rede não perde rascunho silenciosamente; navegação funciona a 390 px (tarefas 3–6).
5. Oficina incompleta não bloqueia atendimento; favorito não concede permissão adicional de chat (tarefas 2 e 5).

## Task 1: Base integrada e contratos

**Files:** copiar desenhos para `docs/superpowers/specs/`; criar `src/lib/perfil-completo/types.ts`; preservar componentes em `src/components/perfil/` e a prévia local separada.

**Interfaces:** `SecaoPerfil = dados | bicicletas | locais | oficina | favoritos | avaliacao | acessibilidade | ajuda | status | mensagens | atividade`; `Resultado<T> = {ok:true;dados:T} | {ok:false;erro:string;campos?:Record<string,string>}`. Dados pessoais incluem nome, WhatsApp, CPF, idade e foto; Senha permanece nesse painel abaixo dos dados. Seções exclusivas são filtradas pelo tipo autenticado.

- [ ] Criar branch de ampliação a partir do HEAD desta entrega, preservando arquivos não commitados da validação visual.
- [ ] Comparar trabalho anterior e dev local; reaproveitar somente módulos/migrations compatíveis, sem merge cego das duas implementações de senha ou chat.
- [ ] Copiar desenhos; registrar aprovação do mecânico e as decisões atuais, corrigindo referências antigas de chat e posição da senha.
- [ ] Escrever teste `tests/perfil-secoes.test.ts`: ciclista tem bicicletas/locais, mecânico tem oficina; ambos têm todas as seções compartilhadas e não expõem seção alheia.
- [ ] Rodar `npm test -- tests/perfil-secoes.test.ts`, observar RED; implementar `secoesDoPerfil(tipo)` e observar GREEN.
- [ ] Commit restrito aos arquivos desta tarefa.

## Task 2: Persistência privada e permissões

**Files:** migrations novas em `supabase/migrations/`; `src/lib/supabase/database.types.ts`; `supabase/tests/perfis-completos.sql`; harness SQL em `scripts/test-db.cjs` se ainda necessário.

**Interfaces:** dados privados por usuário com CPF/idade/foto/preferências; bicicletas e locais privados por ciclista; dados de oficina privados por mecânico com vínculo/CNPJ/endereço/fachada; favoritos de clientes por mecânico; atividade privada produzida por triggers. RPCs autenticadas salvam dados pessoais e oficina atomicamente. Reaproveitar mensagens e avaliações existentes.

- [ ] Escrever testes SQL com dono, outro usuário do mesmo papel, participante de chamado, terceiro e anônimo: acesso privado negado, IDs não podem ser trocados, CPF não aparece em joins públicos.
- [ ] Executar antes da migration e observar falha pelas relações ausentes.
- [ ] Reaproveitar migration anterior do ciclista após revisão; acrescentar modelo do mecânico, constraints de vínculo e favoritos limitados a clientes de chamados próprios. Nenhuma permissão nova no chat.
- [ ] Testar autônomo sem CNPJ, vinculado sem nome/CNPJ, transação revertida em erro, conta antiga incompleta sem bloqueio de atendimento e eventos sem conteúdo pessoal.
- [ ] Testar Storage privado e referências a caminhos alheios; aplicar somente no banco de teste local. Atualizar tipos; `npm run test:db` GREEN.
- [ ] Commit da persistência e testes.

## Task 3: Dados pessoais, oficina, fotos e bicicletas

**Files:** `src/app/_actions/perfil-completo.ts`; módulos em `src/lib/perfil-completo/`; componentes `DadosPessoais`, `Oficina`, `Bicicletas` em `src/components/perfil/`; testes unitários e de componentes.

**Interfaces:** ações `salvarDadosPessoais`, `salvarOficina`, `salvarBicicleta`, `removerBicicleta`, `enviarFoto`, `removerFoto`, todas com `Resultado<T>`, identidade obtida de getUser e sem usuário arbitrário de formulário como autoridade. Consultas retornam URLs assinadas somente ao dono.

- [ ] Escrever e observar RED para CPF/idade opcionais, CNPJ condicionado ao vínculo, imagem inválida/excedente e falha de gravação com rascunho preservado.
- [ ] Implementar validações no cliente e servidor; CPF/idade/oficina também no banco. Reutilizar regras atuais de nome/telefone.
- [ ] Implementar CRUD de múltiplas bicicletas e fotos privadas. Trocar foto gravando nova referência antes de limpar antiga; proteção concorrente por comparação da referência.
- [ ] Testar dois envios simultâneos, falha após upload e tentativa de apagar foto ativa; exigir confirmação ao limpar oficina por mudança de vínculo/CNPJ.
- [ ] Integrar o card de senha existente abaixo dos dados, sem substituí-lo pelo módulo antigo. Testes GREEN, typecheck e commit.

## Task 4: Locais, acessibilidade, ajuda e status

**Files:** componentes `Locais`, `Acessibilidade`, `AjudaDoPerfil`, `StatusDoPerfil`; consultas/ações correspondentes; integração com `AreaLogada` sem alterar outra conta.

**Interfaces:** locais salvos privados e endereços dos próprios chamados; preferências `texto_ampliado`, `alto_contraste`, `reduzir_movimentos`; status derivado dos campos obrigatórios, sem armazenar aprovação fictícia.

- [ ] RED: conta nova tem estados vazios reais; falha de consulta não vira vazio; preferências não vazam entre contas.
- [ ] Implementar CRUD de locais sem capturar GPS ou endereços de clientes para oficina; preferências persistidas aplicadas à área autenticada.
- [ ] Implementar ajuda por papel e status verificável. Fotos/CPF/idade opcionais não geram pendência obrigatória.
- [ ] GREEN de componentes e autorização, typecheck e commit.

## Task 5: Favoritos, avaliações, mensagens e atividade

**Files:** componentes compartilhados de seção e consultas em `src/lib/perfil-completo/`; reutilizar `src/lib/mensagens.ts`, favoritos do ciclista e avaliações existentes.

**Interfaces:** listas paginadas com cursor por data/ID; caixa de mensagens por chamados próprios, filtros enviadas/recebidas; conversas usam chat existente e leitura somente quando abertas/visíveis. Atividade combina chamados e eventos privados, sem prometer auditoria de todos os cliques.

- [ ] RED: favorito mecânico limita-se a cliente de chamado próprio; favorito não libera conversa; terceiro não lê mensagens; falha distingue-se de lista vazia.
- [ ] Integrar favoritos reais por papel e avaliações reais recebidas, com média/quantidade e estado vazio sem notas fictícias.
- [ ] Integrar caixa enviada/recebida sem nova tabela de chat e sem ampliar estados permitidos; preservar rascunho em erro e evitar repetição automática de envio incerto.
- [ ] Atividade paginada apenas de eventos reais autorizados; testes GREEN e commit.

## Task 6: Telas reais, regressão e validação local

**Files:** `src/app/ciclista/perfil/page.tsx`; `src/app/mecanico/perfil/page.tsx`; estrutura de navegação em `src/components/perfil/`; `docs/testes-perfis-completos.md`.

**Interfaces:** navegação por URL com indicação de seção atual; páginas autenticadas carregam dados do dono, sem props de prévia. Manter prévia visual de desenvolvimento identificada e sem mutações reais.

- [ ] RED: ambos os papéis encontram todas as seções solicitadas, Senha abaixo dos dados e notificações/instalação preservadas; salvar atualiza cabeçalho/painel.
- [ ] Integrar componentes nas rotas reais com carregamento, erro, vazio e retry; confirmar teclado/foco e nenhuma rolagem horizontal em 360/390 px e desktop.
- [ ] Executar `npm test`, `npm run test:db`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`; exigir exit 0.
- [ ] Revisão independente do diff completo e correções importantes com testes RED→GREEN.
- [ ] Documentar testes reais pendentes: aplicar migrations no ambiente escolhido, persistência após login, três contas para RLS, fotos e push em aparelho. Não declarar integração remota validada sem executar esses testes.
- [ ] Abrir versão local para validação, sem push/merge/deploy automático.
