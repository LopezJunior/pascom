/* ==========================================================================
   PASCOM PARÓQUIA SANTO ANTÔNIO - SCRIPT PRINCIPAL
   ========================================================================== */

// 1. VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
const urlApiGoogle =
  "https://script.google.com/macros/s/AKfycbwhTgBFYK7fLfACwa_8pr_0eLB5mZBt84ZvSy7fEriAwwcfm9URZUmjvSvjxXnON5Lu/exec";
const idDoCanal = "UC69U57tf2N9ULzxQSFiHR1Q";
const apiKeyYoutube = "AIzaSyB1QCuqtZow18mekFyw_EnAd-Fo92PoWVM";
const urlYoutubeFeed = `https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${idDoCanal}`;

let dadosDosAlbuns = [];
let fotosDoAlbumAtual = [];
let indiceFotoAtual = 0;

/* ==========================================================================
   2. INTEGRAÇÃO COM GOOGLE DRIVE (ÁLBUNS E FOTOS)
   ========================================================================== */

// Busca as pastas no Google Drive ao abrir o site
async function iniciarSite() {
  const containerLista = document.getElementById("lista-albuns");
  if (!containerLista) return;

  try {
    const resposta = await fetch(urlApiGoogle);
    dadosDosAlbuns = await resposta.json();
    containerLista.innerHTML = ""; // Limpa o "Carregando..."

    if (!dadosDosAlbuns || dadosDosAlbuns.length === 0) {
      containerLista.innerHTML =
        '<p style="text-align:center; width:100%; grid-column: 1/-1;">Nenhuma foto ou pasta encontrada.</p>';
      return;
    }

    const btnVerMais = document.getElementById("btn-ver-mais");
    const maxAlbuns = 6;

    // Monta os cartões dos álbuns
    dadosDosAlbuns.forEach((album, index) => {
      // Proteção: ignora pastas vazias
      if (!album.fotos || album.fotos.length === 0) return;

      // Rota oficial de miniaturas (rápida e à prova de bloqueios)
      const urlCapa = `https://drive.google.com/thumbnail?id=${album.fotos[0].id}&sz=w800`;

      const classeExtra = index >= maxAlbuns ? "album-escondido" : "";
      const estiloOculto = index >= maxAlbuns ? 'style="display: none;"' : "";

      const cardHTML = `
                <div class="card-album ${classeExtra}" ${estiloOculto} data-aos="fade-up" onclick="abrirAlbum(${index})">
                    <div class="card-img-wrapper">
                        <span class="badge-fotos"><i class="fa-regular fa-image"></i> ${album.fotos.length}</span>
                        <img src="${urlCapa}" alt="Capa do álbum ${album.titulo}" loading="lazy">
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

    // Lógica do botão "Ver Todos"
    if (dadosDosAlbuns.length > maxAlbuns && btnVerMais) {
      btnVerMais.style.display = "inline-flex";
      btnVerMais.onclick = () => {
        document
          .querySelectorAll(".album-escondido")
          .forEach((album) => (album.style.display = "block"));
        btnVerMais.style.display = "none";
      };
    }
  } catch (erro) {
    console.error("Erro ao buscar as imagens:", erro);
    containerLista.innerHTML =
      '<p style="text-align:center; width:100%; grid-column: 1/-1;">Erro ao conectar com o acervo da Pascom.</p>';
  }
}

// Abre a galeria de fotos de um álbum específico
function abrirAlbum(indexDoAlbum) {
  history.pushState({ tela: "album_aberto" }, "", "#album"); // Regista no histórico do telemóvel
  const albumEscolhido = dadosDosAlbuns[indexDoAlbum];
  fotosDoAlbumAtual = albumEscolhido.fotos;

  const els = obterElementosInterface();
  if (!els.lista || !els.galeria) return;

  els.lista.style.display = "none";
  els.galeria.style.display = "grid";
  if (els.btnVoltar) els.btnVoltar.style.display = "inline-block";
  if (els.btnVerMais) els.btnVerMais.style.display = "none";
  if (els.titulo) els.titulo.innerText = albumEscolhido.titulo;

  els.galeria.innerHTML = "";

  // Injeta as fotos com carregamento preguiçoso (lazy)
  albumEscolhido.fotos.forEach((foto, indexFoto) => {
    const urlFoto = `https://drive.google.com/thumbnail?id=${foto.id}&sz=w800`;
    els.galeria.innerHTML += `<img src="${urlFoto}" alt="Foto da Paróquia" loading="lazy" onclick="abrirLightbox(${indexFoto})">`;
  });

  document.getElementById("albuns").scrollIntoView({ behavior: "smooth" });
}

// Volta para a tela inicial de álbuns
function voltarParaAlbuns() {
  const els = obterElementosInterface();
  if (!els.galeria || !els.lista) return;

  els.galeria.style.display = "none";
  els.lista.style.display = "grid";
  if (els.btnVoltar) els.btnVoltar.style.display = "none";
  if (els.titulo) els.titulo.innerText = "Momentos que ficaram para sempre";

  // Restaura o botão "Ver Mais" se ainda houver álbuns escondidos
  const temOculto = Array.from(
    document.querySelectorAll(".album-escondido"),
  ).some((a) => a.style.display === "none");
  if (temOculto && els.btnVerMais) els.btnVerMais.style.display = "inline-flex";
}

// Função auxiliar para evitar repetição de buscas no DOM
function obterElementosInterface() {
  return {
    lista: document.getElementById("lista-albuns"),
    galeria: document.getElementById("galeria-fotos"),
    btnVoltar: document.getElementById("btn-voltar"),
    btnVerMais: document.getElementById("btn-ver-mais"),
    titulo: document.getElementById("titulo-sessao"),
  };
}

/* ==========================================================================
   3. LIGHTBOX (VISUALIZADOR DE TELA CHEIA)
   ========================================================================== */

function precarregarImagensVizinhas(indexAtual) {
  if (fotosDoAlbumAtual.length === 0) return;
  const prox = indexAtual + 1 >= fotosDoAlbumAtual.length ? 0 : indexAtual + 1;
  const ant =
    indexAtual - 1 < 0 ? fotosDoAlbumAtual.length - 1 : indexAtual - 1;

  new Image().src = `https://drive.google.com/thumbnail?id=${fotosDoAlbumAtual[prox].id}&sz=w1600`;
  new Image().src = `https://drive.google.com/thumbnail?id=${fotosDoAlbumAtual[ant].id}&sz=w1600`;
}

function abrirLightbox(index) {
  indiceFotoAtual = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnDownload = document.getElementById("btn-download");
  if (!lightbox || !lightboxImg || !btnDownload) return;

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  lightboxImg.src = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  lightbox.style.display = "flex";
  precarregarImagensVizinhas(indiceFotoAtual);
}

function fecharLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.style.display = "none";
  const img = document.getElementById("lightbox-img");
  if (img) img.src = "";
}

function mudarFoto(direcao) {
  indiceFotoAtual += direcao;
  if (indiceFotoAtual >= fotosDoAlbumAtual.length) indiceFotoAtual = 0;
  else if (indiceFotoAtual < 0) indiceFotoAtual = fotosDoAlbumAtual.length - 1;

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  document.getElementById("lightbox-img").src =
    `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  document.getElementById("btn-download").href =
    `https://docs.google.com/uc?export=download&id=${idFoto}`;

  precarregarImagensVizinhas(indiceFotoAtual);
}

// Swipe para Telemóveis
let touchStartX = 0;
let touchEndX = 0;

function configurarSwipe() {
  const lightboxElement = document.getElementById("lightbox");
  if (!lightboxElement) return;

  lightboxElement.addEventListener(
    "touchstart",
    (e) => (touchStartX = e.changedTouches[0].screenX),
    { passive: true },
  );
  lightboxElement.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const distanciaMinima = 50;
      if (touchEndX < touchStartX - distanciaMinima) mudarFoto(1);
      if (touchEndX > touchStartX + distanciaMinima) mudarFoto(-1);
    },
    { passive: true },
  );
}

/* ==========================================================================
   4. INTEGRAÇÃO COM YOUTUBE (VÍDEOS E LIVE)
   ========================================================================== */

function carregarVideosYouTube() {
  const gradeVideos = document.getElementById("grade-videos");
  if (!gradeVideos) return;

  fetch(urlYoutubeFeed)
    .then((res) => res.json())
    .then((dados) => {
      gradeVideos.innerHTML = "";
      if (!dados.items) return;

      const ultimosVideos = dados.items.slice(0, 10);
      ultimosVideos.forEach((video) => {
        const cardVideo = `
                    <div class="card-video" onclick="window.open('${video.link}', '_blank')">
                        <div class="thumbnail-wrapper">
                            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
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
    .then((res) => res.json())
    .then((dados) => {
      if (dados.items && dados.items.length > 0) {
        iframeLive.src = `https://www.youtube.com/embed/${dados.items[0].id.videoId}?autoplay=1`;
        secaoLive.style.display = "block";
      } else {
        secaoLive.style.display = "none";
      }
    })
    .catch((erro) => console.error("Erro ao verificar a live:", erro));
}

/* ==========================================================================
   5. INTERAÇÕES GERAIS E INICIALIZAÇÃO (O MOTOR DO SITE)
   ========================================================================== */

// Modais
function abrirModalSobre(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById("modal-sobre");
  if (modal) modal.style.display = "flex";
}

function fecharModalSobre() {
  const modal = document.getElementById("modal-sobre");
  if (modal) modal.style.display = "none";
}

// Animação dos Contadores Numéricos
function animarContadores() {
  document.querySelectorAll(".contador").forEach((contador) => {
    const velocidade = 100;
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

// Inicia tudo quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
  // 1. Dispara as requisições principais
  iniciarSite();
  carregarVideosYouTube();
  verificarLive();

  // 2. Configura o Carrossel de Vídeos
  const track = document.getElementById("grade-videos");
  const btnPrev = document.getElementById("btn-prev-video");
  const btnNext = document.getElementById("btn-next-video");

  if (btnPrev && btnNext && track) {
    btnNext.addEventListener("click", () =>
      track.scrollBy({ left: 320, behavior: "smooth" }),
    );
    btnPrev.addEventListener("click", () =>
      track.scrollBy({ left: -320, behavior: "smooth" }),
    );
  }

  // 3. Configurações de Acessibilidade e Toque (Swipe)
  configurarSwipe();

  document.addEventListener("keydown", (event) => {
    const lightbox = document.getElementById("lightbox");
    if (lightbox && lightbox.style.display === "flex") {
      if (event.key === "ArrowRight") mudarFoto(1);
      if (event.key === "ArrowLeft") mudarFoto(-1);
      if (event.key === "Escape") fecharLightbox();
    }
  });

  const modalSobre = document.getElementById("modal-sobre");
  if (modalSobre) {
    modalSobre.addEventListener("click", function (event) {
      if (event.target === this) fecharModalSobre();
    });
  }

  // 4. Inicia as animações (AOS e Contadores)
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true, offset: 100 });
    setTimeout(() => AOS.refresh(), 2000);
  }

  const sessaoEstatisticas = document.querySelector(".estatisticas");
  if (sessaoEstatisticas && typeof IntersectionObserver !== "undefined") {
    let animacaoJaRodou = false;
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
});

// Controlo do botão de Voltar Físico do Telemóvel
window.addEventListener("popstate", () => {
  if (typeof voltarParaAlbuns === "function") voltarParaAlbuns();
  if (typeof fecharLightbox === "function") fecharLightbox();
});
