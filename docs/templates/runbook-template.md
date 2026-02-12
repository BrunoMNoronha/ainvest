# [RB-XXX] Nome do Procedimento

**Última atualização**: YYYY-MM-DD  
**Autor**: Nome  
**Revisor**: Nome

## Visão Geral

Breve descrição do procedimento e seu propósito.

## Quando Executar

Descreva as situações que requerem a execução deste runbook:

- Gatilho 1 (ex: alerta de monitoramento)
- Gatilho 2 (ex: solicitação de usuário)
- Gatilho 3 (ex: manutenção programada)

## Pré-requisitos

### Acessos Necessários

| Sistema | Nível de Acesso | Como Obter |
|---------|-----------------|------------|
| Sistema 1 | Admin | Solicitar via X |
| Sistema 2 | Read/Write | Solicitar via Y |

### Ferramentas

- [ ] Ferramenta 1 instalada
- [ ] Ferramenta 2 configurada
- [ ] Credenciais disponíveis

### Informações a Coletar

Antes de iniciar, tenha em mãos:
- Informação 1
- Informação 2

## Procedimento

### Passo 1: [Nome do Passo]

**Objetivo**: O que este passo alcança.

**Comandos**:
```bash
# Comando a executar
comando --opcao valor
```

**Verificação**: Como confirmar que funcionou.

**Output esperado**:
```
Exemplo de output esperado
```

---

### Passo 2: [Nome do Passo]

**Objetivo**: O que este passo alcança.

**Interface**:
1. Acessar URL X
2. Navegar para seção Y
3. Clicar em botão Z

**Verificação**: Como confirmar que funcionou.

---

### Passo 3: [Nome do Passo]

**Objetivo**: O que este passo alcança.

⚠️ **ATENÇÃO**: Aviso importante sobre este passo.

**Comandos**:
```bash
# Comando crítico - verificar duas vezes antes de executar
comando-critico --force
```

---

## Verificação de Sucesso

Como confirmar que o procedimento foi bem-sucedido:

- [ ] Verificação 1
- [ ] Verificação 2
- [ ] Verificação 3

### Testes Funcionais

```bash
# Teste para confirmar sucesso
curl -X GET "https://..." | jq '.status'
# Esperado: "ok"
```

## Rollback

Se algo der errado, siga estes passos para reverter:

### Passo 1: [Ação de Rollback]

```bash
# Comando de rollback
```

### Passo 2: [Ação de Rollback]

```bash
# Comando de rollback
```

### Verificação Pós-Rollback

- [ ] Sistema voltou ao estado anterior
- [ ] Sem erros nos logs
- [ ] Usuários não impactados

## Troubleshooting

### Problema 1: [Descrição]

**Sintomas**:
- Sintoma 1
- Sintoma 2

**Causa provável**: Explicação.

**Solução**:
```bash
# Comando para resolver
```

---

### Problema 2: [Descrição]

**Sintomas**:
- Sintoma 1

**Causa provável**: Explicação.

**Solução**: Passos para resolver.

---

## Comunicação

### Antes de Iniciar

- [ ] Notificar time via Slack #canal
- [ ] Criar incident (se aplicável)

### Durante a Execução

- [ ] Manter time atualizado a cada X minutos

### Após Conclusão

- [ ] Notificar conclusão
- [ ] Documentar lições aprendidas (se houver)

## Tempo Estimado

| Cenário | Tempo |
|---------|-------|
| Melhor caso | X minutos |
| Caso típico | Y minutos |
| Pior caso | Z minutos |

## Histórico de Execuções

| Data | Executor | Resultado | Observações |
|------|----------|-----------|-------------|
| YYYY-MM-DD | Nome | Sucesso | - |
| YYYY-MM-DD | Nome | Parcial | Rollback necessário |

---

## Referências

- [Link para documentação relacionada]
- [Link para ADR relacionado]
- [Link para ferramenta usada]
