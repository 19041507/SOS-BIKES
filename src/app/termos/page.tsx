import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal } from "@/components/DocumentoLegal";

export const metadata: Metadata = { title: "Termos de uso · SOS Bikes" };

export default function TermosPage() {
  return (
    <DocumentoLegal titulo="Termos de uso">
      <section>
        <h2>1. Sobre o SOS Bikes</h2>
        <p>O SOS Bikes é um projeto acadêmico desenvolvido por estudantes do curso de Administração da FICR. Não é um serviço comercial e não há canal de atendimento. O aplicativo demonstra um fluxo de socorro entre ciclistas e mecânicos. Os mapas são ilustrativos e não oferecem navegação ou rastreamento por GPS.</p>
      </section>
      <section>
        <h2>2. Conta e informações</h2>
        <p>Forneça dados corretos de nome, e-mail, telefone e perfil. Proteja sua senha e use somente contas e informações que você está autorizado a utilizar. Mecânicos devem manter a disponibilidade e as informações da oficina atualizadas. Não inclua documentos, dados bancários ou informações de terceiros nos campos livres.</p>
      </section>
      <section>
        <h2>3. Pedidos e atendimento</h2>
        <p>O ciclista informa o defeito e o endereço do atendimento e escolhe um mecânico. O pedido depende de aceite, estimativa de preço e tempo, e confirmação do ciclista. A disponibilidade pode mudar. O tempo de chegada é estimado. Use o serviço em local seguro; o SOS Bikes não é um serviço de emergência.</p>
      </section>
      <section>
        <h2>4. Valores e pagamento</h2>
        <p>O valor final pode variar conforme o serviço realizado; o mecânico informa o motivo ao concluir. Pagamento e gorjeta são combinados e realizados diretamente entre os participantes. O app registra os valores e calcula uma comissão de 10% sobre o serviço concluído; não processa pagamentos nem armazena dados de cartão.</p>
      </section>
      <section>
        <h2>5. Conduta e avaliações</h2>
        <p>Trate os participantes com respeito. Não publique informações falsas, ofensivas, discriminatórias ou dados pessoais desnecessários. Ciclista e mecânico podem avaliar um ao outro após um atendimento concluído. Utilize telefone e endereço recebidos somente para tratar do atendimento.</p>
      </section>
      <section>
        <h2>6. Dados pessoais e alterações</h2>
        <p>Leia a <Link href="/privacidade">Política de Privacidade</Link> para conhecer os dados utilizados e seus direitos. O compartilhamento do local é apresentado antes do campo de endereço. Atualizações destes termos serão identificadas pela data da versão. Estes termos não afastam direitos previstos na legislação aplicável.</p>
      </section>
    </DocumentoLegal>
  );
}
