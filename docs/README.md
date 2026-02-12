# AInvest - Documentação

> Plataforma de análise e sinais de trading para o mercado brasileiro (B3)

## 📖 Ordem de Leitura Recomendada

Para melhor compreensão do sistema, recomendamos seguir esta sequência:

| # | Documento | Descrição |
|---|-----------|-----------|
| 1 | [Visão](./01-visao.md) | Missão, público-alvo e proposta de valor |
| 2 | [Produto](./02-produto.md) | Funcionalidades e roadmap |
| 3 | [Estratégias](./03-estrategias.md) | Metodologia SMC e sistema de sinais |
| 4 | [Dados](./04-dados.md) | Fontes de dados e integrações |
| 5 | [Arquitetura](./05-arquitetura.md) | Stack técnico e fluxo de dados |
| 6 | [API](./06-api.md) | Endpoints e referência da API |
| 7 | [Segurança](./07-seguranca.md) | Políticas e práticas de segurança |
| 8 | [Operação](./08-operacao.md) | Runbooks e procedimentos |
| 9 | [Qualidade](./09-qualidade.md) | Testes e métricas |

## 🖥️ Hub de Documentação (In-App)

A aplicação possui um **hub de documentação interativo** acessível via menu lateral em `/docs`:

### Módulos Disponíveis

| Módulo | Rota | Descrição |
|--------|------|-----------|
| **Roadmap** | `/docs/roadmap` | Kanban de funcionalidades com CRUD completo |
| **Estratégias** | `/docs/strategies` | Visualização das estratégias técnicas do projeto |
| **Regras de Negócio** | `/docs/rules` | Gestão de regras organizadas por categoria |
| **Histórico** | `/docs/history` | Timeline de implementações e alterações |

### Tabelas de Suporte

O hub utiliza três tabelas no banco de dados:

- `roadmap_items` - Itens do roadmap com status Kanban
- `business_rules` - Regras de negócio categorizadas
- `development_history` - Registro cronológico de entregas

## 📋 Templates

| Template | Uso |
|----------|-----|
| [ADR Template](./templates/adr-template.md) | Registrar decisões arquiteturais |
| [Runbook Template](./templates/runbook-template.md) | Documentar procedimentos operacionais |
| [Spec Template](./templates/spec-template.md) | Especificar novas funcionalidades |

## 📐 Decisões Arquiteturais (ADRs)

| # | Decisão | Status |
|---|---------|--------|
| [001](./adr/001-cache-swr-upstash.md) | Cache SWR com Upstash Redis | Aceita |
| [002](./adr/002-brapi-hg-brasil.md) | BRAPI + HG Brasil como provedores | Aceita |
| [003](./adr/003-polling-inteligente.md) | Polling baseado em horário de mercado | Aceita |
| [004](./adr/004-armazenamento-sem-particionamento.md) | Armazenamento sem particionamento inicial | Aceita |

## 🔧 Especificações Técnicas

| Recurso | Localização |
|---------|-------------|
| OpenAPI 3.0 | [/openapi/v1.yaml](/openapi/v1.yaml) |
| JSON Schemas | [/schemas](/schemas/) |

## 🤖 Regras para o Lovable

O Lovable deve seguir estas regras ao editar o projeto:

1. **Sempre ler a documentação antes de editar** - Consultar `/docs` para entender decisões
2. **Nunca contradizer decisões documentadas** - Solicitar confirmação se houver conflito
3. **Atualizar documentação após implementações** - Registrar no histórico e roadmap
4. **Comentar código em português** - Todos os comentários em PT-BR
5. **Sugerir próximos passos** - Propor continuações lógicas ao final de cada entrega

## 🤝 Contribuindo com a Documentação

### Convenções

1. **Idioma**: Documentação em PT-BR, termos técnicos em inglês quando apropriado
2. **Nomenclatura de arquivos**: 
   - Documentos: prefixo numérico (`01-visao.md`)
   - ADRs: prefixo de 3 dígitos (`001-cache.md`)
   - Schemas: PascalCase (`MarketOverview.json`)
3. **Links**: Sempre usar caminhos relativos com extensão

### Processo

1. Criar branch a partir de `main`
2. Fazer alterações seguindo os templates
3. Validar links internos
4. Abrir Pull Request com descrição clara

---

**Última atualização**: 03 de Fevereiro de 2026
