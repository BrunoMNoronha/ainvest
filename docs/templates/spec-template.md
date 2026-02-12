# [SPEC-XXX] Título da Funcionalidade

**Status**: Rascunho | Em Revisão | Aprovada | Em Desenvolvimento | Concluída  
**Autor**: Nome  
**Data**: YYYY-MM-DD  
**Versão**: 1.0

## Resumo Executivo

Uma ou duas frases descrevendo a funcionalidade e seu valor.

## Objetivo

### Problema

Descreva o problema que esta funcionalidade resolve:
- Dor do usuário
- Limitação atual
- Oportunidade identificada

### Solução Proposta

Descreva em alto nível como a funcionalidade resolve o problema.

### Métricas de Sucesso

| Métrica | Baseline | Alvo | Prazo |
|---------|----------|------|-------|
| Métrica 1 | X | Y | Z semanas |
| Métrica 2 | X | Y | Z semanas |

## Requisitos Funcionais

### RF-01: [Nome do Requisito]

**Descrição**: O sistema deve [ação].

**Critérios de Aceite**:
- [ ] Dado [contexto], quando [ação], então [resultado]
- [ ] Dado [contexto], quando [ação], então [resultado]

**Prioridade**: Alta | Média | Baixa

---

### RF-02: [Nome do Requisito]

**Descrição**: O sistema deve [ação].

**Critérios de Aceite**:
- [ ] Dado [contexto], quando [ação], então [resultado]

**Prioridade**: Alta | Média | Baixa

---

### RF-03: [Nome do Requisito]

**Descrição**: O sistema deve [ação].

**Critérios de Aceite**:
- [ ] Dado [contexto], quando [ação], então [resultado]

**Prioridade**: Alta | Média | Baixa

## Requisitos Não-Funcionais

### RNF-01: Performance

- Tempo de resposta P95 < X ms
- Suportar Y requisições/minuto

### RNF-02: Disponibilidade

- Uptime > 99.X%
- MTTR < X minutos

### RNF-03: Segurança

- Autenticação requerida para [funcionalidade]
- Dados sensíveis criptografados

### RNF-04: Usabilidade

- Acessível via teclado
- Responsivo (mobile-first)
- Seguir design system existente

## Design

### Wireframes

```
┌─────────────────────────────────────────────┐
│                                             │
│    [Wireframe ou diagrama ASCII]            │
│                                             │
│    Descrição do layout                      │
│                                             │
└─────────────────────────────────────────────┘
```

### Fluxo de Usuário

```
Início
   │
   ▼
[Passo 1]
   │
   ▼
[Passo 2] ──▶ [Alternativa]
   │                │
   ▼                ▼
[Passo 3]      [Passo 3b]
   │                │
   └───────┬────────┘
           ▼
         [Fim]
```

### Protótipo

Link para Figma/protótipo interativo (se disponível).

## Arquitetura Técnica

### Componentes Afetados

| Componente | Tipo de Mudança | Esforço |
|------------|-----------------|---------|
| Component A | Novo | Médio |
| Component B | Modificação | Baixo |
| API X | Novo endpoint | Alto |

### Diagrama de Sequência

```
Frontend      Edge Function      Redis        API Externa
    │               │              │               │
    │── Request ───▶│              │               │
    │               │── Check ────▶│               │
    │               │◀── Miss ─────│               │
    │               │── Fetch ─────────────────────▶│
    │               │◀── Data ─────────────────────│
    │               │── Store ────▶│               │
    │◀── Response ──│              │               │
```

### Modelo de Dados

```typescript
interface NovaEntidade {
  id: string;
  campo1: string;
  campo2: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Changes

```yaml
# Novo endpoint
POST /api/recurso
  Request:
    campo1: string (obrigatório)
    campo2: number (opcional)
  Response:
    201: { id, campo1, campo2, createdAt }
    400: { error: "Validation error" }
    401: { error: "Unauthorized" }
```

## Dependências

### Técnicas

| Dependência | Status | Responsável |
|-------------|--------|-------------|
| Feature X concluída | ✅ Pronto | - |
| API Y disponível | ⏳ Em andamento | Time Z |
| Biblioteca W | ❌ Não iniciado | - |

### Externas

- Aprovação de [stakeholder]
- Acesso a [recurso externo]

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Risco 1 | Alta | Alto | Ação de mitigação |
| Risco 2 | Média | Médio | Ação de mitigação |

## Fora de Escopo

Funcionalidades explicitamente **não** incluídas nesta especificação:

- Funcionalidade X (será tratada em SPEC-YYY)
- Funcionalidade Y (fora do roadmap atual)
- Funcionalidade Z (requer mais pesquisa)

## Cronograma

| Fase | Duração | Início | Término |
|------|---------|--------|---------|
| Design | 1 semana | DD/MM | DD/MM |
| Desenvolvimento | 2 semanas | DD/MM | DD/MM |
| Testes | 1 semana | DD/MM | DD/MM |
| Deploy | 2 dias | DD/MM | DD/MM |

## Aprovações

| Papel | Nome | Status | Data |
|-------|------|--------|------|
| Product Owner | Nome | ⏳ Pendente | - |
| Tech Lead | Nome | ⏳ Pendente | - |
| Designer | Nome | ⏳ Pendente | - |

---

## Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | YYYY-MM-DD | Nome | Versão inicial |
