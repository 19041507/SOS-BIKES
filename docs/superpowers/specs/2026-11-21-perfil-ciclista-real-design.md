# Perfil completo do ciclista — integração real

Estado: aprovado pelo usuário em 21/11/2026, incluindo CPF/idade privados e opcionais, mensagens restritas a participantes e status sem análise de diretrizes fictícia. Execução nativa nesta sessão, conforme preferência já informada.

## Objetivo e escopo confirmado

Substituir o protótipo por funcionalidades reais em `/ciclista/perfil`, preservando a organização visual aprovada e o perfil existente do mecânico. Incluir nome, CPF, idade, WhatsApp, foto de perfil, alteração de senha, várias bicicletas com fotos, localizações utilizadas, favoritos, avaliação recebida, acessibilidade, ajuda, status do perfil, mensagens e atividade.

Não usar dados fictícios, sucessos simulados ou armazenamento apenas na memória na tela real. A prévia de desenvolvimento permanece separada e identificada.

## Abordagens consideradas

1. Prévia navegável: escolhida inicialmente e já entregue para validar a interface; não atende à solicitação atual de persistência real.
2. Integração real com Next.js e Supabase existentes: caminho solicitado agora. Banco, Auth e Storage com permissões por usuário; exige migrations e validação integrada antes da disponibilização.
3. Serviços externos de chat, mídia ou moderação: descartados nesta proposta por acrescentarem fornecedores e contas sem necessidade demonstrada.

## Base e restrições verificadas

- Branch isolada `feat/perfil-ciclista-completo`, a partir da `origin/dev` em `798081b`. A dev já contém #79, #85, #86 e #87; nenhum desses PRs será mesclado novamente.
- A cópia principal contém alterações de outras tarefas; não utilizá-la como fonte de um commit amplo nem sobrescrever arquivos dela.
- `perfis` contém dados consultáveis por participantes de chamados. CPF e idade não entram nessa tabela, nos metadados públicos do Auth ou nas consultas compartilhadas.
- Não há credenciais, configuração local ou ferramenta conectada para administrar o Supabase nesta sessão. Aplicação remota de migrations e teste com contas reais dependem de acesso ao ambiente escolhido.
- Sem merge em dev/main, deploy, criação de contas reais ou envio de mensagens a usuários reais durante a implementação e os testes locais.

## Regras aprovadas

1. CPF e idade opcionais e visíveis somente ao próprio titular. A validação de formato/dígitos do CPF não verifica identidade.
2. Mensagens internas apenas entre os dois participantes de um chamado aceito, em andamento ou concluído, com caixa de entrada para o mecânico também. Sem mensagens a desconhecidos, anexos, comunicação com WhatsApp ou notificações externas.
3. Status mostra dados verificáveis de completude do cadastro e ausência de análise de diretrizes. Sem inventar aprovação, infração, punição ou mecanismo administrativo que não foi definido pelo grupo.

## Dados e controle de acesso

- `dados_privados_ciclistas`: usuário, CPF e idade opcionais, preferências de acessibilidade e caminho da foto. Leitura/escrita apenas pelo dono; validar também no banco o tipo ciclista, limites de idade e formatos. A interface mascara o CPF; nenhum dado pessoal entra em logs.
- `bicicletas`: dono, modelo obrigatório, apelido/cor opcionais, caminho da foto e datas. CRUD somente do dono; múltiplas bicicletas. Não mudar a estrutura dos chamados nem torná-las obrigatórias para pedir socorro.
- `locais_ciclistas`: dono, nome e endereço. CRUD privado; apresentar também endereços realmente usados nos próprios chamados, sem GPS. Não importar automaticamente dados de outras contas nem duplicar registros sem necessidade.
- Favoritos e avaliações recebidas reutilizam as tabelas e políticas já existentes. Média calculada apenas com avaliações reais de chamados concluídos; estado vazio quando não existirem.
- `mensagens_chamados`: chamado, remetente autenticado, texto limitado, data do banco e estado de leitura do destinatário. O banco valida os participantes e o estado elegível do chamado, sem aceitar remetente fornecido pelo cliente como autoridade. Mensagens sem edição ou exclusão nesta primeira versão; leitura por terceiros, anônimos e antigos participantes inexistentes é negada.
- Atividade real: combinar eventos de chamados existentes e eventos novos de perfil/bicicletas/locais. Eventos novos gerados pelo banco para não aceitar atividades forjadas pelo cliente. Registro privado e limitado às ações cobertas; não prometer auditoria completa do sistema. Nunca registrar CPF, senha, conteúdo de mensagens ou imagens no evento.
- Toda tabela nova tem RLS, grants mínimos, índices por dono/chamado/data e políticas de leitura/escrita testadas. Atualizar os tipos gerados e preservar funcionalidades existentes.

## Fotos

- Bucket privado e caminhos separados por usuário, com nomes gerados no servidor e sem nomes de arquivo enviados pelo usuário como identificador.
- JPG, PNG e WebP até 5 MB. Validar tamanho, extensão de saída, tipo e assinatura do arquivo no servidor; não aceitar SVG/HTML.
- Upload via ação autenticada com limite de corpo compatível. Verificar propriedade antes de editar/remover; imagens servidas por URLs assinadas de curta duração apenas ao dono nesta primeira versão.
- Substituição segura: guardar a foto nova, salvar a referência e só então remover a antiga. Se a gravação falhar, limpar o objeto novo. Se a limpeza antiga falhar, registrar falha técnica sem apagar a foto ativa. Não anunciar salvamento quando falhar.
- Foto do perfil inicialmente apenas nesta área privada; exibição pública ou em outras áreas requer decisão explícita posterior.

## Senha e sessão

Usar Supabase Auth com usuário autenticado, confirmação da nova senha, validação no servidor e reautenticação por senha atual antes da alteração. Não armazenar ou registrar senhas. Não reutilizar callbacks de prévia. Erros de sessão, senha atual incorreta e falha do Auth têm mensagens próprias; limpar campos após sucesso.

## Interface e navegação

Preservar as 11 seções do protótipo. Dados pessoais agrupam os quatro campos e a foto. Segurança reúne senha atual/nova/confirmação. Bicicletas e locais têm estados vazios, edição, remoção com confirmação, carregamento e erros recuperáveis. Formulários mantêm rascunhos em falhas.

As seções usam navegação por URL e títulos acessíveis. Celular sem rolagem horizontal, alvos de toque adequados, navegação por teclado e indicação da seção atual. Preferências de acessibilidade reais persistem por conta e se aplicam à área autenticada do ciclista, não ao aparelho nem a outras pessoas.

Mensagens inclui recebidas/enviadas, conversa por chamado, paginação e indicação de leitura somente após consulta efetiva pelo destinatário. Atualização inicial por consulta e atualização manual; Realtime é melhoria opcional, não condição para entregar mensagens persistidas. Acrescentar entrada de mensagens na área do mecânico sem substituir seu formulário de perfil.

Ajuda descreve apenas funcionalidades efetivas. Status não usa exemplos nem texto que pareça certificação real. Atualizar termos/privacidade para descrever dados novos, sem inventar canal de atendimento comercial.

## Sequência de entrega

1. Modelo de dados, RLS, Storage e testes de autorização.
2. Dados pessoais, senha, fotos e bicicletas.
3. Locais, favoritos, avaliações e acessibilidade.
4. Mensagens nos dois perfis, atividade, ajuda e status verificável.
5. Verificação completa, revisão e PR; integração remota somente após migrations e testes reais confirmados.

Todas as etapas fazem parte do escopo; dividir a execução não autoriza chamar uma entrega parcial de completa.

## Critérios de validação

- Lint, TypeScript e build na branch isolada.
- SQL/RLS com usuário dono, outro ciclista, mecânico participante, mecânico alheio e anônimo, inclusive tentativas diretas de API e alteração de IDs.
- Senha: antiga incorreta, confirmação divergente, sessão expirada, erro de Auth e sucesso; nunca apresentar senha nos logs.
- Fotos: imagem válida, assinatura inválida, arquivo excedente, acesso de terceiro, substituição/remoção, falha de upload e gravação.
- Recarregar e entrar novamente mantém dados, bicicletas, locais, mensagens e preferências; cancelar não grava.
- Mensagem enviada como ciclista aparece para o mecânico e vice-versa; terceiros não leem nem inserem e o remetente não pode ser falsificado.
- Avaliações e atividade vêm de dados reais; conta nova mostra estados vazios, não exemplos.
- Navegador em 360 × 640, 390 × 844 e desktop, teclado e preferências de acessibilidade; perfil do mecânico e fluxo normal do pedido continuam funcionando.
- Testes locais isolados não substituem a validação remota com três contas após aplicar as migrations no ambiente correto.

## Decisões delegadas à implementação

Nomes finais de componentes e funções, detalhes de paginação, mensagens de erro, limites razoáveis de texto e organização dos testes. Não delegados: visibilidade de dados pessoais, regra de quem pode conversar, política de análise de diretrizes e escolha do ambiente remoto.
