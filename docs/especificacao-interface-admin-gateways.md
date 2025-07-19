# Especificação - Interface Admin para Gateways SMS
*SMS Marketing Angola - Fase 2: Interface Administrativa*

## 1. Visão Geral

Esta especificação define a interface administrativa para gerenciar os gateways BulkSMS e BulkGate, permitindo configuração, monitoramento e controle de fallback entre provedores.

## 2. Página Principal: Configurações → Gateways SMS

### 2.1 Layout da Página

```jsx
// Estrutura da página AdminSMSGateways.tsx
<div className="space-y-8 p-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h1>Configurações de SMS</h1>
    <Button variant="outline">Histórico Completo</Button>
  </div>

  {/* Controles Globais */}
  <Card className="p-6">
    <h3>Gateway Primário e Fallback</h3>
    <RadioGroup value={primaryGateway} onValueChange={setPrimaryGateway}>
      <RadioGroupItem value="bulksms">BulkSMS (Atual)</RadioGroupItem>
      <RadioGroupItem value="bulkgate">BulkGate</RadioGroupItem>
    </RadioGroup>
    <Checkbox checked={fallbackEnabled}>Usar Fallback Automático</Checkbox>
  </Card>

  {/* Grid de Gateways */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <BulkSMSConfigCard />
    <BulkGateConfigCard />
  </div>

  {/* Estatísticas */}
  <GatewayStatsSection />
</div>
```

### 2.2 Cards de Gateway

#### BulkSMS Card (Esquerda)
```jsx
<Card className="p-6">
  <CardHeader>
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2">
        <Icons.MessageSquare className="w-5 h-5" />
        BulkSMS
        {isPrimary && <Badge variant="primary">Primário</Badge>}
      </h3>
      <StatusIndicator status={bulkSmsStatus} />
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* Status e Métricas */}
    <div className="grid grid-cols-2 gap-4">
      <Metric label="Status" value="Conectado" color="green" />
      <Metric label="Créditos" value="1,250" />
      <Metric label="SMS Enviados" value="3,847" />
      <Metric label="Taxa Sucesso" value="98.5%" />
    </div>

    {/* Configurações Existentes */}
    <div className="space-y-3">
      <Input label="Token ID" value={tokenId} type="password" />
      <Input label="Token Secret" value="••••••••" type="password" />
      <Input label="Sender ID Padrão" value={defaultSender} />
      <Input label="Custo por SMS" value="0.50" suffix="Kz" />
    </div>

    {/* Ações */}
    <div className="flex gap-2">
      <Button variant="outline" onClick={testBulkSMS}>
        <Icons.Zap className="w-4 h-4" />
        Testar Conexão
      </Button>
      <Button onClick={saveBulkSMS}>
        Salvar Configurações
      </Button>
    </div>
  </CardContent>
</Card>
```

#### BulkGate Card (Direita)
```jsx
<Card className="p-6">
  <CardHeader>
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2">
        <Icons.Send className="w-5 h-5" />
        BulkGate
        {isPrimary && <Badge variant="primary">Primário</Badge>}
      </h3>
      <StatusIndicator status={bulkGateStatus} />
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4">
    {/* Status e Métricas */}
    <div className="grid grid-cols-2 gap-4">
      <Metric label="Status" value="Conectado" color="green" />
      <Metric label="Créditos" value="2,100" />
      <Metric label="SMS Enviados" value="156" />
      <Metric label="Taxa Sucesso" value="99.2%" />
    </div>

    {/* Configurações BulkGate */}
    <div className="space-y-3">
      <Input 
        label="Application ID" 
        value="35101" 
        disabled 
        description="Fixo para SMS Marketing Angola" 
      />
      <Input 
        label="Application Token" 
        value="••••••••••••••••••••••••••••••••••••••••••••••••••••••" 
        type="password" 
      />
      <Input label="Sender ID Padrão" value="SMSao" />
      <Input label="Custo por SMS" value="0.45" suffix="Kz" />
    </div>

    {/* Ações */}
    <div className="flex gap-2">
      <Button variant="outline" onClick={testBulkGate}>
        <Icons.Zap className="w-4 h-4" />
        Testar Conexão
      </Button>
      <Button onClick={saveBulkGate}>
        Salvar Configurações
      </Button>
    </div>
  </CardContent>
</Card>
```

## 3. Seleção de Gateway Primário e Fallback

### 3.1 Controles Globais

```jsx
const GatewayControls = () => {
  const [config, setConfig] = useState({
    primaryGateway: 'bulksms', // 'bulksms' | 'bulkgate'
    fallbackEnabled: true,
    fallbackDelay: 30 // segundos
  });

  return (
    <Card className="p-6 mb-6">
      <CardHeader>
        <h3>Configuração Global de Gateways</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label>Gateway Primário</Label>
          <RadioGroup 
            value={config.primaryGateway} 
            onValueChange={(value) => setConfig({...config, primaryGateway: value})}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bulksms" id="primary-bulksms" />
              <Label htmlFor="primary-bulksms">BulkSMS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bulkgate" id="primary-bulkgate" />
              <Label htmlFor="primary-bulkgate">BulkGate</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="fallback-enabled"
            checked={config.fallbackEnabled}
            onCheckedChange={(checked) => setConfig({...config, fallbackEnabled: checked})}
          />
          <Label htmlFor="fallback-enabled">
            Usar Fallback Automático
          </Label>
        </div>

        {config.fallbackEnabled && (
          <div>
            <Label>Delay para Fallback (segundos)</Label>
            <Input 
              type="number" 
              value={config.fallbackDelay}
              onChange={(e) => setConfig({...config, fallbackDelay: parseInt(e.target.value)})}
              className="w-32"
            />
          </div>
        )}

        <Button onClick={saveGlobalConfig}>
          Salvar Configuração Global
        </Button>
      </CardContent>
    </Card>
  );
};
```

### 3.2 API Endpoints

```javascript
// POST /api/admin/gateway-config
{
  "primaryGateway": "bulkgate",
  "fallbackEnabled": true,
  "fallbackDelay": 30
}

// Response:
{
  "success": true,
  "config": {
    "primaryGateway": "bulkgate",
    "fallbackEnabled": true,
    "fallbackDelay": 30,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## 4. Sender IDs Multi-Gateway

### 4.1 Página Sender IDs Atualizada

```jsx
const SenderIDsTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sender ID</TableHead>
          <TableHead>Gateways Suportados</TableHead>
          <TableHead>Status BulkSMS</TableHead>
          <TableHead>Status BulkGate</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {senderIds.map((sender) => (
          <TableRow key={sender.id}>
            <TableCell className="font-medium">{sender.name}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Badge 
                  variant={sender.supportsBulkSMS ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGatewaySupport(sender.id, 'bulksms')}
                >
                  BulkSMS
                </Badge>
                <Badge 
                  variant={sender.supportsBulkGate ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGatewaySupport(sender.id, 'bulkgate')}
                >
                  BulkGate
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={sender.bulkSmsStatus} />
            </TableCell>
            <TableCell>
              <StatusBadge status={sender.bulkGateStatus} />
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Testar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### 4.2 API para Sender IDs

```javascript
// PUT /api/admin/sender-ids/{id}/gateways
{
  "supportedGateways": ["bulksms", "bulkgate"],
  "bulkSmsStatus": "approved",
  "bulkGateStatus": "pending"
}

// POST /api/admin/sender-ids/{id}/test
{
  "gateway": "bulkgate",
  "testMessage": "Test message from SMS Marketing Angola"
}
```

## 5. Histórico e Logs

### 5.1 Seção de Estatísticas

```jsx
const GatewayStatsSection = () => {
  return (
    <div className="space-y-6">
      <h3>Estatísticas e Histórico</h3>
      
      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="SMS Enviados Hoje"
          value="1,247"
          change="+12%"
          trend="up"
        />
        <StatCard
          title="Fallbacks Realizados"
          value="23"
          change="2%"
          trend="neutral"
        />
        <StatCard
          title="Taxa Sucesso Geral"
          value="98.7%"
          change="+0.3%"
          trend="up"
        />
        <StatCard
          title="Custo Médio"
          value="0.47 Kz"
          change="-0.02 Kz"
          trend="down"
        />
      </div>

      {/* Gráfico de Comparação */}
      <Card className="p-6">
        <h4>Envios por Gateway (Últimos 7 dias)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="bulkSms" fill="#8884d8" name="BulkSMS" />
            <Bar dataKey="bulkGate" fill="#82ca9d" name="BulkGate" />
            <Bar dataKey="fallbacks" fill="#ffc658" name="Fallbacks" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela de Logs Recentes */}
      <Card className="p-6">
        <h4>Logs Recentes</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.timestamp)}</TableCell>
                <TableCell>
                  <Badge variant={log.gateway === 'bulksms' ? 'default' : 'secondary'}>
                    {log.gateway.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  <StatusBadge status={log.status} />
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
```

## 6. Testes e Feedback

### 6.1 Modals de Teste

```jsx
const TestConnectionModal = ({ gateway, onClose }) => {
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const response = await fetch(`/api/admin/test-gateway/${gateway}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPhone: '+244912345678',
          testMessage: 'Teste de conectividade - SMS Marketing Angola'
        })
      });
      
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Testar {gateway.toUpperCase()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>Enviar SMS de teste para verificar conectividade.</p>
          
          {!testResult && (
            <Button onClick={runTest} disabled={testing}>
              {testing ? 'Testando...' : 'Executar Teste'}
            </Button>
          )}
          
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h4 className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.success ? 'Teste Bem-sucedido' : 'Teste Falhou'}
              </h4>
              <p className="text-sm mt-2">
                {testResult.success 
                  ? `SMS enviado. ID: ${testResult.messageId}`
                  : `Erro: ${testResult.error}`
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 6.2 Payloads de Exemplo

#### Salvar Configurações BulkGate
```javascript
// POST /api/admin/bulkgate/config
{
  "applicationId": "35101",
  "applicationToken": "uWJ0hdvbRnAm6pzkbjHsSjXNT0sJUOxkdzHrEnxQRXfgHW0HLz",
  "defaultSenderId": "SMSao",
  "costPerSms": 0.45,
  "isActive": true
}

// Response:
{
  "success": true,
  "config": {
    "applicationId": "35101",
    "defaultSenderId": "SMSao",
    "costPerSms": 0.45,
    "isActive": true,
    "lastTested": null,
    "balance": null
  },
  "message": "Configurações do BulkGate salvas com sucesso"
}
```

#### Testar Conexão
```javascript
// POST /api/admin/test-gateway/bulkgate
{
  "testPhone": "+244912345678",
  "testMessage": "Teste de conectividade - SMS Marketing Angola"
}

// Response Success:
{
  "success": true,
  "messageId": "bg_msg_123456789",
  "gateway": "bulkgate",
  "cost": 0.45,
  "balance": 2100,
  "timestamp": "2024-01-15T10:30:00Z"
}

// Response Error:
{
  "success": false,
  "error": "Invalid application token",
  "gateway": "bulkgate",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 7. Responsividade e Acessibilidade

### 7.1 Breakpoints Responsivos

```css
/* Mobile First - Configurações empilhadas */
@media (max-width: 768px) {
  .gateway-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .gateway-card {
    padding: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .gateway-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .gateway-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 7.2 Acessibilidade

```jsx
// Indicadores de status acessíveis
const StatusIndicator = ({ status, size = "sm" }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          label: 'Conectado',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'error':
        return {
          color: 'bg-red-500',
          label: 'Erro de conexão',
          icon: <XCircle className="w-4 h-4" />
        };
      case 'testing':
        return {
          color: 'bg-yellow-500',
          label: 'Testando conexão',
          icon: <Clock className="w-4 h-4" />
        };
      default:
        return {
          color: 'bg-gray-500',
          label: 'Status desconhecido',
          icon: <HelpCircle className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className="flex items-center gap-2"
      role="status"
      aria-label={config.label}
    >
      <div 
        className={`w-3 h-3 rounded-full ${config.color}`}
        aria-hidden="true"
      />
      <span className="sr-only">{config.label}</span>
      {config.icon}
    </div>
  );
};

// Botões com feedback acessível
const TestButton = ({ gateway, onTest, testing }) => (
  <Button
    variant="outline"
    onClick={onTest}
    disabled={testing}
    aria-label={`Testar conexão com ${gateway}`}
    aria-describedby={testing ? `testing-${gateway}` : undefined}
  >
    {testing ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Testando...
        <span id={`testing-${gateway}`} className="sr-only">
          Teste em andamento para {gateway}
        </span>
      </>
    ) : (
      <>
        <Zap className="w-4 h-4 mr-2" />
        Testar Conexão
      </>
    )}
  </Button>
);
```

## 8. Wireframes e Mockups

### 8.1 Layout Desktop
```
┌─────────────────────────────────────────────────────────┐
│ Configurações de SMS                           [Histórico]│
├─────────────────────────────────────────────────────────┤
│ Gateway Primário: ○ BulkSMS ● BulkGate                   │
│ ☑ Usar Fallback Automático                              │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────┐  ┌───────────────────┐            │
│ │ BulkSMS [Primário]│  │ BulkGate          │            │
│ │ ● Conectado       │  │ ● Conectado       │            │
│ │ Créditos: 1,250   │  │ Créditos: 2,100   │            │
│ │ Enviados: 3,847   │  │ Enviados: 156     │            │
│ │ Sucesso: 98.5%    │  │ Sucesso: 99.2%    │            │
│ │                   │  │                   │            │
│ │ [Testar] [Salvar] │  │ [Testar] [Salvar] │            │
│ └───────────────────┘  └───────────────────┘            │
├─────────────────────────────────────────────────────────┤
│ Estatísticas Últimos 7 Dias                             │
│ [Gráfico de Barras Comparativo]                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Layout Mobile
```
┌─────────────────────┐
│ Configurações SMS   │
├─────────────────────┤
│ Gateway Primário:   │
│ ○ BulkSMS           │
│ ● BulkGate          │
│ ☑ Fallback Auto    │
├─────────────────────┤
│ BulkSMS [Primário]  │
│ ● Conectado         │
│ Créditos: 1,250     │
│ [Testar] [Salvar]   │
├─────────────────────┤
│ BulkGate            │
│ ● Conectado         │
│ Créditos: 2,100     │
│ [Testar] [Salvar]   │
├─────────────────────┤
│ [Ver Estatísticas]  │
└─────────────────────┘
```

## 9. Implementação Checklist

### 9.1 Fase 1 - Componentes Base
- [ ] Criar componente `AdminSMSGateways.tsx`
- [ ] Implementar cards de configuração para cada gateway
- [ ] Adicionar controles de gateway primário
- [ ] Criar componentes de métricas e status

### 9.2 Fase 2 - Funcionalidades
- [ ] Implementar testes de conexão
- [ ] Adicionar salvamento de configurações
- [ ] Integrar com APIs dos gateways
- [ ] Implementar logs e histórico

### 9.3 Fase 3 - Sender IDs
- [ ] Atualizar página de Sender IDs
- [ ] Adicionar suporte multi-gateway
- [ ] Implementar testes por gateway

### 9.4 Fase 4 - Estatísticas
- [ ] Criar gráficos de comparação
- [ ] Implementar métricas em tempo real
- [ ] Adicionar exportação de dados

### 9.5 Fase 5 - Testes e Polimento
- [ ] Testes unitários dos componentes
- [ ] Testes de integração
- [ ] Verificação de acessibilidade
- [ ] Otimização de performance

---

**Próximos Passos:** Implementar os componentes base da Fase 1 ou refinar alguma seção específica desta especificação.