# Perfil completo do mecânico — desenho proposto

Estado: ampliação e plano aprovados pelo usuário em 21/11/2026. CNPJ obrigatório somente para quem estiver vinculado a uma oficina. Implementação local autorizada; ambiente remoto precisa ser identificado antes da aplicação. Nenhuma funcionalidade deste documento está sendo declarada pronta.

## Objetivo

Ampliar /mecanico/perfil no padrão visual do perfil do ciclista: dados pessoais e foto, oficina e fachada, clientes favoritos, avaliação recebida, acessibilidade, ajuda, status, mensagens e atividade. Preservar senha, instalação do app, disponibilidade e fluxo de atendimento. A implementação real do perfil do ciclista continua pendente; não tratá-la como dependência já entregue.

## Abordagens

- Integração real no Next.js/Supabase existentes: proposta recomendada, coerente com o pedido anterior de funcionalidades persistidas. Reaproveita Auth, chat, avaliações e instalação do app, mas exige migrations e testes de acesso.
- Apenas prévia navegável: útil para demonstrar aparência, mas sem persistência e não atende à integração real solicitada no contexto.
- Serviço externo de cadastro/chat: acrescentaria fornecedor e contas sem necessidade identificada; fora do escopo.

A arquitetura acima é proposta técnica do implementador, não uma nova escolha já confirmada pelo usuário. Este documento requer aprovação antes do código de produto.

## Base e integração

Trabalhar sobre a branch isolada com origin/dev integrada em 33a6c7c, preservando mudanças posteriores da equipe mediante nova checagem antes de implementar. Não sobrescrever a pasta principal suja nem a prévia. Nenhum push, merge de volta em dev/main, deploy, conta real ou migration remota autorizado por este desenho.

O perfil atual contém nome, WhatsApp e oficina opcional; campo vazio exibe mecânico autônomo. A dev já tem chat na tabela mensagens, avaliações, geolocalização, recuperação de senha e PWA. Reaproveitar isso, sem uma segunda caixa de mensagens baseada em outra tabela.

## Organização

Navegação por URL, com seções:

1. Dados pessoais: nome completo, foto do perfil, CPF, idade, WhatsApp.
2. Senha: card abaixo dos dados pessoais, com senha atual e confirmação; preservar o componente real já implementado, assim como Notificações e InstalarApp.
3. Oficina: vínculo, CNPJ, nome, endereço e foto da fachada.
4. Clientes favoritos.
5. Sua avaliação.
6. Acessibilidade.
7. Ajuda.
8. Status do perfil.
9. Mensagens enviadas e recebidas.
10. Sua atividade.

Manter instalar app acessível. Campos são agrupados em seções, não uma aba isolada para cada campo. Navegação responsiva, teclado, foco visível, estados de carregamento, vazio, erro e confirmação real.

## Vínculo e obrigatoriedade

Escolha explícita: autônomo ou vinculado a uma oficina. Inicializar contas existentes pela presença do nome da oficina; não inferir vínculo por localização ou outra conta.

- Autônomo: não exigir nem enviar CNPJ da oficina. Não exigir nome de oficina. Pode salvar nome e WhatsApp sem dados empresariais.
- Vinculado: nome da oficina e CNPJ obrigatórios para salvar essa seção. Endereço e fachada disponíveis; não torná-los obrigatórios sem nova solicitação.
- CPF e idade opcionais e privados, como no perfil do ciclista.
- CNPJ validado no cliente e servidor e protegido por restrição no banco coerente com vínculo. Aceitar os formatos vigentes no momento da implementação, verificando documentação oficial antes de escrever o validador. Validação sintática não verifica existência da empresa ou vínculo empregatício.
- Conta antiga vinculada e sem CNPJ aparece com cadastro empresarial incompleto. Continua podendo acessar histórico, mensagens e atendimentos; não introduzir bloqueio no socorro ou na disponibilidade sem autorização.
- Tornar-se autônomo limpa os dados específicos da oficina somente após confirmação explícita de remoção, numa transação. Cancelar preserva tudo. A remoção secundária da fachada ocorre após confirmar o novo estado.
- Trocar CNPJ de uma oficina já cadastrada não pode manter silenciosamente fachada/endereço da anterior: solicitar confirmação da troca e limpar esses dados na mesma transação; se apenas corrigir nome/endereço mantendo CNPJ, preservá-los.

## Dados e permissões

Nome, WhatsApp e nome da oficina mantêm o contrato público existente. CPF, idade, CNPJ, endereço cadastrado e caminhos das fotos ficam em registros privados do mecânico, fora das consultas compartilhadas de perfis e de metadados públicos do Auth.

Inicialmente as fotos e o endereço empresarial são exibidos somente no próprio perfil; exposição para ciclistas exige decisão futura. Nunca copiar endereço de chamados de clientes para o endereço da oficina.

Server Actions autenticam com getUser e conferem tipo mecânico; IDs do formulário não são autoridade. RLS e grants mínimos impedem leitura e escrita por outro mecânico, ciclista ou anônimo. Dados pessoais e oficina são salvos atomicamente dentro da respectiva seção. Nenhum CPF, CNPJ, senha, texto de mensagem ou endereço entra nos eventos ou logs.

## Fotos e senha

Fotos de perfil e fachada: bucket privado, caminhos por usuário e finalidade, UUID gerado no servidor, JPG/PNG/WebP até 5 MB, assinatura e MIME conferidos no servidor, URLs assinadas de curta duração. Troca com referência comparada atomicamente; nunca apagar foto ativa antes de salvar a nova. Falha de limpeza não transforma um salvamento confirmado em falha de gravação.

Senha: Supabase Auth, senha atual, nova senha e confirmação; reautenticar a mesma conta antes de updateUser. Não guardar senhas. Preservar a recuperação por e-mail existente.

## Favoritos e avaliação

Proposta de implementação: somente clientes que já participaram de um chamado com o mecânico podem ser adicionados aos favoritos. Lista privada por mecânico; adicionar/remover não notifica o cliente e não libera contato ou dados antes negados pelo RLS. Não altera a lista de mecânicos favoritos do ciclista.

Sua avaliação mostra apenas avaliações reais recebidas dos ciclistas em atendimentos concluídos, com média e quantidade. Sem notas exemplificadas para conta nova, sem edição das notas pelo mecânico.

## Mensagens

Reaproveitar tabela mensagens, RLS e conversa atuais da dev. Listar apenas chamados dos quais o usuário participa, com filtro enviadas/recebidas e paginação estável. Manter a regra atual: enviar durante aceito, a_caminho e em_atendimento; chamados encerrados ficam para leitura. Não permitir falar com cliente arbitrário apenas por estar nos favoritos. Sem envio externo ou anexos.

Marcar leitura apenas na conversa aberta e visível, nunca ao carregar resumos da caixa. Preservar rascunho em falha e não repetir automaticamente envio cujo resultado ficou incerto.

Esta regra do chat atual difere do desenho antigo do ciclista que permitia envio em concluido: a proposta aqui preserva a regra implantada pela equipe. Harmonizar o plano do ciclista antes de implementar sua caixa, sem ampliar permissão silenciosamente.

## Acessibilidade, ajuda, status e atividade

Preferências persistidas por conta: texto ampliado, alto contraste e movimento reduzido, aplicadas na área autenticada do mecânico. Não se aplicam a outra conta nem significam certificação de acessibilidade.

Ajuda descreve cadastro, vínculo, disponibilidade/localização, chamados, estimativa, chat, encerramento, histórico, avaliações, favoritos e instalação. Projeto acadêmico de estudantes de Administração da FICR, sem serviço comercial nem canal de atendimento; não inventar suporte.

Status mostra apenas completude verificável: nome/WhatsApp e, quando vinculado, nome da oficina/CNPJ. CPF, idade e fotos opcionais não geram pendência. Declarar ausência de análise de diretrizes; não inventar aprovação, punição, selo ou verificação documental.

Atividade reúne eventos reais de chamados e alterações de perfil/oficina/favoritos. Novos eventos gerados no banco sem aceitar eventos arbitrários do cliente, privados ao dono, paginados. Não prometer auditoria de todas as interações nem rastrear cliques.

## Validação e entrega

- Testes de validação de vínculo/CNPJ: autônomo sem CNPJ, vinculado sem CNPJ/nome, formatos válidos e inválidos, troca de vínculo e migração de conta antiga.
- Testes SQL com dono, outro mecânico, ciclista participante, terceiro e anônimo; transações que falham não deixam alterações parciais.
- Fotos: formato/tamanho, acesso de terceiro, concorrência e falhas entre upload, salvamento e limpeza.
- Senha incorreta/confirmação divergente/sessão expirada/erro do Auth/sucesso.
- Favorito apenas cliente de chamado próprio; terceiro não lê lista. Chat real mantém acesso e regras da dev.
- Recarregar e entrar novamente preserva os dados; erro mantém rascunho, cancelar não grava.
- 360 × 640, 390 × 844 e desktop, teclado, sem rolagem horizontal.
- TypeScript, lint, testes unitários/SQL, build e revisão independente antes de concluir.
- Sem credenciais remotas disponíveis, aplicação de migrations e testes com contas reais permanecem pendentes e devem ser informados. Não anunciar integração remota como concluída por testes locais.

## Decisões propostas para aprovação

Além da regra de CNPJ já confirmada: agrupar campos em seções; CPF/idade opcionais e privados; endereço/fotos/CNPJ inicialmente privados; favoritos limitados a clientes de chamados próprios; chat conforme a dev; status de completude sem bloquear atendimentos existentes.

Detalhes de componentes, mensagens de erro, organização de testes e paginação ficam a cargo da implementação. Publicação de dados empresariais, bloqueio por cadastro e moderação não foram delegados.
