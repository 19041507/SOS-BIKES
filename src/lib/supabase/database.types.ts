// Tipos do banco no formato do `supabase gen types typescript`.
// Mantenha em sincronia com supabase/migrations. Para regenerar a partir do projeto:
//   npx supabase gen types typescript --project-id <id-do-projeto> > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Privada<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      perfil_privado: Privada<{ usuario_id: string; cpf: string | null; idade: number | null; foto_caminho: string | null; texto_ampliado: boolean; alto_contraste: boolean; reduzir_movimentos: boolean }>;
      oficina_privada: Privada<{ usuario_id: string; vinculado: boolean; cnpj: string | null; endereco: string | null; foto_caminho: string | null }>;
      bicicletas_perfil: Privada<{ id: string; usuario_id: string; modelo: string; apelido: string | null; cor: string | null; foto_caminho: string | null; criado_em: string }>;
      locais_perfil: Privada<{ id: string; usuario_id: string; nome: string; endereco: string; criado_em: string }>;
      clientes_favoritos: Privada<{ usuario_id: string; cliente_id: string; criado_em: string }>;
      atividade_perfil: Privada<{ id: string; usuario_id: string; tipo: string; criado_em: string }>;
      avaliacoes_ciclistas: {
        Row: { chamado_id: string; nota: number; comentario: string | null; criado_em: string };
        Insert: { chamado_id: string; nota: number; comentario?: string | null; criado_em?: string };
        Update: { chamado_id?: string; nota?: number; comentario?: string | null; criado_em?: string };
        Relationships: [{ foreignKeyName: "avaliacoes_ciclistas_chamado_id_fkey"; columns: ["chamado_id"]; isOneToOne: true; referencedRelation: "chamados"; referencedColumns: ["id"] }];
      };
      mecanicos_favoritos: {
        Row: { ciclista_id: string; mecanico_id: string; criado_em: string };
        Insert: { ciclista_id: string; mecanico_id: string; criado_em?: string };
        Update: { ciclista_id?: string; mecanico_id?: string; criado_em?: string };
        Relationships: [
          { foreignKeyName: "mecanicos_favoritos_ciclista_id_fkey"; columns: ["ciclista_id"]; isOneToOne: false; referencedRelation: "perfis"; referencedColumns: ["id"] },
          { foreignKeyName: "mecanicos_favoritos_mecanico_id_fkey"; columns: ["mecanico_id"]; isOneToOne: false; referencedRelation: "perfis"; referencedColumns: ["id"] },
        ];
      };
      inscricoes_push: {
        Row: { id: string; perfil_id: string; endpoint: string; p256dh: string; auth: string; criado_em: string };
        Insert: { id?: string; perfil_id: string; endpoint: string; p256dh: string; auth: string; criado_em?: string };
        Update: { id?: string; perfil_id?: string; endpoint?: string; p256dh?: string; auth?: string; criado_em?: string };
        Relationships: [
          { foreignKeyName: "inscricoes_push_perfil_id_fkey"; columns: ["perfil_id"]; isOneToOne: false; referencedRelation: "perfis"; referencedColumns: ["id"] },
        ];
      };
      mensagens: {
        Row: { id: string; chamado_id: string; autor_id: string; texto: string; criado_em: string; lida_em: string | null };
        Insert: { id?: string; chamado_id: string; autor_id?: string; texto: string; criado_em?: string; lida_em?: string | null };
        Update: { id?: string; chamado_id?: string; autor_id?: string; texto?: string; criado_em?: string; lida_em?: string | null };
        Relationships: [
          { foreignKeyName: "mensagens_chamado_id_fkey"; columns: ["chamado_id"]; isOneToOne: false; referencedRelation: "chamados"; referencedColumns: ["id"] },
          { foreignKeyName: "mensagens_autor_id_fkey"; columns: ["autor_id"]; isOneToOne: false; referencedRelation: "perfis"; referencedColumns: ["id"] },
        ];
      };
      perfis: {
        Row: {
          id: string;
          tipo: Database["public"]["Enums"]["tipo_perfil"];
          nome: string;
          telefone: string | null;
          oficina: string | null;
          disponivel: boolean;
          especialidades: Database["public"]["Enums"]["categoria_defeito"][];
          servicos: string[];
          bairro_regiao: string | null;
          criado_em: string;
        };
        Insert: {
          id: string;
          tipo?: Database["public"]["Enums"]["tipo_perfil"];
          nome: string;
          telefone?: string | null;
          oficina?: string | null;
          disponivel?: boolean;
          especialidades?: Database["public"]["Enums"]["categoria_defeito"][];
          servicos?: string[];
          bairro_regiao?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          tipo?: Database["public"]["Enums"]["tipo_perfil"];
          nome?: string;
          telefone?: string | null;
          oficina?: string | null;
          disponivel?: boolean;
          especialidades?: Database["public"]["Enums"]["categoria_defeito"][];
          servicos?: string[];
          bairro_regiao?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      perfil_mecanico_fotos: {
        Row: {
          id: string;
          mecanico_id: string;
          caminho: string;
          tipo: Database["public"]["Enums"]["tipo_foto_mecanico"];
          descricao: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          mecanico_id: string;
          caminho: string;
          tipo: Database["public"]["Enums"]["tipo_foto_mecanico"];
          descricao: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          mecanico_id?: string;
          caminho?: string;
          tipo?: Database["public"]["Enums"]["tipo_foto_mecanico"];
          descricao?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "perfil_mecanico_fotos_mecanico_id_fkey";
            columns: ["mecanico_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      chamados: {
        Row: {
          id: string;
          ciclista_id: string;
          mecanico_id: string;
          categoria: Database["public"]["Enums"]["categoria_defeito"];
          detalhes: string | null;
          endereco: string;
          latitude: number | null;
          longitude: number | null;
          status: Database["public"]["Enums"]["status_chamado"];
          estimativa: number | null;
          tempo_chegada_min: number | null;
          valor_final: number | null;
          comissao: number | null;
          motivo_variacao: string | null;
          motivo_cancelamento: string | null;
          criado_em: string;
          aceito_em: string | null;
          confirmado_em: string | null;
          chegada_em: string | null;
          concluido_em: string | null;
          encerrado_em: string | null;
        };
        Insert: {
          id?: string;
          ciclista_id: string;
          mecanico_id: string;
          categoria: Database["public"]["Enums"]["categoria_defeito"];
          detalhes?: string | null;
          endereco: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: Database["public"]["Enums"]["status_chamado"];
          estimativa?: number | null;
          tempo_chegada_min?: number | null;
          valor_final?: number | null;
          motivo_variacao?: string | null;
          motivo_cancelamento?: string | null;
          criado_em?: string;
          aceito_em?: string | null;
          confirmado_em?: string | null;
          chegada_em?: string | null;
          concluido_em?: string | null;
          encerrado_em?: string | null;
        };
        Update: {
          id?: string;
          ciclista_id?: string;
          mecanico_id?: string;
          categoria?: Database["public"]["Enums"]["categoria_defeito"];
          detalhes?: string | null;
          endereco?: string;
          latitude?: number | null;
          longitude?: number | null;
          status?: Database["public"]["Enums"]["status_chamado"];
          estimativa?: number | null;
          tempo_chegada_min?: number | null;
          valor_final?: number | null;
          motivo_variacao?: string | null;
          motivo_cancelamento?: string | null;
          criado_em?: string;
          aceito_em?: string | null;
          confirmado_em?: string | null;
          chegada_em?: string | null;
          concluido_em?: string | null;
          encerrado_em?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chamados_ciclista_id_fkey";
            columns: ["ciclista_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chamados_mecanico_id_fkey";
            columns: ["mecanico_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      avaliacoes: {
        Row: {
          chamado_id: string;
          nota: number;
          comentario: string | null;
          gorjeta: number | null;
          comentario_publico: boolean;
          criado_em: string;
        };
        Insert: {
          chamado_id: string;
          nota: number;
          comentario?: string | null;
          gorjeta?: number | null;
          comentario_publico?: boolean;
          criado_em?: string;
        };
        Update: {
          chamado_id?: string;
          nota?: number;
          comentario?: string | null;
          gorjeta?: number | null;
          comentario_publico?: boolean;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "avaliacoes_chamado_id_fkey";
            columns: ["chamado_id"];
            isOneToOne: true;
            referencedRelation: "chamados";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      salvar_perfil_completo: { Args: { operacao: string; dados: Json }; Returns: undefined };
      trocar_foto_perfil: { Args: { destino: string; item_id: string | null; antiga: string | null; nova: string | null }; Returns: boolean };
      listar_secao_perfil: { Args: { secao: string; antes?: string; antes_id?: string }; Returns: Json };
      resumo_avaliacao_perfil: { Args: never; Returns: Json };
      meus_mecanicos_favoritos: {
        Args: never;
        Returns: { id: string; nome: string; oficina: string | null; disponivel: boolean; media: number | null; avaliacoes: number; atendimentos: number }[];
      };
      mecanicos_disponiveis: {
        Args: { lat?: number; lng?: number };
        Returns: {
          id: string;
          nome: string;
          oficina: string | null;
          telefone: string | null;
          media: number | null;
          avaliacoes: number;
          atendimentos: number;
          latitude: number | null;
          longitude: number | null;
          distancia_km: number | null;
        }[];
      };
      perfil_publico_mecanico: {
        Args: { mecanico: string };
        Returns: {
          id: string;
          nome: string;
          oficina: string | null;
          bairro_regiao: string | null;
          especialidades: Database["public"]["Enums"]["categoria_defeito"][];
          servicos: string[];
          media: number | null;
          avaliacoes: number;
          atendimentos: number;
        }[];
      };
      avaliacoes_publicas_do_mecanico: {
        Args: { mecanico: string };
        Returns: { nota: number; comentario: string }[];
      };
      salvar_inscricao_push: {
        Args: { endereco: string; chave_p256dh: string; chave_auth: string };
        Returns: undefined;
      };
      marcar_mensagens_lidas: {
        Args: { chamado: string };
        Returns: undefined;
      };
      atualizar_minha_localizacao: {
        Args: { lat: number; lng: number };
        Returns: undefined;
      };
      localizacao_do_mecanico_do_chamado: {
        Args: { chamado: string };
        Returns: { latitude: number; longitude: number }[];
      };
    };
    Enums: {
      tipo_perfil: "ciclista" | "mecanico";
      tipo_foto_mecanico: "perfil" | "trabalho";
      categoria_defeito: "pneu" | "corrente" | "freio" | "roda" | "selim";
      status_chamado:
        | "aguardando"
        | "aceito"
        | "a_caminho"
        | "em_atendimento"
        | "concluido"
        | "recusado"
        | "cancelado"
        | "expirado";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tabela<Nome extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][Nome]["Row"];
export type Enum<Nome extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][Nome];

export type Perfil = Tabela<"perfis">;
export type Chamado = Tabela<"chamados">;
export type Avaliacao = Tabela<"avaliacoes">;
export type AvaliacaoCiclista = Tabela<"avaliacoes_ciclistas">;
export type StatusChamado = Enum<"status_chamado">;
export type Mensagem = Tabela<"mensagens">;
