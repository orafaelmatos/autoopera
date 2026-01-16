# Documentação de Testes - Barber Flow

Este documento descreve a suíte de testes automatizados do backend, garantindo que as regras de negócio e integrações funcionem corretamente.

## Como Rodar os Testes
No diretório `backend`, execute:
```bash
python3 manage.py test api.tests
```

## Cobertura de Testes

### 1. Regras de Agendamento (`BookingTestCase`)
Testa a lógica central do `BookingService`.
- **Agendamento Simples**: Valida a criação básica de um agendamento e a reserva do slot de tempo.
- **Prevenção de Double-Booking**: Garante que o sistema impeça dois agendamentos no mesmo horário para o mesmo barbeiro.
- **Horário de Funcionamento**: Verifica se o sistema rejeita agendamentos fora da jornada configurada.
- **Lógica de Duração**: Confirma que um serviço (ex: 60 min) bloqueia o tempo correto na agenda, impedindo conflitos.
- **Integração Financeira**: Valida que a conclusão de um serviço gera automaticamente uma transação de receita.

### 2. Autenticação e Perfil (`AuthAndProfileTests`)
- **Login via WhatsApp**: Testa o fluxo customizado de login e auto-cadastro usando número de telefone.
- **Endpoint /me**: Verifica se o sistema identifica corretamente o usuário logado e seu respectivo perfil (Barbeiro ou Cliente).

### 3. Gestão de Clientes (`CustomerTests`)
- **CRUD de Clientes**: Testa criação, listagem, busca e atualização de dados dos clientes.

### 4. Financeiro e Fluxo de Caixa (`FinancialTests`)
- **API de Transações**: Valida o registro manual de receitas e despesas, categorias e métodos de pagamento.
- **Resumo Financeiro**: Testa o cálculo automático do saldo total disponível no dashboard.

### 5. Controle de Estoque (`InventoryTests`)
- **Gestão de Produtos**: CRUD completo de produtos.
- **Alerta de Estoque Baixo**: Testa o filtro que identifica produtos abaixo do nível mínimo definido.

### 6. Ciclo de Vida do Atendimento (`AppointmentLifecycleTests`)
- **Ação de Conclusão**: Testa especificamente o endpoint utilizado pelo barbeiro para encerrar um atendimento (o que dispara o gatilho de pagamento e pontos).

### 7. Funcionalidades Extras (`ExtraFeatureTests`)
- **Lista de Espera**: Valida o registro de intenção de agendamento para datas futuras.
- **Geração de Disponibilidade**: Garante que o sistema projete corretamente os horários da semana.
- **Programa de Fidelidade**: Testa o resgate de pontos acumulados por clientes.
- **Slots Dinâmicos**: Valida o cálculo de horários livres enviado para o frontend.

---
**Data da última atualização**: 15 de Janeiro de 2026
**Total de Testes**: 18
**Status**: OK (Passando)
