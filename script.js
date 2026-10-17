// Seleção dos elementos do DOM
const botoesOpcao = document.querySelectorAll('.opcao');
const elementoResultado = document.getElementById('resultado');
const elementoDetalhes = document.getElementById('detalhes');
const elementoPontosJogador = document.getElementById('pontosJogador');
const elementoPontosComputador = document.getElementById('pontosComputador');
const botaoReiniciar = document.getElementById('reiniciar');

// Estado inicial do jogo
let pontosJogador = 0;
let pontosComputador = 0;
const opcoes = ['pedra', 'papel', 'tesoura'];

// Função para gerar a jogada aleatória da máquina
function sortearJogadaComputador() {
  const indiceAleatorio = Math.floor(Math.random() * opcoes.length);
  return opcoes[indiceAleatorio];
}

// Lógica para determinar o vencedor
function determinarVencedor(jogador, computador) {
  if (jogador === computador) {
    return 'empate';
  }

  if (
    (jogador === 'pedra' && computador === 'tesoura') ||
    (jogador === 'papel' && computador === 'pedra') ||
    (jogador === 'tesoura' && computador === 'papel')
  ) {
    return 'jogador';
  }

  return 'computador';
}

// Função principal executada ao clicar em uma opção
function executarJogada(escolhaJogador) {
  const escolhaComputador = sortearJogadaComputador();
  const resultado = determinarVencedor(escolhaJogador, escolhaComputador);

  // Atualiza as pontuações e textos na tela
  if (resultado === 'jogador') {
    pontosJogador++;
    elementoPontosJogador.textContent = pontosJogador;
    elementoResultado.textContent = '🎉 Você venceu esta rodada!';
  } else if (resultado === 'computador') {
    pontosComputador++;
    elementoPontosComputador.textContent = pontosComputador;
    elementoResultado.textContent = '💻 A máquina venceu esta rodada!';
  } else {
    elementoResultado.textContent = '🤝 Empate nesta rodada!';
  }

  // Exibe os detalhes das escolhas
  elementoDetalhes.textContent = `Você escolheu ${escolhaJogador.toUpperCase()} e a máquina escolheu ${escolhaComputador.toUpperCase()}.`;
}

// Função para reiniciar o placar
function reiniciarJogo() {
  pontosJogador = 0;
  pontosComputador = 0;
  elementoPontosJogador.textContent = '0';
  elementoPontosComputador.textContent = '0';
  elementoResultado.textContent = 'Escolha uma opção para começar!';
  elementoDetalhes.textContent = 'O resultado aparecerá aqui.';
}

// Event Listeners (Escutadores de eventos)
botoesOpcao.forEach((botao) => {
  botao.addEventListener('click', () => {
    const escolha = botao.dataset.escolha;
    executarJogada(escolha);
  });
});

botaoReiniciar.addEventListener('click', reiniciarJogo);
