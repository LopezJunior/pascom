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

    if (containerLista) containerLista.innerHTML = "";

    if (dadosDosAlbuns.length === 0) {
      if (containerLista)
        containerLista.innerHTML =
          '<p style="text-align:center; width:100%;">Nenhuma foto ou pasta encontrada.</p>';
      return;
    }

    const btnVerMais = document.getElementById("btn-ver-mais");
    const maxAlbuns = 6;

    // Monta os cards dos álbuns
    dadosDosAlbuns.forEach((album, index) => {
      // Proteção: Se a pasta estiver vazia, ele ignora e não quebra o site
      if (!album.fotos || album.fotos.length === 0) return;

      // ROTA ATUALIZADA: Usando o servidor lh3 oficial do Google
      const urlCapa = `https://lh3.googleusercontent.com/d/${album.fotos[0].id}`;

      const classeExtra = index >= maxAlbuns ? "album-escondido" : "";
      const estiloOculto = index >= maxAlbuns ? 'style="display: none;"' : "";

      const cardHTML = `
                <div class="card-album ${classeExtra}" ${estiloOculto} data-aos="fade-up" data-aos-delay="100" onclick="abrirAlbum(${index})">
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

      if (containerLista) containerLista.innerHTML += cardHTML;
    });

    // Lógica do botão "Ver Todos"
    if (dadosDosAlbuns.length > maxAlbuns && btnVerMais) {
      btnVerMais.style.display = "inline-flex";

      btnVerMais.onclick = () => {
        const albunsOcultos = document.querySelectorAll(".album-escondido");
        albunsOcultos.forEach((album) => {
          album.style.display = "block";
        });
        btnVerMais.style.display = "none";
      };
    }
  } catch (erro) {
    console.error("Deu erro ao buscar as imagens:", erro);
    if (containerLista) {
      containerLista.innerHTML =
        '<p style="text-align:center; width:100%;">Erro ao conectar com o Google Drive da Pascom.</p>';
    }
  }
}

// 2. Função que abre a galeria de fotos
function abrirAlbum(indexDoAlbum) {
  history.pushState({ tela: "album_aberto" }, "", "#album");
  const albumEscolhido = dadosDosAlbuns[indexDoAlbum];
  fotosDoAlbumAtual = albumEscolhido.fotos;

  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");
  const btnVerMais = document.getElementById("btn-ver-mais");

  if (containerLista) containerLista.style.display = "none";
  if (containerGaleria) containerGaleria.style.display = "grid";
  if (btnVoltar) btnVoltar.style.display = "inline-block";
  if (btnVerMais) btnVerMais.style.display = "none";

  if (tituloSessao) tituloSessao.innerText = albumEscolhido.titulo;
  if (containerGaleria) containerGaleria.innerHTML = "";

  albumEscolhido.fotos.forEach((foto, indexFoto) => {
    // ROTA ATUALIZADA para as fotos da galeria
    const urlFoto = `https://lh3.googleusercontent.com/d/${foto.id}`;
    containerGaleria.innerHTML += `<img src="${urlFoto}" alt="Foto da Paróquia" loading="lazy" onclick="abrirLightbox(${indexFoto})">`;
  });

  document.getElementById("albuns").scrollIntoView({ behavior: "smooth" });
}

// 3. Função para voltar para a tela inicial
function voltarParaAlbuns() {
  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");
  const btnVerMais = document.getElementById("btn-ver-mais");

  if (containerGaleria) containerGaleria.style.display = "none";
  if (containerLista) containerLista.style.display = "grid";
  if (btnVoltar) btnVoltar.style.display = "none";

  const albunsOcultos = document.querySelectorAll(".album-escondido");
  let temOculto = false;
  albunsOcultos.forEach((a) => {
    if (a.style.display === "none") temOculto = true;
  });
  if (temOculto && btnVerMais) btnVerMais.style.display = "inline-flex";

  if (tituloSessao) tituloSessao.innerText = "Momentos que ficaram para sempre";
}

/* ==========================================================================
   FUNÇÕES DO LIGHTBOX (TELA CHEIA)
   ========================================================================== */
function precarregarImagensVizinhas(indexAtual) {
  let indexProxima =
    indexAtual + 1 >= fotosDoAlbumAtual.length ? 0 : indexAtual + 1;
  let indexAnterior =
    indexAtual - 1 < 0 ? fotosDoAlbumAtual.length - 1 : indexAtual - 1;

  const imgProxima = new Image();
  // ROTA ATUALIZADA
  imgProxima.src = `https://lh3.googleusercontent.com/d/${fotosDoAlbumAtual[indexProxima].id}`;

  const imgAnterior = new Image();
  // ROTA ATUALIZADA
  imgAnterior.src = `https://lh3.googleusercontent.com/d/${fotosDoAlbumAtual[indexAnterior].id}`;
}

function abrirLightbox(index) {
  indiceFotoAtual = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnDownload = document.getElementById("btn-download");

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;

  // ROTA ATUALIZADA
  lightboxImg.src = `https://lh3.googleusercontent.com/d/${idFoto}`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  lightbox.style.display = "flex";
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

  // ROTA ATUALIZADA
  document.getElementById("lightbox-img").src =
    `https://lh3.googleusercontent.com/d/${idFoto}`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  precarregarImagensVizinhas(indiceFotoAtual);
}

document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox.style.display === "flex") {
    if (event.key === "ArrowRight") mudarFoto(1);
    if (event.key === "ArrowLeft") mudarFoto(-1);
    if (event.key === "Escape") fecharLightbox();
  }
});

/* ==========================================================================
   NAVEGAÇÃO POR TOQUE (SWIPE PARA TELEMÓVEIS)
   ========================================================================== */
let touchStartX = 0;
let touchEndX = 0;
const lightboxElement = document.getElementById("lightbox");

if (lightboxElement) {
  lightboxElement.addEventListener(
    "touchstart",
    function (event) {
      touchStartX = event.changedTouches[0].screenX;
    },
    false,
  );

  lightboxElement.addEventListener(
    "touchend",
    function (event) {
      touchEndX = event.changedTouches[0].screenX;
      lidarComSwipe();
    },
    false,
  );
}

function lidarComSwipe() {
  const distanciaMinima = 50;
  if (touchEndX < touchStartX - distanciaMinima) mudarFoto(1);
  if (touchEndX > touchStartX + distanciaMinima) mudarFoto(-1);
}

/* ==========================================================================
   MODAL SOBRE NÓS
   ========================================================================== */
function abrirModalSobre(event) {
  event.preventDefault();
  document.getElementById("modal-sobre").style.display = "flex";
}

function fecharModalSobre() {
  document.getElementById("modal-sobre").style.display = "none";
}

const modalSobre = document.getElementById("modal-sobre");
if (modalSobre) {
  modalSobre.addEventListener("click", function (event) {
    if (event.target === this) fecharModalSobre();
  });
}

// Inicializa a biblioteca de animações
if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 800,
    once: true,
    offset: 100,
  });
  setTimeout(() => {
    AOS.refresh();
  }, 2000);
}

/* ==========================================================================
   ANIMAÇÃO DO CONTADOR DE ESTATÍSTICAS
   ========================================================================== */
function animarContadores() {
  const contadores = document.querySelectorAll(".contador");
  const velocidade = 100;

  contadores.forEach((contador) => {
    const atualizarContador = () => {
      const alvo = +contador.getAttribute("data-alvo");
      const contagem = +contador.innerText;
      const incremento = alvo / velocidade;

      if (contagem < alvo) {
        contador.innerText = Math.ceil(contagem + incremento);
        setTimeout(atualizarContador, 20);
      } else {
        contador.innerText = alvo + "+";
      }
    };
    atualizarContador();
  });
}

const sessaoEstatisticas = document.querySelector(".estatisticas");
let animacaoJaRodou = false;

if (sessaoEstatisticas && typeof IntersectionObserver !== "undefined") {
  const observadorScroll = new IntersectionObserver(
    (entradas) => {
      if (entradas[0].isIntersecting && !animacaoJaRodou) {
        animarContadores();
        animacaoJaRodou = true;
      }
    },
    { threshold: 0.5 },
  );
  observadorScroll.observe(sessaoEstatisticas);
}

/* ==========================================================================
   CONTROLO DO BOTÃO VOLTAR DO TELEMÓVEL
   ========================================================================== */
window.addEventListener("popstate", function (event) {
  if (typeof voltarParaAlbuns === "function") voltarParaAlbuns();
  if (typeof fecharLightbox === "function") fecharLightbox();
});

/* ==========================================================================
   CARREGAMENTO AUTOMÁTICO DE VÍDEOS DO YOUTUBE E LIVE
   ========================================================================== */
const idDoCanal = "UC69U57tf2N9ULzxQSFiHR1Q";
const apiKeyYoutube = "AIzaSyB1QCuqtZow18mekFyw_EnAd-Fo92PoWVM";
const urlYoutubeFeed = `https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${idDoCanal}`;

function carregarVideosYouTube() {
  const gradeVideos = document.getElementById("grade-videos");
  if (!gradeVideos) return;

  fetch(urlYoutubeFeed)
    .then((response) => response.json())
    .then((dados) => {
      gradeVideos.innerHTML = "";
      const ultimosVideos = dados.items.slice(0, 10);

      ultimosVideos.forEach((video) => {
        const cardVideo = `
                    <div class="card-video" onclick="window.open('${video.link}', '_blank')">
                        <div class="thumbnail-wrapper">
                            <img src="${video.thumbnail}" alt="${video.title}">
                            <div class="play-overlay"><i class="fa-solid fa-circle-play"></i></div>
                        </div>
                        <div class="video-info">
                            <h3>${video.title}</h3>
                        </div>
                    </div>
                `;
        gradeVideos.innerHTML += cardVideo;
      });
    })
    .catch((erro) => {
      console.error("Erro ao puxar vídeos:", erro);
      gradeVideos.innerHTML = "<p>Erro ao carregar os vídeos recentes.</p>";
    });
}

function verificarLive() {
  const urlBuscaLive = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${idDoCanal}&eventType=live&type=video&key=${apiKeyYoutube}`;
  const secaoLive = document.getElementById("secao-live");
  const iframeLive = document.getElementById("iframe-live");

  if (!secaoLive || !iframeLive) return;

  fetch(urlBuscaLive)
    .then((resposta) => resposta.json())
    .then((dados) => {
      if (dados.items && dados.items.length > 0) {
        const idDaLive = dados.items[0].id.videoId;
        iframeLive.src = `https://www.youtube.com/embed/${idDaLive}?autoplay=1`;
        secaoLive.style.display = "block";
      } else {
        secaoLive.style.display = "none";
      }
    })
    .catch((erro) => {
      console.error("Erro ao verificar a live:", erro);
    });
}

// O bloco central que arranca com tudo quando o site carrega!
document.addEventListener("DOMContentLoaded", () => {
  iniciarSite();
  carregarVideosYouTube();
  verificarLive();

  const track = document.getElementById("grade-videos");
  const btnPrev = document.getElementById("btn-prev-video");
  const btnNext = document.getElementById("btn-next-video");

  if (btnPrev && btnNext && track) {
    btnNext.addEventListener("click", () => {
      track.scrollBy({ left: 300, behavior: "smooth" });
    });

    btnPrev.addEventListener("click", () => {
      track.scrollBy({ left: -300, behavior: "smooth" });
    });
  }
});
