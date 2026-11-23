import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/DocumentoLegal";

export const metadata: Metadata = { title: "Política de privacidade · SOS Bikes" };

export default function PrivacidadePage() {
  return (
    <DocumentoLegal titulo="Política de privacidade">
      <section>
        <h2>1. Dados utilizados e finalidades</h2>
        <ul>
          <li>Nome, e-mail, senha, perfil e telefone: criar a conta, autenticar e permitir comunicação sobre o atendimento. A autenticação é realizada pelo Supabase Auth.</li>
          <li>Oficina e disponibilidade do mecânico: apresentar profissionais para o ciclista escolher.</li>
          <li>Especialidades, serviços e bairro ou região informados pelo mecânico: compor o perfil profissional exibido a usuários autenticados.</li>
          <li>Fotos escolhidas pelo mecânico: exibição no perfil. Os arquivos ficam em um armazenamento público e podem ser acessados por quem tiver a URL; não publique imagens sem autorização.</li>
          <li>Endereço ou referência digitada, defeito e detalhes do pedido: organizar e realizar o socorro. Se você usar a localização do celular, guardamos as coordenadas daquele momento junto com o chamado. Não acompanhamos sua posição em segundo plano. Mapas: OpenStreetMap.</li>
          <li>Mecânicos: a localização é salva ao ficar disponível e usada para mostrar a distância aos ciclistas, de forma aproximada (cerca de 100 m).</li>
          <li>Histórico, estimativas, valores, gorjetas registradas e avaliações: acompanhar atendimentos e apresentar resumos. Não solicitamos dados de cartão.</li>
          <li>Mensagens do chat do chamado: comunicação entre o ciclista e o mecânico durante o atendimento. Só os dois participantes leem a conversa, que fica no histórico do chamado.</li>
          <li>Notificações: se você ativar, guardamos o endereço que o seu navegador gera para receber avisos. Ele é usado só para avisos do atendimento (chamados, respostas e mensagens) e apagado quando você desativa.</li>
          <li>Mecânicos favoritos: permitir encontrar e chamar novamente os profissionais salvos por você.</li>
          <li>Meu perfil: CPF e idade opcionais ficam privados ao titular. Bicicletas, fotos e locais salvos organizam o cadastro do ciclista. Mecânicos vinculados a uma oficina informam nome e CNPJ; CNPJ, endereço e foto da fachada ficam privados nesta versão. Validar o formato do documento não verifica a identidade ou o vínculo.</li>
          <li>Clientes favoritos do mecânico: lista privada limitada a pessoas dos seus próprios chamados. Preferências de acessibilidade ficam salvas por conta. A atividade registra alterações de cadastro e a situação dos chamados, sem rastrear todos os cliques ou registrar documentos e textos de mensagens nos eventos.</li>
        </ul>
      </section>
      <section>
        <h2>2. Local do atendimento e sua escolha</h2>
        <p>Depois do login, explicamos para que serve a localização e você escolhe se quer ativá-la. Se ativar, o app lê a posição do aparelho ao abrir a área do ciclista, para mostrar os mecânicos mais próximos e preencher o endereço do pedido; não acompanhamos sua posição em segundo plano. Se não ativar, você digita o endereço. Sem endereço não é possível enviar o pedido de socorro. As coordenadas são usadas para calcular a distância dos mecânicos e só ficam guardadas quando você envia o pedido. Você pode retirar a permissão nas configurações do navegador.</p>
      </section>
      <section>
        <h2>3. Quem pode acessar</h2>
        <p>Os participantes do chamado podem consultar o endereço, o histórico desse atendimento e os dados de contato necessários à comunicação. As avaliações são visíveis aos dois participantes; a nota agregada pode aparecer no perfil e na escolha de mecânicos. Um comentário só aparece no perfil do mecânico se o ciclista autorizar sua publicação ao avaliar; essa autorização pode ser retirada nos detalhes do chamado. Perfis profissionais e fotos são exibidos a usuários autenticados, mas as imagens podem ser acessadas por quem tiver a URL. Dados de ciclistas são acessíveis ao próprio titular e a participantes dos seus chamados.</p>
        <p className="mt-2">Documentos privados, idade, preferências, bicicletas, locais salvos e fotos do Meu perfil não fazem parte dessas consultas compartilhadas. Fotos ficam em armazenamento privado com links temporários acessíveis ao titular; os metadados da imagem são removidos no fluxo de envio pelo aplicativo.</p>
        <p className="mt-2">O Supabase fornece autenticação e banco de dados; a hospedagem do projeto usa a Vercel. O OpenStreetMap (Nominatim) recebe as coordenadas para devolver o endereço escrito. Regiões de armazenamento, condições de transferência internacional e eventuais fornecedores adicionais precisam ser confirmados pelo responsável antes da operação com dados reais. Ao abrir WhatsApp ou fazer uma ligação, aplicam-se também as regras do serviço de comunicação escolhido.</p>
      </section>
      <section>
        <h2>4. Fundamentos e escolhas</h2>
        <p>Dados necessários ao pedido de atendimento podem ser tratados para executar o serviço solicitado, conforme a LGPD. Quando um tratamento depender de consentimento, sua finalidade deve ser específica e a escolha pode ser revogada. O aceite dos termos não autoriza usos genéricos, publicidade ou venda de dados. O SOS Bikes é um projeto acadêmico, não um serviço comercial.</p>
      </section>
      <section>
        <h2>5. Armazenamento e segurança</h2>
        <p>A sessão utiliza cookies de autenticação. O app utiliza controle de acesso por conta no banco. Na versão atual, os dados permanecem na conta e no histórico, e não há exclusão automática por prazo. Os prazos de retenção e o procedimento de exclusão precisam ser definidos pelo responsável, considerando a finalidade e as hipóteses legais de conservação. Não inclua dados sensíveis em endereços, comentários ou descrições.</p>
      </section>
      <section>
        <h2>6. Seus direitos</h2>
        <p>Você pode solicitar confirmação e acesso aos dados, correção, informações de compartilhamento, anonimização, bloqueio ou exclusão quando cabíveis e portabilidade nos termos da regulamentação. Também pode revogar consentimentos e questionar tratamentos. O projeto não possui canal de atendimento; não há, nesta versão acadêmica, um fluxo de solicitações de privacidade implementado. Alguns registros podem precisar ser conservados por obrigação legal ou exercício de direitos.</p>
      </section>
      <section>
        <h2>7. Referências</h2>
        <p>Este documento considera a <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noopener noreferrer">Lei Geral de Proteção de Dados Pessoais — Lei nº 13.709/2018</a> e as <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" target="_blank" rel="noopener noreferrer">orientações da ANPD sobre direitos dos titulares</a>. Sua publicação, isoladamente, não certifica a conformidade do serviço.</p>
      </section>
    </DocumentoLegal>
  );
}
