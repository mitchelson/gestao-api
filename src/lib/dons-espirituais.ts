export const GIFTS = [
  "Liberalidade", "Profecia", "Liderança", "Hospitalidade", "Línguas",
  "Missionário", "Evangelismo", "Ensino", "Cura", "Pastoral",
  "Administração", "Discernimento", "Apostolado", "Exortação", "Fé",
  "Socorro e Misericórdia", "Conhecimento", "Sabedoria", "Intercessão",
] as const

export type GiftName = typeof GIFTS[number]

export const QUESTIONS: Record<GiftName, string[]> = {
  "Liberalidade": [
    "Sempre tento ajudar pessoas em dificuldades, mesmo que minhas próprias necessidades sejam muitas.",
    "Sou fiel e generoso nos dízimos e ofertas, pois conheço a generosidade de Deus. Sinto prazer em doar.",
    "Os membros da minha congregação sabem que tenho prazer em ajudar aqueles que têm necessidades materiais e financeiras, que gosto de financiar projetos da igreja, mesmo que eu tenha pouco dinheiro.",
    "Poucas coisas me trazem tanta alegria quanto dar parte do que tenho para pessoas que necessitam ou para a igreja e o avanço do evangelho.",
  ],
  "Profecia": [
    "Tenho sonhos e visões contendo mensagens em plena concordância com a Bíblia.",
    "Quando falo em público, os ouvintes me consideram mais do que um professor ou do que um orador ou pregador. A igreja reconhece o dom de profecia em mim.",
    "Recebo mensagens específicas de Deus com conteúdo para a igreja como um todo, bem como para indivíduos, conforme Deus me mostra. Estas mensagens nunca contradizem material já revelado por Deus.",
    "Nunca pedi para ter o dom de profecia. Cumpro com o meu dever em humildade. Sirvo à igreja se ela quiser.",
  ],
  "Liderança": [
    "Gosto de liderar e servir. Se a igreja precisa de alguém para dirigir atividades, motivar pessoas, me encontro entre os primeiros com quem se pode contar.",
    "Quando tenho idéias que creio serem vindas de Deus, aconselho-me com irmãos, avalio as consequências, tomo a decisão e creio na decisão tomada como se fosse de Deus, mesmo que ela seja impopular.",
    "Tem havido espírito de unidade, entusiasmo e progresso do reino de Deus quando ocupo um cargo de liderança. Gosto de liderar servindo e coordenando outros.",
    "Sei que as críticas fazem parte da liderança e tenho aprendido com elas em humildade. Tenho me esforçado pelo melhor e procuro entender e ser sensível às idéias de outros.",
  ],
  "Hospitalidade": [
    "Sinto satisfação em ajudar as pessoas, proporcionando-lhes moradia e alimento.",
    "Se alguém confiável bater a minha porta, precisando de lugar para pernoitar, convido-o para entrar, ainda que para acomodá-lo fosse necessário ceder minha cama e eu dormir no chão.",
    "Quando eu tenho um hóspede me dedico a seu bem estar e a sua salvação de todo coração.",
    "Gosto de convidar pessoas e dar o que tenho de melhor em minha casa, comida, pouso ou o que for necessário.",
  ],
  "Línguas": [
    "Tenho facilidades para aprender línguas de outros países e povos.",
    "Entendo o sentido do que as pessoas estão falando, mesmo que eu não saiba falar a sua língua.",
    "Interesso-me muito por outras línguas e não me custa memorizar palavras.",
    "Gosto de estar no meio de pessoas de outros países; quando tenho que me comunicar com eles, faço o melhor que consigo, mesmo sem saber a língua.",
  ],
  "Missionário": [
    "Sinto grande responsabilidade em levar o Evangelho a pessoas não alcançadas.",
    "Fico inquieto quando vejo quantas pessoas ainda não conhecem Jesus e vivo com idéias para alcançar pessoas ao meu redor. Gosto de dar estudos bíblicos para descrentes, creio que a Palavra transforma suas vidas.",
    "Gosto de estar com pessoas e aceito o jeito diferente de cada um ser. Procuro entendê-las para ajudá-las melhor. Nunca julgo ou condeno alguém, mesmo pelo pior pecado. Busco instruir com paciência e persistência.",
    "Consigo aceitar e amar descrentes como estão e com facilidade ajudá-los a conhecer Jesus.",
  ],
  "Evangelismo": [
    "Tenho facilidade em persuadir alguém a tomar uma decisão ao lado de Cristo.",
    "Facilmente sei transformar uma conversa normal numa conversa espiritual conduzindo a pessoa a Cristo.",
    "Se eu tenho um tempo extra, meu primeiro pensamento é dedicar-me ao trabalho do Evangelho. Sinto desejo de compartilhar aquilo que me fez tão bem: Jesus!",
    "Regularmente levo pessoas a Cristo, acompanhando-as ao batismo e confirmando-as na fé e na doutrina bíblica.",
  ],
  "Ensino": [
    "Gosto de ensinar e muitos me procuram para estudar a Bíblia comigo, pois entendem bem quando eu explico.",
    "Consigo explicar diversos temas de tal maneira que as pessoas incorporam os ensinos em suas vidas.",
    "Quando ensino, percebo que as pessoas ficam envolvidas por inteiro, elas não entendem apenas com a cabeça, mas com o coração, aplicando o tema às suas vidas.",
    "Empolgo-me em ler livros e me desenvolver em didática e psicologia do ensino.",
  ],
  "Cura": [
    "Gosto de estudar o corpo humano, conheço os órgãos e funções e fico me aperfeiçoando na compreensão do corpo.",
    "Deus quer que tenhamos saúde, pois um intelecto vigoroso e uma vida espiritual abundante apenas ocorrem num corpo saudável. Conheço a lógica de nosso corpo e recomendo a prevenção da saúde.",
    "Muitas vezes quando oro pela saúde de alguém, ela melhora. Creio na cura por vias naturais e sobrenaturais.",
    "Conheço tratamentos simples, sem contra-indicação para muitas doenças e males.",
  ],
  "Pastoral": [
    "Gosto de visitar os membros da Igreja regularmente, em suas casas, participando de suas vidas e fases.",
    "Gosto de dar estudos bíblicos para ajudar os membros da igreja a crescer em sua fé.",
    "Gosto de elaborar sermões, de pregá-los e observar o efeito na vida das pessoas.",
    "Eu gosto de aconselhar pessoas nas diferentes fases de suas vidas. Elas também apreciam e tiram proveito para sua experiência espiritual e de vida.",
  ],
  "Administração": [
    "Diante de problemas complexos sou capaz de identificar os fatores que os influenciam, achando soluções práticas.",
    "Tenho facilidade para descobrir recursos e pessoas para realizar certa atividade.",
    "Eu resolvo os problemas de pessoas e da igreja de tal forma que elas se sintam satisfeitas e a igreja encontre caminhos para funcionar melhor.",
    "Gosto de administrar as coisas da igreja: prédios, finanças, pessoas. Penso que quando eu me envolvo nesta área a igreja fica mais organizada e um lugar melhor para adorar. Os membros vêem esta qualidade em mim.",
  ],
  "Discernimento": [
    "Eu posso facilmente dizer se um profeta fala inspirado pelo Espírito Santo ou não.",
    "Sei quando uma pessoa está sofrendo, mesmo que esteja sorrindo.",
    "Posso dizer se determinadas decisões estão ou não de acordo com os princípios bíblicos.",
    "Muitas vezes posso discernir os motivos das pessoas para ajudá-las, sem julgá-las por isso.",
  ],
  "Apostolado": [
    "Tenho sido chamado por Deus para iniciar trabalhos para Jesus onde outros hesitariam em ir.",
    "Sou facilmente impressionável pelo Espírito Santo e sigo as Suas instruções sem temer distância, dificuldade, obstáculos e desvantagens pessoais. Quando Ele chama não temo o que terei que sacrificar.",
    "Já fundei ou tenho muita vontade de fundar uma congregação em um lugar onde antes nada existia.",
    "Sinto-me desassossegado quando fico muito tempo em um mesmo lugar.",
  ],
  "Exortação": [
    "Quando alguém está sofrendo, sou capaz de identificar o que necessita e lhe dizer algo que o ajudará.",
    "Posso ajudar a um causador de problemas a voltar a cooperar com o grupo sob minha liderança.",
    "Frequentemente tenho sido solicitado para ajudar aqueles que estão em problemas para resolvê-los.",
    "Acho fácil aplicar os princípios bíblicos aos problemas das pessoas de tal forma que possa ajudá-las.",
  ],
  "Fé": [
    "Tenho coragem de ousar coisas grandes para Deus, de andar numa direção desconhecida e iniciar projetos, pois eu conheço a direção de Deus e confio que Ele está me guiando.",
    "Sei que ao confiar em Deus Ele me guiará inclusive através de problemas. Tenho convicção de que inclusive as perdas e lutas vão colaborar para o meu bem.",
    "Aceito as promessas de Deus como válidas e creio nelas, ainda que o seu cumprimento pareça impossível.",
    "Deus responde minhas orações, principalmente quando eu avanço pela fé com confiança inabalável nEle.",
  ],
  "Socorro e Misericórdia": [
    "Eu gosto de ajudar rejeitados da sociedade, por exemplo: bêbados, viciados em drogas e outros.",
    "Quando me pedem ajuda, mesmo ocupado, tento ajudar. Sinto que Deus espera de mim e gosto de ajudar.",
    "Sou extremamente sensível às necessidades dos menos favorecidos, sinto satisfação em falar com eles, oferecendo-lhes minha ajuda. Sou cuidadoso para ajudar com sabedoria.",
    "Os membros da igreja sabem que sinto prazer em visitar os doentes e necessitados, ajudando-os.",
  ],
  "Conhecimento": [
    "Conheço a Bíblia e outros escritos proféticos em seu contexto histórico e cultural.",
    "Memorizo textos bíblicos e textos relacionados facilmente e entendo o raciocínio dos autores inspirados.",
    "A igreja me conhece pelo meu conhecimento bíblico e me consulta se necessário.",
    "Conheço a história bíblica em seus detalhes e creio na ação de Deus em cada momento desta história. Conheço o plano profético e fico maravilhado com o plano da salvação em Jesus.",
  ],
  "Sabedoria": [
    "Quando enfrento os dilemas da vida consigo encontrar soluções práticas que ajudam sem complicar as coisas.",
    "Quando aconselho pessoas em conflito ajudo-as a tirar o foco do problema e ganhar foco na solução.",
    "Quando pessoas me procuram, penso nas diferentes opções que elas têm, mas deixo elas decidirem.",
    "Princípios Bíblicos me vêm rápido à mente quando me deparo com problemas.",
  ],
  "Intercessão": [
    "Gasto muito do meu tempo de oração intercedendo pelas necessidades de outros diante de Deus.",
    "Frequentemente, quando pessoas têm problemas, pedem para eu orar por elas.",
    "Nomes, regularmente, vêm à minha mente quando estou em oração, aos quais dedico a Deus.",
    "Minhas orações pelos outros, muitas vezes são respondidas e a igreja sabe disto e me procuram para orar.",
  ],
}

export const GIFT_DESCRIPTIONS: Record<GiftName, string> = {
  "Liberalidade": "O dom do Espírito para dar liberalmente, com alegria, e com regularidade às necessidades da Igreja e de indivíduos.",
  "Profecia": "É o dom através do qual o Espírito transmite conselhos e instruções para a igreja por meio de visões e sonhos.",
  "Liderança": "É o dom de envolver pessoas em uma visão, estabelecer objetivos, desenvolver estratégias para alcançá-los e vê-los realizados para a edificação da igreja.",
  "Hospitalidade": "O dom do Espírito para acolher o abandonado e necessitado, fazendo com que cada pessoa sinta-se querida e confortável.",
  "Línguas": "Capacitação especial e sobrenatural para comunicar verbalmente o Evangelho em um idioma estrangeiro.",
  "Missionário": "É o dom para compartilhar o Evangelho de maneira eficaz noutro país, adaptando-se com espontaneidade a diferentes culturas.",
  "Evangelismo": "O dom do Espírito para compartilhar o Evangelho e ver os descrentes se encontrarem com Jesus, unindo-se à igreja como membros responsáveis.",
  "Ensino": "O dom para conceder instrução espiritual às pessoas de modo que o evangelho seja compreendido e seguido.",
  "Cura": "É o dom de entender o funcionamento do corpo humano, discernir doenças, aplicar tratamentos e ajudar o doente a cuidar de seu corpo.",
  "Pastoral": "O dom do Espírito para ministrar a todas as necessidades de cada membro da congregação e a pessoas que necessitem ser pastoreadas.",
  "Administração": "O dom do Espírito que concebe e supervisiona planos para o trabalho de Deus, trazendo progresso à causa.",
  "Discernimento": "É o dom de perceber o espírito que move as pessoas, percebendo o estado espiritual de outros e ministrando conforme a necessidade.",
  "Apostolado": "O dom do Espírito Santo para pioneiro, líder, que inicia igrejas ou as desenvolve, indo para lugares onde outros não iriam.",
  "Exortação": "O dom do Espírito que traz conforto, encorajamento e instrução àqueles que precisam de alguma ajuda.",
  "Fé": "O dom do Espírito para reclamar as promessas de Deus com inabalável confiança de que serão cumpridas.",
  "Socorro e Misericórdia": "O dom do Espírito para se ter sensibilidade aos sentimentos e necessidades dos outros, dando-lhes auxílio que traz conforto e cura.",
  "Conhecimento": "O dom concedido pelo Espírito capacitando o crente a reter conhecimento. Geralmente está associado ao dom de ensino.",
  "Sabedoria": "Dom que habilita para o entendimento de pessoas e/ou a igreja em sua complexidade, trazendo solução para problemas.",
  "Intercessão": "Pessoas são chamadas para se importar e interceder em oração por outras, por atividades internas e externas à igreja.",
}

export const ANSWER_LABELS = [
  "Não / Nunca / Discordo totalmente",
  "Pouco / Raramente / Discordo um pouco",
  "Muito / Com frequência / Concordo",
  "Sim / Sempre / Concordo totalmente",
]

// Total: 76 questions (19 gifts × 4 questions each)
// Round-robin order: question_index % 19 = gift_index, floor(question_index / 19) = question_num
export const TOTAL_QUESTIONS = 76
export const TOTAL_GIFTS = 19

export function getQuestionAtIndex(index: number): { gift: GiftName; giftIndex: number; questionNum: number; text: string } {
  const giftIndex = index % TOTAL_GIFTS
  const questionNum = Math.floor(index / TOTAL_GIFTS)
  const gift = GIFTS[giftIndex]
  return { gift, giftIndex, questionNum, text: QUESTIONS[gift][questionNum] }
}

export function calculateResults(answers: number[]): { gift: GiftName; score: number; rank: number }[] {
  const scores: Record<string, number> = {}
  for (const g of GIFTS) scores[g] = 0

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const { gift } = getQuestionAtIndex(i)
    scores[gift] += answers[i] ?? 0
  }

  return GIFTS
    .map(g => ({ gift: g, score: scores[g], rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }))
}
