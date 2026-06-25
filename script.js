// URL da API conectada com o Google Drive da Pascom
const urlApiGoogle =
  "https://script.google.com/macros/s/AKfycbwhTgBFYK7fLfACwa_8pr_0eLB5mZBt84ZvSy7fEriAwwcfm9URZUmjvSvjxXnON5Lu/exec";

let dadosDosAlbuns = [];
let fotosDoAlbumAtual = [];
let indiceFotoAtual = 0;

// 1. Função que busca as pastas no Google Drive ao abrir o site
async function iniciarSite() {
  const containerLista = document.getElementById("lista-albuns");

  try {
    const resposta = await fetch(urlApiGoogle);
    dadosDosAlbuns = await resposta.json();

    containerLista.innerHTML = "";

    if (dadosDosAlbuns.length === 0) {
      containerLista.innerHTML =
        '<p style="text-align:center; width:100%;">Nenhuma foto ou pasta encontrada.</p>';
      return;
    }

    // Monta os cards dos álbuns
    dadosDosAlbuns.forEach((album, index) => {
      const idFotoCapa = album.fotos[0].id;
      const urlCapa = `https://drive.google.com/thumbnail?id=${idFotoCapa}&sz=w600`;

      // Novo código do card com a animação
      // O onclick agora fica na div principal do card
      const cardHTML = `
                <div class="card-album" data-aos="fade-up" data-aos-delay="${index * 100}" onclick="abrirAlbum(${index})">
                    <div class="card-img-wrapper">
                        <span class="badge-fotos"><i class="fa-regular fa-image"></i> ${album.fotos.length}</span>
                        <img src="${urlCapa}" alt="Capa do álbum ${album.titulo}">
                    </div>
                    <div class="card-content">
                        <span class="card-date">ÁLBUM DA COMUNIDADE</span>
                        <h3>${album.titulo}</h3>
                        <button class="link-album btn-abrir">VER ÁLBUM <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            `;
      containerLista.innerHTML += cardHTML;
    });
  } catch (erro) {
    console.error("Deu erro ao buscar as imagens:", erro);
    containerLista.innerHTML =
      '<p style="text-align:center; width:100%;">Erro ao conectar com o Google Drive da Pascom.</p>';
  }
}

// 2. Função que abre a galeria de fotos de um álbum específico
function abrirAlbum(indexDoAlbum) {
  const albumEscolhido = dadosDosAlbuns[indexDoAlbum];
  fotosDoAlbumAtual = albumEscolhido.fotos;

  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");

  containerLista.style.display = "none";
  containerGaleria.style.display = "grid";
  btnVoltar.style.display = "inline-block";

  tituloSessao.innerText = albumEscolhido.titulo;
  containerGaleria.innerHTML = "";

  albumEscolhido.fotos.forEach((foto, indexFoto) => {
    const urlFoto = `https://drive.google.com/thumbnail?id=${foto.id}&sz=w1000`;
    containerGaleria.innerHTML += `<img src="${urlFoto}" alt="${foto.nome}" loading="lazy" onclick="abrirLightbox(${indexFoto})">`;
  });

  document.getElementById("albuns").scrollIntoView({ behavior: "smooth" });
}

// 3. Função para voltar para a tela inicial de álbuns
function voltarParaAlbuns() {
  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");

  containerGaleria.style.display = "none";
  containerLista.style.display = "grid";
  btnVoltar.style.display = "none";

  tituloSessao.innerText = "Momentos que ficaram para sempre";
}

/* ==========================================================================
   FUNÇÕES DO LIGHTBOX (TELA CHEIA COM PRÉ-CARREGAMENTO)
   ========================================================================== */

// NOVO: Função para baixar as fotos vizinhas em segundo plano
function precarregarImagensVizinhas(indexAtual) {
  // Descobre qual é a próxima foto e a anterior (com a lógica de loop infinito)
  let indexProxima =
    indexAtual + 1 >= fotosDoAlbumAtual.length ? 0 : indexAtual + 1;
  let indexAnterior =
    indexAtual - 1 < 0 ? fotosDoAlbumAtual.length - 1 : indexAtual - 1;

  // Cria elementos de imagem na memória do navegador para forçar o download invisível
  const imgProxima = new Image();
  const idProxima = fotosDoAlbumAtual[indexProxima].id;
  imgProxima.src = `https://drive.google.com/thumbnail?id=${idProxima}&sz=w1600`;

  const imgAnterior = new Image();
  const idAnterior = fotosDoAlbumAtual[indexAnterior].id;
  imgAnterior.src = `https://drive.google.com/thumbnail?id=${idAnterior}&sz=w1600`;
}

function abrirLightbox(index) {
  indiceFotoAtual = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnDownload = document.getElementById("btn-download");

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;

  // Exibe a foto atual
  lightboxImg.src = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  lightbox.style.display = "flex";

  // Dispara o download antecipado das vizinhas
  precarregarImagensVizinhas(indiceFotoAtual);
}

function fecharLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.style.display = "none";
  document.getElementById("lightbox-img").src = "";
}

function mudarFoto(direcao) {
  indiceFotoAtual += direcao;

  if (indiceFotoAtual >= fotosDoAlbumAtual.length) {
    indiceFotoAtual = 0;
  } else if (indiceFotoAtual < 0) {
    indiceFotoAtual = fotosDoAlbumAtual.length - 1;
  }

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  const btnDownload = document.getElementById("btn-download");

  document.getElementById("lightbox-img").src =
    `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  // Atualiza o pré-carregamento para as novas vizinhas
  precarregarImagensVizinhas(indiceFotoAtual);
}

// Navegação pelo teclado (Setas e Esc)
document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox.style.display === "flex") {
    if (event.key === "ArrowRight") mudarFoto(1);
    if (event.key === "ArrowLeft") mudarFoto(-1);
    if (event.key === "Escape") fecharLightbox();
  }
});

/* ==========================================================================
   NAVEGAÇÃO POR TOQUE (SWIPE PARA CELULARES)
   ========================================================================== */

let touchStartX = 0;
let touchEndX = 0;

const lightboxElement = document.getElementById("lightbox");

// Registra onde o dedo encostou na tela
lightboxElement.addEventListener(
  "touchstart",
  function (event) {
    touchStartX = event.changedTouches[0].screenX;
  },
  false,
);

// Registra onde o dedo soltou da tela e chama a função para calcular a direção
lightboxElement.addEventListener(
  "touchend",
  function (event) {
    touchEndX = event.changedTouches[0].screenX;
    lidarComSwipe();
  },
  false,
);

function lidarComSwipe() {
  // Define uma distância mínima (em pixels) para considerar como um "arrasto" intencional
  // Isso evita que um simples toque na tela avance a foto sem querer
  const distanciaMinima = 50;

  // Se o dedo foi para a esquerda (arrastou para a esquerda)
  if (touchEndX < touchStartX - distanciaMinima) {
    mudarFoto(1); // Vai para a próxima foto
  }

  // Se o dedo foi para a direita (arrastou para a direita)
  if (touchEndX > touchStartX + distanciaMinima) {
    mudarFoto(-1); // Volta para a foto anterior
  }
}

/* ==========================================================================
   MODAL SOBRE NÓS
   ========================================================================== */

function abrirModalSobre(event) {
  // Evita que a página pule pro topo ao clicar no link com href="#"
  event.preventDefault();
  document.getElementById("modal-sobre").style.display = "flex";
}

function fecharModalSobre() {
  document.getElementById("modal-sobre").style.display = "none";
}

// Fecha o modal se o usuário clicar na área escura (fora da caixa branca)
document
  .getElementById("modal-sobre")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      fecharModalSobre();
    }
  });

// Inicializa a biblioteca de animações
AOS.init({
  duration: 800, // Duração da animação (0.8 segundos)
  once: true, // Anima apenas uma vez quando a pessoa rola a página
  offset: 100, // Distância que o elemento precisa aparecer na tela para animar
});

// Atualiza as animações depois que as fotos carregam do Google Drive
setTimeout(() => {
  AOS.refresh();
}, 2000);

/* ==========================================================================
   ANIMAÇÃO DO CONTADOR DE ESTATÍSTICAS
   ========================================================================== */

function animarContadores() {
  const contadores = document.querySelectorAll(".contador");
  const velocidade = 100; // Quanto menor esse número, mais rápido os números rodam

  contadores.forEach((contador) => {
    const atualizarContador = () => {
      // Pega o número final que colocamos no HTML (ex: 1200)
      const alvo = +contador.getAttribute("data-alvo");
      // Pega o número atual na tela
      const contagem = +contador.innerText;

      // Calcula de quanto em quanto o número vai subir
      const incremento = alvo / velocidade;

      if (contagem < alvo) {
        // Arredonda pra cima e sobe o número
        contador.innerText = Math.ceil(contagem + incremento);
        // Chama a função de novo quase instantaneamente (20 milissegundos)
        setTimeout(atualizarContador, 20);
      } else {
        // Adiciona o símbolo de "+" no final do número grandão
        contador.innerText = alvo + "+";
      }
    };
    atualizarContador();
  });
}

// O "Olheiro" que avisa quando a seção aparece na tela
const sessaoEstatisticas = document.querySelector(".estatisticas");
let animacaoJaRodou = false; // Garante que a contagem só aconteça uma vez

const observadorScroll = new IntersectionObserver(
  (entradas) => {
    // Se a seção entrou na tela e a animação ainda não rodou...
    if (entradas[0].isIntersecting && !animacaoJaRodou) {
      animarContadores();
      animacaoJaRodou = true;
    }
  },
  { threshold: 0.5 },
); // threshold: 0.5 significa que a animação só dispara quando metade da barra aparecer

if (sessaoEstatisticas) {
  observadorScroll.observe(sessaoEstatisticas);
}

// Dá a partida no site assim que o código carrega
iniciarSite();
