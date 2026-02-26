# Feature Specification: duGuru — Aplicativo Web de Astrologia Pessoal

**Feature Branch**: `001-duguru-app`  
**Created**: 2026-02-24  
**Status**: Refined  
**Input**: Construção completa do duGuru — app web de astrologia pessoal com mapa astral, horóscopo personalizado, compatibilidade e dashboard.

---

## Identidade Visual e Design System

### Nome e Marca
- Nome: **duGuru** (estilizado com "du" minúsculo + "Guru" capitalizado)
- Ícone: bola de cristal com estrelas (referência fornecida)
- Mascote: figura alienígena verde com planetas ao redor (referência fornecida) — usada em ilustrações, estados vazios (empty states) e onboarding

### Paleta de Cores (tokens de design)

| Token | Light Mode | Dark Mode |
|---|---|---|
| `--color-bg` | `#faeee7` | `#004643` |
| `--color-main` | `#e8e4e6` | — |
| `--color-secondary` | `#ffc6c7` | `#ffc6c7` |
| `--color-tertiary` | `#c3f0ca` | — |
| `--color-headline` | `#33272a` | `#fffffe` |
| `--color-paragraph` | `#594a4e` | `#abd1c6` |
| `--color-button` | `#f25f4c` | `#f9bc60` |
| `--color-button-text` | `#33272a` | `#33272a` |
| `--color-highlight` | `#ff8ba7` | `#ff8ba7` |
| `--color-link` | `#f25f4c` | `#f9bc60` |

Todos os valores de cor devem ser definidos exclusivamente via CSS custom properties (conforme Princípio I da Constituição).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Criar Conta e Configurar Perfil Natal (Priority: P1)

Um novo usuário descobre o duGuru, cria uma conta fornecendo seus dados de nascimento e obtém seu primeiro mapa astral gerado automaticamente.

**Why this priority**: É o ponto de entrada de todo o valor do produto. Sem cadastro e dados de nascimento não há nenhuma funcionalidade personalizada disponível.

**Independent Test**: Pode ser testada completamente abrindo a tela de boas-vindas → preenchendo o formulário de cadastro → sendo redirecionado para o mapa astral gerado. Entrega valor imediato: o usuário vê seus planetas e casas calculados.

**Acceptance Scenarios**:

1. **Given** o usuário acessa a URL raiz sem sessão autenticada, **When** a tela carrega, **Then** são exibidas as opções "Entrar" e "Criar Conta" com a identidade visual do duGuru (logo + mascote).
2. **Given** o usuário clica em "Criar Conta", **When** preenche nome completo, email, senha (≥ 8 caracteres, ≥ 1 maiúscula, ≥ 1 número), data de nascimento, local de nascimento (autocomplete com cidade + país) e horário de nascimento, **Then** a conta é criada e o usuário é autenticado automaticamente.
3. **Given** o campo "local de nascimento" está ativo, **When** o usuário digita pelo menos 3 caracteres, **Then** são exibidas sugestões de cidades em tempo real (máx. 8 resultados, com país).
4. **Given** o horário de nascimento é desconhecido, **When** o usuário marca "Não sei o horário", **Then** o cálculo usa meio-dia solar (12:00) como padrão e a mandala exibe aviso de imprecisão nas casas astrológicas.
5. **Given** o email já está cadastrado, **When** o usuário tenta criar conta, **Then** é exibida mensagem de erro clara sem revelar se o email existe (segurança).
6. **Given** a conta é criada com sucesso, **When** o sistema redireciona, **Then** o mapa astral é calculado automaticamente e o onboarding (3–4 passos) é iniciado.

---

### User Story 2 — Visualizar e Interagir com o Mapa Astral (Priority: P1)

O usuário autenticado explora seu mapa natal completo — mandala SVG interativa, tabela de posições e interpretações.

**Why this priority**: É a funcionalidade central e razão principal de uso do app. Determina a retenção.

**Independent Test**: Pode ser testada com um usuário já cadastrado acessando `/mapa-natal`. Entrega: visualização completa do mapa + tabela + interpretações = produto funcional sem as demais features.

**Acceptance Scenarios**:

1. **Given** o usuário acessa `/mapa-natal`, **When** a página carrega, **Then** a mandala SVG é renderizada em ≤ 2.5 s (LCP) com os 10 planetas posicionados nos signos e casas corretos (tolerância < 0.001°).
2. **Given** a mandala está visível, **When** o usuário toca/clica em um planeta, **Then** um painel lateral ou pop-over exibe: nome do planeta, signo, grau exato, casa, indicador de retrogradação e interpretação resumida (2–4 frases).
3. **Given** a mandala está visível, **When** o usuário toca/clica em um aspecto (linha colorida), **Then** é exibida a descrição do aspecto (tipo, planetas envolvidos, orbe em graus, influência resumida).
4. **Given** a mandala está visível, **When** o usuário seleciona um sistema de casas alternativo (ex: Koch, Whole Sign), **Then** a mandala é recalculada e renderizada com o novo sistema mantendo os planetas estáticos.
5. **Given** a tabela de posições está visível, **When** o usuário visualiza cada linha, **Then** são exibidos: ícone do planeta, nome, signo, grau (ex: "14°33' ♈"), casa (número romano ou arábico), e "R" vermelho se retrógrado.
6. **Given** o usuário clica em "Baixar Mapa", **When** escolhe o formato (PDF ou PNG), **Then** o arquivo é gerado com resolução mínima de 2000×2000 px e nome `duguru-mapa-natal-[nome]-[data].ext`.
7. **Given** o usuário clica em "Enviar por Email", **When** confirma o endereço, **Then** o mapa é enviado ao email cadastrado em ≤ 60 s com assunto "Seu Mapa Astral – duGuru".

---

### User Story 3 — Acessar Horóscopo Personalizado (Priority: P2)

O usuário consulta seu horóscopo diário, semanal, mensal e anual, personalizado com base no signo solar e ascendente.

**Why this priority**: Driver de recorrência diária. Usuários voltam todos os dias pelo horóscopo; é a feature de maior frequência de uso.

**Independent Test**: Pode ser testada acessando `/horoscopo` com usuário autenticado. Entrega: conteúdo personalizado por signo com 5 seções temáticas, provando a personalização mesmo sem o mapa completo.

**Acceptance Scenarios**:

1. **Given** o usuário acessa `/horoscopo`, **When** a página carrega, **Then** é exibido o horóscopo do dia para o signo solar do usuário com as 5 seções: Amor, Trabalho, Saúde, Finanças e Conselho Geral.
2. **Given** o ascendente do usuário é conhecido, **When** o horóscopo é exibido, **Then** há um switch/tab "Por Signo Solar" / "Por Ascendente" para alternar a leitura.
3. **Given** o usuário seleciona "Semana", **When** a aba carrega, **Then** é exibido o horóscopo para a semana corrente (segunda a domingo) com as 5 seções.
4. **Given** o usuário seleciona "Mês" ou "Ano", **When** a aba carrega, **Then** é exibido o horóscopo correspondente ao período corrente com as 5 seções.
5. **Given** é meia-noite (00:00 horário do usuário), **When** o cache expira, **Then** o horóscopo do dia é renovado automaticamente, sem necessidade de reload manual.

---

### User Story 4 — Dashboard / Home com Astro do Dia (Priority: P2)

O usuário autenticado vê um dashboard-home com destaques astrológicos do dia: planeta em destaque, fase lunar, frase inspiradora e alertas.

**Why this priority**: Define a primeira tela após login; contexto diário que engaja e mostra o valor da personalização.

**Independent Test**: Pode ser testada acessando `/` (home) com usuário autenticado e verificando que todos os blocos carregam com dados do dia atual.

**Acceptance Scenarios**:

1. **Given** o usuário autenticado acessa `/`, **When** a home carrega, **Then** são exibidos: (a) Astro do dia com ícone e influência, (b) fase lunar com imagem e descrição, (c) frase inspiradora do dia, (d) alertas de eventos astrológicos ativos, (e) compatibilidade rápida Top 3.
2. **Given** há um planeta retrógrado ou em trânsito relevante, **When** o alerta é exibido, **Then** inclui: nome do evento, período (datas), signo afetado e dica prática (ex: "Cuidado com contratos").
3. **Given** a frase inspiradora é carregada, **When** é uma data Gregoriana diferente do dia anterior, **Then** uma frase diferente é exibida (rotação diária de um banco de pelo menos 365 frases).
4. **Given** o bloco "Compatibilidade Rápida" é exibido, **When** o usuário vê os Top 3, **Then** são listados 3 signos mais compatíveis com o signo solar do usuário, cada um com ícone, nome e resumo de 1 frase.
5. **Given** o usuário toca na fase lunar, **When** o painel expande, **Then** exibe: nome da fase, data do próximo ciclo, influência geral e dica prática.

---

### User Story 5 — Compatibilidade Entre Signos (Priority: P3)

O usuário explora a compatibilidade astrológica entre dois signos ou faz uma sinastria simplificada entre dois perfis.

**Why this priority**: Feature de descoberta e compartilhamento social, mas não é crítica para o MVP funcional.

**Independent Test**: Pode ser testada acessando `/compatibilidade`, selecionando dois signos e verificando o score e as descrições por área.

**Acceptance Scenarios**:

1. **Given** o usuário acessa `/compatibilidade`, **When** seleciona dois signos (ou usa "Meu Signo" como padrão), **Then** é exibido o score de compatibilidade geral (0–100%) e por área: Romance, Amizade e Trabalho, cada um com barra visual e parágrafo explicativo.
2. **Given** o usuário quer fazer sinastria, **When** insere o nome ou email de outro usuário duGuru cadastrado, **Then** é exibida a comparação de sinastria simplificada (aspectos entre os dois mapas natais) com destaque para tensões e harmonias.
3. **Given** o outro perfil não é usuário do duGuru, **When** o usuário insere dados de nascimento manualmente para a sinastria, **Then** o sistema calcula a sinastria com os dados informados sem exigir cadastro do segundo perfil.

---

### User Story 6 — Login, Recuperação de Senha e Perfil (Priority: P1)

O usuário retorna ao app, faz login seguro e pode gerenciar seu perfil.

**Why this priority**: Requisito básico de acesso recorrente e gestão de identidade.

**Independent Test**: Pode ser testada acessando `/login`, fazendo login e navegando para `/perfil` para editar avatar e dados.

**Acceptance Scenarios**:

1. **Given** o usuário acessa `/login`, **When** insere email e senha corretos, **Then** é autenticado em ≤ 3 s e redirecionado para a home.
2. **Given** o usuário clica em "Esqueci minha senha", **When** insere seu email cadastrado, **Then** recebe um email com link de redefinição válido por 1 hora (apenas 1 link ativo por vez).
3. **Given** o usuário acessa `/perfil`, **When** edita campos (nome, foto de avatar, local de nascimento, horário), **Then** as alterações são salvas e o mapa astral é recalculado se dados de nascimento mudaram.
4. **Given** o usuário faz upload de avatar, **When** o arquivo é enviado, **Then** aceita JPG/PNG/WebP ≤ 5 MB, faz crop circular automático e exibe preview antes de salvar.
5. **Given** 5 tentativas de login falham consecutivamente, **When** o sistema detecta, **Then** a conta é bloqueada por 15 minutos e o usuário é notificado por email (proteção contra força bruta).

---

### User Story 7 — Experiência Offline (PWA) (Priority: P3)

O usuário sem conexão pode acessar seu mapa astral e o último horóscopo visualizado.

**Why this priority**: Diferencial de qualidade e alcance para usuários mobile com conectividade instável. Não é bloqueante para o MVP.

**Independent Test**: Pode ser testada desativando a rede após primeira carga e verificando que `/mapa-natal` e `/horoscopo` continuam acessíveis.

**Acceptance Scenarios**:

1. **Given** o app foi carregado ao menos uma vez com conexão, **When** o dispositivo fica offline, **Then** o service worker serve os assets cacheados e o usuário vê seu último mapa astral e horóscopo.
2. **Given** o usuário está offline e tenta uma ação que requer rede (ex: download PDF), **When** a ação é solicitada, **Then** um toast informa "Esta função requer conexão com a internet".
3. **Given** a conexão é restabelecida, **When** o app detecta, **Then** os dados são sincronizados silenciosamente e um toast discreto informa "Conteúdo atualizado".

---

### User Story 8 — Onboarding para Novos Usuários (Priority: P2)

O novo usuário recebe um tour guiado de 3–4 passos para entender as principais seções do app.

**Why this priority**: Reduz abandono na primeira sessão, aumenta ativação.

**Independent Test**: Pode ser testada criando uma nova conta e verificando que o onboarding inicia automaticamente e pode ser completado ou pulado.

**Acceptance Scenarios**:

1. **Given** o usuário completa o cadastro pela primeira vez, **When** é redirecionado para a home, **Then** o onboarding inicia automaticamente com overlay semi-transparente e tooltip posicionado no elemento destacado.
2. **Given** o onboarding está ativo, **When** o usuário navega pelos passos, **Then** são exibidos 3–4 passos cobrindo: Mapa Astral, Horóscopo, Dashboard e Compatibilidade — cada passo com título, descrição (máx. 2 frases) e botões "Anterior" / "Próximo" / "Pular".
3. **Given** o usuário clica em "Pular" ou conclui o tour, **When** o onboarding é fechado, **Then** o estado é salvo (não volta a aparecer) e o app fica totalmente funcional.

---

### Edge Cases

- O que acontece quando o horário de nascimento não é informado? → Sistema usa 12:00 e exibe aviso de imprecisão nas casas.
- O que acontece se as coordenadas do local de nascimento não forem encontradas? → Usuário é solicitado a selecionar manualmente em um mapa ou digitar coordenadas lat/lon.
- O que acontece se o cálculo de Swiss Ephemeris falhar? → Erro crítico logado no Sentry, usuário recebe mensagem "Não conseguimos calcular seu mapa agora, tente em instantes" sem expor detalhes técnicos.
- O que acontece quando dois usuários têm o mesmo email (tentativa de duplicata)? → Retorna erro genérico sem confirmar existência do email.
- O que acontece se o PDF/PNG gerado ultrapassar o tempo de geração (> 30 s)? → Geração é feita em background e enviada por email; usuário recebe toast "Seu mapa está sendo preparado — enviaremos por email em instantes".
- O que acontece em dispositivos sem suporte a SVG interativo (navegadores muito antigos)? → Fallback para imagem estática PNG do mapa com tabela de posições em HTML puro.
- O que acontece se o link de redefinição de senha expirou? → Usuário é informado e pode solicitar um novo link.
- O que acontece se o upload de avatar ultrapassar 5 MB? → Erro imediato com mensagem "Arquivo muito grande. Limite: 5 MB".

---

## Requirements *(mandatory)*

### Functional Requirements

#### Autenticação e Perfil

- **FR-001**: O sistema DEVE permitir cadastro com: nome completo, email, senha, data de nascimento, local de nascimento (autocomplete cidade + país) e horário de nascimento (opcional).
- **FR-002**: O sistema DEVE validar email (formato RFC 5322) e senha (≥ 8 chars, ≥ 1 maiúscula, ≥ 1 número) em tempo real durante o preenchimento.
- **FR-003**: O sistema DEVE emitir JWT de acesso (RS256, 15 min) e refresh token em cookie `HttpOnly; Secure; SameSite=Strict` (7 dias) conforme Princípio III da Constituição.
- **FR-004**: O sistema DEVE implementar Refresh Token Rotation: cada uso do refresh token emite um novo e invalida o anterior.
- **FR-005**: O sistema DEVE bloquear a conta por 15 minutos após 5 tentativas de login consecutivas com falha e notificar o usuário por email.
- **FR-006**: O sistema DEVE oferecer recuperação de senha via email com link válido por 1 hora (máx. 1 link ativo por conta).
- **FR-007**: O usuário DEVE poder editar nome, foto de avatar (JPG/PNG/WebP ≤ 5 MB, crop circular), local e horário de nascimento.
- **FR-008**: Alterações em dados de nascimento DEVEM disparar recalculação automática do mapa astral.

#### Mapa Astral (Natal Chart)

- **FR-010**: O sistema DEVE calcular posições dos 10 planetas (Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno, Plutão) usando Swiss Ephemeris com tolerância < 0.001°.
- **FR-011**: O sistema DEVE calcular 12 casas astrológicas com sistema Placidus como padrão; sistemas Koch, Equal, Whole Sign e Campanus DEVEM ser suportados como opções.
- **FR-012**: O sistema DEVE calcular e exibir aspectos: conjunção (0°, orbe ± 8°), oposição (180°, ± 8°), trígono (120°, ± 8°), quadratura (90°, ± 8°), sextil (60°, ± 6°).
- **FR-013**: O sistema DEVE renderizar a mandala natal como SVG interativo responsivo (toca/clica em planeta ou aspecto para ver detalhes).
- **FR-014**: O sistema DEVE exibir tabela de posições com: ícone, nome do planeta, signo, grau (formato `14°33'`), casa, indicador "R" se retrógrado.
- **FR-015**: O sistema DEVE permitir download do mapa em PDF (A4, orientação paisagem) e PNG (≥ 2000×2000 px).
- **FR-016**: O sistema DEVE enviar o mapa por email (PDF ou PNG) ao endereço cadastrado em ≤ 60 s.
- **FR-017**: Resultados de cálculo DEVEM ser cacheados com chave `{data_utc}:{latitude}:{longitude}:{sistema_casas}` e TTL de 24 h (conforme Princípio IV da Constituição).
- **FR-018**: O sistema DEVE exibir interpretação textual resumida (2–4 frases) para cada planeta no signo e casa, usando banco de textos curado (sem LLM em tempo real). A fonte DEVE ser acessada via interface `InterpretationProvider` para permitir troca futura de implementação sem alteração nos consumidores. O banco offline DEVE cobrir todos os 10 planetas × 12 signos × 12 casas (1.440 combinações mínimas).

#### Horóscopo Personalizado

- **FR-020**: O sistema DEVE fornecer horóscopo do dia, semana, mês e ano para o signo solar do usuário.
- **FR-021**: O sistema DEVE oferecer alternância entre leitura por signo solar e por ascendente (quando calculável).
- **FR-022**: Cada horóscopo DEVE ter 5 seções: Amor, Trabalho, Saúde, Finanças, Conselho Geral.
- **FR-023**: O horóscopo diário DEVE ser renovado automaticamente à meia-noite (horário do servidor UTC).
- **FR-024**: O motor de horóscopo DEVE usar Swiss Ephemeris para calcular os trânsitos planetários ativos sobre o signo solar/ascendente do usuário no período (dia/semana/mês/ano), selecionar os textos-base curados correspondentes ao par `{signo} × {planeta em trânsito}` e compor as 5 seções temáticas (Amor, Trabalho, Saúde, Finanças, Conselho Geral). O banco curado DEVE cobrir os 12 signos × 10 planetas em trânsito × 5 seções (600 entradas mínimas).

#### Dashboard / Home

- **FR-030**: A home DEVE exibir: planeta em destaque do dia, fase da lua (nome, imagem, descrição, data do próximo ciclo), frase inspiradora diária (banco ≥ 365 frases, sem repetição no mesmo ciclo anual), alertas de eventos astrológicos ativos, compatibilidade rápida Top 3.
- **FR-031**: Alertas de eventos astrológicos (retrógrados, eclipses, ingressos) DEVEM incluir: nome, datas de início/fim, signos afetados, dica prática.

#### Compatibilidade

- **FR-040**: O sistema DEVE calcular e exibir score de compatibilidade (0–100%) entre dois signos para as áreas: Romance, Amizade, Trabalho.
- **FR-041**: O sistema DEVE suportar sinastria simplificada entre dois perfis de usuários duGuru ou com dados de nascimento informados manualmente. Os aspectos considerados são os 5 principais (conjunção 0°, oposição 180°, trígono 120°, quadratura 90°, sextil 60°) com orbes diferenciados: ± 8° para Sol/Lua, ± 6° para planetas pessoais (Mercúrio, Vênus, Marte), ± 4° para transpessoais (Júpiter, Saturno, Urano, Netuno, Plutão).

#### UI/UX e Navegação

- **FR-050**: Mobile: navegação por bottom navigation bar com ícones e labels (Home, Mapa, Horóscopo, Compatibilidade, Perfil).
- **FR-051**: Desktop (≥ 1024 px): sidebar de navegação esquerda sempre visível.
- **FR-052**: Animações de transição de tela e componentes DEVEM usar Framer Motion com `prefers-reduced-motion` respeitado (motion desativado se preferência do SO for "reduzida").
- **FR-053**: Estados de carregamento DEVEM usar skeleton screens (não spinner genérico).
- **FR-054**: Todas as ações do usuário com feedback assíncrono DEVEM exibir toast com resultado (sucesso ou erro).
- **FR-055**: Onboarding de 3–4 passos DEVE ser exibido na primeira sessão e pode ser pulado; estado persistido no perfil do usuário.
- **FR-056**: O app DEVE incluir telas de empty state com ilustrações do mascote para seções sem dados.

#### PWA e Performance

- **FR-060**: O app DEVE ser instalável como PWA (manifest.json, service worker, ícones 192×192 e 512×512 px).
- **FR-061**: As páginas `/mapa-natal` e `/horoscopo` DEVEM funcionar offline após primeira carga.
- **FR-062**: LCP DEVE ser ≤ 2.5 s em 4G simulado; INP ≤ 200 ms; CLS ≤ 0.1 (conforme Princípio VII da Constituição).
- **FR-063**: Bundle inicial DEVE ser ≤ 150 KB gzippado; módulo WASM do Swiss Ephemeris DEVE ser carregado de forma lazy.

#### SEO e Acessibilidade

- **FR-070**: Páginas públicas (landing, login, cadastro) DEVEM ter meta tags dinâmicas: `title`, `description`, `og:image`, `og:title`, `og:description`, `canonical`.
- **FR-071**: Todo o app DEVE ser conforme WCAG 2.1 AA (conforme Princípio VIII da Constituição).
- **FR-072**: Gráficos SVG do mapa astral DEVEM ter alternativa textual acessível (tabela de posições + `role="img"` + `aria-describedby`).

#### Internacionalização

- **FR-080**: Toda string visível ao usuário DEVE usar o sistema de i18n (locale padrão: `pt-BR`).
- **FR-081**: Datas, horas, números e moedas DEVEM usar `Intl.*` APIs com locale explícito.
- **FR-082**: Nomes de planetas, signos, casas e aspectos DEVEM estar nos arquivos de mensagens (não hardcoded).

### Key Entities

- **User**: `id`, `name`, `email`, `passwordHash`, `avatarUrl?`, `birthDate`, `birthTime?`, `birthCity`, `birthCountry`, `birthLat`, `birthLon`, `timezone`, `houseSystem`, `locale`, `onboardingDone`, `createdAt`, `updatedAt`
- **NatalChart**: `id`, `userId`, `calculatedAt`, `houseSystem`, `positions` (JSON: planetas + casas + aspectos), `cacheKey`
- **RefreshToken**: `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt?`, `createdAt`
- **DailyContent**: `id`, `date`, `planet`, `moonPhase`, `inspirationalQuote`, `alerts` (JSON)
- **Horoscope**: `id`, `sign`, `period` (day/week/month/year), `date`, `love`, `work`, `health`, `finance`, `advice`, `updatedAt`
- **CompatibilityScore**: `id`, `sign1`, `sign2`, `romance`, `friendship`, `work`, `updatedAt`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O fluxo completo de cadastro → mapa astral exibido é concluído em ≤ 3 minutos por 90% dos usuários em teste de usabilidade.
- **SC-002**: LCP ≤ 2.5 s em 90% das sessões medidas (monitorado via Web Vitals / Vercel Analytics).
- **SC-003**: Posições planetárias calculadas têm erro < 0.001° em comparação com output direto do Swiss Ephemeris em suite de testes de golden data.
- **SC-004**: Cobertura de testes ≥ 80% global; 100% no módulo de cálculo astronômico; 95% nas rotas de autenticação (conforme Princípio VI da Constituição).
- **SC-005**: Zero violações axe-core nível A ou AA em todas as páginas no CI.
- **SC-006**: Score Lighthouse: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90 em todas as páginas públicas.
- **SC-007**: O app é instalável como PWA e funciona offline para mapa astral e horóscopo após primeira carga — verificado por teste Playwright com `networkidle` + desativação de rede.
- **SC-008**: 100% das strings visíveis ao usuário estão externalizadas no sistema de i18n (validado por lint de chaves de tradução no CI).
- **SC-009**: Nenhum JWT de acesso ou dado sensível é armazenado em `localStorage` ou `sessionStorage` — verificado por teste automatizado de storage inspection.
- **SC-010**: Taxa de erro de autenticação (falsos negativos) = 0% em suite de testes E2E de fluxos happy-path.

---

## Notas de Implementação (sem prescrever tecnologia)

> Estas notas registram restrições funcionais e de qualidade mas **não definem a stack técnica** — essa decisão ocorre na fase de plano.

- O módulo de cálculo astronômico deve ser **completamente isolado** de I/O e efeitos colaterais: recebe dados de entrada (data, lat, lon, sistema de casas) e retorna objeto de saída determinístico.
- O design system deve ser documentado em um arquivo de tokens separado (CSS ou JSON) consumido por todos os componentes — nenhum valor de cor, tipografia ou espaçamento pode existir fora dos tokens.
- **Interpretações textuais (planeta no signo/casa)**: banco de textos curado (copywriting fixo, sem LLM em tempo real). Decisão: custo zero de inferência, funciona 100% offline, conteúdo consistente e revisável. O módulo de interpretação DEVE ser abstraído via interface `InterpretationProvider` para que uma fonte LLM possa ser plugada futuramente sem alteração nos consumidores.
- **Fonte do horóscopo**: algorítmico via Swiss Ephemeris (trânsitos planetários sobre o mapa natal/signo solar do usuário) combinado com textos-base curados por par signo + planeta em trânsito. O motor de horóscopo calcula quais trânsitos estão ativos no período e seleciona/compõe o texto correspondente do banco curado.
- **Aspectos e orbes na sinastria**: os 5 aspectos principais com orbes diferenciados por tipo de planeta:
  - Conjunção (0°), Oposição (180°), Trígono (120°), Quadratura (90°), Sextil (60°)
  - Orbe ± 8° para Sol e Lua
  - Orbe ± 6° para planetas pessoais (Mercúrio, Vênus, Marte)
  - Orbe ± 4° para planetas transpessoais (Júpiter, Saturno, Urano, Netuno, Plutão)
